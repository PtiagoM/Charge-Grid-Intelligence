import type { PlantForecastResponse } from "@chargegrid/shared";
import type { EnergyForecastPresentation } from "../domain/admin";

export type ForecastPanelState =
  | { status: "LOADING" }
  | { status: "ERROR"; message: string }
  | { status: "UNAVAILABLE"; reason: string }
  | { status: "STALE"; forecast: EnergyForecastPresentation; reason: string }
  | { status: "AVAILABLE"; forecast: EnergyForecastPresentation };

/** Normalizes the API's scalar forecast contract for display; it does not evaluate policy or make admission decisions. */
export function mapPlantForecastResponse(response: PlantForecastResponse | null | undefined, now = new Date().toISOString(), error?: string): EnergyForecastPresentation {
  const forecast = response?.forecast;
  const empty = (status: EnergyForecastPresentation["status"], reason: string): EnergyForecastPresentation => ({
    status,
    provenance: forecast?.provenance ?? null,
    generatedAt: forecast?.generatedAt ?? null,
    expiresAt: forecast?.expiresAt ?? null,
    horizonMinutes: forecast?.horizonMinutes ?? null,
    modelVersion: forecast?.modelVersion ?? null,
    predictedGridImportKw: null,
    predictedAt: null,
    riskThresholdKw: null,
    riskState: null,
    testMetrics: null,
    unavailableReason: reason
  });

  if (error) return empty("ERROR", error);
  if (!forecast) return empty("UNAVAILABLE", response?.unavailableReason ?? "FORECAST_NOT_GENERATED");
  if (forecast.quality.availability === "UNAVAILABLE") {
    const reason = forecast.quality.unavailableReason || "FORECAST_UNAVAILABLE";
    const isStale = forecast.quality.inputQuality === "STALE" || reason === "FORECAST_EXPIRED";
    return empty(isStale ? "STALE" : "UNAVAILABLE", reason);
  }

  const expiresAt = Date.parse(forecast.expiresAt);
  const nowMs = Date.parse(now);
  if (Number.isFinite(expiresAt) && Number.isFinite(nowMs) && expiresAt <= nowMs) {
    return empty("STALE", "FORECAST_EXPIRED");
  }

  // The promoted runtime emits one scalar peak point. Do not synthesize or interpolate a time series here.
  const point = forecast.points?.[0];
  if (!point || !Number.isFinite(point.predictedGridImportKw)) return empty("UNAVAILABLE", "FORECAST_POINT_MISSING");

  return {
    status: "AVAILABLE",
    provenance: forecast.provenance,
    generatedAt: forecast.generatedAt,
    expiresAt: forecast.expiresAt,
    horizonMinutes: forecast.horizonMinutes,
    modelVersion: forecast.modelVersion,
    predictedGridImportKw: point.predictedGridImportKw,
    predictedAt: point.at,
    riskThresholdKw: Number.isFinite(point.riskThresholdKw) ? point.riskThresholdKw : null,
    riskState: point.riskState,
    testMetrics: forecast.metrics,
    unavailableReason: null
  };
}

export function forecastPanelState(
  forecast: EnergyForecastPresentation | undefined,
  sync: { status: "LOADING" | "SYNCED" | "STALE" | "UNAVAILABLE"; error: string | null },
  now = new Date().toISOString()
): ForecastPanelState {
  if (sync.status === "LOADING") return { status: "LOADING" };
  if (sync.status === "UNAVAILABLE" && sync.error) return { status: "ERROR", message: sync.error };
  if (forecast?.status === "ERROR") return { status: "ERROR", message: forecast.unavailableReason ?? "Falha ao consultar a previsão." };
  if (sync.status === "STALE") {
    if (forecast) return { status: "STALE", forecast, reason: sync.error ?? "A API não confirmou uma atualização recente." };
    return { status: "ERROR", message: sync.error ?? "A API não confirmou a previsão." };
  }
  if (!forecast || forecast.status === "UNAVAILABLE") {
    return { status: "UNAVAILABLE", reason: forecast?.unavailableReason ?? "FORECAST_NOT_GENERATED" };
  }
  const expiresAt = forecast.expiresAt ? Date.parse(forecast.expiresAt) : Number.NaN;
  const nowMs = Date.parse(now);
  if (forecast.status === "STALE" || (Number.isFinite(expiresAt) && Number.isFinite(nowMs) && expiresAt <= nowMs)) {
    return { status: "STALE", forecast, reason: forecast.unavailableReason ?? "FORECAST_EXPIRED" };
  }
  return { status: "AVAILABLE", forecast };
}
