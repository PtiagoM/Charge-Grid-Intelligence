import type {
  Account,
  AdminState,
  ChargerCommand,
  ChargerCommandStatus,
  ChargerTelemetry,
  RequestChargerCommandInput,
  RequestChargerCommandResult,
  SessionEvent,
  SessionEventType
} from "./admin";
import { hasAdminCapability } from "./adminCapabilities";
import { assessEstablishmentEnergy } from "./energyDemand";

export interface ChargerCommandTransitionResult extends RequestChargerCommandResult {
  state: AdminState;
}

export interface ChargerCommandOutcome {
  status: Extract<ChargerCommandStatus, "CONFIRMED" | "FAILED" | "EXPIRED">;
  telemetry?: ChargerTelemetry;
  failureCode?: ChargerCommand["failureCode"];
  failureReason?: string;
}

function commandEvent(
  command: ChargerCommand,
  type: SessionEventType,
  label: string,
  at: string,
  source: SessionEvent["source"],
  detail?: string
): SessionEvent | null {
  if (!command.sessionId) return null;
  return {
    id: `event-${command.id}-${type.toLowerCase()}`,
    sessionId: command.sessionId,
    type,
    label,
    at,
    source,
    commandId: command.id,
    detail
  };
}

function appendEvent(state: AdminState, event: SessionEvent | null) {
  if (!event || state.sessionEvents.some((item) => item.id === event.id)) return state.sessionEvents;
  return [...state.sessionEvents, event];
}

function replaceCommand(state: AdminState, command: ChargerCommand): AdminState {
  return {
    ...state,
    chargerCommands: state.chargerCommands.map((item) => item.id === command.id ? command : item)
  };
}

export function requestChargerCommand(
  state: AdminState,
  account: Account | null,
  input: RequestChargerCommandInput,
  requestedAt = new Date().toISOString()
): ChargerCommandTransitionResult {
  const existing = state.chargerCommands.find((item) => item.idempotencyKey === input.idempotencyKey);
  if (existing) return { ok: true, issues: [], command: existing, state };

  const issues: string[] = [];
  const charger = state.chargers.find((item) => item.id === input.chargerId);
  if (!account || !hasAdminCapability(account.profile, "chargers:command")) issues.push("Perfil sem permissao para comandar carregadores.");
  if (!charger) issues.push("Carregador nao encontrado.");
  if (input.reason.trim().length < 8) issues.push("Informe um motivo com pelo menos 8 caracteres.");
  if (charger && account?.profile === "ESTABELECIMENTO" && account.establishmentId !== charger.establishmentId) {
    issues.push("Carregador fora do escopo do estabelecimento.");
  }
  if (charger && state.chargerCommands.some((item) => item.chargerId === charger.id && (item.status === "REQUESTED" || item.status === "ACCEPTED"))) {
    issues.push("Ja existe um comando em processamento para este carregador.");
  }

  const session = charger && input.type === "START_CHARGE"
    ? state.sessions.find((item) => item.chargerId === charger.id && item.status === "authorized")
    : charger && state.sessions.find((item) => item.chargerId === charger.id && item.status === "active");

  if (charger && input.type === "START_CHARGE") {
    if (charger.status === "offline") issues.push("Carregador offline nao pode iniciar uma recarga.");
    if (charger.status === "charging") issues.push("Carregador ja possui uma recarga ativa.");
    if (!session) issues.push("Nao existe sessao autorizada para iniciar neste carregador.");
    const energy = assessEstablishmentEnergy(state, charger.establishmentId, requestedAt);
    if (!energy.canStartCharge) issues.push(`Inicio bloqueado pela politica de energia: ${energy.reason}`);
  }
  if (charger && input.type === "STOP_CHARGE") {
    if (charger.status !== "charging") issues.push("Carregador nao possui recarga ativa para encerrar.");
    if (!session) issues.push("Nao existe sessao ativa para encerrar neste carregador.");
  }
  if (issues.length || !charger || !account || !session) return { ok: false, issues, state };

  const safeKey = input.idempotencyKey.replace(/[^a-zA-Z0-9-]/g, "-").slice(-48);
  const command: ChargerCommand = {
    id: `cmd-${safeKey}`,
    idempotencyKey: input.idempotencyKey,
    correlationId: `corr-${safeKey}`,
    chargerId: charger.id,
    sessionId: session.id,
    type: input.type,
    status: "REQUESTED",
    reason: input.reason.trim(),
    requestedBy: account.displayName,
    requestedByProfile: account.profile,
    requestedAt
  };
  const event = commandEvent(
    command,
    input.type === "START_CHARGE" ? "START_REQUESTED" : "STOP_REQUESTED",
    input.type === "START_CHARGE" ? "Inicio solicitado" : "Encerramento solicitado",
    requestedAt,
    "CHARGEGRID",
    command.reason
  );

  return {
    ok: true,
    issues: [],
    command,
    state: {
      ...state,
      chargerCommands: [...state.chargerCommands, command],
      sessions: state.sessions.map((item) => item.id === session.id && input.type === "START_CHARGE" ? { ...item, status: "starting" } : item),
      sessionEvents: appendEvent(state, event),
      audit: [...state.audit, { id: `audit-${command.id}`, summary: `${command.type} solicitado em ${charger.identifier} por ${account.displayName}`, at: requestedAt }]
    }
  };
}

