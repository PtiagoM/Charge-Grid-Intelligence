export type Currency = "BRL";

export interface Money {
  amount: number;
  currency: Currency;
}

export type DataOrigin =
  | "GOODWE"
  | "CHARGEGRID"
  | "PAYMENT_PROVIDER"
  | "AI"
  | "DERIVED"
  | "DEMO_ONLY";

export const DEMO_SCENARIO_IDS = [
  "D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7",
  "D8", "D9", "D10", "D11", "D12", "D13", "D14", "D15"
] as const;

export type DemoScenarioId = (typeof DEMO_SCENARIO_IDS)[number];
