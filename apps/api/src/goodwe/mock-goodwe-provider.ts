import { demoScenarioD0 } from "@chargegrid/shared";
import type { GoodWeCommandResult, GoodWeCommandType, GoodWeProvider } from "./goodwe-provider.js";

function createPendingCommand(type: GoodWeCommandType, chargerId: string): GoodWeCommandResult {
  return {
    commandId: `demo_${type.toLowerCase()}_${chargerId}`,
    type,
    chargerId,
    status: "PENDING",
    requestedAt: demoScenarioD0.plant.observedAt
  };
}

export class MockGoodWeProvider implements GoodWeProvider {
  async getPlantTelemetry(plantId: string) {
    return plantId === demoScenarioD0.plant.plantId ? demoScenarioD0.plant : null;
  }

  async getChargerTelemetry(chargerId: string) {
    return demoScenarioD0.chargers.find((charger) => charger.id === chargerId) ?? null;
  }

  async startCharge(chargerId: string) {
    return createPendingCommand("START_CHARGE", chargerId);
  }

  async stopCharge(chargerId: string) {
    return createPendingCommand("STOP_CHARGE", chargerId);
  }
}
