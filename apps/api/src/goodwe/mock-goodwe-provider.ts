import { randomUUID } from "node:crypto";
import { PlantEnergyStatus } from "@chargegrid/shared";
import type { GoodWeCommandResult, GoodWeCommandType, GoodWeProvider } from "./goodwe-provider.js";

function createSuccessfulCommand(type: GoodWeCommandType, chargerId: string): GoodWeCommandResult {
  return {
    commandId: randomUUID(),
    type,
    chargerId,
    status: "SUCCESS",
    requestedAt: new Date().toISOString()
  };
}

export class MockGoodWeProvider implements GoodWeProvider {
  async getPlantTelemetry(plantId: string, simulation?: { online: boolean; pvKw: number; buildingLoadKw: number }) {
    if (!simulation?.online) return null;
    return {
      id: "simulated-reading",
      plantId,
      observedAt: new Date().toISOString(),
      source: "SIMULATED" as const,
      quality: "FRESH" as const,
      pvKw: simulation.pvKw,
      buildingLoadKw: simulation.buildingLoadKw,
      evLoadKw: 0,
      gridImportKw: 0,
      gridExportKw: 0,
      batteryChargeKw: null,
      batteryDischargeKw: null,
      evWh: 0,
      gridImportWh: 0,
      gridExportWh: 0,
      solarToEvWh: 0,
      energyStatus: PlantEnergyStatus.NORMAL
    };
  }

  async getChargerTelemetry() {
    return null;
  }

  async startCharge(chargerId: string) {
    return createSuccessfulCommand("START_CHARGE", chargerId);
  }

  async stopCharge(chargerId: string) {
    return createSuccessfulCommand("STOP_CHARGE", chargerId);
  }
}
