import { CommercialSessionStatus, PaymentStatus, QueueStatus } from "@chargegrid/shared";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CommercialConflictError, CommercialNotFoundError, CommercialRepository } from "./repository.js";

describe("CommercialRepository", () => {
  const repositories: CommercialRepository[] = [];
  afterEach(async () => Promise.all(repositories.splice(0).map((repository) => repository.close())));

  it("persists one Stripe-backed session and exposes the same charger in the snapshot", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const id = "10000000-0000-4000-8000-000000000001";

    await repository.reserveSession({
      id,
      establishmentId: "est_aurora_001",
      chargerCode: "AURORA-01",
      driverName: "Motorista Teste",
      method: "CARD",
      authorizedCents: 2500
    });
    await repository.attachPayment(id, "pi_test_chargegrid", "requires_payment_method");
    const session = await repository.recordPayment({
      sessionId: id,
      paymentIntentId: "pi_test_chargegrid",
      status: PaymentStatus.AUTHORIZED,
      providerStatus: "requires_capture",
      receivedAmount: 0
    });

    expect(session.status).toBe(CommercialSessionStatus.WAITING_START);
    expect(session.chargerCode).toBe("AURORA-01");
    expect(session.chargerId).toBe("00000000-0000-4000-8000-000000000001");
    const snapshot = await repository.snapshot("est_aurora_001");
    expect(snapshot.sessions).toEqual([expect.objectContaining({ id, payment: expect.objectContaining({ paymentIntentId: "pi_test_chargegrid" }) })]);
    expect(snapshot.establishments[0]?.chargers[0]).toEqual(expect.objectContaining({ code: "AURORA-01", commercialStatus: "OCCUPIED", currentSessionId: id }));
    await expect(repository.reserveSession({
      id: "20000000-0000-4000-8000-000000000002",
      establishmentId: "est_aurora_001",
      chargerCode: "AURORA-01",
      driverName: "Outro Motorista",
      method: "PIX",
      authorizedCents: 2500
    })).rejects.toBeInstanceOf(CommercialConflictError);
  }, 20_000);

  it("binds a frozen guest quote to one persistent session without exposing it to another guest", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const guestToken = "guest-token-a";
    const quote = await repository.createQuote({
      chargerId: "00000000-0000-4000-8000-000000000001",
      establishmentId: "est_aurora_001",
      access: { guestToken }
    });
    const session = await repository.reserveQuotedSession({
      id: "11000000-0000-4000-8000-000000000011",
      quoteId: quote.id,
      access: { guestToken },
      method: "PIX",
      authorizedCents: 2500
    });

    expect(session).toMatchObject({ actorType: "GUEST", quote: expect.objectContaining({ id: quote.id, energyCentsPerKwh: 190 }) });
    await expect(repository.sessionForAccess(session.id, { guestToken })).resolves.toMatchObject({ id: session.id });
    await expect(repository.sessionForAccess(session.id, { guestToken: "guest-token-b" })).rejects.toBeInstanceOf(CommercialNotFoundError);
    await expect(repository.reserveQuotedSession({ id: session.id, quoteId: quote.id, access: { guestToken }, method: "PIX", authorizedCents: 4000 })).rejects.toBeInstanceOf(CommercialConflictError);
  }, 20_000);

  it("starts once when payment authorization arrives after the vehicle connection", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const id = "12000000-0000-4000-8000-000000000012";
    await repository.reserveSession({ id, establishmentId: "est_aurora_001", chargerCode: "AURORA-01", driverName: "Motorista Teste", method: "CARD", authorizedCents: 2500 });
    await repository.hardwareEvent("AURORA-01", "CONNECT");
    await repository.hardwareEvent("AURORA-01", "CONNECT");
    expect(await repository.session(id)).toMatchObject({ status: CommercialSessionStatus.AWAITING_PAYMENT });
    await repository.attachPayment(id, "pi_test_connected_first", "requires_capture");
    await repository.recordPayment({ sessionId: id, paymentIntentId: "pi_test_connected_first", status: PaymentStatus.AUTHORIZED, providerStatus: "requires_capture", receivedAmount: 0 });
    expect(await repository.session(id)).toMatchObject({ status: CommercialSessionStatus.CHARGING, currentPowerKw: 7 });
  }, 20_000);

  it("persists accepted idle policy timestamps and freezes cost when the vehicle disconnects", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const id = "13000000-0000-4000-8000-000000000013";
    const guestToken = "guest-token-idle";
    const quote = await repository.createQuote({ chargerId: "00000000-0000-4000-8000-000000000001", establishmentId: "est_aurora_001", access: { guestToken } });
    await repository.reserveQuotedSession({ id, quoteId: quote.id, access: { guestToken }, method: "CARD", authorizedCents: 2500 });
    await repository.attachPayment(id, "pi_test_idle", "requires_capture");
    await repository.recordPayment({ sessionId: id, paymentIntentId: "pi_test_idle", status: PaymentStatus.AUTHORIZED, providerStatus: "requires_capture", receivedAmount: 0 });
    await repository.hardwareEvent("AURORA-01", "CONNECT");
    await repository.stopSession(id);
    const ended = await repository.session(id);
    expect(ended).toMatchObject({ status: CommercialSessionStatus.ENERGY_FINISHED, energyEndedAt: expect.any(String), idleGraceEndsAt: expect.any(String), idleCostCents: 0 });
    await repository.hardwareEvent("AURORA-01", "DISCONNECT");
    expect(await repository.session(id)).toMatchObject({ disconnectedAt: expect.any(String), idleCostCents: 0, totalCostCents: ended.energyCostCents });
  }, 20_000);

  it("applies simulated hardware events and advances energy only from the backend clock", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const id = "30000000-0000-4000-8000-000000000003";
    await repository.reserveSession({ id, establishmentId: "est_aurora_001", chargerCode: "AURORA-01", driverName: "Motorista Teste", method: "CARD", authorizedCents: 2500 });
    await repository.attachPayment(id, "pi_test_hardware", "requires_capture");
    await repository.recordPayment({ sessionId: id, paymentIntentId: "pi_test_hardware", status: PaymentStatus.AUTHORIZED, providerStatus: "requires_capture", receivedAmount: 0 });

    await repository.hardwareEvent("AURORA-01", "CONNECT", 5.5);
    const started = await repository.session(id);
    await repository.advanceEnergy(new Date(Date.parse(started.startedAt!) + 3_600_000));
    const charging = await repository.session(id);

    expect(charging).toMatchObject({ status: CommercialSessionStatus.CHARGING, currentPowerKw: 5.5, costCents: 1045 });
    expect(charging.energyWh).toBeCloseTo(5500, 0);
    await repository.stopSession(id);
    expect(await repository.session(id)).toMatchObject({ status: CommercialSessionStatus.ENERGY_FINISHED, currentPowerKw: 0 });
    await repository.recordPayment({ sessionId: id, paymentIntentId: "pi_test_hardware", status: PaymentStatus.AUTHORIZED, providerStatus: "requires_capture", receivedAmount: 0 });
    expect(await repository.session(id)).toMatchObject({ status: CommercialSessionStatus.ENERGY_FINISHED });
    await expect(repository.assertReadyForCapture(id)).rejects.toBeInstanceOf(CommercialConflictError);
    await expect(repository.completeCapture({ sessionId: id, status: PaymentStatus.PAID, providerStatus: "succeeded", capturedCents: 1330 })).rejects.toBeInstanceOf(CommercialConflictError);
    await repository.hardwareEvent("AURORA-01", "DISCONNECT");
    await expect(repository.assertReadyForCapture(id)).resolves.toBeUndefined();
    await repository.completeCapture({ sessionId: id, status: PaymentStatus.PAID, providerStatus: "succeeded", capturedCents: 1330 });
    expect(await repository.session(id)).toMatchObject({ status: CommercialSessionStatus.COMPLETED, payment: { status: PaymentStatus.PAID, capturedCents: 1330 } });
    expect((await repository.snapshot("est_aurora_001")).establishments[0]?.chargers[0]).toMatchObject({ physicalStatus: "AVAILABLE", commercialStatus: "AVAILABLE_TO_START" });
  }, 20_000);

  it("caps measured energy at the authorized financial limit", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const id = "40000000-0000-4000-8000-000000000004";
    await repository.reserveSession({ id, establishmentId: "est_aurora_001", chargerCode: "AURORA-01", driverName: "Motorista Limite", method: "CARD", authorizedCents: 1000 });
    await repository.attachPayment(id, "pi_test_limit", "requires_capture");
    await repository.recordPayment({ sessionId: id, paymentIntentId: "pi_test_limit", status: PaymentStatus.AUTHORIZED, providerStatus: "requires_capture", receivedAmount: 0 });
    await repository.hardwareEvent("AURORA-01", "CONNECT");
    const started = await repository.session(id);
    await repository.advanceEnergy(new Date(Date.parse(started.startedAt!) + 3_600_000));
    expect(await repository.session(id)).toMatchObject({ status: CommercialSessionStatus.ENERGY_FINISHED, energyWh: 5263.158, costCents: 1000, currentPowerKw: 0 });
  }, 20_000);

  it("persists one active queue per driver and calls the first driver when hardware is released", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    for (let index = 1; index <= 6; index += 1) await repository.hardwareEvent(`AURORA-${String(index).padStart(2, "0")}`, "CONNECT");

    const joined = await repository.joinQueue({ driverId: "driver-queue", driverName: "Motorista Fila", driverVehicle: "EV Teste", establishmentId: "est_aurora_001" });
    expect(joined).toMatchObject({ status: QueueStatus.WAITING, position: 1 });
    expect((await repository.joinQueue({ driverId: "driver-queue", driverName: "Motorista Fila", driverVehicle: "EV Teste", establishmentId: "est_aurora_001" })).id).toBe(joined.id);

    await repository.hardwareEvent("AURORA-03", "DISCONNECT");
    expect(await repository.queueForDriver("driver-queue")).toMatchObject({ status: QueueStatus.CALLED, chargerCode: "AURORA-03", position: 0 });
    await repository.leaveQueue(joined.id, "driver-queue");
    expect(await repository.queueForDriver("driver-queue")).toBeNull();
    expect((await repository.snapshot("est_aurora_001")).establishments[0]?.chargers[2]).toMatchObject({ code: "AURORA-03", commercialStatus: "AVAILABLE_TO_START" });

    await repository.hardwareEvent("AURORA-03", "CONNECT");
    await repository.joinQueue({ driverId: "driver-queue", driverName: "Motorista Fila", driverVehicle: "EV Teste", establishmentId: "est_aurora_001" });
    await repository.hardwareEvent("AURORA-03", "DISCONNECT");
    await expect(repository.reserveSession({ id: "50000000-0000-4000-8000-000000000005", driverId: "driver-queue", driverName: "Motorista Fila", establishmentId: "est_aurora_001", chargerCode: "AURORA-03", method: "CARD", authorizedCents: 2500 })).resolves.toMatchObject({ chargerCode: "AURORA-03" });
    expect(await repository.queueForDriver("driver-queue")).toMatchObject({ status: QueueStatus.ASSIGNED });
  }, 20_000);

  it("resets Aurora test data without replacing its catalog", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const id = "60000000-0000-4000-8000-000000000006";
    await repository.reserveSession({ id, establishmentId: "est_aurora_001", chargerCode: "AURORA-01", driverName: "Motorista Reset", method: "CARD", authorizedCents: 2500 });
    await repository.attachPayment(id, "pi_test_reset", "requires_capture");
    await repository.recordPayment({ sessionId: id, paymentIntentId: "pi_test_reset", status: PaymentStatus.AUTHORIZED, providerStatus: "requires_capture", receivedAmount: 0 });
    await repository.hardwareEvent("AURORA-01", "CONNECT");

    const snapshot = await repository.resetTestData();

    expect(snapshot.sessions).toEqual([]);
    expect(snapshot.queue).toEqual([]);
    expect(snapshot.establishments[0]?.chargers).toHaveLength(6);
    expect(snapshot.establishments[0]?.chargers.every((charger) => charger.physicalStatus === "AVAILABLE" && charger.commercialStatus === "AVAILABLE_TO_START" && charger.currentPowerKw === 0)).toBe(true);
    expect(snapshot.establishments[0]?.chargers.map((charger) => charger.code)).toEqual(["AURORA-01", "AURORA-02", "AURORA-03", "AURORA-04", "AURORA-05", "AURORA-06"]);
  }, 20_000);

  it("resolves Aurora by UUID, code and QR without exposing commercial session data", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const identifiers = ["00000000-0000-4000-8000-000000000002", "AURORA-02", "aurora-02"];
    const resolutions = await Promise.all(identifiers.map((identifier) => repository.resolveCharger(identifier)));

    expect(resolutions.map((item) => item.charger.id)).toEqual([identifiers[0], identifiers[0], identifiers[0]]);
    expect(resolutions[0]?.charger.parkingSpot).toBe("B02");
    expect(await repository.catalog()).toEqual(expect.not.objectContaining({ sessions: expect.anything(), queue: expect.anything() }));
    expect(JSON.stringify(await repository.catalog())).not.toMatch(/driver|email|payment_intent/i);
    expect((await repository.catalog()).establishments[0]?.chargers).toHaveLength(6);
  }, 20_000);

  it("baselines legacy data once and preserves tariff and publication across persistent restarts", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "chargegrid-s4-"));
    let repository: CommercialRepository | undefined;
    try {
      const legacy = new PGlite(dataDir);
      for (const name of ["202609220001_commercial_core.sql", "202609220002_hardware_lifecycle.sql", "202609220003_commercial_queue.sql"]) {
        await legacy.exec(await readFile(new URL(`../../../../supabase/migrations/${name}`, import.meta.url), "utf8"));
      }
      await legacy.query("update commercial_establishments set tariff_cents = 235 where id = 'est_aurora_001'");
      await legacy.query("update commercial_chargers set published = false where code = 'AURORA-02'");
      await legacy.close();

      repository = new CommercialRepository(dataDir);
      const first = await repository.catalog();
      expect(first.establishments[0]?.tariffCents).toBe(235);
      expect(first.establishments[0]?.chargers.map((charger) => charger.code)).not.toContain("AURORA-02");
      await repository.close();
      repository = new CommercialRepository(dataDir);
      const second = await repository.catalog();
      expect(second.establishments[0]?.tariffCents).toBe(235);
      expect(second.establishments[0]?.chargers).toHaveLength(5);
      await repository.close();
      repository = undefined;

      const inspection = new PGlite(dataDir);
      expect((await inspection.query<{ count: number }>("select count(*)::int as count from chargegrid_schema_migrations")).rows[0]?.count).toBe(5);
      await inspection.close();
    } finally {
      if (repository) await repository.close();
      await rm(dataDir, { recursive: true, force: true });
    }
  }, 30_000);
});
