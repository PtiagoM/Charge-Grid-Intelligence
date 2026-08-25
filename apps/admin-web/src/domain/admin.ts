export type Profile = "GOODWE" | "ESTABELECIMENTO";
export type SemsAccountType = "OWNER" | "DISTRIBUTOR_INSTALLER";
export type SemsOrganizationFunction = "ADMINISTRATOR" | "NAVIGATOR" | "TECHNICIAN";
export type AdminRole =
  | "GOODWE_CENTRAL"
  | "GOODWE_PORTFOLIO_MANAGER"
  | "GOODWE_TECH_SUPPORT"
  | "GOODWE_ADMIN"
  | "ESTABLISHMENT_ADMIN"
  | "ESTABLISHMENT_OPERATOR"
  | "REPORT_VIEWER";
export type ChargerStatus = "available" | "charging" | "limited" | "offline";
export type ChargerCommercialStatus = "ELIGIBLE" | "CONFIGURED" | "PUBLISHED" | "SUSPENDED";
export type SessionStatus = "authorized" | "starting" | "active" | "finished" | "start_failed";
export type ChargerCommandType = "START_CHARGE" | "STOP_CHARGE";
export type ChargerCommandStatus = "REQUESTED" | "ACCEPTED" | "CONFIRMED" | "FAILED" | "EXPIRED";
export type ChargerConnectorState = "AVAILABLE" | "CONNECTED" | "CHARGING" | "FAULT" | "OFFLINE";
export type PlantAccessPolicy = "PUBLIC" | "PRIVATE" | "MIXED";

export interface GoodWePlantCharger {
  id: string;
  serial: string;
  model: string;
  powerKw: number;
  technicalStatus: "ONLINE" | "OFFLINE";
}

export interface GoodWePlant {
  id: string;
  name: string;
  organization: string;
  address: string;
  number: string;
  city: string;
  state: string;
  zipCode: string;
  timezone: string;
  latitude: number;
  longitude: number;
  capacityKwp: number;
  batteryCapacityKwh: number;
  authorization: "AUTHORIZED" | "DENIED";
  catalogState: "READY" | "EMPTY" | "OFFLINE";
  lastSyncAt?: string;
  evChargers: GoodWePlantCharger[];
}

export interface CommercialPlantLink {
  id: string;
  goodwePlantId: string;
  establishmentId: string;
  locationId: string;
  commercialName: string;
  accessPolicy: PlantAccessPolicy;
  alwaysOpen: boolean;
  opensAt?: string;
  closesAt?: string;
  status: "PUBLISHED";
  publishedAt: string;
}

export interface PlantOnboardingDraft {
  plantId: string;
  establishmentId: string;
  commercialName: string;
  accessPolicy: PlantAccessPolicy;
  alwaysOpen: boolean;
  opensAt: string;
  closesAt: string;
  updatedAt: string;
}

export type PlantOnboardingIssueCode =
  | "PLANT_REQUIRED"
  | "PLANT_NOT_FOUND"
  | "PLANT_NOT_AUTHORIZED"
  | "PLANT_NOT_READY"
  | "PLANT_WITHOUT_EV"
  | "PLANT_ALREADY_LINKED"
  | "CONTRACT_REQUIRED"
  | "CONTRACT_NOT_AUTHORIZED"
  | "ESTABLISHMENT_REQUIRED"
  | "ESTABLISHMENT_NOT_FOUND"
  | "COMMERCIAL_NAME_REQUIRED"
  | "OPERATING_HOURS_INVALID";

export interface PlantOnboardingIssue {
  code: PlantOnboardingIssueCode;
  message: string;
}

export interface PlantOnboardingPublishResult {
  ok: boolean;
  issues: PlantOnboardingIssue[];
  commercialPlantId?: string;
}

