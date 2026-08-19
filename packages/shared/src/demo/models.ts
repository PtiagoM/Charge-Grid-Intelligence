import type {
  ActiveSession,
  ChargerSummary,
  DashboardKpis,
  EstablishmentSummary,
  PaymentSummary,
  PlantEnergySnapshot,
  QueueSummary
} from "../contracts/index.js";

export interface DemoCharger extends ChargerSummary {
  plantId: string;
  nominalPowerKw: number;
  lastTechnicalUpdateAt: string;
  vehicleConnectionStatus: 0 | 1 | 2 | null;
  faultCode?: string;
  maintenanceReason?: string;
}

export interface DemoSession extends ActiveSession {
  driverRef: string;
  establishmentId: string;
  startedAt: string;
  durationMinutes: number;
  averagePowerKw: number;
  tariffPerKwh: number;
  paymentMethod: "CARD" | "PIX";
  financialLimit?: number;
  note?: string;
}

export interface DemoTariff {
  id: string;
  currency: "BRL";
  basePricePerKwh: number;
  currentPricePerKwh: number;
  nextChangeAt: string;
  segments: readonly {
    id: string;
    start: string;
    end: string;
    pricePerKwh: number;
  }[];
}

export interface DemoIdlePolicy {
  id: string;
  gracePeriodMinutes: number;
  feePerMinute: { amount: number; currency: "BRL" };
  maxFeeMinutes: number;
  enabled: boolean;
}

export interface DemoSessionFinancials {
  sessionId: string;
  energyRevenue: number;
  idleRevenue: number;
  grossSettledRevenue: number | null;
  chargegridCommission: number | null;
  paymentFee: number | null;
  netFinancialAmount: number | null;
  settlementState: "ESTIMATED" | "SETTLED";
}

export interface DemoScenarioD0 {
  contractVersion: "1.0";
  scenarioId: "D0";
  establishment: EstablishmentSummary;
  plant: PlantEnergySnapshot & { operationalEvLimitKw: number; installedChargerPowerKw: number };
  chargers: readonly DemoCharger[];
  sessions: readonly DemoSession[];
  financials: readonly DemoSessionFinancials[];
  payments: Readonly<Record<string, PaymentSummary & { method: "CARD" | "PIX" }>>;
  users: readonly object[];
  tariff: DemoTariff;
  queue: QueueSummary;
  idlePolicy: DemoIdlePolicy;
  chargegridCommissionRate: number;
  dashboardKpis: DashboardKpis;
}
