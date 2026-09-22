import { randomUUID } from "node:crypto";
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
  async getPlantTelemetry() {
    return null;
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
