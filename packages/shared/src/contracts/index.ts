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

export interface CommercialChargerRecord {
  id: string;
  code: string;
  establishmentId: string;
  name: string;
  parkingSpot?: string;
  nominalPowerKw: number;
  currentPowerKw: number;
  physicalStatus: string;
  commercialStatus: ChargerCommercialStatus;
  published: boolean;
  qrIdentifier: string;
  updatedAt: string;
}

export interface CommercialEstablishmentRecord {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  tariffCents: number;
  qrSlug: string;
  chargers: CommercialChargerRecord[];
}

export interface CommercialPaymentRecord {
  paymentIntentId?: string;
  method: "CARD" | "PIX";
  status: PaymentStatus;
  providerStatus?: string;
  authorizedCents: number;
  capturedCents: number;
}

export interface CommercialSessionRecord {
  id: string;
  publicCode: string;
  driverId?: string;
  driverName: string;
  driverEmail?: string;
  establishmentId: string;
  establishmentName: string;
  chargerId: string;
  chargerCode: string;
  chargerName: string;
  parkingSpot?: string;
  status: CommercialSessionStatus;
  tariffCents: number;
  authorizedCents: number;
  energyWh: number;
  costCents: number;
  currentPowerKw: number;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  payment: CommercialPaymentRecord;
}

export interface CommercialSnapshot {
  generatedAt: string;
  establishments: CommercialEstablishmentRecord[];
  sessions: CommercialSessionRecord[];
}
