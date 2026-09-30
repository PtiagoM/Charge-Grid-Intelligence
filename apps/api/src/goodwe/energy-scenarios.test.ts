import { describe, expect, it } from "vitest";
import type { PlantSimulationProfile } from "@chargegrid/shared";
import { historicalSignals, signalsForScenario } from "./energy-scenarios.js";

describe("deterministic GoodWe lab profiles", () => {
  it("produces reproducible ramp, recovery, solar and telemetry-loss states", () => {
    const profile: PlantSimulationProfile = { scenarioId: "DEMAND_RAMP", version: 1, seed: 3, stepSeconds: 60, appliedAt: "2026-09-30T12:00:00.000Z" };
    const at = new Date(profile.appliedAt);
    expect(signalsForScenario(profile, at)).toEqual(signalsForScenario(profile, at));
    expect(historicalSignals(profile, -96).buildingLoadKw).toBe(8.6);
    expect(signalsForScenario(profile, at).buildingLoadKw).toBeGreaterThan(historicalSignals(profile, -1).buildingLoadKw);
    expect(signalsForScenario({ ...profile, scenarioId: "RECOVERY" }, at).pvKw).toBeGreaterThan(historicalSignals({ ...profile, scenarioId: "RECOVERY" }, -96).pvKw);
    expect(signalsForScenario({ ...profile, scenarioId: "TELEMETRY_LOSS" }, at).online).toBe(false);
    expect(signalsForScenario({ ...profile, scenarioId: "SOLAR_SURPLUS" }, at)).toMatchObject({ online: true, pvKw: 30, buildingLoadKw: 8 });
  });
});
