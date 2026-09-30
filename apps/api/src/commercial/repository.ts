import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { ChargerCommercialStatus, ChargerTechnicalStatus, CommercialAvailability, CommercialSessionStatus, PaymentStatus, PlantEnergyStatus, QueueStatus, type CommercialCatalog, type CommercialChargerRecord, type CommercialChargerResolution, type CommercialDashboardMetric, type CommercialDashboardSummary, type CommercialEnergyView, type CommercialEstablishmentRecord, type CommercialFinancialSummary, type CommercialInsight, type CommercialInsights, type CommercialOperationalReport, type CommercialOpeningHoursInterval, type CommercialPublicChargerRecord, type CommercialPublicEstablishmentRecord, type CommercialQueueRecord, type CommercialQuote, type CommercialSessionRecord, type CommercialSnapshot, type CommercialTariffVersion, type DataProvenance, type LabScenarioId, type PlantEnergySnapshot, type PlantSimulationProfile } from "@chargegrid/shared";
import pg from "pg";
import { MockGoodWeProvider, type GoodWeProvider } from "../goodwe/index.js";
import { historicalSignals, LAB_SCENARIOS, signalsForScenario } from "../goodwe/energy-scenarios.js";

const { Pool } = pg;

interface SqlClient {
  query<T>(sql: string, params?: unknown[]): Promise<{ rows: T[] }>;
}