export function acceptChargerCommand(
  state: AdminState,
  commandId: string,
  providerCommandId: string,
  acceptedAt = new Date().toISOString()
): ChargerCommandTransitionResult {
  const current = state.chargerCommands.find((item) => item.id === commandId);
  if (!current) return { ok: false, issues: ["Comando nao encontrado."], state };
  if (current.status !== "REQUESTED") return { ok: current.status === "ACCEPTED", issues: current.status === "ACCEPTED" ? [] : ["Comando nao esta aguardando aceite."], command: current, state };

  const command: ChargerCommand = { ...current, status: "ACCEPTED", providerCommandId, acceptedAt };
  const updated = replaceCommand(state, command);
  const event = commandEvent(
    command,
    command.type === "START_CHARGE" ? "START_ACCEPTED" : "STOP_ACCEPTED",
    "Comando aceito pelo provedor",
    acceptedAt,
    "GOODWE",
    `Protocolo ${providerCommandId}`
  );
  return { ok: true, issues: [], command, state: { ...updated, sessionEvents: appendEvent(updated, event) } };
}

export function resolveChargerCommand(
  state: AdminState,
  commandId: string,
  outcome: ChargerCommandOutcome,
  completedAt = new Date().toISOString()
): ChargerCommandTransitionResult {
  const current = state.chargerCommands.find((item) => item.id === commandId);
  if (!current) return { ok: false, issues: ["Comando nao encontrado."], state };
  if (current.status !== "ACCEPTED") return { ok: false, issues: ["Comando nao esta aguardando confirmacao."], command: current, state };

  const expectsCharging = current.type === "START_CHARGE";
  const telemetryMatches = outcome.telemetry && outcome.telemetry.chargerId === current.chargerId && (
    expectsCharging ? outcome.telemetry.connectorState === "CHARGING" : outcome.telemetry.connectorState !== "CHARGING"
  );
  const telemetryIsFresh = !outcome.telemetry || !current.acceptedAt || new Date(outcome.telemetry.observedAt).getTime() >= new Date(current.acceptedAt).getTime();
  if (outcome.status === "CONFIRMED" && !telemetryMatches) {
    return { ok: false, issues: ["Telemetria incompativel com a confirmacao do comando."], command: current, state };
  }
  if (outcome.status === "CONFIRMED" && !telemetryIsFresh) {
    return { ok: false, issues: ["Telemetria anterior ao aceite do comando."], command: current, state };
  }

  const command: ChargerCommand = {
    ...current,
    status: outcome.status,
    completedAt,
    telemetryObservedAt: outcome.telemetry?.observedAt,
    failureCode: outcome.failureCode,
    failureReason: outcome.failureReason
  };
  let next = replaceCommand(state, command);

  if (outcome.telemetry) {
    next = {
      ...next,
      chargerTelemetry: [
        ...next.chargerTelemetry.filter((item) => item.chargerId !== outcome.telemetry?.chargerId),
        outcome.telemetry
      ]
    };
  }

  if (outcome.status === "CONFIRMED" && outcome.telemetry) {
    next = {
      ...next,
      chargers: next.chargers.map((item) => item.id === current.chargerId ? { ...item, status: expectsCharging ? "charging" : "available" } : item),
      sessions: next.sessions.map((item) => item.id === current.sessionId ? {
        ...item,
        status: expectsCharging ? "active" : "finished",
        finalAmount: expectsCharging ? item.finalAmount : item.consumedAmount
      } : item)
    };
    const energyEvent = commandEvent(
      command,
      expectsCharging ? "ENERGY_CONFIRMED" : "ENERGY_FINISHED",
      expectsCharging ? "Energia confirmada no conector" : "Fluxo de energia encerrado",
      outcome.telemetry.observedAt,
      "GOODWE",
      `${outcome.telemetry.currentPowerKw.toFixed(1)} kW observados`
    );
    next = { ...next, sessionEvents: appendEvent(next, energyEvent) };
  } else if (outcome.status === "FAILED" && expectsCharging) {
    next = {
      ...next,
      sessions: next.sessions.map((item) => item.id === current.sessionId ? { ...item, status: "start_failed" } : item)
    };
    const failureEvent = commandEvent(command, "START_FAILED", "Falha ao iniciar recarga", completedAt, "GOODWE", outcome.failureReason);
    next = { ...next, sessionEvents: appendEvent(next, failureEvent) };
  } else if (outcome.status === "EXPIRED") {
    next = {
      ...next,
      sessions: next.sessions.map((item) => item.id === current.sessionId && expectsCharging ? { ...item, status: "authorized" } : item)
    };
    const expiredEvent = commandEvent(command, "COMMAND_EXPIRED", "Comando expirado sem confirmacao", completedAt, "CHARGEGRID", outcome.failureReason);
    next = { ...next, sessionEvents: appendEvent(next, expiredEvent) };
  }

  next = {
    ...next,
    audit: [...next.audit, {
      id: `audit-${command.id}-${outcome.status.toLowerCase()}`,
      summary: `${command.type} ${outcome.status.toLowerCase()} em ${command.chargerId}`,
      at: completedAt
    }]
  };
  return { ok: outcome.status === "CONFIRMED", issues: outcome.failureReason ? [outcome.failureReason] : [], command, state: next };
}
