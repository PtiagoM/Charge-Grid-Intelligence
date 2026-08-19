import { PlantEnergyStatus } from "../enums/index.js";
import type { PlantEnergySnapshot } from "../contracts/index.js";

export const demoPlantD0: PlantEnergySnapshot & {
  operationalEvLimitKw: number;
  installedChargerPowerKw: number;
} = {
  plantId: "plant_demo_aurora_001",
  observedAt: "2026-08-19T17:45:00-03:00",
  pvKw: 36,
  gridImportKw: 18,
  batteryDischargeKw: 0,
  buildingLoadKw: 42,
  evLoadKw: 12,
  batteryChargeKw: 0,
  gridExportKw: 0,
  energyStatus: PlantEnergyStatus.NORMAL,
  operationalEvLimitKw: 28,
  installedChargerPowerKw: 42
};
