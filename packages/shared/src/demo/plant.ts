import { PlantEnergyStatus } from "../enums/index.js";
import type { PlantEnergySnapshot } from "../contracts/index.js";

export const demoPlantD0: PlantEnergySnapshot & {
  operationalEvLimitKw: number;
  installedChargerPowerKw: number;
} = {
  id: "sample_demo_aurora_001",
  plantId: "plant_demo_aurora_001",
  observedAt: "2026-08-19T17:45:00-03:00",
  source: "SIMULATED",
  quality: "FRESH",
  pvKw: 36,
  gridImportKw: 18,
  batteryDischargeKw: null,
  buildingLoadKw: 42,
  evLoadKw: 12,
  batteryChargeKw: null,
  gridExportKw: 0,
  evWh: 0,
  gridImportWh: 0,
  gridExportWh: 0,
  solarToEvWh: 0,
  energyStatus: PlantEnergyStatus.NORMAL,
  operationalEvLimitKw: 28,
  installedChargerPowerKw: 42
};
