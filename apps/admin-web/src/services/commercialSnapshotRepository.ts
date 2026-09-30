import { CommercialSessionStatus, PaymentStatus, QueueStatus, type CommercialDashboardSummary, type CommercialEnergyView, type CommercialInsight, type CommercialInsights, type CommercialOperationalReport, type CommercialSnapshot, type LabScenarioId } from "@chargegrid/shared";
import type { AdminState, Charger, ChargerTelemetry, Client, CommercialPlantLink, EnergyPolicy, EnergySnapshot, Establishment, FinancialEvent, Incident, IncidentEvent, Location, PaymentTransaction, QueueEntry, Recommendation, Session, SessionEvent, TariffPolicy } from "../domain/admin";

const apiUrl = (import.meta.env.VITE_CHARGEGRID_API_URL || "http://localhost:3333").replace(/\/$/, "");

export type DashboardPeriod = "day" | "week" | "month";

export function dashboardPeriodBounds(period: DashboardPeriod, to = new Date()) {
  const end = new Date(to);
  const windowMs = { day: 24, week: 24 * 7, month: 24 * 30 }[period] * 60 * 60 * 1000;
  return { from: new Date(end.getTime() - windowMs).toISOString(), to: end.toISOString() };
}

export async function fetchCommercialDashboardSummary(input: { establishmentId: string; from: string; to: string }, signal?: AbortSignal) {
  const query = new URLSearchParams(input);
  const response = await fetch(`${apiUrl}/commercial/dashboard-summary?${query}`, { signal });
  if (!response.ok) throw new Error("A API ChargeGrid não respondeu ao resumo do Dashboard.");
  return response.json() as Promise<CommercialDashboardSummary>;
}

export async function fetchCommercialSnapshot(signal?: AbortSignal) {
  const response = await fetch(`${apiUrl}/commercial/snapshot`, { signal });
  if (!response.ok) throw new Error("A API ChargeGrid não respondeu ao monitoramento comercial.");
  return response.json() as Promise<CommercialSnapshot>;
}

export type HardwareAction = "CONNECT" | "DISCONNECT" | "START" | "STOP" | "OFFLINE" | "FAULT" | "RECOVER";

export async function sendHardwareEvent(chargerCode: string, action: HardwareAction, powerKw?: number) {
  const response = await fetch(`${apiUrl}/commercial/chargers/${encodeURIComponent(chargerCode)}/hardware`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, powerKw })
  });
  const payload = await response.json().catch(() => ({})) as CommercialSnapshot & { message?: string };
  if (!response.ok) throw new Error(payload.message || "A API não confirmou o evento físico.");
  return payload;
}

export async function resetCommercialTestData() {
  const response = await fetch(`${apiUrl}/commercial/test-data/reset`, { method: "POST" });
  const payload = await response.json().catch(() => ({})) as CommercialSnapshot & { message?: string };
  if (!response.ok) throw new Error(payload.message || "A API não reiniciou os dados de teste.");
  return payload;
}

function sessionStatus(status: CommercialSessionStatus): Session["status"] {
  if (status === CommercialSessionStatus.CHARGING) return "active";
  if (status === CommercialSessionStatus.STARTING) return "starting";
  if (status === CommercialSessionStatus.SUSPENDED_BY_DEMAND) return "suspended";
  if ([CommercialSessionStatus.ENERGY_FINISHED, CommercialSessionStatus.IDLE_GRACE_PERIOD, CommercialSessionStatus.IDLE_FEE].includes(status)) return "energy_finished";
  if ([CommercialSessionStatus.SETTLING, CommercialSessionStatus.SETTLEMENT_PENDING].includes(status)) return "settling";
  if (status === CommercialSessionStatus.COMPLETED) return "finished";
  if ([CommercialSessionStatus.PAYMENT_FAILED, CommercialSessionStatus.START_FAILED, CommercialSessionStatus.FAULTED, CommercialSessionStatus.CANCELLED].includes(status)) return "start_failed";
  return "authorized";
}

