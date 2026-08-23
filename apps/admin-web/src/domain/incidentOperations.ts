import type { Account, AdminState, Incident, IncidentActionResult, IncidentEvent, Recommendation } from "./admin";
import { hasAdminCapability } from "./adminCapabilities";
import { recommendEnergyAction } from "./energyDemand";

export interface IncidentTransitionResult extends IncidentActionResult {
  state: AdminState;
}

export interface IncidentSignal {
  establishmentId: string;
  locationId?: string;
  chargerId?: string;
  sessionId?: string;
  source: Incident["source"];
  sourceEventId: string;
  correlationKey: string;
  category: Incident["category"];
  severity: Incident["severity"];
  title: string;
  summary: string;
}

function canManage(account: Account | null, establishmentId: string) {
  return Boolean(account && hasAdminCapability(account, "incidents:manage") && (
    account.profile === "GOODWE" || account.establishmentId === establishmentId
  ));
}

function recommendationForIncident(incident: Incident): Recommendation {
  return {
    id: `rec-${incident.id}`,
    establishmentId: incident.establishmentId,
    incidentId: incident.id,
    title: incident.category === "SESSION_START" ? "Revisar conexao antes de nova tentativa" : "Investigar equipamento afetado",
    rationale: incident.summary,
    evidence: [`Origem ${incident.source}.`, `${incident.occurrences} ocorrencia(s) correlacionada(s).`, `Severidade ${incident.severity}.`],
    expectedImpact: incident.severity === "CRITICAL" || incident.severity === "HIGH" ? "Reduzir indisponibilidade e evitar novas sessoes afetadas." : "Restabelecer a qualidade operacional do ponto.",
    proposedAction: incident.chargerId ? "OPEN_CHARGER" : "MONITOR",
    targetId: incident.chargerId,
    confidence: incident.source === "GOODWE" ? "HIGH" : "MEDIUM",
    deterministic: true,
    status: "OPEN",
    createdAt: incident.updatedAt
  };
}

export function ingestIncidentSignal(state: AdminState, signal: IncidentSignal, now = new Date().toISOString()): IncidentTransitionResult {
  const previousIncidentId = state.incidentEvents.find((item) => item.sourceEventId === signal.sourceEventId)?.incidentId;
  if (state.incidents.some((item) => item.source === signal.source && item.sourceEventId === signal.sourceEventId) || previousIncidentId) {
    const incident = state.incidents.find((item) => item.id === previousIncidentId || (item.source === signal.source && item.sourceEventId === signal.sourceEventId));
    return { ok: true, issues: [], incident, state };
  }
  const correlated = state.incidents.find((item) => item.correlationKey === signal.correlationKey && item.status !== "RESOLVED");
  if (correlated) {
    const incident: Incident = { ...correlated, occurrences: correlated.occurrences + 1, updatedAt: now, severity: signal.severity === "CRITICAL" ? "CRITICAL" : correlated.severity };
    const incidentEvent: IncidentEvent = { id: `incident-event-${incident.id}-correlated-${incident.occurrences}`, incidentId: incident.id, sourceEventId: signal.sourceEventId, type: "CORRELATED", at: now, actor: signal.source, detail: signal.summary };
    return { ok: true, issues: [], incident, state: { ...state, incidents: state.incidents.map((item) => item.id === incident.id ? incident : item), incidentEvents: [...state.incidentEvents, incidentEvent] } };
  }

  const incident: Incident = { id: `incident-${signal.source.toLowerCase()}-${signal.sourceEventId}`, ...signal, status: "OPEN", occurrences: 1, createdAt: now, updatedAt: now };
  const incidentEvent: IncidentEvent = { id: `incident-event-${incident.id}-created`, incidentId: incident.id, sourceEventId: signal.sourceEventId, type: "CREATED", at: now, actor: signal.source, detail: signal.summary };
  const recommendation = recommendationForIncident(incident);
  return { ok: true, issues: [], incident, state: { ...state, incidents: [...state.incidents, incident], incidentEvents: [...state.incidentEvents, incidentEvent], recommendations: state.recommendations.some((item) => item.id === recommendation.id) ? state.recommendations : [...state.recommendations, recommendation] } };
}

export function correlateOperationalSignals(state: AdminState, now = new Date().toISOString()) {
  let next = state;
  for (const telemetry of state.chargerTelemetry.filter((item) => item.connectorState === "OFFLINE" || item.connectorState === "FAULT")) {
    const charger = state.chargers.find((item) => item.id === telemetry.chargerId);
    if (!charger) continue;
    next = ingestIncidentSignal(next, { establishmentId: charger.establishmentId, locationId: charger.locationId, chargerId: charger.id, source: "GOODWE", sourceEventId: `${charger.id}-${telemetry.observedAt}`, correlationKey: `charger-${charger.id}-availability`, category: telemetry.connectorState === "OFFLINE" ? "COMMUNICATION" : "CHARGER_FAULT", severity: telemetry.connectorState === "OFFLINE" ? "HIGH" : "CRITICAL", title: `${charger.id} ${telemetry.connectorState.toLowerCase()}`, summary: telemetry.faultCode ? `GoodWe reportou ${telemetry.faultCode}.` : "GoodWe deixou de reportar telemetria valida." }, now).state;
  }
  for (const command of state.chargerCommands.filter((item) => item.status === "FAILED")) {
    const charger = state.chargers.find((item) => item.id === command.chargerId);
    if (!charger) continue;
    next = ingestIncidentSignal(next, { establishmentId: charger.establishmentId, locationId: charger.locationId, chargerId: charger.id, sessionId: command.sessionId, source: "CHARGEGRID", sourceEventId: command.id, correlationKey: `charger-${charger.id}-start`, category: "SESSION_START", severity: "HIGH", title: `Falha de inicio em ${charger.id}`, summary: command.failureReason ?? "Comando de inicio falhou sem confirmacao de energia." }, now).state;
  }
  for (const transaction of state.paymentTransactions.filter((item) => item.status === "DISPUTED")) {
    next = ingestIncidentSignal(next, { establishmentId: transaction.establishmentId, sessionId: transaction.sessionId, source: "PAYMENT", sourceEventId: transaction.id, correlationKey: `payment-${transaction.id}`, category: "PAYMENT", severity: "HIGH", title: `Disputa em ${transaction.sessionId}`, summary: "O provider financeiro marcou a transacao como disputada." }, now).state;
  }
  return next;
}

