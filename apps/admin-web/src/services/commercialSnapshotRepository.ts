import { CommercialSessionStatus, PaymentStatus, QueueStatus, type CommercialSnapshot } from "@chargegrid/shared";
import type { AdminState, Charger, ChargerTelemetry, CommercialPlantLink, Establishment, Location, PaymentTransaction, QueueEntry, Session } from "../domain/admin";

const apiUrl = (import.meta.env.VITE_CHARGEGRID_API_URL || "http://localhost:3333").replace(/\/$/, "");

export async function fetchCommercialSnapshot() {
  const response = await fetch(`${apiUrl}/commercial/snapshot`);
  if (!response.ok) throw new Error("A API ChargeGrid não respondeu ao monitoramento comercial.");
  return response.json() as Promise<CommercialSnapshot>;
}

export type HardwareAction = "CONNECT" | "DISCONNECT" | "START" | "STOP" | "OFFLINE" | "FAULT" | "RECOVER";

export async function sendHardwareEvent(chargerCode: string, action: HardwareAction, powerKw?: number) {
  const response = await fetch(`${apiUrl}/commercial/chargers/${encodeURIComponent(chargerCode)}/hardware`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, powerKw })
  });
  const payload = await response.json().catch(() => ({})) as CommercialSnapshot & { message?: string };
  if (!response.ok) throw new Error(payload.message || "A API não confirmou o evento físico.");
  return payload;
}

function sessionStatus(status: CommercialSessionStatus): Session["status"] {
  if (status === CommercialSessionStatus.CHARGING) return "active";
  if ([CommercialSessionStatus.STARTING, CommercialSessionStatus.ENERGY_FINISHED, CommercialSessionStatus.SETTLING].includes(status)) return "starting";
  if (status === CommercialSessionStatus.COMPLETED) return "finished";
  if ([CommercialSessionStatus.PAYMENT_FAILED, CommercialSessionStatus.START_FAILED, CommercialSessionStatus.FAULTED, CommercialSessionStatus.CANCELLED].includes(status)) return "start_failed";
  return "authorized";
}