export async function fetchCommercialInsights(signal?: AbortSignal) {
  const response = await fetch(`${apiUrl}/commercial/insights`, { signal });
  if (!response.ok) throw new Error("A API ChargeGrid não respondeu aos insights operacionais.");
  return response.json() as Promise<CommercialInsights>;
}

export async function fetchCommercialProjection(signal?: AbortSignal) {
  const snapshot = await fetchCommercialSnapshot(signal);
  const [insights, energyViews] = await Promise.all([
    fetchCommercialInsights(signal),
    Promise.all(snapshot.establishments.filter((item) => item.plantId).map(async (item) => {
      const response = await fetch(`${apiUrl}/commercial/plants/${encodeURIComponent(item.plantId!)}/energy`, { signal });
      if (!response.ok) throw new Error("A API ChargeGrid não respondeu à política energética.");
      return response.json() as Promise<CommercialEnergyView>;
    }))
  ]);
  return { snapshot, insights, energyViews };
}

export async function decideCommercialInsight(id: string, decision: "ACKNOWLEDGE" | "RESOLVE" | "ACCEPT" | "DEFER" | "REJECT", reason: string) {
  const response = await fetch(`${apiUrl}/commercial/insights/${encodeURIComponent(id)}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision, reason })
  });
  const payload = await response.json().catch(() => ({})) as { message?: string };
  if (!response.ok) throw new Error(payload.message || "A API não confirmou a decisão operacional.");
}

function csvCell(value: unknown) {
  const text = String(value ?? "").replace(/[\r\n]+/g, " ");
  const safe = /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function generateCommercialReportArtifact(input: { type: "SESSIONS" | "ENERGY" | "FINANCIAL" | "INCIDENTS"; establishmentId: string; periodFrom: string; periodTo: string }) {
  const from = new Date(`${input.periodFrom}T00:00:00.000Z`);
  const to = new Date(`${input.periodTo}T00:00:00.000Z`);
  to.setUTCDate(to.getUTCDate() + 1);
  const response = await fetch(`${apiUrl}/commercial/reports?${new URLSearchParams({ establishmentId: input.establishmentId, from: from.toISOString(), to: to.toISOString() })}`);
  const payload = await response.json().catch(() => ({})) as CommercialOperationalReport & { message?: string };
  if (!response.ok) throw new Error(payload.message || "A API não respondeu ao relatório comercial.");
  const rows = input.type === "SESSIONS"
    ? payload.sessions.map((session) => [session.id, session.publicCode, session.chargerId, session.chargerCode, session.driverName, session.status, session.createdAt, session.startedAt, session.endedAt, session.energyWh, session.totalCostCents])
    : input.type === "ENERGY"
      ? [[payload.establishmentId, payload.from, payload.to, payload.energy.evWh, payload.energy.solarToEvWh, payload.energy.gridImportWh, payload.energy.gridExportWh]]
      : input.type === "FINANCIAL"
        ? [[payload.establishmentId, payload.from, payload.to, payload.financial.capturedCents, payload.financial.refundedCents]]
        : payload.decisions.map((item) => [item.id, item.kind, item.type, item.reviewState, item.reasonCode, item.updatedAt]);
  const headers = input.type === "SESSIONS"
    ? ["sessao_id", "sessao_codigo", "carregador_id", "carregador_codigo", "motorista", "estado", "criada_em", "iniciada_em", "encerrada_em", "energia_wh", "valor_centavos"]
    : input.type === "ENERGY"
      ? ["estabelecimento", "inicio_utc", "fim_utc", "ev_wh", "solar_para_ev_wh", "importacao_rede_wh", "exportacao_rede_wh"]
      : input.type === "FINANCIAL"
        ? ["estabelecimento", "inicio_utc", "fim_utc", "capturado_centavos", "reembolsado_centavos"]
        : ["decisao", "tipo", "categoria", "estado", "motivo", "atualizado_em"];
  return { csvContent: `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}`, rowCount: rows.length, fileName: `chargegrid-${input.type.toLowerCase()}-${input.periodFrom}-${input.periodTo}.csv` };
}

export async function configurePlantTelemetry(input: { plantId: string; online: boolean; pvKw: number; buildingLoadKw: number }) {
  const response = await fetch(`${apiUrl}/commercial/plants/${encodeURIComponent(input.plantId)}/hardware`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  const payload = await response.json().catch(() => ({})) as CommercialSnapshot & { message?: string };
  if (!response.ok) throw new Error(payload.message || "A API não confirmou o cenário energético.");
  return payload;
}

export async function fetchPlantEnergyView(plantId: string, signal?: AbortSignal) {
  const response = await fetch(`${apiUrl}/commercial/plants/${encodeURIComponent(plantId)}/energy`, { signal });
  if (!response.ok) throw new Error("A API ChargeGrid não respondeu à telemetria da planta.");
  return response.json() as Promise<CommercialEnergyView>;
}

export async function applyPlantScenario(plantId: string, scenarioId: LabScenarioId) {
  const response = await fetch(`${apiUrl}/commercial/plants/${encodeURIComponent(plantId)}/hardware`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenarioId })
  });
  const payload = await response.json().catch(() => ({})) as CommercialSnapshot & { message?: string };
  if (!response.ok) throw new Error(payload.message || "A API não aplicou o cenário de hardware.");
  return payload;
}

export async function publishCommercialTariff(input: { establishmentId: string; energyCentsPerKwh: number; idleCentsPerMinute: number; reason: string }) {
  const response = await fetch(`${apiUrl}/commercial/admin/tariffs`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
  const payload = await response.json().catch(() => ({})) as { message?: string };
  if (!response.ok) throw new Error(payload.message || "A API não publicou a tarifa comercial.");
}

function snapshotSessionEvents(session: CommercialSnapshot["sessions"][number]): SessionEvent[] {
  const money = (cents: number) => `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
  const events: SessionEvent[] = [{ id: `commercial-${session.id}-payment`, sessionId: session.id, type: "PAYMENT_AUTHORIZED", label: "Pagamento autorizado", at: session.createdAt, source: "PAYMENT", detail: `Limite de ${money(session.authorizedCents)}` }];
  if (session.startedAt) events.push({ id: `commercial-${session.id}-connected`, sessionId: session.id, type: "START_ACCEPTED", label: "Veiculo conectado", at: session.startedAt, source: "GOODWE", detail: "Evento fisico simulado pelo provider GoodWe" });
  if (session.status === CommercialSessionStatus.CHARGING) events.push({ id: `commercial-${session.id}-charging`, sessionId: session.id, type: "CHARGING", label: "Recarga em andamento", at: session.updatedAt, source: "GOODWE", detail: `${session.currentPowerKw.toFixed(1)} kW observados` });
  if (session.energyEndedAt) events.push({ id: `commercial-${session.id}-energy-ended`, sessionId: session.id, type: "ENERGY_FINISHED", label: "Entrega de energia encerrada", at: session.energyEndedAt, source: "GOODWE", detail: "Aguardando liquidacao comercial" });
  if (session.settledAt) events.push({ id: `commercial-${session.id}-settled`, sessionId: session.id, type: "PAYMENT_CAPTURED", label: "Pagamento liquidado", at: session.settledAt, source: "PAYMENT", detail: money(session.totalCostCents) });
  return events;
}

