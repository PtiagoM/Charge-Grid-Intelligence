import type {
  ChargerCommercialStatus,
  ChargerTechnicalStatus,
  CommercialAvailability,
  CommercialSessionStatus,
  PaymentStatus,
  PlantEnergyStatus,
  QueueStatus
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
  /** Persistent commercial identifier when the UI uses the operational code as `id`. */
  internalId?: string;
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
  plantId: string | null;
  name: string;
  parkingSpot?: string;
  nominalPowerKw: number;
  currentPowerKw: number;
  physicalStatus: ChargerTechnicalStatus;
  commercialStatus: ChargerCommercialStatus;
  published: boolean;
  qrIdentifier: string;
  currentSessionId: string | null;
  assignmentId: string | null;
  updatedAt: string;
}

export interface CommercialOpeningHoursInterval {
  day: number;
  opens: string;
  closes: string;
}

export interface CommercialEstablishmentRecord {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  tariffCents: number;
  qrSlug: string;
  plantId: string | null;
  timezone: string;
  openingHours: CommercialOpeningHoursInterval[];
  published: boolean;
  availableChargerCount: number;
  queueSummary: QueueSummary;
  chargers: CommercialChargerRecord[];
}

export interface CommercialTariffVersion {
  id: string;
  establishmentId: string;
  energyCentsPerKwh: number;
  solarEnergyCentsPerKwh: number | null;
  idleGraceMinutes: number;
  idleCentsPerMinute: number;
  idleMaxMinutes: number;
  idleEnabled: boolean;
  validFrom: string;
  createdAt: string;
  reason: string;
}

export interface CommercialQuote {
  id: string;
  chargerId: string;
  establishmentId: string;
  policyVersion: string;
  energyCentsPerKwh: number;
  idleGraceMinutes: number;
  idleCentsPerMinute: number;
  idleMaxMinutes: number;
  idleEnabled: boolean;
  offeredAt: string;
  expiresAt: string;
  reasonCode: string;
  energySampleId: string | null;
}

export interface CommercialPaymentRecord {
  id: string | null;
  paymentIntentId?: string;
  method: "CARD" | "PIX";
  status: PaymentStatus;
  providerStatus?: string;
  authorizedCents: number;
  capturedCents: number;
  refundedCents: number;
  pendingOperation: string | null;
  lastErrorCode: string | null;
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
  actorType: "DRIVER" | "GUEST";
  quote: CommercialQuote | null;
  authorizedCents: number;
  energyWh: number;
  costCents: number;
  energyCostCents: number;
  idleCostCents: number;
  totalCostCents: number;
  currentPowerKw: number;
  startedAt?: string;
  endedAt?: string;
  energyEndedAt: string | null;
  disconnectedAt: string | null;
  settledAt: string | null;
  idleGraceEndsAt: string | null;
  endReason: string | null;
  transitionReason: string | null;
  pendingCommandId: string | null;
  createdAt: string;
  updatedAt: string;
  payment: CommercialPaymentRecord;
}

export interface CommercialQueueRecord {
  id: string;
  driverId: string;
  driverName: string;
  driverVehicle: string;
  establishmentId: string;
  establishmentName: string;
  status: QueueStatus;
  position: number;
  chargerId?: string;
  chargerCode?: string;
  parkingSpot?: string;
  joinedAt: string;
  calledAt?: string;
  assignmentExpiresAt?: string;
  completedAt?: string;
  sessionId: string | null;
  estimatedWaitMinutes: number | null;
}

export interface CommercialPublicChargerRecord {
  id: string;
  code: string;
  establishmentId: string;
  plantId: string | null;
  name: string;
  parkingSpot?: string;
  nominalPowerKw: number;
  currentPowerKw: number;
  physicalStatus: ChargerTechnicalStatus;
  commercialStatus: ChargerCommercialStatus;
  published: boolean;
  qrIdentifier: string;
  updatedAt: string;
}

export interface CommercialPublicEstablishmentRecord {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  tariffCents: number;
  qrSlug: string;
  plantId: string | null;
  timezone: string;
  openingHours: CommercialOpeningHoursInterval[];
  published: boolean;
  availableChargerCount: number;
  queueSummary: QueueSummary;
  chargers: CommercialPublicChargerRecord[];
}

export interface CommercialCatalog {
  generatedAt: string;
  establishments: CommercialPublicEstablishmentRecord[];
}

export interface CommercialChargerResolution {
  establishment: CommercialPublicEstablishmentRecord;
  charger: CommercialPublicChargerRecord;
}

export interface CommercialSnapshot {
  contractVersion: "S4-C1";
  generatedAt: string;
  establishments: CommercialEstablishmentRecord[];
  sessions: CommercialSessionRecord[];
  queue: CommercialQueueRecord[];
}
