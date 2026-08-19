import { CONTRACT_VERSION } from "../constants/index.js";
import { demoChargersD0 } from "./chargers.js";
import { demoDashboardKpisD0, demoFinancialsD0, demoPaymentsD0, demoTariffD0, demoUsersD0 } from "./commerce.js";
import { demoEstablishmentD0, demoQueueD0 } from "./establishment.js";
import type { DemoScenarioD0 } from "./models.js";
import { demoPlantD0 } from "./plant.js";
import { demoSessionsD0 } from "./sessions.js";

export const demoScenarioD0: DemoScenarioD0 = {
  contractVersion: CONTRACT_VERSION,
  scenarioId: "D0",
  establishment: demoEstablishmentD0,
  plant: demoPlantD0,
  chargers: demoChargersD0,
  sessions: demoSessionsD0,
  financials: demoFinancialsD0,
  payments: demoPaymentsD0,
  users: demoUsersD0,
  tariff: demoTariffD0,
  queue: demoQueueD0,
  idlePolicy: {
    id: "idle_policy_demo_aurora_v1",
    gracePeriodMinutes: 15,
    feePerMinute: { amount: 0.5, currency: "BRL" },
    maxFeeMinutes: 60,
    enabled: true
  },
  chargegridCommissionRate: 0.05,
  dashboardKpis: demoDashboardKpisD0
};
