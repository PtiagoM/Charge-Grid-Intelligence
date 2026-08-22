import type { AdminState, EnergyPolicy, EnergySnapshot, Session } from "./admin";

export type EnergyOperationalState = "NORMAL" | "ALERT" | "CRITICAL" | "STALE" | "UNAVAILABLE";

export interface EnergyAssessment {
  state: EnergyOperationalState;
  utilizationPercent: number | null;
  marginKw: number | null;
  ageMinutes: number | null;
  isFresh: boolean;
  canStartCharge: boolean;
  reason: string;
  evidence: string[];
}

export interface RenewableAttribution {
  calculable: boolean;
  renewableKwh?: number;
  gridKwh?: number;
  renewableSharePercent?: number;
  reason: string;
}

export interface EnergyRecommendation {
  severity: "info" | "warning" | "critical";
  title: string;
  reason: string;
  evidence: string[];
  action: "MONITOR" | "PAUSE_NEW_STARTS" | "REVIEW_STOP" | "RESTORE_TELEMETRY";
  candidateSession?: Session;
}

export const DEFAULT_ENERGY_POLICY: Omit<EnergyPolicy, "establishmentId"> = {
  alertUtilizationPercent: 80,
  criticalUtilizationPercent: 90,
  freshnessMinutes: 15,
  blockStartOnCritical: true,
  blockStartWithoutFreshTelemetry: true
};

export function assessEnergySnapshot(snapshot: EnergySnapshot | undefined, policy: EnergyPolicy, now = new Date().toISOString()): EnergyAssessment {
  if (!snapshot || snapshot.providerStatus === "OFFLINE") {
    return { state: "UNAVAILABLE", utilizationPercent: null, marginKw: null, ageMinutes: null, isFresh: false, canStartCharge: !policy.blockStartWithoutFreshTelemetry, reason: "Telemetria energetica indisponivel.", evidence: ["O provider nao entregou um snapshot online."] };
  }

  const observedAt = new Date(snapshot.observedAt).getTime();
  const ageMinutes = Math.max(0, (new Date(now).getTime() - observedAt) / 60_000);
  const utilizationPercent = snapshot.contractedLimitKw > 0 ? (snapshot.demandKw / snapshot.contractedLimitKw) * 100 : 100;
  const marginKw = Math.max(0, snapshot.contractedLimitKw - snapshot.demandKw);
  if (!Number.isFinite(observedAt) || ageMinutes > policy.freshnessMinutes) {
    return { state: "STALE", utilizationPercent, marginKw, ageMinutes, isFresh: false, canStartCharge: !policy.blockStartWithoutFreshTelemetry, reason: "Snapshot energetico fora da janela de frescor.", evidence: [`Ultima leitura ha ${Math.round(ageMinutes)} min.`, `Politica exige ate ${policy.freshnessMinutes} min.`] };
  }

  const state: EnergyOperationalState = utilizationPercent >= policy.criticalUtilizationPercent ? "CRITICAL" : utilizationPercent >= policy.alertUtilizationPercent ? "ALERT" : "NORMAL";
  const canStartCharge = !(state === "CRITICAL" && policy.blockStartOnCritical);
  const reason = state === "CRITICAL"
    ? "Demanda acima do limiar critico; novos inicios devem ser bloqueados."
    : state === "ALERT"
      ? "Margem reduzida; monitorar antes de ampliar a carga."
      : "Margem energetica dentro da politica operacional.";
  return {
    state,
    utilizationPercent,
    marginKw,
    ageMinutes,
    isFresh: true,
    canStartCharge,
    reason,
    evidence: [`${snapshot.demandKw.toFixed(1)} kW de ${snapshot.contractedLimitKw.toFixed(1)} kW contratados.`, `Limiar critico em ${policy.criticalUtilizationPercent}%.`]
  };
}

export function energyPolicyFor(state: AdminState, establishmentId: string): EnergyPolicy {
  return state.energyPolicies.find((item) => item.establishmentId === establishmentId) ?? { establishmentId, ...DEFAULT_ENERGY_POLICY };
}

export function assessEstablishmentEnergy(state: AdminState, establishmentId: string, now = new Date().toISOString()) {
  return assessEnergySnapshot(state.energy.find((item) => item.establishmentId === establishmentId), energyPolicyFor(state, establishmentId), now);
}

export function calculateRenewableAttribution(snapshot: EnergySnapshot | undefined): RenewableAttribution {
  const solar = snapshot?.periodSolarKwh;
  const battery = snapshot?.periodBatteryKwh;
  const grid = snapshot?.periodGridKwh;
  if (![solar, battery, grid].every((value) => typeof value === "number" && Number.isFinite(value))) {
    return { calculable: false, reason: "Atribuicao indisponivel: o snapshot nao contem energia acumulada por origem." };
  }
  const renewableKwh = Math.max(0, solar! + battery!);
  const gridKwh = Math.max(0, grid!);
  const total = renewableKwh + gridKwh;
  return { calculable: true, renewableKwh, gridKwh, renewableSharePercent: total > 0 ? Math.round((renewableKwh / total) * 100) : 0, reason: "Estimativa calculada a partir da energia acumulada por origem no periodo." };
}

function priorityRank(session: Session) {
  return ({ STANDARD: 0, ACCESSIBILITY: 1, FLEET_CRITICAL: 2 } as const)[session.servicePriority ?? "STANDARD"];
}

export function recommendEnergyAction(state: AdminState, establishmentId: string, now = new Date().toISOString()): EnergyRecommendation {
  const assessment = assessEstablishmentEnergy(state, establishmentId, now);
  if (assessment.state === "STALE" || assessment.state === "UNAVAILABLE") {
    return { severity: "warning", title: "Restaurar telemetria antes de comandar", reason: assessment.reason, evidence: assessment.evidence, action: "RESTORE_TELEMETRY" };
  }
  if (assessment.state === "CRITICAL") {
    const candidateSession = state.sessions
      .filter((item) => item.establishmentId === establishmentId && item.status === "active")
      .sort((a, b) => priorityRank(a) - priorityRank(b) || b.energyKwh - a.energyKwh)[0];
    return {
      severity: "critical",
      title: candidateSession ? "Revisar parada assistida" : "Pausar novos inicios",
      reason: assessment.reason,
      evidence: [...assessment.evidence, candidateSession ? `${candidateSession.id} tem prioridade ${candidateSession.servicePriority ?? "STANDARD"}.` : "Nenhuma sessao ativa pode ser reduzida."],
      action: candidateSession ? "REVIEW_STOP" : "PAUSE_NEW_STARTS",
      candidateSession
    };
  }
  if (assessment.state === "ALERT") return { severity: "warning", title: "Monitorar margem antes da proxima admissao", reason: assessment.reason, evidence: assessment.evidence, action: "MONITOR" };
  return { severity: "info", title: "Operacao dentro da margem", reason: assessment.reason, evidence: assessment.evidence, action: "MONITOR" };
}