export function mergeCommercialSnapshot(state: AdminState, snapshot: CommercialSnapshot): AdminState {
  const ids = new Set(snapshot.establishments.map((item) => item.id));
  const locationId = (establishmentId: string) => `loc-${establishmentId}`;
  const establishments: Establishment[] = snapshot.establishments.map((item) => ({ id: item.id, clientId: "cli-fiap", name: item.name, city: "São Paulo", state: "SP", address: item.address, pricePerKwh: item.tariffCents / 100, contractCode: `CG-${item.id.toUpperCase()}` }));
  const locations: Location[] = snapshot.establishments.map((item) => ({ id: locationId(item.id), establishmentId: item.id, name: item.name, address: item.address, number: "420", city: "São Paulo", state: "SP", zipCode: "01000-000", latitude: item.latitude, longitude: item.longitude, status: "Ativo" }));
  const commercialPlants: CommercialPlantLink[] = snapshot.establishments.map((item) => ({ id: `cplant-${item.id}`, goodwePlantId: `gw-${item.id}`, establishmentId: item.id, locationId: locationId(item.id), commercialName: item.name, accessPolicy: "PUBLIC", alwaysOpen: true, status: "PUBLISHED", publishedAt: snapshot.generatedAt }));
  const chargers: Charger[] = snapshot.establishments.flatMap((establishment) => establishment.chargers.map((charger) => ({
    id: charger.code,
    establishmentId: establishment.id,
    locationId: locationId(establishment.id),
    identifier: charger.code,
    internalId: charger.id,
    serial: charger.code,
    model: "GoodWe AC 7",
    powerKw: charger.nominalPowerKw,
    installationDate: "2026-09-01",
    status: charger.physicalStatus === "CHARGING" ? "charging" : charger.physicalStatus === "OFFLINE" ? "offline" : charger.physicalStatus === "FAULT" ? "limited" : "available",
    publicationStatus: "PUBLISHED",
    todayEnergyKwh: snapshot.sessions.filter((session) => session.chargerCode === charger.code).reduce((total, session) => total + session.energyWh / 1000, 0),
    revenueToday: snapshot.sessions.filter((session) => session.chargerCode === charger.code).reduce((total, session) => total + session.costCents / 100, 0)
  })));
  const telemetry: ChargerTelemetry[] = snapshot.establishments.flatMap((establishment) => establishment.chargers.map((charger) => ({
    chargerId: charger.code,
    connectorState: (["AVAILABLE", "CONNECTED", "CHARGING", "FAULT", "OFFLINE"].includes(charger.physicalStatus) ? charger.physicalStatus : "AVAILABLE") as ChargerTelemetry["connectorState"],
    currentPowerKw: charger.currentPowerKw,
    observedAt: charger.updatedAt,
    vehicleConnected: ["CONNECTED", "CHARGING"].includes(charger.physicalStatus)
  })));
  const sessions: Session[] = snapshot.sessions.map((session) => ({
    id: session.publicCode,
    chargerId: session.chargerCode,
    establishmentId: session.establishmentId,
    locationId: locationId(session.establishmentId),
    driverId: session.driverId ?? `guest-${session.id}`,
    driverName: session.driverName,
    vehicle: session.driverId ? "Veículo cadastrado" : "Visitante",
    status: sessionStatus(session.status),
    startedAt: session.startedAt ?? session.createdAt,
    durationMinutes: Math.max(0, Math.floor((Date.parse(session.endedAt ?? snapshot.generatedAt) - Date.parse(session.startedAt ?? session.createdAt)) / 60_000)),
    energyKwh: session.energyWh / 1000,
    tariffPerKwh: session.tariffCents / 100,
    consumedAmount: session.costCents / 100,
    finalAmount: session.endedAt ? session.costCents / 100 : undefined,
    payment: { status: [PaymentStatus.AUTHORIZED, PaymentStatus.PAID].includes(session.payment.status) ? "Aprovado" : session.payment.status === PaymentStatus.FAILED ? "Recusado" : "Pendente", method: session.payment.method === "PIX" ? "Pix" : "Cartao", limitAmount: session.authorizedCents / 100 },
    idleMinutes: 0
  }));
  const paymentTransactions: PaymentTransaction[] = snapshot.sessions.filter((session) => session.payment.paymentIntentId).map((session) => ({
    id: `pay-${session.id}`,
    sessionId: session.publicCode,
    establishmentId: session.establishmentId,
    tariffPolicyId: `commercial-${session.establishmentId}`,
    provider: "STRIPE_SANDBOX",
    providerReference: session.payment.paymentIntentId!,
    currency: "BRL",
    status: session.payment.status === PaymentStatus.PAID ? "CAPTURED" : session.payment.status === PaymentStatus.FAILED ? "FAILED" : "AUTHORIZED",
    settlementStatus: session.payment.status === PaymentStatus.PAID ? "AVAILABLE" : session.payment.status === PaymentStatus.FAILED ? "FAILED" : "PENDING",
    authorizedCents: session.authorizedCents,
    capturedCents: session.payment.capturedCents,
    refundedCents: 0,
    providerFeeCents: 0,
    platformShareBps: 0,
    createdAt: session.createdAt,
    capturedAt: session.payment.status === PaymentStatus.PAID ? session.endedAt : undefined
  }));
  const queue: QueueEntry[] = snapshot.queue.map((entry) => ({
    id: entry.id,
    driverId: entry.driverId,
    establishmentId: entry.establishmentId,
    locationId: locationId(entry.establishmentId),
    driverName: entry.driverName,
    vehicle: entry.driverVehicle,
    requiredConnector: "TYPE_2",
    status: entry.status === QueueStatus.WAITING ? "waiting" : entry.status === QueueStatus.CALLED ? "called" : entry.status === QueueStatus.ASSIGNED ? "assigned" : entry.status === QueueStatus.EXPIRED ? "expired" : "released",
    joinedAt: entry.joinedAt,
    calledAt: entry.calledAt,
    callExpiresAt: entry.assignmentExpiresAt,
    suggestedChargerId: entry.chargerCode,
    assignedAt: entry.status === QueueStatus.ASSIGNED ? entry.calledAt : undefined,
    completedAt: entry.completedAt
  }));
  const scopeIds = [...ids];
  return {
    ...state,
    accounts: state.accounts.map((account) => account.role === "GOODWE_CENTRAL" ? { ...account, technicalEstablishmentIds: [...new Set([...(account.technicalEstablishmentIds ?? []), ...scopeIds])] } : account),
    accessGrants: state.accessGrants.map((grant) => grant.role === "GOODWE_CENTRAL" && grant.status === "ACTIVE" ? { ...grant, establishmentIds: [...new Set([...grant.establishmentIds, ...scopeIds])] } : grant),
    establishments: [...state.establishments.filter((item) => !ids.has(item.id)), ...establishments],
    locations: [...state.locations.filter((item) => !ids.has(item.establishmentId)), ...locations],
    commercialPlants: [...state.commercialPlants.filter((item) => !ids.has(item.establishmentId)), ...commercialPlants],
    chargers: [...state.chargers.filter((item) => !ids.has(item.establishmentId)), ...chargers],
    chargerTelemetry: [...state.chargerTelemetry.filter((item) => !chargers.some((charger) => charger.id === item.chargerId)), ...telemetry],
    sessions: [...state.sessions.filter((item) => !ids.has(item.establishmentId)), ...sessions],
    paymentTransactions: [...state.paymentTransactions.filter((item) => !ids.has(item.establishmentId)), ...paymentTransactions],
    queue: [...state.queue.filter((item) => !ids.has(item.establishmentId)), ...queue]
  };
}
