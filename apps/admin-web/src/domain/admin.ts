export type Profile = "GOODWE" | "ESTABELECIMENTO";
export type ChargerStatus = "available" | "charging" | "limited" | "offline";
export type SessionStatus = "active" | "finished";

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
  locations: Location[];
  chargers: Charger[];
  sessions: Session[];
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