export interface Account {
  id: string;
  email: string;
  password: string;
  profile: Profile;
  semsAccountType: SemsAccountType;
  role?: AdminRole;
  semsOrganizationFunction?: SemsOrganizationFunction;
  displayName: string;
  establishmentId?: string;
  technicalEstablishmentIds?: string[];
}

export interface Client {
  id: string;
  name: string;
  corporateName: string;
  document: string;
  owner: string;
  contactName: string;
  contactEmail: string;
  status: "Ativo" | "Implantação";
}

export interface Establishment {
  id: string;
  clientId: string;
  name: string;
  city: string;
  state: string;
  address: string;
  pricePerKwh: number;
  contractCode: string;
}

export interface Location {
  id: string;
  establishmentId: string;
  name: string;
  address: string;
  number: string;
  city: string;
  state: string;
  zipCode: string;
  latitude: number;
  longitude: number;
  status: "Ativo" | "Offline";
}

export interface Charger {
  id: string;
  establishmentId: string;
  locationId: string;
  identifier: string;
  internalId: string;
  serial: string;
  model: string;
  powerKw: number;
  installationDate: string;
  status: ChargerStatus;
  commercialStatus: ChargerCommercialStatus;
  todayEnergyKwh: number;
  revenueToday: number;
}

export interface AccessGrant {
  id: string;
  accountId: string;
  role: AdminRole;
  establishmentIds: string[];
  status: "ACTIVE" | "REVOKED";
  grantedAt: string;
  grantedBy: string;
  revokedAt?: string;
  revokedBy?: string;
  revocationReason?: string;
}

export interface AccessActionResult {
  ok: boolean;
  issues: string[];
  grant?: AccessGrant;
}

export type ReportType = "SESSIONS" | "ENERGY" | "FINANCIAL" | "INCIDENTS";

export interface ReportJob {
  id: string;
  type: ReportType;
  requestedBy: string;
  establishmentIds: string[];
  periodFrom: string;
  periodTo: string;
  status: "QUEUED" | "PROCESSING" | "READY" | "FAILED";
  requestedAt: string;
  completedAt?: string;
  rowCount?: number;
  fileName?: string;
  csvContent?: string;
  failureReason?: string;
}

export interface ReportSubscription {
  id: string;
  accountId: string;
  type: ReportType;
  establishmentIds: string[];
  cadence: "DAILY" | "WEEKLY" | "MONTHLY";
  status: "ACTIVE" | "PAUSED";
  nextRunAt?: string;
  updatedAt: string;
}

export interface ReportActionResult {
  ok: boolean;
  issues: string[];
  job?: ReportJob;
  subscription?: ReportSubscription;
}

export interface ChargerTelemetry {
  chargerId: string;
  connectorState: ChargerConnectorState;
  currentPowerKw: number;
  observedAt: string;
  vehicleConnected: boolean;
  faultCode?: string;
}

export interface ChargerCommand {
  id: string;
  providerCommandId?: string;
  idempotencyKey: string;
  correlationId: string;
  chargerId: string;
  sessionId?: string;
  type: ChargerCommandType;
  status: ChargerCommandStatus;
  reason: string;
  requestedBy: string;
  requestedByProfile: Profile;
  requestedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  telemetryObservedAt?: string;
  failureCode?: "START_FAILED" | "PROVIDER_REJECTED" | "TELEMETRY_TIMEOUT";
  failureReason?: string;
}

export interface Payment {
  status: "Aprovado" | "Pendente" | "Recusado";
  method: "Cartao" | "Pix";
  limitAmount: number;
}

export interface Session {
  id: string;
  chargerId: string;
  establishmentId: string;
  locationId: string;
  driverId: string;
  driverName: string;
  vehicle: string;
  status: SessionStatus;
  startedAt: string;
  durationMinutes: number;
  energyKwh: number;
  tariffPerKwh: number;
  consumedAmount: number;
  finalAmount?: number;
  payment: Payment;
  servicePriority?: "STANDARD" | "ACCESSIBILITY" | "FLEET_CRITICAL";
  tariffPolicyId?: string;
  idleMinutes?: number;
}

