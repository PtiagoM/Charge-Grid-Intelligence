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
  id: string;
  plantId: string;
  observedAt: string;
  source: "SIMULATED";
  quality: "FRESH" | "STALE" | "UNKNOWN";
  pvKw: number;
  gridImportKw: number;
  gridExportKw: number;
  buildingLoadKw: number;
  evLoadKw: number;
  energyStatus: PlantEnergyStatus;
  batteryDischargeKw: null;
  batteryChargeKw: null;
  evWh: number;
  gridImportWh: number;
  gridExportWh: number;
  solarToEvWh: number;
}

export interface CommercialEnergyPolicy {
  id: string;
  plantId: string;
  version: string;
  demandControlEnabled: boolean;
  limitKw: number;
  alertPercent: number;
  criticalPercent: number;
  recoveryPercent: number;
  recoveryStableSeconds: number;
  freshSeconds: number;
  updatedAt: string;
}

export interface CommercialEnergyDecision {
  plantId: string;
  policyVersion: string;
  sampleId: string | null;
  state: "NORMAL" | "ALERT" | "CRITICAL" | null;
  quality: "FRESH" | "STALE" | "UNKNOWN";
  enabled: boolean;
  canAdmit: boolean;
  reasonCode: "ENERGY_POLICY_DISABLED" | "TELEMETRY_UNAVAILABLE" | "DEMAND_ALERT" | "PROJECTED_LIMIT" | "ADMISSION_ALLOWED";
  projectedImportKw: number | null;
  candidateSessionIds: string[];
  observedAt: string;
}

export interface CommercialEnergyView {
  snapshot: PlantEnergySnapshot | null;
  policy: CommercialEnergyPolicy;
  decision: CommercialEnergyDecision;
  simulation: PlantSimulationProfile | null;
}

export interface PlantSimulationProfile {
  scenarioId: LabScenarioId;
  version: 1;
  seed: number;
  stepSeconds: 60;
  appliedAt: string;
}

