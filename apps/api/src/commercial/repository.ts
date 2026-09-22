import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { CommercialSessionStatus, PaymentStatus, type CommercialChargerRecord, type CommercialEstablishmentRecord, type CommercialSessionRecord, type CommercialSnapshot } from "@chargegrid/shared";

interface ChargerRow {
  id: string;
  code: string;
  establishment_id: string;
  name: string;
  parking_spot: string | null;
  nominal_power_kw: number;
  physical_status: string;
  commercial_status: string;
  published: boolean;
  qr_identifier: string;
  updated_at: Date | string;
}

interface EstablishmentRow {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  tariff_cents: number;
  qr_slug: string;
}

interface SessionRow {
  id: string;
  public_code: string;
  driver_id: string | null;
  driver_name: string;
  driver_email: string | null;
  establishment_id: string;
  establishment_name: string;
  charger_code: string;
  charger_name: string;
  parking_spot: string | null;
  status: CommercialSessionStatus;
  tariff_cents: number;
  authorized_cents: number;
  energy_wh: number;
  cost_cents: number;
  started_at: Date | string | null;
  ended_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  payment_intent_id: string | null;
  payment_method: "CARD" | "PIX" | null;
  payment_status: PaymentStatus | null;
  provider_status: string | null;
  captured_cents: number | null;
}

export class CommercialConflictError extends Error {}
export class CommercialNotFoundError extends Error {}

const migrationUrl = new URL("../../../../supabase/migrations/202609220001_commercial_core.sql", import.meta.url);
const defaultDataDir = process.env.CHARGEGRID_DATABASE_PATH ?? (process.env.NODE_ENV === "test" ? "memory://" : fileURLToPath(new URL("../../../../.local/commercial-db", import.meta.url)));

function iso(value: Date | string | null) {
  return value ? new Date(value).toISOString() : undefined;
}

function chargerRecord(row: ChargerRow): CommercialChargerRecord {
  return {
    id: row.id,
    code: row.code,
    establishmentId: row.establishment_id,
    name: row.name,
    parkingSpot: row.parking_spot ?? undefined,
    nominalPowerKw: Number(row.nominal_power_kw),
    physicalStatus: row.physical_status,
    commercialStatus: row.commercial_status as CommercialChargerRecord["commercialStatus"],
    published: row.published,
    qrIdentifier: row.qr_identifier,
    updatedAt: iso(row.updated_at)!
  };
}

function sessionRecord(row: SessionRow): CommercialSessionRecord {
  return {
    id: row.id,
    publicCode: row.public_code,
    driverId: row.driver_id ?? undefined,
    driverName: row.driver_name,
    driverEmail: row.driver_email ?? undefined,
    establishmentId: row.establishment_id,
    establishmentName: row.establishment_name,
    chargerId: row.charger_code,
    chargerCode: row.charger_code,
    chargerName: row.charger_name,
    parkingSpot: row.parking_spot ?? undefined,
    status: row.status,
    tariffCents: row.tariff_cents,
    authorizedCents: row.authorized_cents,
    energyWh: Number(row.energy_wh),
    costCents: row.cost_cents,
    startedAt: iso(row.started_at),
    endedAt: iso(row.ended_at),
    createdAt: iso(row.created_at)!,
    updatedAt: iso(row.updated_at)!,
    payment: {
      paymentIntentId: row.payment_intent_id ?? undefined,
      method: row.payment_method ?? "CARD",
      status: row.payment_status ?? PaymentStatus.PENDING,
      providerStatus: row.provider_status ?? undefined,
      authorizedCents: row.authorized_cents,
      capturedCents: row.captured_cents ?? 0
    }
  };
}

const sessionSelect = `
  select s.*, e.name as establishment_name, c.code as charger_code, c.name as charger_name,
    c.parking_spot, p.payment_intent_id, p.method as payment_method, p.status as payment_status,
    p.provider_status, p.captured_cents
  from commercial_sessions s
  join commercial_establishments e on e.id = s.establishment_id
  join commercial_chargers c on c.id = s.charger_id
  left join commercial_payments p on p.session_id = s.id`;

export class CommercialRepository {
  private readonly db: PGlite;
  private readonly ready: Promise<void>;

  constructor(dataDir = defaultDataDir) {
    this.db = new PGlite(dataDir);
    this.ready = readFile(migrationUrl, "utf8").then(async (sql) => { await this.db.exec(sql); });
  }

  async close() {
    await this.db.close();
  }

  async reserveSession(input: {
    id: string;
    establishmentId: string;
    chargerCode: string;
    driverId?: string;
    driverName?: string;
    driverEmail?: string;
    method: "CARD" | "PIX";
    authorizedCents: number;
  }) {
    await this.ready;
    await this.db.transaction(async (tx) => {
      const existing = await tx.query<{ id: string }>("select id from commercial_sessions where id = $1", [input.id]);
      if (existing.rows.length) return;
      const charger = await tx.query<{ id: string; tariff_cents: number; commercial_status: string }>(`
        select c.id, e.tariff_cents, c.commercial_status
        from commercial_chargers c join commercial_establishments e on e.id = c.establishment_id
        where c.code = $1 and c.establishment_id = $2 and c.published = true`, [input.chargerCode, input.establishmentId]);
      const selected = charger.rows[0];
      if (!selected) throw new CommercialNotFoundError("Carregador comercial não encontrado.");
      if (selected.commercial_status !== "AVAILABLE_TO_START") throw new CommercialConflictError("Este carregador não está disponível para iniciar.");
      await tx.query(`insert into commercial_sessions
        (id, public_code, driver_id, driver_name, driver_email, establishment_id, charger_id, status, tariff_cents, authorized_cents)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`, [
        input.id,
        `CG-${input.id.slice(0, 8).toUpperCase()}`,
        input.driverId ?? null,
        input.driverName?.trim() || "Visitante",
        input.driverEmail ?? null,
        input.establishmentId,
        selected.id,
        CommercialSessionStatus.AWAITING_PAYMENT,
        selected.tariff_cents,
        input.authorizedCents
      ]);
      await tx.query(`insert into commercial_payments
        (id, session_id, method, status, authorized_cents) values ($1, $2, $3, $4, $5)`, [
        randomUUID(), input.id, input.method, PaymentStatus.PENDING, input.authorizedCents
      ]);
      await tx.query("update commercial_chargers set commercial_status = 'OCCUPIED', updated_at = now() where id = $1", [selected.id]);
    });
    return this.session(input.id);
  }