interface SqlDatabase extends SqlClient {
  exec(sql: string): Promise<void>;
  transaction<T>(callback: (client: SqlClient) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

interface ChargerRow {
  id: string;
  code: string;
  establishment_id: string;
  plant_id: string | null;
  name: string;
  parking_spot: string | null;
  nominal_power_kw: number;
  current_power_kw: number;
  physical_status: string;
  commercial_status: string;
  published: boolean;
  qr_identifier: string;
  current_session_id: string | null;
  assignment_id: string | null;
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
  plant_id: string | null;
  timezone: string;
  opening_hours: unknown;
  published: boolean;
}

interface SessionRow {
  id: string;
  public_code: string;
  driver_id: string | null;
  driver_name: string;
  driver_email: string | null;
  establishment_id: string;
  establishment_name: string;
  charger_id: string;
  charger_code: string;
  charger_name: string;
  parking_spot: string | null;
  status: CommercialSessionStatus;
  tariff_cents: number;
  authorized_cents: number;
  energy_wh: number;
  cost_cents: number;
  current_power_kw: number;
  last_energy_at: Date | string | null;
  started_at: Date | string | null;
  ended_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
  payment_intent_id: string | null;
  payment_method: "CARD" | "PIX" | null;
  payment_status: PaymentStatus | null;
  provider_status: string | null;
  captured_cents: number | null;
  payment_id: string | null;
  refunded_cents: number | null;
  pending_operation: string | null;
  last_error_code: string | null;
  actor_type: "DRIVER" | "GUEST";
  quote: CommercialQuote | string | null;
  energy_cost_cents: number | null;
  idle_cost_cents: number | null;
  total_cost_cents: number | null;
  energy_ended_at: Date | string | null;
  disconnected_at: Date | string | null;
  settled_at: Date | string | null;
  idle_grace_ends_at: Date | string | null;
  end_reason: string | null;
  transition_reason: string | null;
  pending_command_id: string | null;
}

interface QueueRow {
  id: string;
  driver_id: string;
  driver_name: string;
  driver_vehicle: string;
  establishment_id: string;
  establishment_name: string;
  status: QueueStatus;
  charger_id: string | null;
  charger_code: string | null;
  parking_spot: string | null;
  joined_at: Date | string;
  called_at: Date | string | null;
  assignment_expires_at: Date | string | null;
  completed_at: Date | string | null;
  session_id: string | null;
  estimated_wait_minutes: number | null;
}

interface QuoteRow {
  id: string;
  charger_id: string;
  establishment_id: string;
  tariff_version_id: string;
  policy_version: string;
  energy_cents_per_kwh: number;
  idle_grace_minutes: number;
  idle_cents_per_minute: number;
  idle_max_minutes: number;
  idle_enabled: boolean;
  offered_at: Date | string;
  expires_at: Date | string;
  reason_code: string;
  energy_sample_id: string | null;
  driver_id: string | null;
  guest_token_hash: string | null;
}

interface TariffVersionRow {
  id: string;
  establishment_id: string;
  energy_cents_per_kwh: number;
  solar_energy_cents_per_kwh: number | null;
  idle_grace_minutes: number;
  idle_cents_per_minute: number;
  idle_max_minutes: number;
  idle_enabled: boolean;
  valid_from: Date | string;
  created_at: Date | string;
  reason: string;
}

interface PlantRow {
  id: string;
  establishment_id: string;
  provider_config: unknown;
  energy_policy: unknown;
  updated_at?: Date | string;
}

interface EnergySampleRow {
  id: string;
  plant_id: string;
  observed_at: Date | string;
  source: "SIMULATED";
  quality: "FRESH" | "STALE" | "UNKNOWN";
  pv_kw: number;
  building_load_kw: number;
  ev_load_kw: number;
  grid_import_kw: number;
  grid_export_kw: number;
  ev_wh: number;
  grid_import_wh: number;
  grid_export_wh: number;
  solar_to_ev_wh: number;
}

interface InsightRow {
  id: string;
  correlation_key: string;
  kind: CommercialInsight["kind"];
  type: string;
  entity_id: string;
  source_event_id: string | null;
  sample_id: string | null;
  policy_version: string | null;
  condition_active: boolean;
  was_active: boolean;
  severity: CommercialInsight["severity"];
  reason_code: string;
  message: string;
  evidence: unknown;
  suggested_action: string | null;
  review_state: CommercialInsight["reviewState"];
  decided_at: Date | string | null;
  decided_by: string | null;
  decision_reason: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

interface InsightInput {
  establishmentId: string;
  correlationKey: string;
  kind: CommercialInsight["kind"];
  type: string;
  entityId: string;
  sourceEventId?: string | null;
  sampleId?: string | null;
  policyVersion?: string | null;
  conditionActive: boolean;
  severity: CommercialInsight["severity"];
  reasonCode: string;
  message: string;
  evidence: string[];
  suggestedAction?: string | null;
}

export class CommercialConflictError extends Error {}
export class CommercialNotFoundError extends Error {}

export type CommercialSessionAccess = { driverId: string } | { guestToken: string };

const migrations = [
  { name: "202609220001_commercial_core", url: new URL("../../../../supabase/migrations/202609220001_commercial_core.sql", import.meta.url) },
  { name: "202609220002_hardware_lifecycle", url: new URL("../../../../supabase/migrations/202609220002_hardware_lifecycle.sql", import.meta.url) },
  { name: "202609220003_commercial_queue", url: new URL("../../../../supabase/migrations/202609220003_commercial_queue.sql", import.meta.url) },
  { name: "202609260004_s4_foundation", url: new URL("../../../../supabase/migrations/202609260004_s4_foundation.sql", import.meta.url) },
  { name: "202609260005_checkout_quotes", url: new URL("../../../../supabase/migrations/202609260005_checkout_quotes.sql", import.meta.url) },
  { name: "202609260006_energy_telemetry", url: new URL("../../../../supabase/migrations/202609260006_energy_telemetry.sql", import.meta.url) },
  { name: "202609270007_demand_policy", url: new URL("../../../../supabase/migrations/202609270007_demand_policy.sql", import.meta.url) },
  { name: "202609270008_commercial_insights", url: new URL("../../../../supabase/migrations/202609270008_commercial_insights.sql", import.meta.url) },
  { name: "202609270009_insight_lifecycle", url: new URL("../../../../supabase/migrations/202609270009_insight_lifecycle.sql", import.meta.url) }
] as const;
const legacyMigrationNames = new Set(migrations.slice(0, 3).map((migration) => migration.name));
const defaultDataDir = process.env.CHARGEGRID_DATABASE_PATH ?? (process.env.NODE_ENV === "test" ? "memory://" : fileURLToPath(new URL("../../../../.local/commercial-db", import.meta.url)));

interface DatabaseLease {
  release(): void;
}

function acquirePgliteLease(dataDir: string): DatabaseLease | undefined {
  if (dataDir.startsWith("memory://")) return undefined;
  const lockDir = `${dataDir}.chargegrid-lock`;
  mkdirSync(dirname(lockDir), { recursive: true });
  try {
    mkdirSync(lockDir);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    let stale = false;
    try {
      const owner = JSON.parse(readFileSync(join(lockDir, "owner.json"), "utf8")) as { pid?: unknown };
      const pid = Number(owner.pid);
      if (Number.isInteger(pid) && pid > 0) {
        try {
          process.kill(pid, 0);
        } catch (ownerError) {
          stale = (ownerError as NodeJS.ErrnoException).code === "ESRCH";
        }
      }
    } catch {
      // Lock sem proprietário verificável continua protegido para não arriscar o banco.
    }
    if (!stale) throw new Error(`O banco local ChargeGrid já está em uso (${lockDir}). Encerre a outra API; após uma queda confirmada, remova somente essa pasta de lock.`);
    rmSync(lockDir, { recursive: true, force: true });
    mkdirSync(lockDir);
  }
  try {
    writeFileSync(join(lockDir, "owner.json"), JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }), "utf8");
  } catch (error) {
    rmSync(lockDir, { recursive: true, force: true });
    throw error;
  }
  return { release: () => rmSync(lockDir, { recursive: true, force: true }) };
}

function pgliteDatabase(dataDir: string): SqlDatabase {
  const lease = acquirePgliteLease(dataDir);
  let db: PGlite;
  try {
    db = new PGlite(dataDir);
  } catch (error) {
    lease?.release();
    throw error;
  }
  const client = (queryable: { query<T>(sql: string, params?: unknown[]): Promise<{ rows: T[] }> }): SqlClient => ({ query: (sql, params = []) => queryable.query(sql, params) });
  return {
    ...client(db),
    exec: async (sql) => { await db.exec(sql); },
    transaction: (callback) => db.transaction((tx) => callback(client(tx))),
    close: async () => {
      try {
        await db.close();
      } finally {
        lease?.release();
      }
    }
  };
}

function postgresDatabase(connectionString: string): SqlDatabase {
  const pool = new Pool({ connectionString, ssl: true });
  const client = (queryable: { query(sql: string, params?: unknown[]): Promise<{ rows: unknown[] }> }): SqlClient => ({
    query: async <T>(sql: string, params: unknown[] = []) => ({ rows: (await queryable.query(sql, params)).rows as T[] })
  });
  return {
    ...client(pool),
    exec: async (sql) => { await pool.query(sql); },
    transaction: async (callback) => {
      const connection = await pool.connect();
      try {
        await connection.query("begin");
        const result = await callback(client(connection));
        await connection.query("commit");
        return result;
      } catch (error) {
        await connection.query("rollback");
        throw error;
      } finally {
        connection.release();
      }
    },
    close: () => pool.end()
  };
}

function iso(value: Date | string | null) {
  return value ? new Date(value).toISOString() : undefined;
}

function openingHours(value: unknown): CommercialOpeningHoursInterval[] {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  if (!Array.isArray(parsed)) return [];
  return parsed.filter((item): item is CommercialOpeningHoursInterval => typeof item === "object" && item !== null
    && typeof item.day === "number" && typeof item.opens === "string" && typeof item.closes === "string");
}

function quoteRecord(value: SessionRow["quote"]): CommercialQuote | null {
  if (!value) return null;
  return (typeof value === "string" ? JSON.parse(value) : value) as CommercialQuote;
}

function quoteFromRow(row: QuoteRow): CommercialQuote {
  return {
    id: row.id,
    chargerId: row.charger_id,
    establishmentId: row.establishment_id,
    policyVersion: row.policy_version,
    energyCentsPerKwh: row.energy_cents_per_kwh,
    idleGraceMinutes: row.idle_grace_minutes,
    idleCentsPerMinute: row.idle_cents_per_minute,
    idleMaxMinutes: row.idle_max_minutes,
    idleEnabled: row.idle_enabled,
    offeredAt: iso(row.offered_at)!,
    expiresAt: iso(row.expires_at)!,
    reasonCode: row.reason_code,
    energySampleId: row.energy_sample_id
  };
}

function tariffVersionRecord(row: TariffVersionRow): CommercialTariffVersion {
  return {
    id: row.id,
    establishmentId: row.establishment_id,
    energyCentsPerKwh: row.energy_cents_per_kwh,
    solarEnergyCentsPerKwh: row.solar_energy_cents_per_kwh,
    idleGraceMinutes: row.idle_grace_minutes,
    idleCentsPerMinute: row.idle_cents_per_minute,
    idleMaxMinutes: row.idle_max_minutes,
    idleEnabled: row.idle_enabled,
    validFrom: iso(row.valid_from)!,
    createdAt: iso(row.created_at)!,
    reason: row.reason
  };
}

function providerConfig(value: unknown): { online: boolean; pvKw: number; buildingLoadKw: number; simulation: PlantSimulationProfile | null } {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  const config = typeof parsed === "object" && parsed !== null ? parsed as Record<string, unknown> : {};
  const numeric = (key: "pvKw" | "buildingLoadKw") => typeof config[key] === "number" && Number.isFinite(config[key]) && config[key] >= 0 ? config[key] : 0;
  const rawSimulation = typeof config.simulation === "object" && config.simulation !== null ? config.simulation as Record<string, unknown> : null;
  const simulation = rawSimulation && LAB_SCENARIOS.includes(rawSimulation.scenarioId as LabScenarioId) && rawSimulation.version === 1 && Number.isInteger(rawSimulation.seed) && typeof rawSimulation.appliedAt === "string"
    ? { scenarioId: rawSimulation.scenarioId as LabScenarioId, version: 1 as const, seed: rawSimulation.seed as number, stepSeconds: 60 as const, appliedAt: rawSimulation.appliedAt }
    : null;
  return { online: config.online === true, pvKw: numeric("pvKw"), buildingLoadKw: numeric("buildingLoadKw"), simulation };
}

function energyPolicy(value: unknown) {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  const policy = typeof parsed === "object" && parsed !== null ? parsed as Record<string, unknown> : {};
  return {
    demandControlEnabled: policy.demandControlEnabled === true,
    limitKw: typeof policy.limitKw === "number" && policy.limitKw > 0 ? policy.limitKw : 20,
    alertPercent: typeof policy.alertPercent === "number" ? policy.alertPercent : 80,
    criticalPercent: typeof policy.criticalPercent === "number" ? policy.criticalPercent : 90,
    recoveryPercent: typeof policy.recoveryPercent === "number" ? policy.recoveryPercent : 75,
    freshSeconds: typeof policy.freshSeconds === "number" && policy.freshSeconds > 0 ? policy.freshSeconds : 15,
    recoverySeconds: typeof policy.recoverySeconds === "number" && policy.recoverySeconds > 0 ? policy.recoverySeconds : 30
  };
}

function energySampleRecord(row: EnergySampleRow): PlantEnergySnapshot {
  const number = (value: number) => Number(value);
  const net = number(row.grid_import_kw) >= 18 ? PlantEnergyStatus.CRITICAL : number(row.grid_import_kw) >= 16 ? PlantEnergyStatus.ALERT : PlantEnergyStatus.NORMAL;
  return {
    id: row.id,
    plantId: row.plant_id,
    observedAt: iso(row.observed_at)!,
    source: row.source,
    quality: row.quality,
    pvKw: number(row.pv_kw),
    buildingLoadKw: number(row.building_load_kw),
    evLoadKw: number(row.ev_load_kw),
    gridImportKw: number(row.grid_import_kw),
    gridExportKw: number(row.grid_export_kw),
    batteryChargeKw: null,
    batteryDischargeKw: null,
    evWh: number(row.ev_wh),
    gridImportWh: number(row.grid_import_wh),
    gridExportWh: number(row.grid_export_wh),
    solarToEvWh: number(row.solar_to_ev_wh),
    energyStatus: net
  };
}

function hasSolarSurplus(sample: PlantEnergySnapshot | null) {
  return Boolean(sample && sample.quality === "FRESH" && Date.now() - Date.parse(sample.observedAt) <= 15_000
    && sample.energyStatus === PlantEnergyStatus.NORMAL && sample.pvKw - sample.buildingLoadKw >= 7);
}

function insightRecord(row: InsightRow): CommercialInsight {
  const parsed = typeof row.evidence === "string" ? JSON.parse(row.evidence) : row.evidence;
  return {
    id: row.id,
    kind: row.kind,
    type: row.type,
    entityId: row.entity_id,
    sourceEventId: row.source_event_id,
    sampleId: row.sample_id,
    policyVersion: row.policy_version,
    conditionActive: row.condition_active,
    severity: row.severity,
    reasonCode: row.reason_code,
    message: row.message,
    evidence: Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [],
    suggestedAction: row.suggested_action,
    reviewState: row.review_state,
    decidedAt: iso(row.decided_at),
    decidedBy: row.decided_by ?? undefined,
    decisionReason: row.decision_reason ?? undefined,
    createdAt: iso(row.created_at)!,
    updatedAt: iso(row.updated_at)!
  };
}

function idleCharge(quote: CommercialQuote | null, energyEndedAt: Date, disconnectedAt: Date) {
  if (!quote?.idleEnabled) return { minutes: 0, cents: 0, graceEndsAt: null };
  const graceEndsAt = new Date(energyEndedAt.getTime() + quote.idleGraceMinutes * 60_000);
  const overdueMs = disconnectedAt.getTime() - graceEndsAt.getTime();
  const minutes = overdueMs <= 0 ? 0 : Math.min(quote.idleMaxMinutes, Math.ceil(overdueMs / 60_000));
  return { minutes, cents: minutes * quote.idleCentsPerMinute, graceEndsAt };
}

export function hashGuestToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function matchingGuestToken(token: string, hash: string | null) {
  if (!hash) return false;
  const actual = Buffer.from(hashGuestToken(token), "hex");
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function commercialAvailability(chargers: CommercialChargerRecord[]): CommercialAvailability {
  const available = chargers.filter((charger) => charger.physicalStatus === ChargerTechnicalStatus.AVAILABLE && charger.commercialStatus === ChargerCommercialStatus.AVAILABLE_TO_START).length;
  if (chargers.length > 0 && chargers.every((charger) => [ChargerTechnicalStatus.FAULT, ChargerTechnicalStatus.OFFLINE].includes(charger.physicalStatus))) return CommercialAvailability.FAULT;
  if (available === 0) return CommercialAvailability.FULL_QUEUE;
  return available === chargers.length ? CommercialAvailability.OPEN_AVAILABLE : CommercialAvailability.OPEN_PARTIAL;
}

function chargerRecord(row: ChargerRow): CommercialChargerRecord {
  return {
    id: row.id,
    code: row.code,
    establishmentId: row.establishment_id,
    plantId: row.plant_id,
    name: row.name,
    parkingSpot: row.parking_spot ?? undefined,
    nominalPowerKw: Number(row.nominal_power_kw),
    currentPowerKw: Number(row.current_power_kw),
    physicalStatus: row.physical_status as ChargerTechnicalStatus,
    commercialStatus: row.commercial_status as ChargerCommercialStatus,
    published: row.published,
    qrIdentifier: row.qr_identifier,
    currentSessionId: row.current_session_id,
    assignmentId: row.assignment_id,
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
    chargerId: row.charger_id,
    chargerCode: row.charger_code,
    chargerName: row.charger_name,
    parkingSpot: row.parking_spot ?? undefined,
    status: row.status,
    tariffCents: row.tariff_cents,
    actorType: row.actor_type,
    quote: quoteRecord(row.quote),
    authorizedCents: row.authorized_cents,
    energyWh: Math.round(Number(row.energy_wh) * 1000) / 1000,
    costCents: row.cost_cents,
    energyCostCents: row.energy_cost_cents ?? row.cost_cents,
    idleCostCents: row.idle_cost_cents ?? 0,
    totalCostCents: row.total_cost_cents ?? row.cost_cents,
    currentPowerKw: Number(row.current_power_kw),
    startedAt: iso(row.started_at),
    endedAt: iso(row.ended_at),
    energyEndedAt: iso(row.energy_ended_at) ?? null,
    disconnectedAt: iso(row.disconnected_at) ?? null,
    settledAt: iso(row.settled_at) ?? null,
    idleGraceEndsAt: iso(row.idle_grace_ends_at) ?? null,
    endReason: row.end_reason,
    transitionReason: row.transition_reason,
    pendingCommandId: row.pending_command_id,
    createdAt: iso(row.created_at)!,
    updatedAt: iso(row.updated_at)!,
    payment: {
      id: row.payment_id,
      paymentIntentId: row.payment_intent_id ?? undefined,
      method: row.payment_method ?? "CARD",
      status: row.payment_status ?? PaymentStatus.PENDING,
      providerStatus: row.provider_status ?? undefined,
      authorizedCents: row.authorized_cents,
      capturedCents: row.captured_cents ?? 0,
      refundedCents: row.refunded_cents ?? 0,
      pendingOperation: row.pending_operation,
      lastErrorCode: row.last_error_code
    }
  };
}

function queueRecords(rows: QueueRow[]): CommercialQueueRecord[] {
  const positions = new Map<string, number>();
  return rows.map((row) => {
    const position = row.status === QueueStatus.WAITING ? (positions.get(row.establishment_id) ?? 0) + 1 : 0;
    if (position) positions.set(row.establishment_id, position);
    return {
      id: row.id,
      driverId: row.driver_id,
      driverName: row.driver_name,
      driverVehicle: row.driver_vehicle,
      establishmentId: row.establishment_id,
      establishmentName: row.establishment_name,
      status: row.status,
      position,
      chargerId: row.charger_id ?? undefined,
      chargerCode: row.charger_code ?? undefined,
      parkingSpot: row.parking_spot ?? undefined,
      joinedAt: iso(row.joined_at)!,
      calledAt: iso(row.called_at),
      assignmentExpiresAt: iso(row.assignment_expires_at),
      completedAt: iso(row.completed_at),
      sessionId: row.session_id,
      estimatedWaitMinutes: row.estimated_wait_minutes
    };
  });
}

function establishmentRecord(row: EstablishmentRow, chargers: CommercialChargerRecord[], queue: CommercialQueueRecord[]): CommercialEstablishmentRecord {
  const establishmentChargers = chargers.filter((charger) => charger.establishmentId === row.id);
  const activeCount = queue.filter((entry) => entry.establishmentId === row.id && [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.ASSIGNED].includes(entry.status)).length;
  const availability = commercialAvailability(establishmentChargers);
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    tariffCents: row.tariff_cents,
    qrSlug: row.qr_slug,
    plantId: row.plant_id,
    timezone: row.timezone,
    openingHours: openingHours(row.opening_hours),
    published: row.published,
    availableChargerCount: establishmentChargers.filter((charger) => charger.physicalStatus === ChargerTechnicalStatus.AVAILABLE && charger.commercialStatus === ChargerCommercialStatus.AVAILABLE_TO_START).length,
    queueSummary: { establishmentId: row.id, activeCount, registeredCount: activeCount, commercialAvailability: availability },
    chargers: establishmentChargers
  };
}

function publicChargerRecord(charger: CommercialChargerRecord): CommercialPublicChargerRecord {
  const { currentSessionId, assignmentId, ...publicCharger } = charger;
  void currentSessionId;
  void assignmentId;
  return publicCharger;
}

function publicEstablishmentRecord(establishment: CommercialEstablishmentRecord): CommercialPublicEstablishmentRecord {
  return { ...establishment, offerTariffCents: null, favorableEnergyCondition: false, chargers: establishment.chargers.map(publicChargerRecord) };
}

const sessionSelect = `
  select s.*, e.name as establishment_name, c.id as charger_id, c.code as charger_code, c.name as charger_name,
    c.parking_spot, c.current_power_kw, p.id as payment_id, p.payment_intent_id, p.method as payment_method, p.status as payment_status,
    p.provider_status, p.captured_cents, p.refunded_cents, p.pending_operation, p.last_error_code
  from commercial_sessions s
  join commercial_establishments e on e.id = s.establishment_id
  join commercial_chargers c on c.id = s.charger_id
  left join commercial_payments p on p.session_id = s.id`;

const queueSelect = `
  select q.*, e.name as establishment_name, c.code as charger_code, c.parking_spot
  from commercial_queue_entries q
  join commercial_establishments e on e.id = q.establishment_id
  left join commercial_chargers c on c.id = q.charger_id`;

export class CommercialRepository {
  private readonly db: SqlDatabase;
  private readonly ready: Promise<void>;
  private readonly plantTickedAt = new Map<string, number>();
  private readonly demandRecoveredAt = new Map<string, number>();
  private readonly admittedPowerByPlant = new Map<string, number>();

  constructor(dataDir?: string, private readonly goodWeProvider: GoodWeProvider = new MockGoodWeProvider()) {
    const remoteUrl = process.env.CHARGEGRID_DATABASE_URL?.trim();
    this.db = !dataDir && remoteUrl ? postgresDatabase(remoteUrl) : pgliteDatabase(dataDir ?? defaultDataDir);
    this.ready = this.applyMigrations();
  }