export interface CommercialInsight {
  id: string;
  kind: "ALERT" | "RECOMMENDATION";
  type: string;
  entityId: string;
  sourceEventId: string | null;
  sampleId: string | null;
  policyVersion: string | null;
  conditionActive: boolean;
  severity: "INFO" | "WARNING" | "CRITICAL";
  reasonCode: string;
  message: string;
  evidence: string[];
  suggestedAction: string | null;
  reviewState: "OPEN" | "ACKNOWLEDGED" | "RESOLVED" | "ACCEPTED" | "DEFERRED" | "REJECTED";
  decidedAt?: string;
  decidedBy?: string;
  decisionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CommercialInsights {
  alerts: CommercialInsight[];
  recommendations: CommercialInsight[];
}

export interface CommercialOperationalReport {
  establishmentId: string;
  from: string;
  to: string;
  energy: {
    evWh: number;
    solarToEvWh: number;
    gridImportWh: number;
    gridExportWh: number;
  };
  financial: {
    capturedCents: number;
    refundedCents: number;
  };
  sessions: Array<{
    id: string;
    publicCode: string;
    chargerId: string;
    chargerCode: string;
    driverName: string;
    status: CommercialSessionStatus;
    energyWh: number;
    totalCostCents: number;
    startedAt?: string;
    endedAt?: string;
    createdAt: string;
  }>;
  chargers: {
    total: number;
    available: number;
    charging: number;
    faulted: number;
  };
  decisions: CommercialInsight[];
}

export interface ChargerSummary {
  id: string;
  /** Legacy alias only; canonical integrations keep the persistent UUID in `id`. */
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

export interface CommercialFinancialSummary {
  establishmentId?: string;
  sessionCount: number;
  activeSessionCount: number;
  authorizedCents: number;
  consumedCents: number;
  capturedCents: number;
  refundedCents: number;
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
  offerTariffCents: number | null;
  favorableEnergyCondition: boolean;
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
  tariffs: CommercialTariffVersion[];
  plantEnergy: PlantEnergySnapshot[];
  sessions: CommercialSessionRecord[];
  queue: CommercialQueueRecord[];
}

/** Provenance of an observed or derived value; distinct from its provider. */
export type DataProvenance = "REAL" | "SANDBOX" | "SIMULATED" | "DERIVED";
export type DataQuality = "FRESH" | "STALE" | "UNAVAILABLE";

export type CommercialDashboardMetric<T> =
  | { value: T; provenance: DataProvenance; quality: "FRESH" | "STALE"; unavailableReason: null }
  | { value: null; provenance: DataProvenance | null; quality: "UNAVAILABLE"; unavailableReason: string };

export interface CommercialDashboardSummary {
  contractVersion: "S4-C2";
  establishmentId: string;
  plantId: string | null;
  period: { from: string; to: string };
  generatedAt: string;
  energy: {
    evWh: CommercialDashboardMetric<number>;
    solarToEvWh: CommercialDashboardMetric<number>;
    gridImportWh: CommercialDashboardMetric<number>;
    gridExportWh: CommercialDashboardMetric<number>;
  };
  financial: {
    capturedCents: CommercialDashboardMetric<number>;
    refundedCents: CommercialDashboardMetric<number>;
    netCapturedCents: CommercialDashboardMetric<number>;
  };
  demand: {
    currentGridImportKw: CommercialDashboardMetric<number>;
    peakGridImportKw: CommercialDashboardMetric<number>;
    limitKw: CommercialDashboardMetric<number>;
  };
  utilization: {
    occupiedChargerSeconds: CommercialDashboardMetric<number>;
    publishedChargerSeconds: CommercialDashboardMetric<number>;
    ratio: CommercialDashboardMetric<number>;
  };
  counts: {
    sessionsCreatedInPeriod: CommercialDashboardMetric<number>;
    activeSessionsAtGeneration: CommercialDashboardMetric<number>;
    chargersAtGeneration: CommercialDashboardMetric<number>;
    availableChargersAtGeneration: CommercialDashboardMetric<number>;
    queuedEntriesAtGeneration: CommercialDashboardMetric<number>;
  };
}

export interface ForecastPoint {
  at: string;
  predictedGridImportKw: number;
}

export interface ForecastTestMetrics {
  maeKw: number;
  rmseKw: number;
  baselineMaeKw: number;
  baselineRmseKw: number;
  testFrom: string;
  testTo: string;
}

interface ForecastRecordBase {
  contractVersion: "S4-C2";
  id: string;
  plantId: string;
  generatedAt: string;
  inputFrom: string;
  inputTo: string;
  horizonMinutes: number;
  stepMinutes: number;
  modelVersion: string;
  provenance: DataProvenance;
}

export type ForecastQuality =
  | { availability: "AVAILABLE"; inputQuality: "FRESH"; unavailableReason: null }
  | { availability: "UNAVAILABLE"; inputQuality: DataQuality; unavailableReason: string };

export type ForecastRecord = ForecastRecordBase &
  (
    | { quality: Extract<ForecastQuality, { availability: "AVAILABLE" }>; metrics: ForecastTestMetrics; points: ForecastPoint[] }
    | { quality: Extract<ForecastQuality, { availability: "UNAVAILABLE" }>; metrics: null; points: null }
  );

export interface DemandDecisionEvidence {
  contractVersion: "S4-C2";
  forecastId: string;
  sampleId: string;
  policyVersion: string;
  modelVersion: string;
  correlationKey: string;
  limitKw: number;
  alertThresholdPercent: number;
  criticalThresholdPercent: number;
  peak: ForecastPoint;
  outcome: "PREDICTED_NORMAL" | "PREDICTED_ALERT" | "PREDICTED_CRITICAL";
}

export const LAB_SCENARIO_IDS = [
  "SOLAR_SURPLUS",
  "DEMAND_RAMP",
  "LOW_SOLAR",
  "TELEMETRY_LOSS",
  "RECOVERY"
] as const;

export type LabScenarioId = (typeof LAB_SCENARIO_IDS)[number];
