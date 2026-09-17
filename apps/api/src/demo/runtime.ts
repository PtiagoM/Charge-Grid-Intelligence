import { mkdirSync, readFileSync, renameSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import type { DemoRuntimeScenario, DemoRuntimeSession, DemoRuntimeState, DemoStartSessionInput } from "@chargegrid/shared";

export class DemoError extends Error {
  constructor(readonly code: string, message: string, readonly status = 400) { super(message); }
}
const round = (value: number, places = 6) => Number(value.toFixed(places));
const money = (value: number) => round(value, 2);
const conditions = {
  solar: { solarKw: 24, buildingKw: 12 },
  peak: { solarKw: 4, buildingKw: 18 },
  critical: { solarKw: 0, buildingKw: 27 },
  offline: { solarKw: 8, buildingKw: 12 }
} as const;

function validStoredState(value: unknown): value is DemoRuntimeState {
  if (!value || typeof value !== "object") return false;
  const state = value as DemoRuntimeState;
  const finite = (number: unknown) => typeof number === "number" && Number.isFinite(number);
  const nonnegative = (number: unknown) => finite(number) && (number as number) >= 0;
  const date = (text: unknown) => typeof text === "string" && Number.isFinite(Date.parse(text));
  if (state.version !== 1 || state.mode !== "simulated" || !Object.hasOwn(conditions, state.scenario) || !Number.isInteger(state.revision) || state.revision < 0 || !date(state.now)) return false;
  if (!state.plant || state.plant.id !== "DEMO-PLANT" || typeof state.plant.name !== "string" || state.plant.capacityKw !== 28 || !["normal", "alert", "critical", "offline"].includes(state.plant.demandState)) return false;
  if (![state.plant.solarKw, state.plant.buildingKw, state.plant.evKw].every(nonnegative) || !finite(state.plant.gridKw)) return false;
  if (!Array.isArray(state.chargers) || state.chargers.length !== 2 || new Set(state.chargers.map((charger) => charger?.id)).size !== 2 || state.chargers.some((charger) => !charger || !["DEMO-01", "DEMO-02"].includes(charger.id) || typeof charger.name !== "string" || charger.powerKw !== 7 || !["available", "charging", "offline"].includes(charger.status))) return false;
  if (!Array.isArray(state.sessions) || new Set(state.sessions.map((session) => session?.id)).size !== state.sessions.length) return false;
  for (const session of state.sessions) {
    if (!session || typeof session.id !== "string" || typeof session.driverName !== "string" || !state.chargers.some((charger) => charger.id === session.chargerId) || !["charging", "completed"].includes(session.status) || !date(session.startedAt)) return false;
    if (![session.energyKwh, session.solarEnergyKwh, session.gridEnergyKwh, session.amount].every(nonnegative) || ![1.7, 2, 2.6].includes(session.ratePerKwh) || !finite(session.authorizedAmount) || session.authorizedAmount < 0.5 || session.authorizedAmount > 1000 || session.amount > session.authorizedAmount) return false;
    if (Math.abs(session.solarEnergyKwh + session.gridEnergyKwh - session.energyKwh) > 0.000001 || Math.abs(money(session.energyKwh * session.ratePerKwh) - session.amount) > 0.01) return false;
    if (session.status === "completed" && (!date(session.endedAt) || !["user", "financial_limit", "offline"].includes(session.stopReason ?? ""))) return false;
  }
  for (const charger of state.chargers) {
    const active = state.sessions.filter((session) => session.chargerId === charger.id && session.status === "charging");
    if (active.length !== (charger.status === "charging" ? 1 : 0)) return false;
    if ((state.scenario === "offline") !== (charger.status === "offline")) return false;
  }
  if (!Array.isArray(state.events) || state.events.some((item) => !item || typeof item.id !== "string" || !date(item.at) || typeof item.type !== "string" || typeof item.message !== "string" || (item.sessionId !== undefined && !state.sessions.some((session) => session.id === item.sessionId)))) return false;
  const calculated = structuredClone(state);
  refresh(calculated);
  return JSON.stringify(calculated.plant) === JSON.stringify(state.plant);
}

function refresh(state: DemoRuntimeState) {
  const evKw = state.chargers.filter((charger) => charger.status === "charging").reduce((total, charger) => total + charger.powerKw, 0);
  const condition = conditions[state.scenario];
  state.plant = { ...state.plant, ...condition, evKw, gridKw: condition.buildingKw + evKw - condition.solarKw,
    demandState: state.scenario === "offline" ? "offline" : state.scenario === "critical" || condition.buildingKw + evKw > state.plant.capacityKw ? "critical" : condition.buildingKw + evKw > state.plant.capacityKw * 0.8 ? "alert" : "normal" };
}
function event(state: DemoRuntimeState, type: string, message: string, sessionId?: string, at = state.now) {
  state.events.push({ id: `EVT-${state.events.length + 1}`, at, type, message, ...(sessionId ? { sessionId } : {}) });
}
function initialState(): DemoRuntimeState {
  const state: DemoRuntimeState = {
    version: 1, mode: "simulated", revision: 0, now: "2026-09-16T15:00:00.000Z", scenario: "solar",
    plant: { id: "DEMO-PLANT", name: "Laboratório ChargeGrid", solarKw: 24, buildingKw: 12, gridKw: -12, evKw: 0, capacityKw: 28, demandState: "normal" },
    chargers: [1, 2].map((number) => ({ id: `DEMO-0${number}`, name: `Demo 0${number}`, powerKw: 7, status: "available" })),
    sessions: [], events: []
  };
  event(state, "reset", "Cenário local simulado iniciado; nenhum pagamento ou comando físico é executado.");
  return state;
}

export class DemoRuntime {
  private state: DemoRuntimeState;
  private readonly file: string;
  constructor(file: string) {
    mkdirSync(dirname(file), { recursive: true });
    this.file = file;
    if (existsSync(this.file)) {
      const saved: unknown = JSON.parse(readFileSync(this.file, "utf8"));
      if (!validStoredState(saved)) {
        throw new Error("Estado da demonstração inválido. Preserve state.json e configure outro CHARGEGRID_DEMO_STATE_PATH.");
      }
      this.state = saved;
    } else {
      this.state = initialState();
      this.persist(this.state);
    }
  }
  private persist(next: DemoRuntimeState) {
    const temporary = `${this.file}.tmp`;
    writeFileSync(temporary, JSON.stringify(next, null, 2), "utf8");
    renameSync(temporary, this.file);
  }
  snapshot() { return structuredClone(this.state); }
  private change(update: (next: DemoRuntimeState) => void) {
    const next = this.snapshot();
    update(next);
    refresh(next);
    next.revision++;
    this.persist(next);
    this.state = next;
    return this.snapshot();
  }
  reset() {
    return this.change((next) => { const revision = next.revision; Object.assign(next, initialState(), { revision }); });
  }
  scenario(scenario: DemoRuntimeScenario) {
    if (!Object.hasOwn(conditions, scenario)) throw new DemoError("INVALID_SCENARIO", "Escolha solar, peak, critical ou offline.");
    return this.change((next) => {
      next.scenario = scenario;
      event(next, "scenario", `Condição energética simulada: ${scenario}.`);
      if (scenario === "offline") {
        next.sessions.filter((session) => session.status === "charging").forEach((session) => this.finish(next, session, "offline"));
        next.chargers.forEach((charger) => { charger.status = "offline"; });
      } else {
        next.chargers.filter((charger) => charger.status === "offline").forEach((charger) => { charger.status = "available"; });
      }
    });
  }
  start(input: DemoStartSessionInput) {
    if (!input || typeof input.driverName !== "string" || !input.driverName.trim() || input.driverName.trim().length > 80 || typeof input.chargerId !== "string" || !Number.isFinite(input.authorizedAmount) || input.authorizedAmount < 0.5 || input.authorizedAmount > 1000 || Math.abs(input.authorizedAmount * 100 - Math.round(input.authorizedAmount * 100)) > 0.000001 || !["approved", "declined"].includes(input.paymentScenario)) {
      throw new DemoError("INVALID_SESSION", "Informe motorista, carregador, autorização entre R$ 0,50 e R$ 1.000 e cenário de pagamento.");
    }
    return this.change((next) => {
      const charger = next.chargers.find((item) => item.id === input.chargerId);
      if (!charger) throw new DemoError("CHARGER_NOT_FOUND", "Carregador não encontrado.", 404);
      if (charger.status === "offline") throw new DemoError("CHARGER_OFFLINE", "Carregador sem comunicação.", 409);
      if (charger.status !== "available") throw new DemoError("CHARGER_BUSY", "Carregador já possui uma sessão ativa.", 409);
      if (next.plant.demandState === "critical" || next.plant.buildingKw + next.plant.evKw + charger.powerKw > next.plant.capacityKw) throw new DemoError("ENERGY_CAPACITY", "Condição energética bloqueia novas sessões.", 409);
      if (input.paymentScenario === "declined") throw new DemoError("PAYMENT_DECLINED", "Autorização simulada recusada; sessão não iniciada.", 402);
      const session: DemoRuntimeSession = {
        id: `DEMO-SESSION-${next.sessions.length + 1}`, driverName: input.driverName.trim(), chargerId: charger.id, status: "charging",
        energyKwh: 0, solarEnergyKwh: 0, gridEnergyKwh: 0, amount: 0, authorizedAmount: money(input.authorizedAmount),
        ratePerKwh: next.scenario === "solar" ? 1.7 : next.scenario === "peak" ? 2.6 : 2, startedAt: next.now
      };
      charger.status = "charging";
      next.sessions.push(session);
      event(next, "start", `START_CHARGE simulado confirmado em ${charger.id}; autorização simulada R$ ${session.authorizedAmount.toFixed(2)}.`, session.id);
    });
  }
  private finish(next: DemoRuntimeState, session: DemoRuntimeSession, reason: NonNullable<DemoRuntimeSession["stopReason"]>, at = next.now) {
    session.status = "completed";
    session.endedAt = at;
    session.stopReason = reason;
    const charger = next.chargers.find((item) => item.id === session.chargerId)!;
    charger.status = next.scenario === "offline" ? "offline" : "available";
    event(next, "stop", `STOP_CHARGE simulado confirmado: ${reason}; total R$ ${session.amount.toFixed(2)}.`, session.id, at);
  }
  stop(id: string) {
    const session = this.state.sessions.find((item) => item.id === id);
    if (!session) throw new DemoError("SESSION_NOT_FOUND", "Sessão não encontrada.", 404);
    if (session.status === "completed") return this.snapshot();
    return this.change((next) => this.finish(next, next.sessions.find((item) => item.id === id)!, "user"));
  }
  advance(minutes: number) {
    if (!Number.isInteger(minutes) || minutes < 1 || minutes > 60) throw new DemoError("INVALID_MINUTES", "Avance entre 1 e 60 minutos inteiros.");
    return this.change((next) => {
      let remainingSeconds = minutes * 60;
      let elapsedSeconds = 0;
      const startTime = Date.parse(next.now);
      // Integrate in segments ending at each financial limit, then redistribute solar.
      while (remainingSeconds > 0.000001) {
        const active = next.sessions.filter((session) => session.status === "charging");
        if (!active.length) break;
        const totalPower = active.reduce((sum, session) => sum + next.chargers.find((charger) => charger.id === session.chargerId)!.powerKw, 0);
        const solarShare = Math.min(1, Math.max(0, next.plant.solarKw - next.plant.buildingKw) / totalPower);
        const secondsUntilLimit = (session: DemoRuntimeSession) => Math.max(0, (session.authorizedAmount / session.ratePerKwh - session.energyKwh) * 3600 / next.chargers.find((charger) => charger.id === session.chargerId)!.powerKw);
        const segment = Math.min(remainingSeconds, ...active.map(secondsUntilLimit));
        for (const session of active) {
          const limitReached = secondsUntilLimit(session) <= segment + 0.000001;
          const power = next.chargers.find((charger) => charger.id === session.chargerId)!.powerKw;
          const energy = limitReached ? session.authorizedAmount / session.ratePerKwh - session.energyKwh : power * segment / 3600;
          session.energyKwh += energy;
          session.solarEnergyKwh += energy * solarShare;
          session.gridEnergyKwh += energy * (1 - solarShare);
          session.amount = limitReached ? session.authorizedAmount : money(session.energyKwh * session.ratePerKwh);
          if (limitReached) this.finish(next, session, "financial_limit", new Date(startTime + (elapsedSeconds + segment) * 1000).toISOString());
        }
        elapsedSeconds += segment;
        remainingSeconds -= segment;
      }
      next.now = new Date(startTime + minutes * 60_000).toISOString();
      event(next, "measurement", `Relógio simulado avançou ${minutes} min; energia integrada por potência e duração.`);
    });
  }
}