  async attachPayment(sessionId: string, paymentIntentId: string, providerStatus: string) {
    await this.ready;
    await this.db.query("update commercial_payments set payment_intent_id = $2, provider_status = $3, updated_at = now() where session_id = $1", [sessionId, paymentIntentId, providerStatus]);
  }

  async failSession(sessionId: string, providerStatus = "failed") {
    await this.ready;
    await this.db.transaction(async (tx) => {
      await tx.query("update commercial_payments set status = $2, provider_status = $3, updated_at = now() where session_id = $1", [sessionId, PaymentStatus.FAILED, providerStatus]);
      await tx.query("update commercial_sessions set status = $2, updated_at = now() where id = $1", [sessionId, CommercialSessionStatus.PAYMENT_FAILED]);
      await tx.query("update commercial_chargers set commercial_status = 'AVAILABLE_TO_START', updated_at = now() where id = (select charger_id from commercial_sessions where id = $1)", [sessionId]);
    });
  }

  async recordPayment(input: { paymentIntentId: string; sessionId?: string; status: PaymentStatus; providerStatus: string; receivedAmount: number }) {
    await this.ready;
    const found = input.sessionId
      ? await this.db.query<{ session_id: string }>("select session_id from commercial_payments where session_id = $1 and payment_intent_id = $2", [input.sessionId, input.paymentIntentId])
      : await this.db.query<{ session_id: string }>("select session_id from commercial_payments where payment_intent_id = $1", [input.paymentIntentId]);
    const sessionId = found.rows[0]?.session_id;
    if (!sessionId) throw new CommercialNotFoundError("Pagamento não vinculado a uma sessão ChargeGrid.");
    const nextSessionStatus = input.status === PaymentStatus.FAILED
      ? CommercialSessionStatus.PAYMENT_FAILED
      : [PaymentStatus.AUTHORIZED, PaymentStatus.PAID].includes(input.status)
        ? CommercialSessionStatus.WAITING_START
        : CommercialSessionStatus.AWAITING_PAYMENT;
    await this.db.transaction(async (tx) => {
      await tx.query("update commercial_payments set status = $2, provider_status = $3, captured_cents = $4, updated_at = now() where session_id = $1", [sessionId, input.status, input.providerStatus, Math.round(input.receivedAmount * 100)]);
      await tx.query(`update commercial_sessions set status = $2, updated_at = now()
        where id = $1 and status in ('AWAITING_PAYMENT', 'AUTHORIZED', 'WAITING_START', 'PAYMENT_FAILED')`, [sessionId, nextSessionStatus]);
      if (input.status === PaymentStatus.FAILED) {
        await tx.query("update commercial_chargers set commercial_status = 'AVAILABLE_TO_START', updated_at = now() where id = (select charger_id from commercial_sessions where id = $1)", [sessionId]);
      }
    });
    return this.session(sessionId);
  }

  async session(id: string) {
    await this.ready;
    const result = await this.db.query<SessionRow>(`${sessionSelect} where s.id = $1`, [id]);
    if (!result.rows[0]) throw new CommercialNotFoundError("Sessão comercial não encontrada.");
    return sessionRecord(result.rows[0]);
  }

  async snapshot(establishmentId?: string): Promise<CommercialSnapshot> {
    await this.ready;
    const establishments = await this.db.query<EstablishmentRow>(`select * from commercial_establishments where published = true ${establishmentId ? "and id = $1" : ""} order by name`, establishmentId ? [establishmentId] : []);
    const chargers = await this.db.query<ChargerRow>(`select * from commercial_chargers where published = true ${establishmentId ? "and establishment_id = $1" : ""} order by code`, establishmentId ? [establishmentId] : []);
    const sessions = await this.db.query<SessionRow>(`${sessionSelect} ${establishmentId ? "where s.establishment_id = $1" : ""} order by s.created_at desc`, establishmentId ? [establishmentId] : []);
    const chargerRecords = chargers.rows.map(chargerRecord);
    const establishmentRecords: CommercialEstablishmentRecord[] = establishments.rows.map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      latitude: Number(row.latitude),
      longitude: Number(row.longitude),
      tariffCents: row.tariff_cents,
      qrSlug: row.qr_slug,
      chargers: chargerRecords.filter((charger) => charger.establishmentId === row.id)
    }));
    return { generatedAt: new Date().toISOString(), establishments: establishmentRecords, sessions: sessions.rows.map(sessionRecord) };
  }
}

let repository: CommercialRepository | undefined;

export function getCommercialRepository() {
  return repository ??= new CommercialRepository();
}
