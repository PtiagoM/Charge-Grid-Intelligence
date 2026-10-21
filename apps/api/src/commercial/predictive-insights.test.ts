import { afterEach, describe, expect, it } from "vitest";
import type { ForecastRecord } from "@chargegrid/shared";
import { FORECAST_MODEL_VERSION } from "../ai/forecast.js";
import { CommercialRepository } from "./repository.js";

describe("predictive commercial insights", () => {
  const repositories: CommercialRepository[] = [];
  afterEach(async () => Promise.all(repositories.splice(0).map((repository) => repository.close())));

  it("correlates one recommendation and critical alert, then preserves them as superseded", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const now = new Date();
    await repository.configurePlantTelemetry({ plantId: "plant_aurora_001", online: true, pvKw: 0, buildingLoadKw: 0 });
    await repository.advancePlantTelemetry(now);
    const sample = await repository.plantEnergy("plant_aurora_001");
    expect(sample?.quality).toBe("FRESH");

    const db = (repository as unknown as { db: { query(sql: string, params?: unknown[]): Promise<unknown> } }).db;
    let sequence = 0;
    async function persistForecast(predictedGridImportKw: number) {
      const generatedAt = new Date(Date.now() - 30_000 + sequence++ * 10_000).toISOString();
      const inputTo = new Date(Date.parse(generatedAt) - 1_000).toISOString();
      const forecast: ForecastRecord = {
        contractVersion: "S4-C2",
        id: `plant_aurora_001:ops-${sequence}`,
        plantId: "plant_aurora_001",
        generatedAt,
        expiresAt: new Date(Date.parse(generatedAt) + 20 * 60_000).toISOString(),
        inputFrom: new Date(Date.parse(inputTo) - 24 * 60 * 60_000).toISOString(),
        inputTo,
        horizonMinutes: 60,
        stepMinutes: 15,
        modelVersion: FORECAST_MODEL_VERSION,
        provenance: "SIMULATED",
        fallback: null,
        quality: { availability: "AVAILABLE", inputQuality: "FRESH", unavailableReason: null },
        metrics: { maeKw: 1, rmseKw: 1, baselineMaeKw: 2, baselineRmseKw: 2, testFrom: inputTo, testTo: generatedAt },
        points: [{ at: new Date(Date.parse(inputTo) + 60 * 60_000).toISOString(), predictedGridImportKw, riskThresholdKw: 18, riskState: predictedGridImportKw >= 18 ? "PREDICTED_PEAK" : "NORMAL" }]
      };
      await db.query(`insert into commercial_forecasts (id, plant_id, model_version, input_to, generated_at, expires_at, record)
        values ($1, $2, $3, $4, $5, $6, $7::jsonb)`, [forecast.id, forecast.plantId, forecast.modelVersion, forecast.inputTo, forecast.generatedAt, forecast.expiresAt, JSON.stringify(forecast)]);
      return forecast.id;
    }

    await persistForecast(17);
    const alertRisk = await repository.insights("est_aurora_001");
    const recommendation = alertRisk.recommendations.find((item) => item.type === "PREDICTED_DEMAND_RISK");
    expect(recommendation).toMatchObject({ conditionActive: true, reasonCode: "PREDICTED_ALERT", severity: "WARNING" });
    expect(alertRisk.alerts.some((item) => item.type === "PREDICTED_DEMAND_CRITICAL" && item.conditionActive)).toBe(false);
    expect((await repository.insights("est_aurora_001")).recommendations.filter((item) => item.type === "PREDICTED_DEMAND_RISK")).toHaveLength(1);

    const criticalForecastId = await persistForecast(19);
    const critical = await repository.insights("est_aurora_001");
    const criticalRecommendation = critical.recommendations.find((item) => item.type === "PREDICTED_DEMAND_RISK");
    const criticalAlert = critical.alerts.find((item) => item.type === "PREDICTED_DEMAND_CRITICAL");
    expect(criticalRecommendation).toMatchObject({ id: recommendation?.id, conditionActive: true, reasonCode: "PREDICTED_CRITICAL", sourceEventId: criticalForecastId });
    expect(criticalAlert).toMatchObject({ conditionActive: true, reasonCode: "PREDICTED_CRITICAL", sourceEventId: criticalForecastId });

    await persistForecast(10);
    const cleared = await repository.insights("est_aurora_001");
    expect(cleared.recommendations.find((item) => item.type === "PREDICTED_DEMAND_RISK")).toMatchObject({ id: recommendation?.id, conditionActive: false, reviewState: "RESOLVED" });
    expect(cleared.alerts.find((item) => item.type === "PREDICTED_DEMAND_CRITICAL")).toMatchObject({ id: criticalAlert?.id, conditionActive: false, reviewState: "RESOLVED" });
  }, 30_000);
});
