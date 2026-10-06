import type { DemandDecisionEvidence, ForecastRecord } from "@chargegrid/shared";
import { FORECAST_MODEL_VERSION } from "../ai/forecast.js";

const FORECAST_MAX_AGE_MS = 30 * 60_000;

type DemandPolicy = {
  version: string;
  demandControlEnabled: boolean;
  limitKw: number;
  alertPercent: number;
  criticalPercent: number;
};

export type ForecastDemandDecision = {
  availability: "AVAILABLE" | "UNAVAILABLE";
  outcome: DemandDecisionEvidence["outcome"] | null;
  evidence: DemandDecisionEvidence | null;
  unavailableReason: string | null;
  blocksNewAdmissions: boolean;
};

export function evaluateDemandForecast(
  forecast: ForecastRecord | null,
  plantId: string,
  sampleId: string | null,
  policy: DemandPolicy,
  now = new Date()
): ForecastDemandDecision {
  const unavailable = (reason: string): ForecastDemandDecision => ({
    availability: "UNAVAILABLE", outcome: null, evidence: null, unavailableReason: reason, blocksNewAdmissions: false
  });
  if (!forecast || forecast.quality.availability !== "AVAILABLE" || !forecast.points) return unavailable(forecast?.quality.unavailableReason ?? "FORECAST_NOT_GENERATED");
  if (forecast.plantId !== plantId || forecast.modelVersion !== FORECAST_MODEL_VERSION || forecast.horizonMinutes !== 60 || forecast.stepMinutes !== 15
    || forecast.quality.inputQuality !== "FRESH" || forecast.fallback !== null) return unavailable("INCOMPATIBLE_FORECAST");
  if (forecast.provenance !== "SIMULATED") return unavailable("UNSUPPORTED_FORECAST_PROVENANCE");
  if (!sampleId) return unavailable("ENERGY_SAMPLE_UNAVAILABLE");
  if (!policy.version || !Number.isFinite(policy.limitKw) || policy.limitKw <= 0
    || !Number.isFinite(policy.alertPercent) || !Number.isFinite(policy.criticalPercent)
    || policy.alertPercent < 0 || policy.criticalPercent <= policy.alertPercent || policy.criticalPercent > 100) return unavailable("INVALID_DEMAND_POLICY");

  const inputTo = Date.parse(forecast.inputTo);
  const generatedAt = Date.parse(forecast.generatedAt);
  const expiresAt = Date.parse(forecast.expiresAt);
  if (![inputTo, generatedAt, expiresAt].every(Number.isFinite) || inputTo > now.getTime() || generatedAt < inputTo || generatedAt > now.getTime()
    || now.getTime() - inputTo > FORECAST_MAX_AGE_MS || expiresAt <= now.getTime()) return unavailable("FORECAST_STALE");

  const points = forecast.points.filter((point) => {
    const at = Date.parse(point.at);
    return Number.isFinite(at) && at > inputTo && at <= inputTo + forecast.horizonMinutes * 60_000
      && Number.isFinite(point.predictedGridImportKw) && point.predictedGridImportKw >= 0
      && Number.isFinite(point.riskThresholdKw) && point.riskThresholdKw >= 0
      && ["NORMAL", "PREDICTED_PEAK"].includes(point.riskState);
  });
  if (!points.length) return unavailable("FORECAST_POINTS_INVALID");
  const peak = points.reduce((max, point) => point.predictedGridImportKw > max.predictedGridImportKw ? point : max);
  const criticalKw = policy.limitKw * policy.criticalPercent / 100;
  const alertKw = policy.limitKw * policy.alertPercent / 100;
  const outcome: DemandDecisionEvidence["outcome"] = peak.predictedGridImportKw >= criticalKw
    ? "PREDICTED_CRITICAL"
    : peak.predictedGridImportKw >= alertKw ? "PREDICTED_ALERT" : "PREDICTED_NORMAL";
  const correlationKey = `${plantId}:${forecast.id}:${policy.version}:${policy.limitKw}:${policy.alertPercent}:${policy.criticalPercent}`;
  const evidence: DemandDecisionEvidence = {
    contractVersion: "S4-C2", forecastId: forecast.id, sampleId, policyVersion: policy.version,
    modelVersion: forecast.modelVersion, correlationKey, limitKw: policy.limitKw,
    alertThresholdPercent: policy.alertPercent, criticalThresholdPercent: policy.criticalPercent,
    peak, outcome
  };
  return {
    availability: "AVAILABLE", outcome, evidence, unavailableReason: null,
    blocksNewAdmissions: policy.demandControlEnabled && outcome === "PREDICTED_CRITICAL"
  };
}
