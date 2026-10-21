import type { ForecastRecord } from "@chargegrid/shared";
import { describe, expect, it } from "vitest";
import { evaluateDemandForecast } from "./demand-decision.js";

const modelVersion = "cg-ai-03c-ridge_delta-1h-v1";

function forecast(predictedGridImportKw: number, now: Date, overrides: Partial<ForecastRecord> = {}): ForecastRecord {
  const inputTo = new Date(now.getTime() - 60_000);
  return {
    contractVersion: "S4-C2", id: "forecast-1", plantId: "plant-1", generatedAt: inputTo.toISOString(),
    expiresAt: new Date(inputTo.getTime() + 30 * 60_000).toISOString(), inputFrom: inputTo.toISOString(), inputTo: inputTo.toISOString(),
    horizonMinutes: 60, stepMinutes: 15, modelVersion, provenance: "SIMULATED", fallback: null,
    quality: { availability: "AVAILABLE", inputQuality: "FRESH", unavailableReason: null },
    metrics: { maeKw: 1, rmseKw: 1, baselineMaeKw: 1, baselineRmseKw: 1, testFrom: "2026-01-01", testTo: "2026-01-02" },
    points: [{ at: new Date(inputTo.getTime() + 60 * 60_000).toISOString(), predictedGridImportKw, riskThresholdKw: 18, riskState: "NORMAL" }],
    ...overrides
  } as ForecastRecord;
}

describe("evaluateDemandForecast", () => {
  it("classifies peak levels against policy thresholds and blocks only critical new admissions", () => {
    const now = new Date("2026-10-04T12:00:00.000Z");
    const policy = { version: "demand-v1", demandControlEnabled: true, limitKw: 20, alertPercent: 80, criticalPercent: 90 };
    const normal = evaluateDemandForecast(forecast(15.9, now), "plant-1", "sample-1", policy, now);
    const alert = evaluateDemandForecast(forecast(16, now), "plant-1", "sample-1", policy, now);
    const critical = evaluateDemandForecast(forecast(18, now), "plant-1", "sample-1", policy, now);

    expect(normal).toMatchObject({ availability: "AVAILABLE", outcome: "PREDICTED_NORMAL", blocksNewAdmissions: false });
    expect(alert).toMatchObject({ availability: "AVAILABLE", outcome: "PREDICTED_ALERT", blocksNewAdmissions: false });
    expect(critical).toMatchObject({ availability: "AVAILABLE", outcome: "PREDICTED_CRITICAL", blocksNewAdmissions: true });
    expect(critical.evidence).toMatchObject({ contractVersion: "S4-C2", limitKw: 20, alertThresholdPercent: 80, criticalThresholdPercent: 90 });
  });

  it("keeps stale or incompatible forecasts unavailable without blocking", () => {
    const now = new Date("2026-10-04T12:00:00.000Z");
    const policy = { version: "demand-v1", demandControlEnabled: true, limitKw: 20, alertPercent: 80, criticalPercent: 90 };
    const stale = evaluateDemandForecast(forecast(30, new Date(now.getTime() - 31 * 60_000)), "plant-1", "sample-1", policy, now);
    const incompatible = evaluateDemandForecast(forecast(30, now, { modelVersion: "unknown-model" }), "plant-1", "sample-1", policy, now);
    const unsupportedProvenance = evaluateDemandForecast(forecast(30, now, { provenance: "DERIVED" }), "plant-1", "sample-1", policy, now);

    expect(stale).toMatchObject({ availability: "UNAVAILABLE", unavailableReason: "FORECAST_STALE", blocksNewAdmissions: false });
    expect(incompatible).toMatchObject({ availability: "UNAVAILABLE", unavailableReason: "INCOMPATIBLE_FORECAST", blocksNewAdmissions: false });
    expect(unsupportedProvenance).toMatchObject({ availability: "UNAVAILABLE", unavailableReason: "UNSUPPORTED_FORECAST_PROVENANCE", blocksNewAdmissions: false });
  });
});