function insightEstablishmentId(snapshot: CommercialSnapshot, insight: CommercialInsight) {
  return snapshot.establishments.find((item) => item.plantId === insight.entityId || item.chargers.some((charger) => charger.id === insight.entityId))?.id ?? "est_aurora_001";
}

function insightIncident(snapshot: CommercialSnapshot, insight: CommercialInsight): Incident {
  const establishmentId = insightEstablishmentId(snapshot, insight);
  const category: Incident["category"] = insight.type === "HARDWARE_FAULT" ? "CHARGER_FAULT" : insight.type === "SETTLEMENT_PENDING" ? "PAYMENT" : insight.type === "DEMAND_REVIEW" ? "DEMAND" : "COMMUNICATION";
  const source: Incident["source"] = insight.type === "HARDWARE_FAULT" ? "GOODWE" : insight.type === "SETTLEMENT_PENDING" ? "PAYMENT" : "CHARGEGRID";
  return {
    id: insight.id,
    establishmentId,
    chargerId: snapshot.establishments.flatMap((item) => item.chargers).find((item) => item.id === insight.entityId)?.id,
    sessionId: snapshot.sessions.find((item) => item.id === insight.entityId)?.id,
    source,
    sourceEventId: insight.sourceEventId ?? insight.sampleId ?? insight.id,
    correlationKey: insight.id,
    category,
    severity: insight.severity === "CRITICAL" ? "CRITICAL" : insight.severity === "WARNING" ? "HIGH" : "LOW",
    status: insight.reviewState === "ACKNOWLEDGED" ? "ACKNOWLEDGED" : insight.reviewState === "RESOLVED" ? "RESOLVED" : "OPEN",
    title: insight.type.replaceAll("_", " "),
    summary: insight.message,
    occurrences: 1,
    createdAt: insight.createdAt,
    updatedAt: insight.updatedAt,
    assignee: insight.reviewState === "ACKNOWLEDGED" || insight.reviewState === "RESOLVED" ? insight.decidedBy : undefined,
    resolvedAt: insight.reviewState === "RESOLVED" ? insight.decidedAt : undefined,
    resolution: insight.reviewState === "RESOLVED" ? insight.decisionReason : undefined,
    conditionActive: insight.conditionActive,
    reasonCode: insight.reasonCode,
    evidence: insight.evidence,
    policyVersion: insight.policyVersion,
    sampleId: insight.sampleId
  };
}