export type SessionEventType =
  | "PAYMENT_AUTHORIZED"
  | "START_REQUESTED"
  | "START_ACCEPTED"
  | "ENERGY_CONFIRMED"
  | "CHARGING"
  | "START_FAILED"
  | "COMMAND_EXPIRED"
  | "STOP_REQUESTED"
  | "STOP_ACCEPTED"
  | "ENERGY_FINISHED"
  | "PAYMENT_CAPTURED"
  | "SETTLEMENT_PENDING";

export interface SessionEvent {
  id: string;
  sessionId: string;
  type: SessionEventType;
  label: string;
  at: string;
  source: "PAYMENT" | "CHARGEGRID" | "GOODWE";
  commandId?: string;
  detail?: string;
}

export interface RequestChargerCommandInput {
  chargerId: string;
  type: ChargerCommandType;
  reason: string;
  idempotencyKey: string;
}

export interface RequestChargerCommandResult {
  ok: boolean;
  issues: string[];
  command?: ChargerCommand;
}

export interface QueueEntry {
  id: string;
  driverId: string;
  establishmentId: string;
  locationId: string;
  driverName: string;
  vehicle: string;
  requiredConnector: "TYPE_2" | "CCS_2";
  status: "waiting" | "called" | "assigned" | "no_show" | "expired" | "released";
  joinedAt: string;
  calledAt?: string;
  callExpiresAt?: string;
  suggestedChargerId?: string;
  assignedAt?: string;
  completedAt?: string;
}

export interface QueueEvent {
  id: string;
  queueEntryId: string;
  establishmentId: string;
  type: "JOINED" | "CALLED" | "ASSIGNED" | "NO_SHOW" | "EXPIRED" | "RELEASED";
  label: string;
  at: string;
  actor: string;
  detail?: string;
}

export interface QueueActionResult {
  ok: boolean;
  issues: string[];
  entry?: QueueEntry;
}

export interface SupportTicket {
  id: string;
  establishmentId: string;
  code: string;
  title: string;
  description: string;
  status: "Aberto" | "Em atendimento";
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  summary: string;
  at: string;
}

export interface EnergySnapshot {
  establishmentId: string;
  demandState: "Favorável" | "Alerta" | "Crítico";
  observedAt: string;
  providerStatus: "ONLINE" | "OFFLINE";
  demandKw: number;
  contractedLimitKw: number;
  powerMarginPercent: number;
  batterySocPercent: number;
  solarPowerKw: number;
  gridPowerKw: number;
  periodSolarKwh?: number;
  periodBatteryKwh?: number;
  periodGridKwh?: number;
}

export interface EnergyPolicy {
  establishmentId: string;
  alertUtilizationPercent: number;
  criticalUtilizationPercent: number;
  freshnessMinutes: number;
  blockStartOnCritical: boolean;
  blockStartWithoutFreshTelemetry: boolean;
}

export interface TariffPolicy {
  id: string;
  establishmentId: string;
  version: number;
  status: "DRAFT" | "ACTIVE" | "RETIRED";
  energyPriceCentsPerKwh: number;
  idlePriceCentsPerMinute: number;
  idleGraceMinutes: number;
  platformShareBps: number;
  effectiveFrom: string;
  effectiveTo?: string;
  createdAt: string;
  createdBy: string;
  changeReason: string;
}

export interface PaymentTransaction {
  id: string;
  sessionId: string;
  establishmentId: string;
  tariffPolicyId: string;
  provider: "STRIPE_SANDBOX";
  providerReference: string;
  currency: "BRL";
  status: "AUTHORIZED" | "CAPTURED" | "PARTIALLY_REFUNDED" | "REFUNDED" | "FAILED" | "DISPUTED";
  settlementStatus: "PENDING" | "AVAILABLE" | "PAID" | "FAILED";
  authorizedCents: number;
  capturedCents: number;
  refundedCents: number;
  providerFeeCents: number;
  platformShareBps: number;
  createdAt: string;
  capturedAt?: string;
  settledAt?: string;
  failureReason?: string;
}

