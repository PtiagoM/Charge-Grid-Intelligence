import { afterEach, describe, expect, it } from "vitest";
import { FORECAST_WARMUP_MINUTES } from "../goodwe/energy-scenarios.js";
import { CommercialRepository } from "./repository.js";

describe("lab forecast warm-up", () => {
  const repositories: CommercialRepository[] = [];
  afterEach(async () => Promise.all(repositories.splice(0).map((repository) => repository.close())));

  it("generates a simulated peak forecast immediately after applying DEMAND_RAMP and clears it on reset", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const now = new Date(Math.floor(Date.now() / 60_000) * 60_000);
    const input = { plantId: "plant_aurora_001", scenarioId: "DEMAND_RAMP" as const, seed: 3, now };

    const profile = await repository.configurePlantScenario(input);
    await repository.configurePlantScenario({ ...input, now: new Date(now.getTime() + 60_000) });
    await repository.advancePlantTelemetry(now);
    expect((await repository.plantEnergySeries(input.plantId))).toHaveLength(FORECAST_WARMUP_MINUTES + 1);

    await repository.advancePlantForecasts(now);
    const response = await repository.plantForecast(input.plantId, now);
    expect(response.forecast).toMatchObject({
      plantId: input.plantId,
      provenance: "SIMULATED",
      horizonMinutes: 60,
      quality: { availability: "AVAILABLE", inputQuality: "FRESH" },
      points: [expect.objectContaining({ predictedGridImportKw: expect.any(Number) })]
    });
    const view = await repository.plantEnergyView(input.plantId);
    expect(response.forecast!.points![0]!.predictedGridImportKw).toBeGreaterThan(view.policy.limitKw * view.policy.criticalPercent / 100);
    expect(view.simulation).toMatchObject({ scenarioId: input.scenarioId, seed: input.seed, appliedAt: profile.appliedAt });
    expect(view.decision.forecastDecision).toMatchObject({
      availability: "AVAILABLE",
      outcome: "PREDICTED_CRITICAL",
      evidence: { forecastId: response.forecast?.id }
    });
    expect(view.decision.canAdmit).toBe(false);

    await repository.resetTestData();
    expect(await repository.plantForecast(input.plantId)).toMatchObject({ forecast: null, availability: "UNAVAILABLE" });
  }, 30_000);

  it("persists a fresh forecast for a newly applied scenario in the same 15-minute window and links its decision", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const quarter = Math.floor(Date.now() / (15 * 60_000)) * 15 * 60_000;
    const solarAt = new Date(quarter + 2 * 60_000);
    const rampAt = new Date(quarter + 3 * 60_000);
    const plantId = "plant_aurora_001";
    const database = (repository as unknown as { db: { query(sql: string, params?: unknown[]): Promise<{ rows: Array<Record<string, unknown>> }> } }).db;

    await repository.configurePlantScenario({ plantId, scenarioId: "SOLAR_SURPLUS", seed: 3, now: solarAt });
    await repository.advancePlantTelemetry(solarAt);
    await repository.advancePlantForecasts(solarAt);
    const solarForecast = (await repository.plantForecast(plantId, solarAt)).forecast!;

    await repository.configurePlantScenario({ plantId, scenarioId: "DEMAND_RAMP", seed: 3, now: rampAt });
    await repository.advancePlantTelemetry(rampAt);
    await repository.advancePlantForecasts(rampAt, plantId);
    const rampForecast = (await repository.plantForecast(plantId, rampAt)).forecast!;
    const view = await repository.plantEnergyView(plantId);

    expect(rampForecast.id).not.toBe(solarForecast.id);
    expect(rampForecast.generatedAt).not.toBe(solarForecast.generatedAt);
    expect(rampForecast.inputTo).toBe(solarForecast.inputTo);
    expect(rampForecast.provenance).toBe("SIMULATED");
    expect(rampForecast.points?.[0]?.predictedGridImportKw).toBeGreaterThan(solarForecast.points?.[0]?.predictedGridImportKw ?? 0);
    expect(view.simulation?.scenarioId).toBe("DEMAND_RAMP");
    expect(view.decision.forecastDecision.evidence?.forecastId).toBe(rampForecast.id);
    expect((await database.query("select id from commercial_forecasts where plant_id = $1 order by generated_at", [plantId])).rows).toHaveLength(2);
  }, 30_000);
});
