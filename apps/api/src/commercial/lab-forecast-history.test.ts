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
});