export function acknowledgeIncident(state: AdminState, account: Account | null, incidentId: string, assignee: string, now = new Date().toISOString()): IncidentTransitionResult {
  const current = state.incidents.find((item) => item.id === incidentId);
  if (!current) return { ok: false, issues: ["Incidente nao encontrado."], state };
  if (!canManage(account, current.establishmentId)) return { ok: false, issues: ["Perfil sem permissao para gerenciar este incidente."], incident: current, state };
  if (!assignee.trim()) return { ok: false, issues: ["Informe o responsavel pelo incidente."], incident: current, state };
  if (current.status === "RESOLVED") return { ok: false, issues: ["Incidente resolvido nao pode ser reconhecido novamente."], incident: current, state };
  const incident: Incident = { ...current, status: "IN_PROGRESS", assignee: assignee.trim(), updatedAt: now };
  const incidentEvent: IncidentEvent = { id: `incident-event-${incident.id}-assigned-${now}`, incidentId, type: "ASSIGNED", at: now, actor: account?.displayName ?? "Operacao", detail: `Responsavel: ${assignee.trim()}` };
  return { ok: true, issues: [], incident, state: { ...state, incidents: state.incidents.map((item) => item.id === incidentId ? incident : item), incidentEvents: [...state.incidentEvents, incidentEvent] } };
}

export function resolveIncident(state: AdminState, account: Account | null, incidentId: string, resolution: string, now = new Date().toISOString()): IncidentTransitionResult {
  const current = state.incidents.find((item) => item.id === incidentId);
  if (!current) return { ok: false, issues: ["Incidente nao encontrado."], state };
  if (!canManage(account, current.establishmentId)) return { ok: false, issues: ["Perfil sem permissao para gerenciar este incidente."], incident: current, state };
  if (resolution.trim().length < 8) return { ok: false, issues: ["Descreva a resolucao com pelo menos 8 caracteres."], incident: current, state };
  const incident: Incident = { ...current, status: "RESOLVED", resolution: resolution.trim(), resolvedAt: now, updatedAt: now };
  const incidentEvent: IncidentEvent = { id: `incident-event-${incident.id}-resolved`, incidentId, type: "RESOLVED", at: now, actor: account?.displayName ?? "Operacao", detail: incident.resolution };
  return { ok: true, issues: [], incident, state: { ...state, incidents: state.incidents.map((item) => item.id === incidentId ? incident : item), incidentEvents: [...state.incidentEvents, incidentEvent], audit: [...state.audit, { id: `audit-${incidentEvent.id}`, summary: `Incidente ${incident.id} resolvido por ${incidentEvent.actor}`, at: now }] } };
}

export function decideRecommendation(state: AdminState, account: Account | null, recommendationId: string, decision: Extract<Recommendation["status"], "ACCEPTED" | "DEFERRED" | "REJECTED">, reason: string, now = new Date().toISOString()): IncidentTransitionResult {
  const current = state.recommendations.find((item) => item.id === recommendationId);
  if (!current) return { ok: false, issues: ["Recomendacao nao encontrada."], state };
  if (!canManage(account, current.establishmentId)) return { ok: false, issues: ["Perfil sem permissao para decidir esta recomendacao."], recommendation: current, state };
  if (current.status !== "OPEN") return { ok: false, issues: ["Recomendacao ja possui uma decisao registrada."], recommendation: current, state };
  if (decision !== "ACCEPTED" && reason.trim().length < 8) return { ok: false, issues: ["Informe o motivo da decisao com pelo menos 8 caracteres."], recommendation: current, state };
  const recommendation: Recommendation = { ...current, status: decision, decidedAt: now, decidedBy: account?.displayName, decisionReason: reason.trim() || "Acao aceita para revisao humana." };
  return { ok: true, issues: [], recommendation, state: { ...state, recommendations: state.recommendations.map((item) => item.id === recommendationId ? recommendation : item), audit: [...state.audit, { id: `audit-recommendation-${recommendation.id}-${decision.toLowerCase()}`, summary: `Recomendacao ${recommendation.id} ${decision.toLowerCase()} por ${account?.displayName}`, at: now }] } };
}

export function deterministicEnergyRecommendation(state: AdminState, establishmentId: string, now = new Date().toISOString()): Recommendation {
  const energy = recommendEnergyAction(state, establishmentId, now);
  return { id: `rec-energy-${establishmentId}`, establishmentId, title: energy.title, rationale: energy.reason, evidence: energy.evidence, expectedImpact: energy.action === "REVIEW_STOP" ? "Recuperar margem de demanda com decisao assistida." : "Preservar a operacao dentro da politica energetica.", proposedAction: "OPEN_ENERGY", targetId: establishmentId, confidence: energy.severity === "critical" ? "HIGH" : "MEDIUM", deterministic: true, status: "OPEN", createdAt: now };
}
