import type { Account, AdminState, ReportActionResult, ReportJob, ReportSubscription, ReportType } from "./admin";
import { accessibleEstablishmentIds } from "./accessOperations";
import { hasAdminCapability } from "./adminCapabilities";

export interface RequestReportInput {
  type: ReportType;
  establishmentIds: string[];
  periodFrom: string;
  periodTo: string;
}

export interface ReportArtifact {
  csvContent: string;
  rowCount: number;
  fileName: string;
}

export interface ReportTransitionResult extends ReportActionResult {
  state: AdminState;
}

function normalizeScopes(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort();
}

function authorizedScopes(state: AdminState, account: Account | null, requested: string[]) {
  const allowed = accessibleEstablishmentIds(state, account);
  const selected = normalizeScopes(requested.length ? requested : allowed);
  return { allowed, selected, denied: selected.some((item) => !allowed.includes(item)) };
}

export function requestReport(state: AdminState, account: Account | null, input: RequestReportInput, now = new Date().toISOString()): ReportTransitionResult {
  const issues: string[] = [];
  if (!account || !hasAdminCapability(account, "reports:generate")) issues.push("Perfil sem permissao para gerar relatorios.");
  const scopes = authorizedScopes(state, account, input.establishmentIds);
  if (!scopes.selected.length) issues.push("Nenhum estabelecimento disponivel para o relatorio.");
  if (scopes.denied) issues.push("O relatorio solicita dados fora do escopo autorizado.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.periodFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(input.periodTo)) issues.push("Informe um periodo valido.");
  if (input.periodFrom > input.periodTo) issues.push("A data inicial nao pode ser posterior a data final.");
  if (issues.length) return { ok: false, issues, state };

  const suffix = `${Date.parse(now) || now.replace(/\W/g, "")}-${state.reportJobs.length + 1}`;
  const job: ReportJob = {
    id: `report-${input.type.toLowerCase()}-${suffix}`,
    type: input.type,
    requestedBy: account!.id,
    establishmentIds: scopes.selected,
    periodFrom: input.periodFrom,
    periodTo: input.periodTo,
    status: "QUEUED",
    requestedAt: now
  };
  return {
    ok: true,
    issues: [],
    job,
    state: {
      ...state,
      reportJobs: [job, ...state.reportJobs],
      audit: [...state.audit, { id: `audit-${job.id}`, summary: `Relatorio ${input.type} solicitado por ${account!.displayName}`, at: now }]
    }
  };
}

export function markReportProcessing(state: AdminState, jobId: string): ReportTransitionResult {
  const current = state.reportJobs.find((item) => item.id === jobId);
  if (!current) return { ok: false, issues: ["Tarefa de relatorio nao encontrada."], state };
  if (current.status !== "QUEUED") return { ok: false, issues: ["A tarefa nao esta aguardando processamento."], job: current, state };
  const job: ReportJob = { ...current, status: "PROCESSING", failureReason: undefined };
  return { ok: true, issues: [], job, state: { ...state, reportJobs: state.reportJobs.map((item) => item.id === jobId ? job : item) } };
}

export function completeReport(state: AdminState, jobId: string, artifact: ReportArtifact, now = new Date().toISOString()): ReportTransitionResult {
  const current = state.reportJobs.find((item) => item.id === jobId);
  if (!current) return { ok: false, issues: ["Tarefa de relatorio nao encontrada."], state };
  const job: ReportJob = { ...current, status: "READY", completedAt: now, ...artifact, failureReason: undefined };
  return { ok: true, issues: [], job, state: { ...state, reportJobs: state.reportJobs.map((item) => item.id === jobId ? job : item) } };
}

export function failReport(state: AdminState, jobId: string, reason: string, now = new Date().toISOString()): ReportTransitionResult {
  const current = state.reportJobs.find((item) => item.id === jobId);
  if (!current) return { ok: false, issues: ["Tarefa de relatorio nao encontrada."], state };
  const job: ReportJob = { ...current, status: "FAILED", completedAt: now, failureReason: reason };
  return { ok: true, issues: [], job, state: { ...state, reportJobs: state.reportJobs.map((item) => item.id === jobId ? job : item) } };
}

function safeCsvCell(value: unknown) {
  let text = value === null || value === undefined ? "" : String(value);
  text = text.replace(/[\r\n]+/g, " ");
  if (/^\s*[=+\-@]/.test(text)) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}

function csv(headers: string[], rows: unknown[][]) {
  return [headers, ...rows].map((row) => row.map(safeCsvCell).join(",")).join("\r\n");
}

function inPeriod(value: string, from: string, to: string) {
  const date = value.slice(0, 10);
  return date >= from && date <= to;
}

export function generateReportArtifact(state: AdminState, job: ReportJob): ReportArtifact {
  const scope = new Set(job.establishmentIds);
  let headers: string[];
  let rows: unknown[][];

  if (job.type === "SESSIONS") {
    headers = ["sessao", "estabelecimento", "carregador", "status", "inicio", "energia_kwh", "valor_centavos"];
    rows = state.sessions.filter((item) => scope.has(item.establishmentId) && inPeriod(item.startedAt, job.periodFrom, job.periodTo)).map((item) => [item.id, item.establishmentId, item.chargerId, item.status, item.startedAt, item.energyKwh, Math.round((item.finalAmount ?? item.consumedAmount) * 100)]);
  } else if (job.type === "ENERGY") {
    headers = ["estabelecimento", "observado_em", "estado", "demanda_kw", "limite_kw", "solar_kw", "rede_kw"];
    rows = state.energy.filter((item) => scope.has(item.establishmentId) && inPeriod(item.observedAt, job.periodFrom, job.periodTo)).map((item) => [item.establishmentId, item.observedAt, item.demandState, item.demandKw, item.contractedLimitKw, item.solarPowerKw, item.gridPowerKw]);
  } else if (job.type === "FINANCIAL") {
    headers = ["transacao", "sessao", "estabelecimento", "status", "capturado_centavos", "reembolsado_centavos", "liquidacao"];
    rows = state.paymentTransactions.filter((item) => scope.has(item.establishmentId) && inPeriod(item.createdAt, job.periodFrom, job.periodTo)).map((item) => [item.id, item.sessionId, item.establishmentId, item.status, item.capturedCents, item.refundedCents, item.settlementStatus]);
  } else {
    headers = ["incidente", "estabelecimento", "origem", "categoria", "severidade", "status", "criado_em", "ocorrencias"];
    rows = state.incidents.filter((item) => scope.has(item.establishmentId) && inPeriod(item.createdAt, job.periodFrom, job.periodTo)).map((item) => [item.id, item.establishmentId, item.source, item.category, item.severity, item.status, item.createdAt, item.occurrences]);
  }

  return {
    csvContent: `\uFEFF${csv(headers, rows)}`,
    rowCount: rows.length,
    fileName: `chargegrid-${job.type.toLowerCase()}-${job.periodFrom}-${job.periodTo}.csv`
  };
}

export function saveReportSubscription(state: AdminState, account: Account | null, input: Pick<ReportSubscription, "type" | "establishmentIds" | "cadence" | "status">, now = new Date().toISOString()): ReportTransitionResult {
  if (!account || !hasAdminCapability(account, "reports:subscribe")) return { ok: false, issues: ["Perfil sem permissao para assinar relatorios."], state };
  const scopes = authorizedScopes(state, account, input.establishmentIds);
  if (!scopes.selected.length || scopes.denied) return { ok: false, issues: ["A assinatura solicita um escopo nao autorizado."], state };
  const id = `subscription-${account.id}-${input.type.toLowerCase()}`;
  const subscription: ReportSubscription = { id, accountId: account.id, type: input.type, establishmentIds: scopes.selected, cadence: input.cadence, status: input.status, nextRunAt: input.status === "ACTIVE" ? new Date(Date.parse(now) + 7 * 86400000).toISOString() : undefined, updatedAt: now };
  const exists = state.reportSubscriptions.some((item) => item.id === id);
  return { ok: true, issues: [], subscription, state: { ...state, reportSubscriptions: exists ? state.reportSubscriptions.map((item) => item.id === id ? subscription : item) : [...state.reportSubscriptions, subscription], audit: [...state.audit, { id: `audit-${id}-${Date.parse(now)}`, summary: `Assinatura ${input.type} ${input.status.toLowerCase()} por ${account.displayName}`, at: now }] } };
}