export interface FinancialEvent {
  id: string;
  transactionId: string;
  type: "AUTHORIZED" | "CAPTURED" | "REFUNDED" | "DISPUTED" | "SETTLED" | "FAILED";
  at: string;
  actor: string;
  amountCents?: number;
  reason?: string;
}

export interface FinancialActionResult {
  ok: boolean;
  issues: string[];
  transaction?: PaymentTransaction;
  tariffPolicy?: TariffPolicy;
}

export interface Incident {
  id: string;
  establishmentId: string;
  locationId?: string;
  chargerId?: string;
  sessionId?: string;
  source: "GOODWE" | "CHARGEGRID" | "PAYMENT";
  sourceEventId: string;
  correlationKey: string;
  category: "COMMUNICATION" | "CHARGER_FAULT" | "SESSION_START" | "PAYMENT" | "DEMAND";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "OPEN" | "ACKNOWLEDGED" | "IN_PROGRESS" | "RESOLVED";
  title: string;
  summary: string;
  occurrences: number;
  createdAt: string;
  updatedAt: string;
  assignee?: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface IncidentEvent {
  id: string;
  incidentId: string;
  sourceEventId?: string;
  type: "CREATED" | "CORRELATED" | "ACKNOWLEDGED" | "ASSIGNED" | "RESOLVED" | "REOPENED";
  at: string;
  actor: string;
  detail?: string;
}

export interface Recommendation {
  id: string;
  establishmentId: string;
  incidentId?: string;
  title: string;
  rationale: string;
  evidence: string[];
  expectedImpact: string;
  proposedAction: "OPEN_CHARGER" | "OPEN_ENERGY" | "OPEN_FINANCE" | "MONITOR";
  targetId?: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  deterministic: boolean;
  status: "OPEN" | "ACCEPTED" | "DEFERRED" | "REJECTED";
  createdAt: string;
  decidedAt?: string;
  decidedBy?: string;
  decisionReason?: string;
}

export interface IncidentActionResult {
  ok: boolean;
  issues: string[];
  incident?: Incident;
  recommendation?: Recommendation;
}

export interface AdminState {
  accounts: Account[];
  accessGrants: AccessGrant[];
  currentAccountId: string | null;
  clients: Client[];
  establishments: Establishment[];
  commercialPlants: CommercialPlantLink[];
  plantOnboardingDraft: PlantOnboardingDraft;
  locations: Location[];
  chargers: Charger[];
  chargerTelemetry: ChargerTelemetry[];
  chargerCommands: ChargerCommand[];
  sessions: Session[];
  sessionEvents: SessionEvent[];
  queue: QueueEntry[];
  queueEvents: QueueEvent[];
  supportTickets: SupportTicket[];
  audit: AuditEntry[];
  energy: EnergySnapshot[];
  energyPolicies: EnergyPolicy[];
  tariffPolicies: TariffPolicy[];
  paymentTransactions: PaymentTransaction[];
  financialEvents: FinancialEvent[];
  incidents: Incident[];
  incidentEvents: IncidentEvent[];
  recommendations: Recommendation[];
  reportJobs: ReportJob[];
  reportSubscriptions: ReportSubscription[];
}

export interface NewClientInput {
  name: string;
  corporateName: string;
  document: string;
  owner: string;
  contactName: string;
  contactEmail: string;
}

export interface NewLocationInput {
  establishmentId: string;
  name: string;
  address: string;
  number: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface NewChargerInput {
  establishmentId: string;
  locationId: string;
  identifier: string;
  internalId: string;
  serial: string;
  model: string;
  powerKw: number;
  installationDate: string;
}
