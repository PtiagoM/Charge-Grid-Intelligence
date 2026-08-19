import { PaymentStatus, UserRole } from "../enums/index.js";
import type { DashboardKpis, PaymentSummary } from "../contracts/index.js";
import { demoEstablishmentD0 } from "./establishment.js";
import { demoPlantD0 } from "./plant.js";
import type { DemoSessionFinancials } from "./models.js";

const brl = (amount: number) => ({ amount, currency: "BRL" as const });

export const demoPaymentsD0: Readonly<Record<string, PaymentSummary & { method: "CARD" | "PIX" }>> = {
  sess_demo_001: { method: "CARD", paymentStatus: PaymentStatus.AUTHORIZED, financialLimit: brl(40), amountDue: brl(3.93), amountPaid: brl(0) },
  sess_demo_002: { method: "PIX", paymentStatus: PaymentStatus.PAID, financialLimit: brl(30), amountDue: brl(6.42), amountPaid: brl(30), expectedRefund: brl(23.58) },
  sess_demo_003: { method: "CARD", paymentStatus: PaymentStatus.AUTHORIZED, financialLimit: brl(55), amountDue: brl(36), amountPaid: brl(0) },
  sess_demo_004: { method: "CARD", paymentStatus: PaymentStatus.PAID, financialLimit: brl(23.56), amountDue: brl(23.56), amountPaid: brl(23.56) },
  sess_demo_005: { method: "CARD", paymentStatus: PaymentStatus.PAID, financialLimit: brl(8.4), amountDue: brl(8.4), amountPaid: brl(8.4) },
  sess_demo_006: { method: "PIX", paymentStatus: PaymentStatus.REFUNDED, financialLimit: brl(25), amountDue: brl(15.2), amountPaid: brl(15.2), expectedRefund: brl(9.8) }
};

export const demoFinancialsD0: readonly DemoSessionFinancials[] = [
  { sessionId: "sess_demo_001", energyRevenue: 3.93, idleRevenue: 0, grossSettledRevenue: null, chargegridCommission: null, paymentFee: null, netFinancialAmount: null, settlementState: "ESTIMATED" },
  { sessionId: "sess_demo_002", energyRevenue: 6.42, idleRevenue: 0, grossSettledRevenue: null, chargegridCommission: null, paymentFee: null, netFinancialAmount: null, settlementState: "ESTIMATED" },
  { sessionId: "sess_demo_003", energyRevenue: 36, idleRevenue: 0, grossSettledRevenue: null, chargegridCommission: null, paymentFee: null, netFinancialAmount: null, settlementState: "ESTIMATED" },
  { sessionId: "sess_demo_004", energyRevenue: 23.56, idleRevenue: 0, grossSettledRevenue: 23.56, chargegridCommission: 1.18, paymentFee: 0.94, netFinancialAmount: 21.44, settlementState: "SETTLED" },
  { sessionId: "sess_demo_005", energyRevenue: 8.4, idleRevenue: 0, grossSettledRevenue: 8.4, chargegridCommission: 0.42, paymentFee: 0.34, netFinancialAmount: 7.64, settlementState: "SETTLED" },
  { sessionId: "sess_demo_006", energyRevenue: 15.2, idleRevenue: 0, grossSettledRevenue: 15.2, chargegridCommission: 0.76, paymentFee: 0.61, netFinancialAmount: 13.83, settlementState: "SETTLED" }
] as const;

export const demoUsersD0 = [
  { id: "driver_demo_ana", role: UserRole.DRIVER, displayName: "Ana", vehicle: "Lumen E2", batteryCapacityKwh: 54, socPercent: 42, queuePriorityClass: "REGISTERED" },
  { id: "driver_demo_bruno", role: UserRole.DRIVER, displayName: "Bruno", vehicle: "Vento LX", batteryCapacityKwh: 60, socPercent: 58, queuePriorityClass: "REGISTERED" },
  { id: "guest_demo_7f3a", role: UserRole.GUEST, displayName: "Visitante 7f3a", queuePriorityClass: "GUEST" },
  { id: "guest_demo_c91b", role: UserRole.GUEST, displayName: "Visitante c91b", queuePriorityClass: "GUEST" },
  { id: "driver_demo_caio", role: UserRole.DRIVER, displayName: "Caio", vehicle: "Orbita S", batteryCapacityKwh: 50, socPercent: 31, queuePriorityClass: "REGISTERED" },
  { id: "driver_demo_dina", role: UserRole.DRIVER, displayName: "Dina", vehicle: "Sereno EV", batteryCapacityKwh: 45, socPercent: 67, queuePriorityClass: "REGISTERED" }
] as const;

export const demoTariffD0 = {
  id: "tariff_demo_aurora_v1", currency: "BRL", basePricePerKwh: 2, currentPricePerKwh: 1.9,
  nextChangeAt: "2026-08-19T18:00:00-03:00",
  segments: [
    { id: "SOLAR_FAVORAVEL", start: "08:00", end: "17:59", pricePerKwh: 1.9 },
    { id: "PICO_PROGRAMADO", start: "18:00", end: "21:59", pricePerKwh: 2.3 },
    { id: "FORA_DE_PICO", start: "22:00", end: "07:59", pricePerKwh: 2 }
  ]
} as const;

export const demoDashboardKpisD0: DashboardKpis = {
  scope: demoEstablishmentD0.id,
  period: { from: "2026-08-19T00:00:00-03:00", to: demoPlantD0.observedAt },
  generatedAt: demoPlantD0.observedAt,
  activeSessions: 3,
  availableChargers: 1,
  queueActiveCount: 0,
  incidentCount: 1
};