function insightIncidentEvents(insight: CommercialInsight): IncidentEvent[] {
  const events: IncidentEvent[] = [{ id: `${insight.id}-signal`, incidentId: insight.id, sourceEventId: insight.sourceEventId ?? insight.sampleId ?? undefined, type: "CREATED", at: insight.createdAt, actor: insight.type === "HARDWARE_FAULT" ? "GOODWE_SIMULATOR" : "CHARGEGRID_API", detail: `Condição ${insight.type.replaceAll("_", " ")} detectada.` }];
  if (insight.decidedAt && (insight.reviewState === "ACKNOWLEDGED" || insight.reviewState === "RESOLVED")) events.push({ id: `${insight.id}-${insight.reviewState.toLowerCase()}`, incidentId: insight.id, type: insight.reviewState, at: insight.decidedAt, actor: insight.decidedBy ?? "Operação ChargeGrid", detail: insight.decisionReason });
  return events;
}

function insightRecommendation(snapshot: CommercialSnapshot, insight: CommercialInsight): Recommendation {
  const establishmentId = insightEstablishmentId(snapshot, insight);
  const action: Recommendation["proposedAction"] = insight.suggestedAction === "OPEN_CHARGER" ? "OPEN_CHARGER" : insight.suggestedAction === "OPEN_FINANCE" ? "OPEN_FINANCE" : insight.suggestedAction === "OPEN_ENERGY" ? "OPEN_ENERGY" : "MONITOR";
  return {
    id: insight.id,
    establishmentId,
    title: ({ SOLAR_OPPORTUNITY: "Aproveitar excedente solar", DEMAND_REVIEW: "Revisar admissão por demanda", RESTORE_TELEMETRY: "Restaurar telemetria" } as Record<string, string>)[insight.type] ?? insight.type.replaceAll("_", " "),
    rationale: insight.message,
    evidence: insight.evidence,
    expectedImpact: insight.type === "SOLAR_OPPORTUNITY"
      ? "Novas cotações elegíveis podem usar a oferta solar enquanto a condição persistir."
      : insight.type === "DEMAND_REVIEW"
        ? "Novos inícios seguem a decisão de admissão persistida; a revisão humana não executa comandos."
        : "A condição deve ser investigada antes de depender destes dados para operação.",
    proposedAction: action,
    targetId: insight.entityId,
    confidence: insight.severity === "CRITICAL" ? "HIGH" : "MEDIUM",
    deterministic: true,
    status: insight.reviewState === "ACCEPTED" ? "ACCEPTED" : insight.reviewState === "DEFERRED" ? "DEFERRED" : insight.reviewState === "REJECTED" ? "REJECTED" : "OPEN",
    createdAt: insight.updatedAt,
    decidedAt: insight.decidedAt,
    decidedBy: insight.decidedBy,
    decisionReason: insight.decisionReason,
    conditionActive: insight.conditionActive,
    origin: "ChargeGrid API · regra determinística",
    reasonCode: insight.reasonCode,
    sourceEventId: insight.sourceEventId,
    sampleId: insight.sampleId,
    policyVersion: insight.policyVersion,
    updatedAt: insight.updatedAt
  };
}