  private async applyMigrations() {
    await this.db.exec(`create table if not exists chargegrid_schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )`);
    const appliedRows = await this.db.query<{ name: string }>("select name from chargegrid_schema_migrations");
    const applied = new Set(appliedRows.rows.map((row) => row.name));
    if (applied.size === 0) {
      const legacy = await this.db.query<{ exists: boolean }>(`select exists (
        select 1 from information_schema.tables where table_schema = 'public' and table_name = 'commercial_establishments'
      ) as exists`);
      if (legacy.rows[0]?.exists) {
        for (const name of legacyMigrationNames) {
          await this.db.query("insert into chargegrid_schema_migrations (name) values ($1) on conflict (name) do nothing", [name]);
          applied.add(name);
        }
      }
    }
    for (const migration of migrations) {
      if (applied.has(migration.name)) continue;
      await this.db.exec(await readFile(migration.url, "utf8"));
      await this.db.query("insert into chargegrid_schema_migrations (name) values ($1) on conflict (name) do nothing", [migration.name]);
    }
  }

  async close() {
    try {
      await this.ready;
    } finally {
      await this.db.close();
    }
  }

  async createQuote(input: { chargerId: string; establishmentId: string; access: CommercialSessionAccess }) {
    await this.ready;
    return this.db.transaction(async (tx) => {
      const charger = await tx.query<{ id: string; establishment_id: string; plant_id: string | null; commercial_status: string; physical_status: string }>(`
        select id, establishment_id, plant_id, commercial_status, physical_status from commercial_chargers
        where id = $1 and establishment_id = $2 and published = true`, [input.chargerId, input.establishmentId]);
      const selected = charger.rows[0];
      if (!selected) throw new CommercialNotFoundError("Carregador comercial não encontrado.");
      const assignment = "driverId" in input.access ? await tx.query<{ id: string }>(`select id from commercial_queue_entries
        where driver_id = $1 and charger_id = $2 and status = 'CALLED' and assignment_expires_at > now()`, [input.access.driverId, selected.id]) : { rows: [] };
      if ((selected.physical_status !== "AVAILABLE" || selected.commercial_status !== "AVAILABLE_TO_START") && !assignment.rows[0]) {
        throw new CommercialConflictError("Este carregador não está disponível para iniciar.");
      }
      const tariff = await tx.query<{ id: string; energy_cents_per_kwh: number; idle_grace_minutes: number; idle_cents_per_minute: number; idle_max_minutes: number; idle_enabled: boolean }>(`
        select id, energy_cents_per_kwh, idle_grace_minutes, idle_cents_per_minute, idle_max_minutes, idle_enabled
        from commercial_tariff_versions where establishment_id = $1
        order by valid_from desc, created_at desc limit 1`, [input.establishmentId]);
      const currentTariff = tariff.rows[0];
      if (!currentTariff) throw new CommercialNotFoundError("Tarifa comercial não encontrada.");
      const sample = selected.plant_id ? await tx.query<EnergySampleRow>("select * from commercial_energy_samples where plant_id = $1 order by observed_at desc limit 1", [selected.plant_id]) : { rows: [] as EnergySampleRow[] };
      const latest = sample.rows[0] ? energySampleRecord(sample.rows[0]) : null;
      const solarOffer = hasSolarSurplus(latest);
      const energyCentsPerKwh = solarOffer ? Math.min(currentTariff.energy_cents_per_kwh, 170) : currentTariff.energy_cents_per_kwh;
      const id = randomUUID();
      const expiresAt = new Date(Date.now() + 5 * 60_000).toISOString();
      await tx.query(`insert into commercial_quotes
        (id, charger_id, establishment_id, tariff_version_id, policy_version, energy_cents_per_kwh, idle_grace_minutes, idle_cents_per_minute, idle_max_minutes, idle_enabled, expires_at, reason_code, energy_sample_id, driver_id, guest_token_hash)
        values ($1, $2, $3, $4, 's4-quote-v1', $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`, [
        id, selected.id, selected.establishment_id, currentTariff.id, energyCentsPerKwh,
        currentTariff.idle_grace_minutes, currentTariff.idle_cents_per_minute, currentTariff.idle_max_minutes,
        currentTariff.idle_enabled, expiresAt, solarOffer ? "SOLAR_SURPLUS" : "BASE_TARIFF", latest?.id ?? null,
        "driverId" in input.access ? input.access.driverId : null, "guestToken" in input.access ? hashGuestToken(input.access.guestToken) : null
      ]);
      const quote = await tx.query<QuoteRow>("select * from commercial_quotes where id = $1", [id]);
      return quoteFromRow(quote.rows[0]!);
    });
  }

  async publishTariff(input: { establishmentId: string; energyCentsPerKwh: number; idleCentsPerMinute: number; reason: string }) {
    await this.ready;
    if (!Number.isInteger(input.energyCentsPerKwh) || input.energyCentsPerKwh < 1 || !Number.isInteger(input.idleCentsPerMinute) || input.idleCentsPerMinute < 0 || input.reason.trim().length < 8) {
      throw new CommercialConflictError("Informe tarifa, ociosidade e motivo válidos.");
    }
    return this.db.transaction(async (tx) => {
      const establishment = await tx.query<{ id: string }>("select id from commercial_establishments where id = $1", [input.establishmentId]);
      if (!establishment.rows[0]) throw new CommercialNotFoundError("Estabelecimento comercial não encontrado.");
      const id = `tariff_${randomUUID()}`;
      await tx.query(`insert into commercial_tariff_versions
        (id, establishment_id, energy_cents_per_kwh, idle_grace_minutes, idle_cents_per_minute, idle_max_minutes, idle_enabled, reason)
        values ($1, $2, $3, 15, $4, 60, true, $5)`, [id, input.establishmentId, input.energyCentsPerKwh, input.idleCentsPerMinute, input.reason.trim()]);
      await tx.query("update commercial_establishments set tariff_cents = $2 where id = $1", [input.establishmentId, input.energyCentsPerKwh]);
      const tariff = await tx.query<TariffVersionRow>("select * from commercial_tariff_versions where id = $1", [id]);
      return tariffVersionRecord(tariff.rows[0]!);
    });
  }

