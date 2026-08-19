import type {
  ChargerCommercialStatus,
  ChargerTechnicalStatus,
  CommercialAvailability,
  CommercialSessionStatus,
  PaymentStatus,
  PlantEnergyStatus
} from "../enums/index.js";
import type { Money } from "../types/index.js";

export interface QueueSummary {
  establishmentId: string;
  activeCount: number;
  commercialAvailability: CommercialAvailability;
  estimatedWaitMinutes?: number;
  registeredCount?: number;
  guestCount?: number;
}

export interface EstablishmentSummary {
  id: string;
  name: string;
  commercialAvailability: CommercialAvailability;
  availableChargerCount: number;
  queueSummary: QueueSummary;
  address?: string;
  timezone?: string;
  openingHours?: string;
  distanceKm?: number;
  tariffFrom?: Money;
  favorableEnergyCondition?: boolean;
}

export interface PlantEnergySnapshot {
  plantId: string;
  observedAt: string;
  pvKw: number;
  gridImportKw: number;
  buildingLoadKw: number;
  evLoadKw: number;
  energyStatus: PlantEnergyStatus;
  batteryDischargeKw?: number;
  batteryChargeKw?: number;
  gridExportKw?: number;
  freshnessSeconds?: number;
}

export interface ChargerSummary {
  id: string;
  commercialName: string;
  technicalStatus: ChargerTechnicalStatus;
  commercialStatus: ChargerCommercialStatus;
  nominalPowerKw?: number;
  currentPowerKw?: number;
  parkingSpot?: string;
  activeSessionId?: string;
  lastTechnicalUpdateAt?: string;
}

export interface ActiveSession {
  sessionId: string;
  status: CommercialSessionStatus;
  chargerId: string;
  energyDeliveredKwh: number;
  costEstimate: Money;
  updatedAt: string;
  currentPowerKw?: number;
  idleGraceEndsAt?: string;
  idleFeeAmount?: Money;
  topUpEligible?: boolean;
}

export interface PaymentSummary {
  paymentStatus: PaymentStatus;
  financialLimit: Money;
  amountDue: Money;
  amountPaid: Money;
  expectedRefund?: Money;
  nextStep?: string;
}

export interface DashboardKpis {
  scope: string;
  period: { from: string; to: string };
  generatedAt: string;
  activeSessions?: number;
  energyDeliveredKwh?: number;
  grossRevenue?: Money;
  availableChargers?: number;
  queueActiveCount?: number;
  incidentCount?: number;
}