export function mergeCommercialSnapshot(state: AdminState, snapshot: CommercialSnapshot, insights?: CommercialInsights, energyViews: CommercialEnergyView[] = []): AdminState {
  const ids = new Set(snapshot.establishments.map((item) => item.id));
  const locationId = (establishmentId: string) => snapshot.establishments.find((item) => item.id === establishmentId)?.plantId ?? `loc-${establishmentId}`;
  const commercialClient: Client = { id: "cli-chargegrid-pilot", name: "Operação comercial ChargeGrid", corporateName: "Cenário integrado de demonstração", document: "CHARGEGRID-PILOT", owner: "ChargeGrid", contactName: "Operação ChargeGrid", contactEmail: "operacao@chargegrid.local", status: "Ativo" };
  const establishments: Establishment[] = snapshot.establishments.map((item) => ({ id: item.id, clientId: commercialClient.id, name: item.name, city: "São Paulo", state: "SP", address: item.address, pricePerKwh: item.tariffCents / 100, contractCode: `CG-${item.id.toUpperCase()}` }));
  const locations: Location[] = snapshot.establishments.map((item) => ({ id: locationId(item.id), establishmentId: item.id, name: item.name, address: item.address, number: "420", city: "São Paulo", state: "SP", zipCode: "01000-000", latitude: item.latitude, longitude: item.longitude, status: "Ativo" }));
  const commercialPlants: CommercialPlantLink[] = snapshot.establishments.filter((item) => item.plantId).map((item) => ({ id: item.plantId!, goodwePlantId: item.plantId!, establishmentId: item.id, locationId: locationId(item.id), commercialName: item.name, accessPolicy: "PUBLIC", alwaysOpen: true, status: "PUBLISHED", publishedAt: snapshot.generatedAt }));
  const chargers: Charger[] = snapshot.establishments.flatMap((establishment) => establishment.chargers.map((charger) => ({
    id: charger.id,
    establishmentId: establishment.id,
    locationId: locationId(establishment.id),
    identifier: charger.code,
    internalId: charger.id,
    parkingSpot: charger.parkingSpot,
    currentSessionId: charger.currentSessionId,
    serial: charger.code,
    model: "GoodWe AC 7",
    powerKw: charger.nominalPowerKw,
    installationDate: "2026-09-01",
    status: charger.physicalStatus === "CHARGING" ? "charging" : charger.physicalStatus === "CONNECTED" ? "connected" : charger.physicalStatus === "OFFLINE" ? "offline" : charger.physicalStatus === "FAULT" ? "fault" : "available",
    publicationStatus: "PUBLISHED",
    todayEnergyKwh: snapshot.sessions.filter((session) => session.chargerCode === charger.code).reduce((total, session) => total + session.energyWh / 1000, 0),
    revenueToday: snapshot.sessions.filter((session) => session.chargerCode === charger.code).reduce((total, session) => total + session.costCents / 100, 0)
  })));
  const telemetry: ChargerTelemetry[] = snapshot.establishments.flatMap((establishment) => establishment.chargers.map((charger) => ({
    chargerId: charger.id,
    connectorState: (["AVAILABLE", "CONNECTED", "CHARGING", "FAULT", "OFFLINE"].includes(charger.physicalStatus) ? charger.physicalStatus : "AVAILABLE") as ChargerTelemetry["connectorState"],
    currentPowerKw: charger.currentPowerKw,
    observedAt: charger.updatedAt,
    vehicleConnected: ["CONNECTED", "CHARGING"].includes(charger.physicalStatus)
  })));
  const sessions: Session[] = snapshot.sessions.map((session) => ({
    id: session.id,
    publicCode: session.publicCode,
    internalId: session.id,
    chargerId: session.chargerId,
    establishmentId: session.establishmentId,
    locationId: locationId(session.establishmentId),
    driverId: session.driverId ?? `guest-${session.id}`,
    driverName: session.driverName,
    vehicle: session.driverId ? "Veículo cadastrado" : "Visitante",
    status: sessionStatus(session.status),
    startedAt: session.startedAt ?? session.createdAt,
    durationMinutes: Math.max(0, Math.floor((Date.parse(session.endedAt ?? snapshot.generatedAt) - Date.parse(session.startedAt ?? session.createdAt)) / 60_000)),
    energyKwh: session.energyWh / 1000,
    tariffPerKwh: session.tariffCents / 100,
    consumedAmount: session.costCents / 100,
    finalAmount: session.endedAt ? session.costCents / 100 : undefined,
    payment: { status: [PaymentStatus.AUTHORIZED, PaymentStatus.PAID].includes(session.payment.status) ? "Aprovado" : session.payment.status === PaymentStatus.FAILED ? "Recusado" : "Pendente", method: session.payment.method === "PIX" ? "Pix" : "Cartao", limitAmount: session.authorizedCents / 100 },
    idleMinutes: 0
  }));
  const sessionEvents = snapshot.sessions.flatMap(snapshotSessionEvents);
  const paymentTransactions: PaymentTransaction[] = snapshot.sessions.filter((session) => session.payment.paymentIntentId).map((session) => ({
    id: session.payment.id ?? `pay-${session.id}`,
    sessionId: session.id,
    establishmentId: session.establishmentId,
    tariffPolicyId: `commercial-${session.establishmentId}`,
    provider: "STRIPE_SANDBOX",
    providerReference: session.payment.paymentIntentId!,
    currency: "BRL",
    status: session.payment.status === PaymentStatus.PAID ? "CAPTURED" : session.payment.status === PaymentStatus.FAILED ? "FAILED" : "AUTHORIZED",
    settlementStatus: session.payment.status === PaymentStatus.PAID ? "PAID" : session.payment.status === PaymentStatus.FAILED ? "FAILED" : "PENDING",
    authorizedCents: session.authorizedCents,
    capturedCents: session.payment.capturedCents,
    refundedCents: session.payment.refundedCents,
    providerFeeCents: 0,
    platformShareBps: 0,
    createdAt: session.createdAt,
    capturedAt: session.payment.status === PaymentStatus.PAID ? session.settledAt ?? session.endedAt : undefined,
    settledAt: session.settledAt ?? undefined
  }));
  const tariffPolicies: TariffPolicy[] = (snapshot.tariffs ?? []).map((tariff, index, all) => ({
    id: tariff.id,
    establishmentId: tariff.establishmentId,
    version: all.filter((candidate) => candidate.establishmentId === tariff.establishmentId).length - all.slice(0, index).filter((candidate) => candidate.establishmentId === tariff.establishmentId).length,
    status: all.find((candidate) => candidate.establishmentId === tariff.establishmentId)?.id === tariff.id ? "ACTIVE" : "RETIRED",
    energyPriceCentsPerKwh: tariff.energyCentsPerKwh,
    idlePriceCentsPerMinute: tariff.idleCentsPerMinute,
    idleGraceMinutes: tariff.idleGraceMinutes,
    platformShareBps: 0,
    effectiveFrom: tariff.validFrom,
    createdAt: tariff.createdAt,
    createdBy: "ChargeGrid API",
    changeReason: tariff.reason
  }));
  const financialEvents = snapshot.sessions.filter((session) => session.payment.paymentIntentId).flatMap((session) => {
    const transactionId = session.payment.id ?? `pay-${session.id}`;
    const events: FinancialEvent[] = [{ id: `commercial-${session.id}-authorized`, transactionId, type: "AUTHORIZED", at: session.createdAt, actor: "Stripe sandbox", amountCents: session.authorizedCents }];
    if (session.payment.capturedCents) events.push({ id: `commercial-${session.id}-captured`, transactionId, type: "CAPTURED" as const, at: session.settledAt ?? session.updatedAt, actor: "Stripe sandbox", amountCents: session.payment.capturedCents });
    if (session.payment.refundedCents) events.push({ id: `commercial-${session.id}-refunded`, transactionId, type: "REFUNDED" as const, at: session.settledAt ?? session.updatedAt, actor: "Stripe sandbox", amountCents: session.payment.refundedCents });
    if (session.settledAt) events.push({ id: `commercial-${session.id}-settled`, transactionId, type: "SETTLED" as const, at: session.settledAt, actor: "ChargeGrid" });
    return events;
  });
  const queue: QueueEntry[] = snapshot.queue.map((entry) => ({
    id: entry.id,
    driverId: entry.driverId,
    establishmentId: entry.establishmentId,
    locationId: locationId(entry.establishmentId),
    driverName: entry.driverName,
    vehicle: entry.driverVehicle,
    requiredConnector: "TYPE_2",
    status: entry.status === QueueStatus.WAITING ? "waiting" : entry.status === QueueStatus.CALLED ? "called" : entry.status === QueueStatus.ASSIGNED ? "assigned" : entry.status === QueueStatus.EXPIRED ? "expired" : "released",
    position: entry.position,
    estimatedWaitMinutes: entry.estimatedWaitMinutes,
    joinedAt: entry.joinedAt,
    calledAt: entry.calledAt,
    callExpiresAt: entry.assignmentExpiresAt,
    suggestedChargerId: entry.chargerId,
    assignedAt: entry.status === QueueStatus.ASSIGNED ? entry.calledAt : undefined,
    completedAt: entry.completedAt
  }));
  const energy: EnergySnapshot[] = (snapshot.plantEnergy ?? []).map((item) => {
    const establishment = snapshot.establishments.find((candidate) => candidate.plantId === item.plantId);
    const view = energyViews.find((candidate) => candidate.policy.plantId === item.plantId);
    const contractedLimitKw = view?.policy.limitKw ?? 20;
    const demandState = item.energyStatus === "CRITICAL" ? "Crítico" : item.energyStatus === "ALERT" ? "Alerta" : "Favorável";
    return {
      establishmentId: establishment?.id ?? item.plantId,
      plantId: item.plantId,
      sampleId: item.id,
      source: item.source,
      quality: view?.decision.quality ?? item.quality,
      demandState,
      observedAt: item.observedAt,
      providerStatus: item.quality === "FRESH" ? "ONLINE" : "OFFLINE",
      demandKw: item.gridImportKw,
      contractedLimitKw,
      powerMarginPercent: Math.max(0, ((contractedLimitKw - item.gridImportKw) / contractedLimitKw) * 100),
      batterySocPercent: null,
      solarPowerKw: item.pvKw,
      gridPowerKw: item.gridImportKw - item.gridExportKw,
      buildingLoadKw: item.buildingLoadKw,
      evLoadKw: item.evLoadKw,
      gridImportKw: item.gridImportKw,
      gridExportKw: item.gridExportKw,
      decision: view?.decision,
      periodSolarKwh: item.solarToEvWh / 1000,
      periodGridKwh: item.gridImportWh / 1000
    };
  });
  const energyPolicies: EnergyPolicy[] = snapshot.establishments.filter((item) => item.plantId).map((item) => {
    const policy = energyViews.find((view) => view.policy.plantId === item.plantId)?.policy;
    return { establishmentId: item.id, alertUtilizationPercent: policy?.alertPercent ?? 80, criticalUtilizationPercent: policy?.criticalPercent ?? 90, freshnessMinutes: (policy?.freshSeconds ?? 900) / 60, blockStartOnCritical: true, blockStartWithoutFreshTelemetry: true, demandControlEnabled: policy?.demandControlEnabled, version: policy?.version, recoveryUtilizationPercent: policy?.recoveryPercent, recoveryStableSeconds: policy?.recoveryStableSeconds };
  });
  const commercialIncidents = (insights?.alerts ?? []).map((item) => insightIncident(snapshot, item));
  const commercialIncidentEvents = (insights?.alerts ?? []).flatMap(insightIncidentEvents);
  const commercialRecommendations = (insights?.recommendations ?? []).map((item) => insightRecommendation(snapshot, item));
  const scopeIds = [...ids];
  const replacedChargerIds = new Set(state.chargers.filter((item) => ids.has(item.establishmentId)).flatMap((item) => [item.id, item.internalId, item.identifier]));
  const replacedSessionIds = new Set(state.sessions.filter((item) => ids.has(item.establishmentId)).flatMap((item) => [item.id, item.internalId].filter((value): value is string => Boolean(value))));
  return {
    ...state,
    clients: [...state.clients.filter((item) => item.id !== commercialClient.id), commercialClient],
    accounts: state.accounts.map((account) => account.role === "GOODWE_CENTRAL" ? { ...account, technicalEstablishmentIds: [...new Set([...(account.technicalEstablishmentIds ?? []), ...scopeIds])] } : account),
    accessGrants: state.accessGrants.map((grant) => grant.role === "GOODWE_CENTRAL" && grant.status === "ACTIVE" ? { ...grant, establishmentIds: [...new Set([...grant.establishmentIds, ...scopeIds])] } : grant),
    establishments: [...state.establishments.filter((item) => !ids.has(item.id)), ...establishments],
    locations: [...state.locations.filter((item) => !ids.has(item.establishmentId)), ...locations],
    commercialPlants: [...state.commercialPlants.filter((item) => !ids.has(item.establishmentId)), ...commercialPlants],
    chargers: [...state.chargers.filter((item) => !ids.has(item.establishmentId)), ...chargers],
    chargerTelemetry: [...state.chargerTelemetry.filter((item) => !replacedChargerIds.has(item.chargerId)), ...telemetry],
    sessions: [...state.sessions.filter((item) => !ids.has(item.establishmentId)), ...sessions],
    sessionEvents: [...state.sessionEvents.filter((item) => !replacedSessionIds.has(item.sessionId)), ...sessionEvents],
    paymentTransactions: [...state.paymentTransactions.filter((item) => !ids.has(item.establishmentId)), ...paymentTransactions],
    financialEvents: [...state.financialEvents.filter((item) => !paymentTransactions.some((transaction) => transaction.id === item.transactionId)), ...financialEvents],
    incidents: [...state.incidents.filter((item) => !item.id.startsWith("insight_")), ...commercialIncidents],
    incidentEvents: [...state.incidentEvents.filter((item) => !item.incidentId.startsWith("insight_")), ...commercialIncidentEvents],
    recommendations: [...state.recommendations.filter((item) => !item.id.startsWith("insight_")), ...commercialRecommendations],
    tariffPolicies: [...state.tariffPolicies.filter((item) => !ids.has(item.establishmentId)), ...tariffPolicies],
    queue: [...state.queue.filter((item) => !ids.has(item.establishmentId)), ...queue],
    energy: [...state.energy.filter((item) => !ids.has(item.establishmentId)), ...energy],
    energyPolicies: [...state.energyPolicies.filter((item) => !ids.has(item.establishmentId)), ...energyPolicies]
  };
}
