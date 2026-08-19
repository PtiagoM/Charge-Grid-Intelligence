import type { ChargerSummary, PlantEnergySnapshot } from "@chargegrid/shared";

export type GoodWeCommandType = "START_CHARGE" | "STOP_CHARGE";
export type GoodWeCommandStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface GoodWeCommandResult {
  commandId: string;
  type: GoodWeCommandType;
  chargerId: string;
  status: GoodWeCommandStatus;
  requestedAt: string;
}

export interface GoodWeProvider {
  getPlantTelemetry(plantId: string): Promise<PlantEnergySnapshot | null>;
  getChargerTelemetry(chargerId: string): Promise<ChargerSummary | null>;
  startCharge(chargerId: string): Promise<GoodWeCommandResult>;
  stopCharge(chargerId: string): Promise<GoodWeCommandResult>;
}
