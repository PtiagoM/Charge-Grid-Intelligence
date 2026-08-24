import type { Account, AdminState, QueueActionResult, QueueEntry, QueueEvent } from "./admin";
import { hasAdminCapability } from "./adminCapabilities";
import { canAccessEstablishment } from "./accessOperations";

export interface QueueTransitionResult extends QueueActionResult {
  state: AdminState;
}

export interface EnqueueDriverInput {
  id: string;
  driverId: string;
  establishmentId: string;
  locationId: string;
  driverName: string;
  vehicle: string;
  requiredConnector: QueueEntry["requiredConnector"];
}

function canManage(state: AdminState, account: Account | null, establishmentId: string) {
  return Boolean(account && hasAdminCapability(account, "queue:manage") && canAccessEstablishment(state, account, establishmentId));
}

function event(entry: QueueEntry, type: QueueEvent["type"], label: string, at: string, actor: string, detail?: string): QueueEvent {
  return { id: `queue-event-${entry.id}-${type.toLowerCase()}-${at}`, queueEntryId: entry.id, establishmentId: entry.establishmentId, type, label, at, actor, detail };
}

function replaceEntry(state: AdminState, entry: QueueEntry, queueEvent: QueueEvent): AdminState {
  return {
    ...state,
    queue: state.queue.map((item) => item.id === entry.id ? entry : item),
    queueEvents: [...state.queueEvents, queueEvent],
    audit: [...state.audit, { id: `audit-${queueEvent.id}`, summary: `${queueEvent.label}: ${entry.driverName}`, at: queueEvent.at }]
  };
}

function connectorForModel(model: string): QueueEntry["requiredConnector"] {
  return model.toUpperCase().includes("DC") ? "CCS_2" : "TYPE_2";
}

export function enqueueDriver(state: AdminState, input: EnqueueDriverInput, joinedAt = new Date().toISOString()): QueueTransitionResult {
  const issues: string[] = [];
  if (!state.establishments.some((item) => item.id === input.establishmentId)) issues.push("Estabelecimento nao encontrado.");
  if (!state.locations.some((item) => item.id === input.locationId && item.establishmentId === input.establishmentId)) issues.push("Local fora do estabelecimento.");
  if (state.queue.some((item) => item.driverId === input.driverId && ["waiting", "called", "assigned"].includes(item.status))) issues.push("Motorista ja possui uma entrada ativa em fila.");
  if (issues.length) return { ok: false, issues, state };

  const entry: QueueEntry = { ...input, status: "waiting", joinedAt };
  const joined = event(entry, "JOINED", "Entrada confirmada na fila", joinedAt, "DRIVER_PWA", `${input.requiredConnector} · ${input.vehicle}`);
  return { ok: true, issues: [], entry, state: { ...state, queue: [...state.queue, entry], queueEvents: [...state.queueEvents, joined] } };
}

export function callNextDriver(state: AdminState, account: Account | null, establishmentId: string, now = new Date().toISOString(), windowMinutes = 10): QueueTransitionResult {
  if (!canManage(state, account, establishmentId)) return { ok: false, issues: ["Perfil sem permissao para gerenciar esta fila."], state };
  if (state.queue.some((item) => item.establishmentId === establishmentId && item.status === "called")) {
    return { ok: false, issues: ["Ja existe um motorista em janela de chamada neste estabelecimento."], state };
  }

  const entry = state.queue
    .filter((item) => item.establishmentId === establishmentId && item.status === "waiting")
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt))[0];
  if (!entry) return { ok: false, issues: ["Nao ha motoristas aguardando neste estabelecimento."], state };

  const charger = state.chargers
    .filter((item) => item.establishmentId === establishmentId && item.status === "available" && item.commercialStatus === "PUBLISHED" && connectorForModel(item.model) === entry.requiredConnector)
    .sort((a, b) => a.id.localeCompare(b.id))[0];
  if (!charger) return { ok: false, issues: ["Nao ha carregador compativel e disponivel para a proxima chamada."], state };

  const calledAt = new Date(now);
  const calledAtIso = calledAt.toISOString();
  const callExpiresAt = new Date(calledAt.getTime() + windowMinutes * 60_000).toISOString();
  const called: QueueEntry = { ...entry, status: "called", calledAt: calledAtIso, callExpiresAt, suggestedChargerId: charger.id };
  const calledEvent = event(called, "CALLED", "Motorista chamado", calledAtIso, account?.displayName ?? "Operacao", `${charger.id} sugerido · janela de ${windowMinutes} min; sem reserva tecnica`);
  return { ok: true, issues: [], entry: called, state: replaceEntry(state, called, calledEvent) };
}