  async reserveQuotedSession(input: {
    id: string;
    quoteId: string;
    access: CommercialSessionAccess;
    method: "CARD" | "PIX";
    authorizedCents: number;
    driverName?: string;
    driverEmail?: string;
  }) {
    await this.ready;
    await this.db.transaction(async (tx) => {
      const existing = await tx.query<{ quote_id: string | null; driver_id: string | null; guest_token_hash: string | null; authorized_cents: number; method: "CARD" | "PIX" }>(
        "select s.quote_id, s.driver_id, s.guest_token_hash, s.authorized_cents, p.method from commercial_sessions s join commercial_payments p on p.session_id = s.id where s.id = $1", [input.id]);
      if (existing.rows[0]) {
        const current = existing.rows[0];
        const owned = "driverId" in input.access
          ? current.driver_id === input.access.driverId
          : matchingGuestToken(input.access.guestToken, current.guest_token_hash);
        if (current.quote_id !== input.quoteId || !owned || current.authorized_cents !== input.authorizedCents || current.method !== input.method) throw new CommercialConflictError("A sessão já pertence a outra tentativa de pagamento.");
        return;
      }
      const quote = await tx.query<QuoteRow>("select * from commercial_quotes where id = $1 and expires_at > now()", [input.quoteId]);
      const selectedQuote = quote.rows[0];
      const owned = selectedQuote && ("driverId" in input.access
        ? selectedQuote.driver_id === input.access.driverId
        : matchingGuestToken(input.access.guestToken, selectedQuote.guest_token_hash));
      if (!selectedQuote || !owned) throw new CommercialNotFoundError("Cotação comercial não encontrada.");
      const charger = await tx.query<{ id: string; commercial_status: string; physical_status: string }>(
        "select id, commercial_status, physical_status from commercial_chargers where id = $1 and establishment_id = $2 and published = true", [selectedQuote.charger_id, selectedQuote.establishment_id]);
      const selected = charger.rows[0];
      if (!selected) throw new CommercialNotFoundError("Carregador comercial não encontrado.");
      const assignment = "driverId" in input.access ? await tx.query<{ id: string }>(`select id from commercial_queue_entries
        where driver_id = $1 and charger_id = $2 and status = 'CALLED' and assignment_expires_at > now()`, [input.access.driverId, selected.id]) : { rows: [] };
      if ((selected.physical_status !== "AVAILABLE" || selected.commercial_status !== "AVAILABLE_TO_START") && !assignment.rows.length) {
        throw new CommercialConflictError("Este carregador não está disponível para iniciar.");
      }
      const actorType = "driverId" in input.access ? "DRIVER" : "GUEST";
      const quoteSnapshot = JSON.stringify(quoteFromRow(selectedQuote));
      await tx.query(`insert into commercial_sessions
        (id, public_code, driver_id, driver_name, driver_email, establishment_id, charger_id, status, tariff_cents, authorized_cents, actor_type, quote_id, quote, policy_version, guest_token_hash, idle_enabled)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14, $15, $16)`, [
        input.id, `CG-${input.id.replace(/-/g, "").slice(0, 12).toUpperCase()}`,
        "driverId" in input.access ? input.access.driverId : null,
        input.driverName?.trim() || "Visitante", input.driverEmail ?? null,
        selectedQuote.establishment_id, selected.id, CommercialSessionStatus.AWAITING_PAYMENT,
        selectedQuote.energy_cents_per_kwh, input.authorizedCents, actorType, selectedQuote.id, quoteSnapshot,
        selectedQuote.policy_version, "guestToken" in input.access ? selectedQuote.guest_token_hash : null, selectedQuote.idle_enabled
      ]);
      await tx.query(`insert into commercial_payments
        (id, session_id, method, status, authorized_cents) values ($1, $2, $3, $4, $5)`, [
        randomUUID(), input.id, input.method, PaymentStatus.PENDING, input.authorizedCents
      ]);
      await tx.query("update commercial_chargers set commercial_status = 'OCCUPIED', current_session_id = $2, assignment_id = null, updated_at = now() where id = $1", [selected.id, input.id]);
      if (assignment.rows[0]) await tx.query("update commercial_queue_entries set status = 'ASSIGNED', session_id = $2, updated_at = now() where id = $1", [assignment.rows[0].id, input.id]);
    });
    return this.session(input.id);
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
      const assignment = input.driverId ? await tx.query<{ id: string }>(`select id from commercial_queue_entries
        where driver_id = $1 and charger_id = $2 and status = 'CALLED' and assignment_expires_at > now()`, [input.driverId, selected.id]) : { rows: [] };
      if (selected.commercial_status !== "AVAILABLE_TO_START" && !assignment.rows.length) throw new CommercialConflictError("Este carregador não está disponível para iniciar.");
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
      await tx.query("update commercial_chargers set commercial_status = 'OCCUPIED', current_session_id = $2, assignment_id = null, updated_at = now() where id = $1", [selected.id, input.id]);
      if (assignment.rows[0]) await tx.query("update commercial_queue_entries set status = 'ASSIGNED', updated_at = now() where id = $1", [assignment.rows[0].id]);
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
      await tx.query("update commercial_chargers set commercial_status = 'AVAILABLE_TO_START', current_session_id = null, updated_at = now() where id = (select charger_id from commercial_sessions where id = $1) and current_session_id = $1", [sessionId]);
    });
  }

  private async startWhenReady(chargerCode: string, powerKw?: number) {
    const ready = await this.db.query<{ id: string; plant_id: string | null; nominal_power_kw: number }>(`select s.id, c.plant_id, c.nominal_power_kw from commercial_sessions s
      join commercial_chargers c on c.id = s.charger_id
      where c.code = $1 and c.physical_status = 'CONNECTED' and s.status in ('WAITING_START', 'SUSPENDED_BY_DEMAND') and c.current_session_id = s.id`, [chargerCode]);
    if (!ready.rows[0]) return false;
    const candidate = ready.rows[0];
    if (candidate.plant_id) {
      const plant = await this.db.query<PlantRow>("select id, establishment_id, provider_config, energy_policy from commercial_plants where id = $1", [candidate.plant_id]);
      const policy = plant.rows[0] && energyPolicy(plant.rows[0].energy_policy);
      const snapshot = await this.plantEnergy(candidate.plant_id);
      const ageMs = snapshot ? Math.max(0, Date.now() - Date.parse(snapshot.observedAt)) : Number.POSITIVE_INFINITY;
      const projectedImportKw = snapshot ? snapshot.gridImportKw + (this.admittedPowerByPlant.get(candidate.plant_id) ?? 0) + (powerKw ?? Number(candidate.nominal_power_kw)) : null;
      if (policy?.demandControlEnabled && (!snapshot || snapshot.quality !== "FRESH" || ageMs > policy.freshSeconds * 1000 || projectedImportKw === null || projectedImportKw >= policy.limitKw * policy.criticalPercent / 100)) {
        await this.db.query("update commercial_sessions set transition_reason = $2, updated_at = now() where id = $1", [candidate.id, !snapshot || snapshot.quality !== "FRESH" || ageMs > policy.freshSeconds * 1000 ? "TELEMETRY_UNAVAILABLE" : "RESTRICTED_BY_ENERGY"]);
        return false;
      }
      this.admittedPowerByPlant.set(candidate.plant_id, (this.admittedPowerByPlant.get(candidate.plant_id) ?? 0) + (powerKw ?? Number(candidate.nominal_power_kw)));
    }
    const command = await this.goodWeProvider.startCharge(chargerCode);
    if (command.status !== "SUCCESS") {
      if (candidate.plant_id) this.admittedPowerByPlant.set(candidate.plant_id, Math.max(0, (this.admittedPowerByPlant.get(candidate.plant_id) ?? 0) - (powerKw ?? Number(candidate.nominal_power_kw))));
      return false;
    }
    await this.hardwareEvent(chargerCode, "START", powerKw);
    return true;
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
        await tx.query("update commercial_chargers set commercial_status = 'AVAILABLE_TO_START', current_session_id = null, updated_at = now() where id = (select charger_id from commercial_sessions where id = $1) and current_session_id = $1", [sessionId]);
      }
    });
    const session = await this.session(sessionId);
    if (session.status === CommercialSessionStatus.WAITING_START) await this.startWhenReady(session.chargerCode);
    return this.session(sessionId);
  }

  async queueForDriver(driverId: string) {
    const entries = await this.queueSnapshot();
    return entries.find((entry) => entry.driverId === driverId && [QueueStatus.WAITING, QueueStatus.CALLED, QueueStatus.ASSIGNED].includes(entry.status)) ?? null;
  }

  async joinQueue(input: { driverId: string; driverName: string; driverVehicle: string; establishmentId: string }) {
    await this.ready;
    const existing = await this.queueForDriver(input.driverId);
    if (existing) return existing;
    await this.db.transaction(async (tx) => {
      const establishment = await tx.query<{ id: string }>("select id from commercial_establishments where id = $1 and published = true", [input.establishmentId]);
      if (!establishment.rows[0]) throw new CommercialNotFoundError("Estabelecimento comercial não encontrado.");
      const available = await tx.query<{ id: string }>(`select id from commercial_chargers
        where establishment_id = $1 and published = true and physical_status = 'AVAILABLE' and commercial_status = 'AVAILABLE_TO_START' limit 1`, [input.establishmentId]);
      if (available.rows[0]) throw new CommercialConflictError("Há carregador disponível; escolha uma vaga antes de entrar na fila.");
      await tx.query(`insert into commercial_queue_entries
        (id, driver_id, driver_name, driver_vehicle, establishment_id, status)
        values ($1, $2, $3, $4, $5, 'WAITING')`, [randomUUID(), input.driverId, input.driverName.trim(), input.driverVehicle.trim(), input.establishmentId]);
    });
    return (await this.queueForDriver(input.driverId))!;
  }

  async leaveQueue(id: string, driverId: string) {
    await this.ready;
    const result = await this.db.query<{ id: string; establishment_id: string; charger_id?: string }>(`update commercial_queue_entries set status = 'LEFT', completed_at = now(), updated_at = now()
      where id = $1 and driver_id = $2 and status in ('WAITING', 'CALLED', 'ASSIGNED') returning id, establishment_id, charger_id`, [id, driverId]);
    if (!result.rows[0]) throw new CommercialNotFoundError("Entrada ativa da fila não encontrada.");
    const entry = result.rows[0];
    if (entry.charger_id) {
      await this.db.query(`update commercial_chargers set commercial_status = 'AVAILABLE_TO_START', assignment_id = null, updated_at = now()
        where id = $1 and physical_status = 'AVAILABLE' and not exists (
          select 1 from commercial_sessions where charger_id = $1 and status not in ('COMPLETED', 'PAYMENT_FAILED', 'START_FAILED', 'FAULTED', 'CANCELLED')
        )`, [entry.charger_id]);
      await this.processQueue(entry.establishment_id);
    }
  }

  async processQueue(establishmentId: string) {
    await this.ready;
    await this.db.transaction(async (tx) => {
      const charger = await tx.query<{ id: string }>(`select id from commercial_chargers
        where establishment_id = $1 and published = true and physical_status = 'AVAILABLE' and commercial_status = 'AVAILABLE_TO_START'
        order by code limit 1`, [establishmentId]);
      const entry = await tx.query<{ id: string }>(`select id from commercial_queue_entries
        where establishment_id = $1 and status = 'WAITING' order by joined_at limit 1`, [establishmentId]);
      if (!charger.rows[0] || !entry.rows[0]) return;
      await tx.query(`update commercial_queue_entries set status = 'CALLED', charger_id = $2, called_at = now(),
        assignment_expires_at = now() + interval '10 minutes', updated_at = now() where id = $1`, [entry.rows[0].id, charger.rows[0].id]);
      await tx.query("update commercial_chargers set commercial_status = 'OCCUPIED', assignment_id = $2, updated_at = now() where id = $1", [charger.rows[0].id, entry.rows[0].id]);
    });
  }

  async queueSnapshot(establishmentId?: string) {
    await this.ready;
    const result = await this.db.query<QueueRow>(`${queueSelect} ${establishmentId ? "where q.establishment_id = $1" : ""}
      order by q.joined_at`, establishmentId ? [establishmentId] : []);
    return queueRecords(result.rows);
  }

  async expireQueueAssignments(now = new Date()) {
    await this.ready;
    const expired = await this.db.transaction(async (tx) => {
      const entries = await tx.query<{ establishment_id: string; charger_id: string | null }>(`update commercial_queue_entries
        set status = 'EXPIRED', completed_at = $1, updated_at = now()
        where status = 'CALLED' and assignment_expires_at <= $1
        returning establishment_id, charger_id`, [now.toISOString()]);
      for (const entry of entries.rows) {
        if (!entry.charger_id) continue;
        await tx.query("update commercial_chargers set commercial_status = 'AVAILABLE_TO_START', assignment_id = null, updated_at = now() where id = $1 and physical_status = 'AVAILABLE' and current_session_id is null", [entry.charger_id]);
      }
      return [...new Set(entries.rows.map((entry) => entry.establishment_id))];
    });
    for (const establishmentId of expired) await this.processQueue(establishmentId);
  }

  async configurePlantTelemetry(input: { plantId: string; online: boolean; pvKw: number; buildingLoadKw: number }) {
    await this.ready;
    if (![input.pvKw, input.buildingLoadKw].every((value) => Number.isFinite(value) && value >= 0)) throw new CommercialConflictError("Os sinais simulados da planta devem ser números não negativos.");
    const result = await this.db.query<PlantRow>("select id, establishment_id, provider_config, energy_policy from commercial_plants where id = $1", [input.plantId]);
    const plant = result.rows[0];
    if (!plant) throw new CommercialNotFoundError("Planta comercial não encontrada.");
    const policy = { ...energyPolicy(plant.energy_policy), demandControlEnabled: input.online || energyPolicy(plant.energy_policy).demandControlEnabled };
    await this.db.query("update commercial_plants set provider_config = $2::jsonb, energy_policy = $3::jsonb, updated_at = now() where id = $1", [input.plantId, JSON.stringify(input), JSON.stringify(policy)]);
    this.plantTickedAt.delete(input.plantId);
    return this.plantEnergy(input.plantId);
  }

  async configurePlantScenario(input: { plantId: string; scenarioId: LabScenarioId; seed: number; now?: Date }) {
    await this.ready;
    if (!LAB_SCENARIOS.includes(input.scenarioId) || !Number.isInteger(input.seed) || input.seed < 0) throw new CommercialConflictError("Cenário ou seed de laboratório inválido.");
    const result = await this.db.query<PlantRow>("select id, establishment_id, provider_config from commercial_plants where id = $1", [input.plantId]);
    const plant = result.rows[0];
    if (!plant) throw new CommercialNotFoundError("Planta comercial não encontrada.");
    const now = input.now ?? new Date();
    const current = providerConfig(plant.provider_config);
    if (current.simulation?.scenarioId === input.scenarioId && current.simulation.seed === input.seed) return current.simulation;
    const profile: PlantSimulationProfile = { scenarioId: input.scenarioId, version: 1, seed: input.seed, stepSeconds: 60, appliedAt: now.toISOString() };
    const signals = signalsForScenario(profile, now);
    await this.db.query("update commercial_plants set provider_config = $2::jsonb, updated_at = now() where id = $1", [input.plantId, JSON.stringify({ ...signals, simulation: profile })]);
    this.plantTickedAt.delete(input.plantId);

    if (signals.online) {
      for (let index = -96; index < 0; index += 1) {
        const observedAt = new Date(now.getTime() + index * profile.stepSeconds * 1000);
        const historical = historicalSignals(profile, index);
        const gridImportKw = Math.max(0, historical.buildingLoadKw - historical.pvKw);
        const gridExportKw = Math.max(0, historical.pvKw - historical.buildingLoadKw);
        await this.db.query(`insert into commercial_energy_samples (
          id, plant_id, observed_at, source, quality, pv_kw, building_load_kw, ev_load_kw, grid_import_kw, grid_export_kw,
          ev_wh, grid_import_wh, grid_export_wh, solar_to_ev_wh
        ) values ($1, $2, $3, 'SIMULATED', 'FRESH', $4, $5, 0, $6, $7, 0, $8, $9, 0)
        on conflict (plant_id, observed_at) do nothing`, [
          randomUUID(), input.plantId, observedAt.toISOString(), historical.pvKw, historical.buildingLoadKw,
          gridImportKw, gridExportKw, gridImportKw * profile.stepSeconds / 3.6, gridExportKw * profile.stepSeconds / 3.6
        ]);
      }
    }
    return profile;
  }

  async plantEnergy(plantId: string): Promise<PlantEnergySnapshot | null> {
    await this.ready;
    const plant = await this.db.query<PlantRow>("select id, establishment_id, provider_config from commercial_plants where id = $1", [plantId]);
    if (!plant.rows[0]) throw new CommercialNotFoundError("Planta comercial não encontrada.");
    const last = await this.db.query<EnergySampleRow>("select * from commercial_energy_samples where plant_id = $1 order by observed_at desc limit 1", [plantId]);
    const config = providerConfig(plant.rows[0].provider_config);
    if (!config.online) return last.rows[0] ? { ...energySampleRecord(last.rows[0]), quality: "STALE" } : null;
    return last.rows[0] ? energySampleRecord(last.rows[0]) : null;
  }

  async plantEnergySeries(plantId: string) {
    await this.ready;
    const rows = await this.db.query<EnergySampleRow>("select * from commercial_energy_samples where plant_id = $1 order by observed_at desc limit 3600", [plantId]);
    return rows.rows.reverse().map(energySampleRecord);
  }

  async plantEnergyView(plantId: string): Promise<CommercialEnergyView> {
    await this.ready;
    const rows = await this.db.query<PlantRow>("select id, establishment_id, provider_config, energy_policy, updated_at from commercial_plants where id = $1", [plantId]);
    const plant = rows.rows[0];
    if (!plant) throw new CommercialNotFoundError("Planta comercial não encontrada.");
    const policy = energyPolicy(plant.energy_policy);
    const snapshot = await this.plantEnergy(plantId);
    const available = await this.db.query<{ nominal_power_kw: number }>(`select nominal_power_kw from commercial_chargers
      where plant_id = $1 and published = true and physical_status = 'AVAILABLE' and commercial_status = 'AVAILABLE_TO_START'
      order by code limit 1`, [plantId]);
    const candidates = await this.db.query<{ id: string }>(`select s.id from commercial_sessions s join commercial_chargers c on c.id = s.charger_id
      where c.plant_id = $1 and s.status in ('CHARGING', 'SUSPENDED_BY_DEMAND')
      order by case when s.actor_type = 'GUEST' then 0 else 1 end, s.started_at desc, s.id desc`, [plantId]);
    const ageMs = snapshot ? Math.max(0, Date.now() - Date.parse(snapshot.observedAt)) : Number.POSITIVE_INFINITY;
    const quality = !snapshot ? "UNKNOWN" as const : snapshot.quality !== "FRESH" || ageMs > policy.freshSeconds * 1000 ? "STALE" as const : "FRESH" as const;
    const utilization = snapshot ? snapshot.gridImportKw / policy.limitKw * 100 : null;
    const state = utilization === null ? null : utilization >= policy.criticalPercent ? "CRITICAL" as const : utilization >= policy.alertPercent ? "ALERT" as const : "NORMAL" as const;
    const projectedImportKw = snapshot && available.rows[0] ? snapshot.gridImportKw + Number(available.rows[0].nominal_power_kw) : null;
    const projectedCritical = projectedImportKw !== null && projectedImportKw >= policy.limitKw * policy.criticalPercent / 100;
    const canAdmit = !policy.demandControlEnabled || quality === "FRESH" && state === "NORMAL" && !projectedCritical;
    const reasonCode = !policy.demandControlEnabled
      ? "ENERGY_POLICY_DISABLED" as const
      : quality !== "FRESH"
        ? "TELEMETRY_UNAVAILABLE" as const
        : state !== "NORMAL"
          ? "DEMAND_ALERT" as const
          : projectedCritical
            ? "PROJECTED_LIMIT" as const
            : "ADMISSION_ALLOWED" as const;
    return {
      snapshot,
      policy: {
        id: `${plantId}:demand`, plantId, version: "demand-v1", demandControlEnabled: policy.demandControlEnabled,
        limitKw: policy.limitKw, alertPercent: policy.alertPercent, criticalPercent: policy.criticalPercent,
        recoveryPercent: policy.recoveryPercent, recoveryStableSeconds: policy.recoverySeconds,
        freshSeconds: policy.freshSeconds, updatedAt: iso(plant.updated_at ?? null) ?? new Date().toISOString()
      },
      decision: {
        plantId, policyVersion: "demand-v1", sampleId: snapshot?.id ?? null, state, quality,
        enabled: policy.demandControlEnabled, canAdmit, reasonCode, projectedImportKw,
        candidateSessionIds: candidates.rows.map((item) => item.id), observedAt: snapshot?.observedAt ?? new Date().toISOString()
      },
      simulation: providerConfig(plant.provider_config).simulation
    };
  }

  async advancePlantTelemetry(now = new Date()) {
    await this.ready;
    const plants = await this.db.query<PlantRow>("select id, establishment_id, provider_config from commercial_plants");
    for (const plant of plants.rows) {
      const config = providerConfig(plant.provider_config);
      const signals = config.simulation ? signalsForScenario(config.simulation, now) : config;
      const telemetry = await this.goodWeProvider.getPlantTelemetry(plant.id, signals);
      if (!telemetry) {
        this.plantTickedAt.delete(plant.id);
        continue;
      }
      const loads = await this.db.query<{ ev_load_kw: number }>("select coalesce(sum(current_power_kw), 0) as ev_load_kw from commercial_chargers where plant_id = $1 and physical_status = 'CHARGING'", [plant.id]);
      const evLoadKw = Number(loads.rows[0]?.ev_load_kw ?? 0);
      const pvKw = telemetry.pvKw;
      const buildingLoadKw = telemetry.buildingLoadKw;
      const gridImportKw = Math.max(0, buildingLoadKw + evLoadKw - pvKw);
      const gridExportKw = Math.max(0, pvKw - buildingLoadKw - evLoadKw);
      const previous = this.plantTickedAt.get(plant.id);
      const elapsedMs = previous === undefined ? 0 : Math.max(0, now.getTime() - previous);
      this.plantTickedAt.set(plant.id, now.getTime());
      const wh = (kw: number) => kw * elapsedMs / 3600;
      await this.db.query(`insert into commercial_energy_samples (
        id, plant_id, observed_at, source, quality, pv_kw, building_load_kw, ev_load_kw, grid_import_kw, grid_export_kw,
        ev_wh, grid_import_wh, grid_export_wh, solar_to_ev_wh
      ) values ($1, $2, $3, 'SIMULATED', 'FRESH', $4, $5, $6, $7, $8, $9, $10, $11, $12)
      on conflict (plant_id, observed_at) do nothing`, [
        randomUUID(), plant.id, now.toISOString(), pvKw, buildingLoadKw, evLoadKw, gridImportKw, gridExportKw,
        wh(evLoadKw), wh(gridImportKw), wh(gridExportKw), wh(Math.min(evLoadKw, Math.max(0, pvKw - buildingLoadKw)))
      ]);
      this.admittedPowerByPlant.set(plant.id, 0);
      await this.enforceDemandPolicy(plant.id, now);
    }
  }

  private async enforceDemandPolicy(plantId: string, now: Date) {
    const plant = await this.db.query<PlantRow>("select id, establishment_id, provider_config, energy_policy from commercial_plants where id = $1", [plantId]);
    const policy = plant.rows[0] && energyPolicy(plant.rows[0].energy_policy);
    const snapshot = await this.plantEnergy(plantId);
    if (!policy?.demandControlEnabled || !snapshot || snapshot.quality !== "FRESH") return;
    const criticalKw = policy.limitKw * policy.criticalPercent / 100;
    const recoveryKw = policy.limitKw * policy.recoveryPercent / 100;
    if (snapshot.gridImportKw >= criticalKw) {
      this.demandRecoveredAt.delete(plantId);
      const candidate = await this.db.query<{ id: string; charger_code: string }>(`${sessionSelect}
        where c.plant_id = $1 and s.status = 'CHARGING'
        order by case when s.actor_type = 'GUEST' then 0 else 1 end, s.started_at desc, s.id desc limit 1`, [plantId]);
      const session = candidate.rows[0];
      if (!session) return;
      const command = await this.goodWeProvider.stopCharge(session.charger_code);
      if (command.status !== "SUCCESS") return;
      await this.db.transaction(async (tx) => {
        await tx.query("update commercial_sessions set status = 'SUSPENDED_BY_DEMAND', transition_reason = 'DEMAND_CRITICAL', last_energy_at = null, updated_at = now() where id = $1 and status = 'CHARGING'", [session.id]);
        await tx.query("update commercial_chargers set physical_status = 'CONNECTED', current_power_kw = 0, updated_at = now() where code = $1", [session.charger_code]);
      });
      return;
    }
    if (snapshot.gridImportKw >= recoveryKw) {
      this.demandRecoveredAt.delete(plantId);
      return;
    }
    const stableSince = this.demandRecoveredAt.get(plantId) ?? now.getTime();
    this.demandRecoveredAt.set(plantId, stableSince);
    if (now.getTime() - stableSince < policy.recoverySeconds * 1000) return;
    const suspended = await this.db.query<{ charger_code: string }>(`${sessionSelect}
      where c.plant_id = $1 and c.physical_status = 'CONNECTED' and s.status = 'SUSPENDED_BY_DEMAND'
      order by s.started_at asc, s.id asc limit 1`, [plantId]);
    if (suspended.rows[0]) await this.startWhenReady(suspended.rows[0].charger_code);
    const waiting = await this.db.query<{ charger_code: string }>(`${sessionSelect}
      where c.plant_id = $1 and c.physical_status = 'CONNECTED' and s.status = 'WAITING_START'
      order by s.created_at asc, s.id asc`, [plantId]);
    for (const candidate of waiting.rows) await this.startWhenReady(candidate.charger_code);
  }

  async advanceEnergy(now = new Date()) {
    await this.ready;
    const charging = await this.db.query<SessionRow & { charger_id: string }>(`${sessionSelect}
      where s.status = 'CHARGING' and c.current_power_kw > 0`);
    for (const row of charging.rows) {
      const since = row.last_energy_at ? new Date(row.last_energy_at).getTime() : now.getTime();
      const measuredEnergyWh = Number(row.energy_wh) + Number(row.current_power_kw) * Math.max(0, now.getTime() - since) / 3600;
      const energyWh = row.tariff_cents > 0 ? Math.min(measuredEnergyWh, row.authorized_cents * 1000 / row.tariff_cents) : measuredEnergyWh;
      const costCents = Math.min(row.authorized_cents, Math.round(energyWh * row.tariff_cents / 1000));
      const finished = measuredEnergyWh > energyWh || costCents >= row.authorized_cents;
      const idle = idleCharge(quoteRecord(row.quote), now, now);
      await this.db.transaction(async (tx) => {
        await tx.query(`update commercial_sessions set energy_wh = $2, cost_cents = $3,
          energy_cost_cents = $3, total_cost_cents = $3, last_energy_at = $4,
          status = case when $5 then 'ENERGY_FINISHED' else status end,
          energy_ended_at = case when $5 then coalesce(energy_ended_at, $4) else energy_ended_at end,
          idle_grace_ends_at = case when $5 and $6 then coalesce(idle_grace_ends_at, $7) else idle_grace_ends_at end,
          updated_at = now() where id = $1 and status = 'CHARGING'`, [row.id, energyWh, costCents, now.toISOString(), finished, idle.graceEndsAt !== null, idle.graceEndsAt?.toISOString() ?? null]);
        if (finished) await tx.query("update commercial_chargers set physical_status = 'CONNECTED', current_power_kw = 0, updated_at = now() where id = $1", [row.charger_id]);
      });
    }
    await this.expireQueueAssignments(now);
  }

  async hardwareEvent(chargerCode: string, action: "CONNECT" | "DISCONNECT" | "START" | "STOP" | "OFFLINE" | "FAULT" | "RECOVER", powerKw?: number): Promise<CommercialSnapshot> {
    await this.ready;
    if (["STOP", "DISCONNECT", "OFFLINE", "FAULT"].includes(action)) await this.advanceEnergy();
    let startAutomatically = false;
    await this.db.transaction(async (tx) => {
      const chargerResult = await tx.query<ChargerRow>("select * from commercial_chargers where code = $1 and published = true", [chargerCode]);
      const charger = chargerResult.rows[0];
      if (!charger) throw new CommercialNotFoundError("Carregador comercial não encontrado.");
      const sessionResult = await tx.query<{ id: string; status: CommercialSessionStatus; quote: CommercialQuote | string | null; energy_ended_at: Date | string | null; energy_cost_cents: number | null; authorized_cents: number }>(`select id, status, quote, energy_ended_at, energy_cost_cents, authorized_cents from commercial_sessions
        where charger_id = $1 and status not in ('COMPLETED', 'PAYMENT_FAILED', 'START_FAILED', 'FAULTED', 'CANCELLED')
        order by created_at desc limit 1`, [charger.id]);
      const session = sessionResult.rows[0];
      if (action === "CONNECT") {
        if (!["AVAILABLE", "CONNECTED"].includes(charger.physical_status)) throw new CommercialConflictError("O equipamento não pode ser conectado neste estado.");
        await tx.query("update commercial_chargers set physical_status = 'CONNECTED', commercial_status = 'OCCUPIED', current_power_kw = 0, updated_at = now() where id = $1", [charger.id]);
        startAutomatically = session?.status === CommercialSessionStatus.WAITING_START;
      } else if (action === "START") {
        if (!session || ![CommercialSessionStatus.WAITING_START, CommercialSessionStatus.SUSPENDED_BY_DEMAND].includes(session.status) || charger.physical_status !== "CONNECTED") throw new CommercialConflictError("Conecte o veículo de uma sessão autorizada antes de iniciar a energia.");
        const selectedPower = Math.min(Number(charger.nominal_power_kw), powerKw ?? Number(charger.nominal_power_kw));
        if (!Number.isFinite(selectedPower) || selectedPower <= 0) throw new CommercialConflictError("Informe uma potência simulada válida.");
        await tx.query("update commercial_chargers set physical_status = 'CHARGING', current_power_kw = $2, updated_at = now() where id = $1", [charger.id, selectedPower]);
        await tx.query("update commercial_sessions set status = 'CHARGING', started_at = coalesce(started_at, now()), last_energy_at = now(), updated_at = now() where id = $1", [session.id]);
        await tx.query("update commercial_queue_entries set status = 'COMPLETED', completed_at = now(), updated_at = now() where session_id = $1 and status = 'ASSIGNED'", [session.id]);
      } else if (action === "STOP") {
        if (!session || session.status !== CommercialSessionStatus.CHARGING) throw new CommercialConflictError("Não existe recarga ativa neste equipamento.");
        const endedAt = new Date();
        const idle = idleCharge(quoteRecord(session.quote), endedAt, endedAt);
        await tx.query(`update commercial_sessions set status = 'ENERGY_FINISHED', last_energy_at = null,
          energy_ended_at = coalesce(energy_ended_at, $2), idle_grace_ends_at = case when $3 then coalesce(idle_grace_ends_at, $4) else idle_grace_ends_at end,
          energy_cost_cents = coalesce(energy_cost_cents, cost_cents), total_cost_cents = coalesce(total_cost_cents, cost_cents), updated_at = now() where id = $1`, [session.id, endedAt.toISOString(), idle.graceEndsAt !== null, idle.graceEndsAt?.toISOString() ?? null]);
        await tx.query("update commercial_chargers set physical_status = 'CONNECTED', current_power_kw = 0, updated_at = now() where id = $1", [charger.id]);
      } else if (action === "DISCONNECT") {
        if (session?.status === CommercialSessionStatus.CHARGING) throw new CommercialConflictError("Interrompa a energia antes de desconectar o veículo.");
        if (session?.status === CommercialSessionStatus.ENERGY_FINISHED) {
          const disconnectedAt = new Date();
          const idle = idleCharge(quoteRecord(session.quote), session.energy_ended_at ? new Date(session.energy_ended_at) : disconnectedAt, disconnectedAt);
          const energyCostCents = session.energy_cost_cents ?? 0;
          const totalCostCents = Math.min(session.authorized_cents, energyCostCents + idle.cents);
          await tx.query(`update commercial_sessions set disconnected_at = coalesce(disconnected_at, $2), idle_cost_cents = $3,
            total_cost_cents = $4, cost_cents = $4, updated_at = now() where id = $1`, [session.id, disconnectedAt.toISOString(), Math.max(0, totalCostCents - energyCostCents), totalCostCents]);
        }
        await tx.query("update commercial_chargers set physical_status = 'AVAILABLE', commercial_status = $2, current_power_kw = 0, updated_at = now() where id = $1", [charger.id, session ? "OCCUPIED" : "AVAILABLE_TO_START"]);
      } else if (["OFFLINE", "FAULT"].includes(action)) {
        await tx.query("update commercial_chargers set physical_status = $2, commercial_status = 'FAULTED', current_session_id = null, current_power_kw = 0, updated_at = now() where id = $1", [charger.id, action]);
        if (session) await tx.query("update commercial_sessions set status = 'FAULTED', last_energy_at = null, updated_at = now() where id = $1", [session.id]);
      } else {
        await tx.query("update commercial_chargers set physical_status = 'AVAILABLE', commercial_status = 'AVAILABLE_TO_START', current_power_kw = 0, updated_at = now() where id = $1", [charger.id]);
      }
    });
    if (startAutomatically) await this.startWhenReady(chargerCode, powerKw);
    if (["DISCONNECT", "RECOVER"].includes(action)) {
      const charger = (await this.snapshot()).establishments.flatMap((item) => item.chargers).find((item) => item.code === chargerCode);
      if (charger) await this.processQueue(charger.establishmentId);
    }
    return this.snapshot();
  }

  async resetTestData(establishmentId = "est_aurora_001") {
    await this.ready;
    await this.db.transaction(async (tx) => {
      await tx.query(`update commercial_chargers set physical_status = 'AVAILABLE', commercial_status = 'AVAILABLE_TO_START',
        current_session_id = null, assignment_id = null, current_power_kw = 0, updated_at = now() where establishment_id = $1`, [establishmentId]);
      await tx.query("delete from commercial_payments where session_id in (select id from commercial_sessions where establishment_id = $1)", [establishmentId]);
      await tx.query("delete from commercial_queue_entries where establishment_id = $1", [establishmentId]);
      await tx.query("delete from commercial_sessions where establishment_id = $1", [establishmentId]);
      await tx.query("delete from commercial_decisions where establishment_id = $1", [establishmentId]);
      await tx.query("delete from commercial_energy_samples where plant_id in (select id from commercial_plants where establishment_id = $1)", [establishmentId]);
      await tx.query("update commercial_plants set provider_config = $2::jsonb, updated_at = now() where establishment_id = $1", [establishmentId, JSON.stringify({ online: false, pvKw: 0, buildingLoadKw: 0 })]);
    });
    const plant = await this.db.query<{ id: string }>("select id from commercial_plants where establishment_id = $1", [establishmentId]);
    plant.rows.forEach((item) => this.plantTickedAt.delete(item.id));
    return this.snapshot(establishmentId);
  }

  async stopSession(id: string) {
    await this.advanceEnergy();
    const current = await this.session(id);
    if (current.status !== CommercialSessionStatus.CHARGING) throw new CommercialConflictError("A sessão não está carregando.");
    const command = await this.goodWeProvider.stopCharge(current.chargerCode);
    if (command.status !== "SUCCESS") throw new CommercialConflictError("O equipamento não confirmou a interrupção da energia.");
    await this.hardwareEvent(current.chargerCode, "STOP");
    return this.session(id);
  }

  async assertReadyForCapture(sessionId: string) {
    await this.ready;
    const result = await this.db.query<{ physical_status: string; status: CommercialSessionStatus }>(`select c.physical_status, s.status
      from commercial_sessions s join commercial_chargers c on c.id = s.charger_id where s.id = $1`, [sessionId]);
    const current = result.rows[0];
    if (!current) throw new CommercialNotFoundError("Sessão comercial não encontrada.");
    if (current.status !== CommercialSessionStatus.ENERGY_FINISHED) throw new CommercialConflictError("Finalize a entrega de energia antes de liquidar o pagamento.");
    if (current.physical_status !== "AVAILABLE") throw new CommercialConflictError("Desconecte o veículo no carregador antes de liquidar o pagamento.");
  }

  async completeCapture(input: { sessionId: string; status: PaymentStatus; providerStatus: string; capturedCents: number }) {
    await this.ready;
    await this.db.transaction(async (tx) => {
      const session = await tx.query<{ charger_id: string; physical_status: string; status: CommercialSessionStatus }>(`select s.charger_id, c.physical_status, s.status
        from commercial_sessions s join commercial_chargers c on c.id = s.charger_id where s.id = $1`, [input.sessionId]);
      const current = session.rows[0];
      if (!current) throw new CommercialNotFoundError("Sessão comercial não encontrada.");
      if (current.status !== CommercialSessionStatus.ENERGY_FINISHED) throw new CommercialConflictError("Finalize a entrega de energia antes de liquidar o pagamento.");
      if (current.physical_status !== "AVAILABLE") throw new CommercialConflictError("Desconecte o veículo no carregador antes de liquidar o pagamento.");
      await tx.query("update commercial_payments set status = $2, provider_status = $3, captured_cents = $4, updated_at = now() where session_id = $1", [input.sessionId, input.status, input.providerStatus, input.capturedCents]);
      await tx.query("update commercial_sessions set status = $2, ended_at = now(), settled_at = now(), last_energy_at = null, updated_at = now() where id = $1", [input.sessionId, input.status === PaymentStatus.PAID ? CommercialSessionStatus.COMPLETED : CommercialSessionStatus.CANCELLED]);
      await tx.query("update commercial_chargers set commercial_status = 'AVAILABLE_TO_START', current_session_id = null, current_power_kw = 0, updated_at = now() where id = $1 and current_session_id = $2", [current.charger_id, input.sessionId]);
      await tx.query(`update commercial_queue_entries set status = 'COMPLETED', completed_at = now(), updated_at = now()
        where driver_id = (select driver_id from commercial_sessions where id = $1) and status = 'ASSIGNED'`, [input.sessionId]);
    });
    const session = await this.session(input.sessionId);
    await this.processQueue(session.establishmentId);
    return session;
  }

  async completeRefund(input: { sessionId: string; providerStatus: string; refundedCents: number }) {
    await this.ready;
    await this.assertReadyForCapture(input.sessionId);
    await this.db.transaction(async (tx) => {
      const session = await tx.query<{ charger_id: string; authorized_cents: number }>("select charger_id, authorized_cents from commercial_sessions where id = $1", [input.sessionId]);
      const current = session.rows[0];
      if (!current) throw new CommercialNotFoundError("Sessão comercial não encontrada.");
      await tx.query("update commercial_payments set status = $2, provider_status = $3, captured_cents = $4, refunded_cents = $5, updated_at = now() where session_id = $1", [input.sessionId, PaymentStatus.PAID, input.providerStatus, current.authorized_cents, input.refundedCents]);
      await tx.query("update commercial_sessions set status = 'COMPLETED', ended_at = now(), settled_at = now(), last_energy_at = null, updated_at = now() where id = $1", [input.sessionId]);
      await tx.query("update commercial_chargers set commercial_status = 'AVAILABLE_TO_START', current_session_id = null, current_power_kw = 0, updated_at = now() where id = $1 and current_session_id = $2", [current.charger_id, input.sessionId]);
    });
    const session = await this.session(input.sessionId);
    await this.processQueue(session.establishmentId);
    return session;
  }

  async session(id: string) {
    await this.ready;
    const result = await this.db.query<SessionRow>(`${sessionSelect} where s.id = $1`, [id]);
    if (!result.rows[0]) throw new CommercialNotFoundError("Sessão comercial não encontrada.");
    return sessionRecord(result.rows[0]);
  }

  async sessionForAccess(id: string, access: CommercialSessionAccess) {
    await this.ready;
    const owner = await this.db.query<{ driver_id: string | null; guest_token_hash: string | null }>("select driver_id, guest_token_hash from commercial_sessions where id = $1", [id]);
    const current = owner.rows[0];
    if (!current || ("driverId" in access ? current.driver_id !== access.driverId : !matchingGuestToken(access.guestToken, current.guest_token_hash))) {
      throw new CommercialNotFoundError("Sessão comercial não encontrada.");
    }
    return this.session(id);
  }

  async sessionsForAccess(access: CommercialSessionAccess) {
    await this.ready;
    const sessions = "driverId" in access
      ? await this.db.query<SessionRow>(`${sessionSelect} where s.driver_id = $1 order by s.created_at desc`, [access.driverId])
      : await this.db.query<SessionRow>(`${sessionSelect} where s.guest_token_hash = $1 order by s.created_at desc`, [hashGuestToken(access.guestToken)]);
    return sessions.rows.map(sessionRecord);
  }

  async financialSummary(establishmentId?: string): Promise<CommercialFinancialSummary> {
    await this.ready;
    const result = await this.db.query<{ session_count: number; active_session_count: number; authorized_cents: number; consumed_cents: number; captured_cents: number; refunded_cents: number }>(`
      select count(*)::int as session_count,
        count(*) filter (where s.status not in ('COMPLETED', 'PAYMENT_FAILED', 'START_FAILED', 'FAULTED', 'CANCELLED'))::int as active_session_count,
        coalesce(sum(s.authorized_cents), 0)::int as authorized_cents,
        coalesce(sum(s.total_cost_cents), 0)::int as consumed_cents,
        coalesce(sum(p.captured_cents), 0)::int as captured_cents,
        coalesce(sum(p.refunded_cents), 0)::int as refunded_cents
      from commercial_sessions s left join commercial_payments p on p.session_id = s.id
      ${establishmentId ? "where s.establishment_id = $1" : ""}`, establishmentId ? [establishmentId] : []);
    const row = result.rows[0]!;
    return { establishmentId, sessionCount: row.session_count, activeSessionCount: row.active_session_count, authorizedCents: row.authorized_cents, consumedCents: row.consumed_cents, capturedCents: row.captured_cents, refundedCents: row.refunded_cents };
  }

  async sessionIdForPaymentIntent(paymentIntentId: string) {
    await this.ready;
    const result = await this.db.query<{ session_id: string }>("select session_id from commercial_payments where payment_intent_id = $1", [paymentIntentId]);
    if (!result.rows[0]) throw new CommercialNotFoundError("Pagamento não vinculado a uma sessão ChargeGrid.");
    return result.rows[0].session_id;
  }

  async catalog(): Promise<CommercialCatalog> {
    await this.ready;
    const establishments = await this.db.query<EstablishmentRow>("select e.*, p.id as plant_id from commercial_establishments e left join commercial_plants p on p.establishment_id = e.id where e.published = true order by e.name");
    const chargers = await this.db.query<ChargerRow>("select * from commercial_chargers where published = true order by code");
    const queue = await this.queueSnapshot();
    const chargerRecords = chargers.rows.map(chargerRecord);
    const energyByPlant = new Map((await Promise.all(establishments.rows.map(async (row) => row.plant_id ? [row.plant_id, await this.plantEnergy(row.plant_id)] as const : null))).filter((item): item is readonly [string, PlantEnergySnapshot | null] => item !== null));
    return {
      generatedAt: new Date().toISOString(),
      establishments: establishments.rows.map((row) => {
        const favorableEnergyCondition = hasSolarSurplus(row.plant_id ? energyByPlant.get(row.plant_id) ?? null : null);
        return {
          ...publicEstablishmentRecord(establishmentRecord(row, chargerRecords, queue)),
          favorableEnergyCondition,
          offerTariffCents: favorableEnergyCondition ? Math.min(row.tariff_cents, 170) : null
        };
      })
    };
  }

  private async synchronizeInsight(input: InsightInput) {
    const id = `insight_${randomUUID()}`;
    const reviewState = "OPEN";
    await this.db.query(`insert into commercial_decisions (
      id, correlation_key, establishment_id, kind, type, entity_id, source_event_id, sample_id, policy_version,
      condition_active, was_active, severity, reason_code, message, evidence, suggested_action, review_state
    ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $11, $12, $13, $14::jsonb, $15, $16)
    on conflict (correlation_key) do update set
      condition_active = excluded.condition_active, severity = excluded.severity, reason_code = excluded.reason_code,
      was_active = commercial_decisions.was_active or excluded.condition_active,
      message = excluded.message, evidence = excluded.evidence, sample_id = excluded.sample_id,
      policy_version = excluded.policy_version, suggested_action = excluded.suggested_action,
      review_state = case when excluded.condition_active and commercial_decisions.review_state = 'RESOLVED' then 'OPEN' else commercial_decisions.review_state end,
      updated_at = now()`, [
      id, input.correlationKey, input.establishmentId, input.kind, input.type, input.entityId,
      input.sourceEventId ?? null, input.sampleId ?? null, input.policyVersion ?? null, input.conditionActive,
      input.severity, input.reasonCode, input.message, JSON.stringify(input.evidence), input.suggestedAction ?? null, reviewState
    ]);
  }

  private async synchronizeInsights(establishmentId?: string) {
    const plants = await this.db.query<PlantRow & { establishment_id: string }>(`select id, establishment_id, provider_config, energy_policy from commercial_plants ${establishmentId ? "where establishment_id = $1" : ""}`, establishmentId ? [establishmentId] : []);
    for (const plant of plants.rows) {
      const snapshot = await this.plantEnergy(plant.id);
      const policy = energyPolicy(plant.energy_policy);
      const stale = !snapshot || snapshot.quality !== "FRESH" || Date.now() - Date.parse(snapshot.observedAt) > policy.freshSeconds * 1000;
      await this.synchronizeInsight({
        establishmentId: plant.establishment_id, correlationKey: `telemetry:${plant.id}`, kind: "ALERT", type: "TELEMETRY_STALE", entityId: plant.id,
        sampleId: snapshot?.id ?? null, policyVersion: "demand-v1", conditionActive: stale, severity: "WARNING", reasonCode: stale ? "TELEMETRY_UNAVAILABLE" : "TELEMETRY_RECOVERED",
        message: stale ? "A telemetria da planta está indisponível ou expirada." : "A telemetria da planta foi restabelecida.",
        evidence: snapshot ? [`Última amostra: ${snapshot.observedAt}.`, `Qualidade: ${snapshot.quality}.`] : ["Nenhuma amostra de telemetria foi recebida."],
        suggestedAction: "OPEN_ENERGY"
      });
      const solar = hasSolarSurplus(snapshot);
      await this.synchronizeInsight({
        establishmentId: plant.establishment_id, correlationKey: `solar:${plant.id}`, kind: "RECOMMENDATION", type: "SOLAR_OPPORTUNITY", entityId: plant.id,
        sampleId: snapshot?.id ?? null, policyVersion: "s4-quote-v1", conditionActive: solar, severity: "INFO", reasonCode: solar ? "SOLAR_SURPLUS" : "SOLAR_SURPLUS_UNAVAILABLE",
        message: solar ? "Há excedente solar elegível para novas cotações." : "Não há excedente solar elegível para novas cotações.",
        evidence: snapshot ? [`Solar: ${snapshot.pvKw.toFixed(1)} kW.`, `Carga-base: ${snapshot.buildingLoadKw.toFixed(1)} kW.`, `Excedente: ${(snapshot.pvKw - snapshot.buildingLoadKw).toFixed(1)} kW.`] : ["Telemetria indisponível para avaliar excedente solar."],
        suggestedAction: "OPEN_ENERGY"
      });
      const demand = snapshot?.energyStatus === PlantEnergyStatus.ALERT || snapshot?.energyStatus === PlantEnergyStatus.CRITICAL;
      await this.synchronizeInsight({
        establishmentId: plant.establishment_id, correlationKey: `demand:${plant.id}`, kind: "RECOMMENDATION", type: "DEMAND_REVIEW", entityId: plant.id,
        sampleId: snapshot?.id ?? null, policyVersion: "demand-v1", conditionActive: demand, severity: snapshot?.energyStatus === PlantEnergyStatus.CRITICAL ? "CRITICAL" : "WARNING", reasonCode: demand ? "DEMAND_THRESHOLD" : "DEMAND_NORMAL",
        message: demand ? "A demanda da planta requer acompanhamento operacional." : "A demanda da planta está dentro da faixa normal.",
        evidence: snapshot ? [`Importação: ${snapshot.gridImportKw.toFixed(1)} kW.`, `Estado: ${snapshot.energyStatus}.`] : ["Telemetria indisponível para avaliar a demanda."],
        suggestedAction: "OPEN_ENERGY"
      });
      const chargers = await this.db.query<{ id: string; code: string; physical_status: string }>("select id, code, physical_status from commercial_chargers where plant_id = $1", [plant.id]);
      for (const charger of chargers.rows) {
        const faulted = charger.physical_status === "FAULT" || charger.physical_status === "OFFLINE";
        await this.synchronizeInsight({
          establishmentId: plant.establishment_id, correlationKey: `hardware:${charger.id}`, kind: "ALERT", type: "HARDWARE_FAULT", entityId: charger.id,
          conditionActive: faulted, severity: "CRITICAL", reasonCode: faulted ? charger.physical_status : "HARDWARE_RECOVERED",
          message: faulted ? `${charger.code} está ${charger.physical_status}.` : `${charger.code} voltou a reportar disponibilidade.`,
          evidence: [`Estado físico atual: ${charger.physical_status}.`], suggestedAction: "OPEN_CHARGER"
        });
      }
      const sessions = await this.db.query<{ id: string; public_code: string; status: CommercialSessionStatus }>("select id, public_code, status from commercial_sessions where establishment_id = $1", [plant.establishment_id]);
      for (const session of sessions.rows) {
        const pending = session.status === CommercialSessionStatus.SETTLEMENT_PENDING;
        await this.synchronizeInsight({
          establishmentId: plant.establishment_id, correlationKey: `settlement:${session.id}`, kind: "ALERT", type: "SETTLEMENT_PENDING", entityId: session.id,
          conditionActive: pending, severity: "WARNING", reasonCode: pending ? "SETTLEMENT_PENDING" : "SETTLEMENT_RESOLVED",
          message: pending ? `A liquidação de ${session.public_code} está pendente.` : `A liquidação de ${session.public_code} foi atualizada.`,
          evidence: [`Estado comercial atual: ${session.status}.`], suggestedAction: "OPEN_FINANCE"
        });
      }
    }
  }

  async insights(establishmentId?: string): Promise<CommercialInsights> {
    await this.ready;
    await this.synchronizeInsights(establishmentId);
    const rows = await this.db.query<InsightRow>(`select * from commercial_decisions ${establishmentId ? "where establishment_id = $1" : ""} order by updated_at desc`, establishmentId ? [establishmentId] : []);
    const records = rows.rows.map((row) => ({ row, insight: insightRecord(row) }));
    return {
      alerts: records.filter(({ row, insight }) => insight.kind === "ALERT" && (insight.conditionActive || row.was_active)).map(({ insight }) => insight),
      recommendations: records.filter(({ insight }) => insight.kind === "RECOMMENDATION" && (insight.conditionActive || insight.reviewState !== "OPEN")).map(({ insight }) => insight)
    };
  }

  async decideInsight(input: { id: string; decision: "ACKNOWLEDGE" | "RESOLVE" | "ACCEPT" | "DEFER" | "REJECT"; reason: string; actor?: string }) {
    await this.ready;
    if (!input.reason.trim() || input.reason.trim().length > 500) throw new CommercialConflictError("Informe um motivo de até 500 caracteres.");
    const rows = await this.db.query<InsightRow>("select * from commercial_decisions where id = $1", [input.id]);
    const current = rows.rows[0];
    if (!current) throw new CommercialNotFoundError("Insight comercial não encontrado.");
    const isAlert = current.kind === "ALERT";
    if ((isAlert && !["ACKNOWLEDGE", "RESOLVE"].includes(input.decision)) || (!isAlert && !["ACCEPT", "DEFER", "REJECT"].includes(input.decision))) throw new CommercialConflictError("A decisão não é válida para este insight.");
    if (input.decision === "RESOLVE" && current.condition_active) throw new CommercialConflictError("A condição ainda está ativa e não pode ser resolvida manualmente.");
    const reviewState = input.decision === "ACKNOWLEDGE" ? "ACKNOWLEDGED" : input.decision === "RESOLVE" ? "RESOLVED" : input.decision === "ACCEPT" ? "ACCEPTED" : input.decision === "DEFER" ? "DEFERRED" : "REJECTED";
    await this.db.query("update commercial_decisions set review_state = $2, decided_at = now(), decided_by = $3, decision_reason = $4, updated_at = now() where id = $1", [input.id, reviewState, input.actor ?? "Operação ChargeGrid", input.reason.trim()]);
    const updated = await this.db.query<InsightRow>("select * from commercial_decisions where id = $1", [input.id]);
    return insightRecord(updated.rows[0]!);
  }

  async dashboardSummary(input: { establishmentId: string; from: string; to: string }): Promise<CommercialDashboardSummary> {
    await this.ready;
    const generatedAt = new Date();
    const establishment = await this.db.query<{ id: string; plant_id: string | null; energy_policy: unknown }>(`select e.id, p.id as plant_id, p.energy_policy
      from commercial_establishments e left join commercial_plants p on p.establishment_id = e.id
      where e.id = $1 and e.published = true`, [input.establishmentId]);
    const scope = establishment.rows[0];
    if (!scope) throw new CommercialNotFoundError("Estabelecimento comercial não encontrado.");

    const policy = scope.energy_policy ? energyPolicy(scope.energy_policy) : null;
    const freshSeconds = policy?.freshSeconds ?? 15;
    const periodMs = Date.parse(input.to) - Date.parse(input.from);
    const samples = scope.plant_id ? await this.db.query<{
      sample_count: number; fresh_count: number; first_at: Date | string | null; last_at: Date | string | null; max_gap_seconds: number | null;
      ev_wh: number | null; solar_to_ev_wh: number | null; grid_import_wh: number | null; grid_export_wh: number | null; peak_grid_import_kw: number | null;
    }>(`with ordered as (
        select observed_at, quality,
          lag(observed_at) over (order by observed_at) as previous_at,
          ev_wh, solar_to_ev_wh, grid_import_wh, grid_export_wh, grid_import_kw
        from commercial_energy_samples
        where plant_id = $1 and observed_at >= $2 and observed_at < $3
      )
      select count(*)::int as sample_count,
        count(*) filter (where quality = 'FRESH')::int as fresh_count,
        min(observed_at) as first_at, max(observed_at) as last_at,
        max(extract(epoch from observed_at - previous_at)) as max_gap_seconds,
        sum(ev_wh) as ev_wh, sum(solar_to_ev_wh) as solar_to_ev_wh,
        sum(grid_import_wh) as grid_import_wh, sum(grid_export_wh) as grid_export_wh,
        max(grid_import_kw) as peak_grid_import_kw
      from ordered`, [scope.plant_id, input.from, input.to]) : { rows: [] };
    const sample = samples.rows[0];
    const hasSamples = (sample?.sample_count ?? 0) > 0;
    const sampleCoverageStale = hasSamples && (
      sample!.fresh_count !== sample!.sample_count
      || Date.parse(String(sample!.first_at)) - Date.parse(input.from) > freshSeconds * 1000
      || Date.parse(input.to) - Date.parse(String(sample!.last_at)) > freshSeconds * 1000
      || Number(sample!.max_gap_seconds ?? 0) > freshSeconds
    );
    const energyQuality = sampleCoverageStale ? "STALE" as const : "FRESH" as const;
    const energyMetric = (value: number | null | undefined): CommercialDashboardMetric<number> => hasSamples
      ? { value: Number(value ?? 0), provenance: "SIMULATED", quality: energyQuality, unavailableReason: null }
      : { value: null, provenance: scope.plant_id ? "SIMULATED" : null, quality: "UNAVAILABLE", unavailableReason: scope.plant_id ? "NO_ENERGY_SAMPLES_IN_PERIOD" : "PLANT_NOT_CONFIGURED" };

    const financial = await this.db.query<{ payment_count: number; captured_cents: number | null; refunded_cents: number | null }>(`select count(p.id)::int as payment_count,
        coalesce(sum(p.captured_cents), 0)::int as captured_cents, coalesce(sum(p.refunded_cents), 0)::int as refunded_cents
      from commercial_payments p join commercial_sessions s on s.id = p.session_id
      where s.establishment_id = $1 and coalesce(s.settled_at, s.created_at) >= $2 and coalesce(s.settled_at, s.created_at) < $3`, [input.establishmentId, input.from, input.to]);
    const financialRow = financial.rows[0]!;
    const paymentProvenance: DataProvenance = financialRow.payment_count > 0 ? "SANDBOX" : "DERIVED";
    const financialMetric = (value: number): CommercialDashboardMetric<number> => ({ value, provenance: paymentProvenance, quality: "FRESH", unavailableReason: null });

    const demand = scope.plant_id ? await this.plantEnergyView(scope.plant_id) : null;
    const currentDemand = demand?.snapshot && demand.decision.quality !== "UNKNOWN"
      ? { value: demand.snapshot.gridImportKw, provenance: "SIMULATED" as const, quality: demand.decision.quality === "FRESH" ? "FRESH" as const : "STALE" as const, unavailableReason: null }
      : { value: null, provenance: scope.plant_id ? "SIMULATED" as const : null, quality: "UNAVAILABLE" as const, unavailableReason: scope.plant_id ? "CURRENT_TELEMETRY_UNAVAILABLE" : "PLANT_NOT_CONFIGURED" };
    const peakDemand: CommercialDashboardMetric<number> = hasSamples
      ? { value: Number(sample!.peak_grid_import_kw ?? 0), provenance: "SIMULATED", quality: energyQuality, unavailableReason: null }
      : { value: null, provenance: scope.plant_id ? "SIMULATED" : null, quality: "UNAVAILABLE", unavailableReason: scope.plant_id ? "NO_ENERGY_SAMPLES_IN_PERIOD" : "PLANT_NOT_CONFIGURED" };
    const limitKw: CommercialDashboardMetric<number> = policy
      ? { value: policy.limitKw, provenance: "DERIVED", quality: "FRESH", unavailableReason: null }
      : { value: null, provenance: null, quality: "UNAVAILABLE", unavailableReason: "DEMAND_POLICY_NOT_CONFIGURED" };

    const sessions = await this.db.query<{ created_count: number; active_count: number; occupied_seconds: number }>(`select
        count(*) filter (where created_at >= $2 and created_at < $3)::int as created_count,
        count(*) filter (where status not in ('COMPLETED', 'PAYMENT_FAILED', 'START_FAILED', 'FAULTED', 'CANCELLED'))::int as active_count,
        coalesce(sum(extract(epoch from (least(coalesce(ended_at, $3::timestamptz), $3::timestamptz) - greatest(started_at, $2::timestamptz))))
          filter (where started_at is not null and started_at < $3::timestamptz and coalesce(ended_at, $3::timestamptz) > $2::timestamptz), 0)::float8 as occupied_seconds
      from commercial_sessions where establishment_id = $1`, [input.establishmentId, input.from, input.to]);
    const chargerRows = await this.db.query<{ charger_count: number; published_count: number; available_count: number }>(`select count(*)::int as charger_count,
        count(*) filter (where published)::int as published_count,
        count(*) filter (where published and physical_status = 'AVAILABLE' and commercial_status = 'AVAILABLE_TO_START')::int as available_count
      from commercial_chargers where establishment_id = $1`, [input.establishmentId]);
    const queueRows = await this.db.query<{ active_count: number }>(`select count(*)::int as active_count from commercial_queue_entries
      where establishment_id = $1 and status in ('WAITING', 'CALLED', 'ASSIGNED')`, [input.establishmentId]);
    const sessionRow = sessions.rows[0]!;
    const chargerRow = chargerRows.rows[0]!;
    const queueCount = queueRows.rows[0]!.active_count;
    const derivedMetric = (value: number): CommercialDashboardMetric<number> => ({ value, provenance: "DERIVED", quality: "FRESH", unavailableReason: null });
    const occupiedSeconds = Number(sessionRow.occupied_seconds);
    const publishedSeconds = chargerRow.published_count * periodMs / 1000;
    const utilizationRatio: CommercialDashboardMetric<number> = publishedSeconds > 0
      ? derivedMetric(Math.max(0, Math.min(1, occupiedSeconds / publishedSeconds)))
      : { value: null, provenance: "DERIVED", quality: "UNAVAILABLE", unavailableReason: "NO_PUBLISHED_CHARGERS" };
    const generatedAtIso = generatedAt.toISOString();
    const numeric = (value: number | null | undefined) => Number(value ?? 0);

    return {
      contractVersion: "S4-C2",
      establishmentId: scope.id,
      plantId: scope.plant_id,
      period: { from: input.from, to: input.to },
      generatedAt: generatedAtIso,
      energy: {
        evWh: energyMetric(sample?.ev_wh),
        solarToEvWh: energyMetric(sample?.solar_to_ev_wh),
        gridImportWh: energyMetric(sample?.grid_import_wh),
        gridExportWh: energyMetric(sample?.grid_export_wh)
      },
      financial: {
        capturedCents: financialMetric(numeric(financialRow.captured_cents)),
        refundedCents: financialMetric(numeric(financialRow.refunded_cents)),
        netCapturedCents: financialMetric(numeric(financialRow.captured_cents) - numeric(financialRow.refunded_cents))
      },
      demand: {
        currentGridImportKw: currentDemand,
        peakGridImportKw: peakDemand,
        limitKw
      },
      utilization: {
        occupiedChargerSeconds: derivedMetric(occupiedSeconds),
        publishedChargerSeconds: derivedMetric(publishedSeconds),
        ratio: utilizationRatio
      },
      counts: {
        sessionsCreatedInPeriod: derivedMetric(sessionRow.created_count),
        activeSessionsAtGeneration: derivedMetric(sessionRow.active_count),
        chargersAtGeneration: derivedMetric(chargerRow.charger_count),
        availableChargersAtGeneration: derivedMetric(chargerRow.available_count),
        queuedEntriesAtGeneration: derivedMetric(queueCount)
      }
    };
  }

  async operationalReport(input: { establishmentId: string; from: string; to: string }): Promise<CommercialOperationalReport> {
    await this.ready;
    const energy = await this.db.query<{ ev_wh: number; solar_to_ev_wh: number; grid_import_wh: number; grid_export_wh: number }>(`select
      coalesce(sum(es.ev_wh), 0) as ev_wh, coalesce(sum(es.solar_to_ev_wh), 0) as solar_to_ev_wh,
      coalesce(sum(es.grid_import_wh), 0) as grid_import_wh, coalesce(sum(es.grid_export_wh), 0) as grid_export_wh
      from commercial_energy_samples es join commercial_plants p on p.id = es.plant_id
      where p.establishment_id = $1 and es.observed_at >= $2 and es.observed_at < $3`, [input.establishmentId, input.from, input.to]);
    const financial = await this.db.query<{ captured_cents: number; refunded_cents: number }>(`select
      coalesce(sum(p.captured_cents), 0) as captured_cents, coalesce(sum(p.refunded_cents), 0) as refunded_cents
      from commercial_payments p join commercial_sessions s on s.id = p.session_id
      where s.establishment_id = $1 and coalesce(s.settled_at, s.created_at) >= $2 and coalesce(s.settled_at, s.created_at) < $3`, [input.establishmentId, input.from, input.to]);
    const sessions = await this.db.query<SessionRow>(`${sessionSelect}
      where s.establishment_id = $1 and s.created_at >= $2 and s.created_at < $3
      order by s.created_at desc`, [input.establishmentId, input.from, input.to]);
    const chargers = await this.db.query<ChargerRow>("select * from commercial_chargers where establishment_id = $1 and published = true", [input.establishmentId]);
    const values = energy.rows[0] ?? { ev_wh: 0, solar_to_ev_wh: 0, grid_import_wh: 0, grid_export_wh: 0 };
    const money = financial.rows[0] ?? { captured_cents: 0, refunded_cents: 0 };
    const insights = await this.insights(input.establishmentId);
    return {
      establishmentId: input.establishmentId,
      from: input.from,
      to: input.to,
      energy: { evWh: Number(values.ev_wh), solarToEvWh: Number(values.solar_to_ev_wh), gridImportWh: Number(values.grid_import_wh), gridExportWh: Number(values.grid_export_wh) },
      financial: { capturedCents: Number(money.captured_cents), refundedCents: Number(money.refunded_cents) },
      sessions: sessions.rows.map(sessionRecord).map((session) => ({
        id: session.id,
        publicCode: session.publicCode,
        chargerId: session.chargerId,
        chargerCode: session.chargerCode,
        driverName: session.driverName,
        status: session.status,
        energyWh: session.energyWh,
        totalCostCents: session.totalCostCents,
        startedAt: session.startedAt ?? undefined,
        endedAt: session.endedAt ?? undefined,
        createdAt: session.createdAt
      })),
      chargers: {
        total: chargers.rows.length,
        available: chargers.rows.filter((charger) => charger.physical_status === ChargerTechnicalStatus.AVAILABLE).length,
        charging: chargers.rows.filter((charger) => charger.physical_status === ChargerTechnicalStatus.CHARGING).length,
        faulted: chargers.rows.filter((charger) => [ChargerTechnicalStatus.FAULT, ChargerTechnicalStatus.OFFLINE].includes(charger.physical_status as ChargerTechnicalStatus)).length
      },
      decisions: [...insights.alerts, ...insights.recommendations]
    };
  }

  async resolveCharger(identifier: string): Promise<CommercialChargerResolution> {
    const normalized = identifier.trim();
    if (!normalized) throw new CommercialNotFoundError("Carregador comercial não encontrado.");
    const catalog = await this.catalog();
    for (const establishment of catalog.establishments) {
      const charger = establishment.chargers.find((candidate) => candidate.id === normalized
        || candidate.code.toLocaleLowerCase("pt-BR") === normalized.toLocaleLowerCase("pt-BR")
        || candidate.qrIdentifier.toLocaleLowerCase("pt-BR") === normalized.toLocaleLowerCase("pt-BR"));
      if (charger) return { establishment, charger };
    }
    throw new CommercialNotFoundError("Carregador comercial não encontrado.");
  }

  async snapshot(establishmentId?: string): Promise<CommercialSnapshot> {
    await this.ready;
    const establishments = await this.db.query<EstablishmentRow>(`select e.*, p.id as plant_id from commercial_establishments e left join commercial_plants p on p.establishment_id = e.id where e.published = true ${establishmentId ? "and e.id = $1" : ""} order by e.name`, establishmentId ? [establishmentId] : []);
    const chargers = await this.db.query<ChargerRow>(`select * from commercial_chargers where published = true ${establishmentId ? "and establishment_id = $1" : ""} order by code`, establishmentId ? [establishmentId] : []);
    const sessions = await this.db.query<SessionRow>(`${sessionSelect} ${establishmentId ? "where s.establishment_id = $1" : ""} order by s.created_at desc`, establishmentId ? [establishmentId] : []);
    const queue = await this.queueSnapshot(establishmentId);
    const tariffs = await this.db.query<TariffVersionRow>(`select * from commercial_tariff_versions ${establishmentId ? "where establishment_id = $1" : ""} order by valid_from desc, created_at desc`, establishmentId ? [establishmentId] : []);
    const plantEnergy = (await Promise.all(establishments.rows.map(async (row) => row.plant_id ? this.plantEnergy(row.plant_id) : null))).filter((item): item is PlantEnergySnapshot => item !== null);
    const chargerRecords = chargers.rows.map(chargerRecord);
    const establishmentRecords = establishments.rows.map((row) => establishmentRecord(row, chargerRecords, queue));
    return { contractVersion: "S4-C1", generatedAt: new Date().toISOString(), establishments: establishmentRecords, tariffs: tariffs.rows.map(tariffVersionRecord), plantEnergy, sessions: sessions.rows.map(sessionRecord), queue };
  }
}

let repository: CommercialRepository | undefined;

export function getCommercialRepository() {
  return repository ??= new CommercialRepository();
}

export async function closeCommercialRepository() {
  const activeRepository = repository;
  repository = undefined;
  await activeRepository?.close();
}

export function startCommercialClock() {
  let stopped = false;
  let pending = Promise.resolve();
  const tick = () => {
    pending = pending.then(async () => {
      if (stopped) return;
      const repository = getCommercialRepository();
      await repository.advanceEnergy();
      await repository.advancePlantTelemetry();
    }).catch((error) => console.error(JSON.stringify({ level: "error", service: "chargegrid-api", message: "Commercial energy clock failed", error: error instanceof Error ? error.message : String(error) })));
  };
  const timer = setInterval(tick, 1000);
  timer.unref();
  return {
    stop: async () => {
      stopped = true;
      clearInterval(timer);
      await pending;
    }
  };
}
