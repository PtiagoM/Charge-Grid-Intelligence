import { LAB_SCENARIO_IDS, type PlantSimulationProfile } from "@chargegrid/shared";

export interface SimulatedPlantSignals {
  online: boolean;
  pvKw: number;
  buildingLoadKw: number;
}

export const LAB_SCENARIOS = LAB_SCENARIO_IDS;

export function signalsForScenario(profile: PlantSimulationProfile, observedAt: Date): SimulatedPlantSignals {
  const step = Math.floor((observedAt.getTime() - Date.parse(profile.appliedAt)) / (profile.stepSeconds * 1000));
  const age = Math.max(0, 96 + step + Math.abs(profile.seed % 4));
  switch (profile.scenarioId) {
    case "SOLAR_SURPLUS": return { online: true, pvKw: 30, buildingLoadKw: 8 };
    case "DEMAND_RAMP": return { online: true, pvKw: 2, buildingLoadKw: Math.min(28, 8 + age * 0.2) };
    case "LOW_SOLAR": return { online: true, pvKw: 1, buildingLoadKw: 12 };
    case "TELEMETRY_LOSS": return { online: false, pvKw: 0, buildingLoadKw: 0 };
    case "RECOVERY": return { online: true, pvKw: Math.min(30, 2 + age * 0.2), buildingLoadKw: 12 };
  }
}

export function historicalSignals(profile: PlantSimulationProfile, index: number): SimulatedPlantSignals {
  // The fixed 96-step prefix is explicitly synthetic and provides a reproducible 96-minute lab history.
  const at = new Date(Date.parse(profile.appliedAt) + index * profile.stepSeconds * 1000);
  return signalsForScenario(profile, at);
}
