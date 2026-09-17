/** Executable local demonstration; never hardware telemetry or a real payment. */
export type DemoRuntimeScenario = "solar" | "peak" | "critical" | "offline";
export interface DemoRuntimePlant {
  id: string;
  name: string;
  solarKw: number;
  buildingKw: number;
  gridKw: number;
  evKw: number;
  capacityKw: number;
  demandState: "normal" | "alert" | "critical" | "offline";
}
export interface DemoRuntimeCharger {
  id: string;
  name: string;
  powerKw: number;
  status: "available" | "charging" | "offline";
}
export interface DemoRuntimeSession {
  id: string;
  driverName: string;
  chargerId: string;
  status: "charging" | "completed";
  energyKwh: number;
  solarEnergyKwh: number;
  gridEnergyKwh: number;
  amount: number;
  authorizedAmount: number;
  ratePerKwh: number;
  startedAt: string;
  endedAt?: string;
  stopReason?: "user" | "financial_limit" | "offline";
}
export interface DemoRuntimeEvent {
  id: string;
  at: string;
  type: string;
  message: string;
  sessionId?: string;
}
export interface DemoRuntimeState {
  version: 1;
  mode: "simulated";
  revision: number;
  now: string;
  scenario: DemoRuntimeScenario;
  plant: DemoRuntimePlant;
  chargers: DemoRuntimeCharger[];
  sessions: DemoRuntimeSession[];
  events: DemoRuntimeEvent[];
}
export interface DemoStartSessionInput {
  chargerId: string;
  driverName: string;
  authorizedAmount: number;
  paymentScenario: "approved" | "declined";
}
export interface DemoRuntimeError {
  error: { code: string; message: string };
}
