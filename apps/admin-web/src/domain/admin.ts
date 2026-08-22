export type Profile = "GOODWE" | "ESTABELECIMENTO";
export type ChargerStatus = "available" | "charging" | "limited" | "offline";
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
  displayName: string;
  establishmentId?: string;
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
  todayEnergyKwh: number;
  revenueToday: number;
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
  establishmentId: string;
  locationId: string;
  driverName: string;
  vehicle: string;
  status: "waiting" | "released";
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
  demandKw: number;
  contractedLimitKw: number;
  powerMarginPercent: number;
  batterySocPercent: number;
  solarPowerKw: number;
  gridPowerKw: number;
}

export interface AdminState {
  accounts: Account[];
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
  supportTickets: SupportTicket[];
  audit: AuditEntry[];
  energy: EnergySnapshot[];
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