export function confirmQueueArrival(state: AdminState, account: Account | null, entryId: string, now = new Date().toISOString()): QueueTransitionResult {
  const current = state.queue.find((item) => item.id === entryId);
  if (!current) return { ok: false, issues: ["Entrada de fila nao encontrada."], state };
  if (!canManage(state, account, current.establishmentId)) return { ok: false, issues: ["Perfil sem permissao para gerenciar esta fila."], state };
  if (current.status !== "called") return { ok: false, issues: ["Motorista nao esta em janela de chamada."], entry: current, state };
  if (current.callExpiresAt && new Date(now).getTime() > new Date(current.callExpiresAt).getTime()) return { ok: false, issues: ["Janela de chamada expirada."], entry: current, state };

  const assigned: QueueEntry = { ...current, status: "assigned", assignedAt: now };
  const assignedEvent = event(assigned, "ASSIGNED", "Comparecimento confirmado", now, account?.displayName ?? "Operacao", `${assigned.suggestedChargerId} indicado; conector continua sem reserva`);
  return { ok: true, issues: [], entry: assigned, state: replaceEntry(state, assigned, assignedEvent) };
}

export function markQueueNoShow(state: AdminState, account: Account | null, entryId: string, now = new Date().toISOString()): QueueTransitionResult {
  const current = state.queue.find((item) => item.id === entryId);
  if (!current) return { ok: false, issues: ["Entrada de fila nao encontrada."], state };
  if (!canManage(state, account, current.establishmentId)) return { ok: false, issues: ["Perfil sem permissao para gerenciar esta fila."], state };
  if (current.status !== "called") return { ok: false, issues: ["Motorista nao esta em janela de chamada."], entry: current, state };
  if (current.callExpiresAt && new Date(now).getTime() < new Date(current.callExpiresAt).getTime()) return { ok: false, issues: ["A janela de chamada ainda esta ativa."], entry: current, state };

  const noShow: QueueEntry = { ...current, status: "no_show", completedAt: now };
  const noShowEvent = event(noShow, "NO_SHOW", "Nao comparecimento registrado", now, account?.displayName ?? "Operacao");
  return { ok: true, issues: [], entry: noShow, state: replaceEntry(state, noShow, noShowEvent) };
}

export function releaseQueueEntry(state: AdminState, account: Account | null, entryId: string, now = new Date().toISOString()): QueueTransitionResult {
  const current = state.queue.find((item) => item.id === entryId);
  if (!current) return { ok: false, issues: ["Entrada de fila nao encontrada."], state };
  if (!canManage(state, account, current.establishmentId)) return { ok: false, issues: ["Perfil sem permissao para gerenciar esta fila."], state };
  if (current.status !== "assigned") return { ok: false, issues: ["Entrada ainda nao foi atribuida."], entry: current, state };
  const released: QueueEntry = { ...current, status: "released", completedAt: now };
  const releasedEvent = event(released, "RELEASED", "Fila concluida pela operacao", now, account?.displayName ?? "Operacao");
  return { ok: true, issues: [], entry: released, state: replaceEntry(state, released, releasedEvent) };
}

export function queuePosition(state: AdminState, entryId: string, averageWaitMinutes = 18) {
  const waiting = state.queue.filter((item) => item.status === "waiting").sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  const index = waiting.findIndex((item) => item.id === entryId);
  return index < 0 ? null : { position: index + 1, estimatedWaitMinutes: (index + 1) * averageWaitMinutes };
}
