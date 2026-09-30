import { CommercialSessionStatus, PaymentStatus, QueueStatus } from "@chargegrid/shared";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, describe, expect, it } from "vitest";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MockGoodWeProvider } from "../goodwe/mock-goodwe-provider.js";
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
    await expect(repository.financialSummary("est_aurora_001")).resolves.toMatchObject({ establishmentId: "est_aurora_001", sessionCount: 1, activeSessionCount: 1, authorizedCents: 2500, consumedCents: 0 });
    await expect(repository.reserveSession({
      id: "20000000-0000-4000-8000-000000000002",
      establishmentId: "est_aurora_001",
      chargerCode: "AURORA-01",
      driverName: "Outro Motorista",
      method: "PIX",
      authorizedCents: 2500
    })).rejects.toBeInstanceOf(CommercialConflictError);
  }, 20_000);

  it("publishes a persisted tariff used only by new quotes", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const first = await repository.createQuote({ chargerId: "00000000-0000-4000-8000-000000000001", establishmentId: "est_aurora_001", access: { guestToken: "tariff-before" } });
    const tariff = await repository.publishTariff({ establishmentId: "est_aurora_001", energyCentsPerKwh: 215, idleCentsPerMinute: 60, reason: "Ajuste demonstrável de demanda." });
    const second = await repository.createQuote({ chargerId: "00000000-0000-4000-8000-000000000001", establishmentId: "est_aurora_001", access: { guestToken: "tariff-after" } });
    const snapshot = await repository.snapshot("est_aurora_001");

    expect(first.energyCentsPerKwh).toBe(190);
    expect(tariff.energyCentsPerKwh).toBe(215);
    expect(second.energyCentsPerKwh).toBe(215);
    expect(snapshot.establishments[0]?.tariffCents).toBe(215);
    expect(snapshot.tariffs[0]).toEqual(expect.objectContaining({ id: tariff.id, idleCentsPerMinute: 60 }));
  }, 20_000);

  it("offers a frozen solar tariff only from a fresh surplus sample", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    await repository.configurePlantTelemetry({ plantId: "plant_aurora_001", online: true, pvKw: 20, buildingLoadKw: 10 });
    await repository.advancePlantTelemetry();

    expect((await repository.catalog()).establishments[0]).toMatchObject({ favorableEnergyCondition: true, offerTariffCents: 170 });

    const quote = await repository.createQuote({
      chargerId: "00000000-0000-4000-8000-000000000001",
      establishmentId: "est_aurora_001",
      access: { guestToken: "solar-surplus" }
    });
    const session = await repository.reserveQuotedSession({
      id: "73000000-0000-4000-8000-000000000003",
      quoteId: quote.id,
      access: { guestToken: "solar-surplus" },
      method: "CARD",
      authorizedCents: 2500
    });

    expect(quote).toMatchObject({ energyCentsPerKwh: 170, reasonCode: "SOLAR_SURPLUS", energySampleId: expect.any(String) });
    expect(session.quote).toMatchObject({ id: quote.id, energyCentsPerKwh: 170, reasonCode: "SOLAR_SURPLUS" });
  }, 20_000);

  it("exposes the persisted demand policy and the same admission decision used by starts", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    await repository.configurePlantTelemetry({ plantId: "plant_aurora_001", online: true, pvKw: 20, buildingLoadKw: 10 });
    await repository.advancePlantTelemetry();

    await expect(repository.plantEnergyView("plant_aurora_001")).resolves.toMatchObject({
      snapshot: { plantId: "plant_aurora_001", gridImportKw: 0, evLoadKw: 0 },
      policy: { plantId: "plant_aurora_001", demandControlEnabled: true, limitKw: 20, alertPercent: 80, criticalPercent: 90 },
      decision: { plantId: "plant_aurora_001", quality: "FRESH", canAdmit: true, reasonCode: "ADMISSION_ALLOWED", projectedImportKw: 7 }
    });
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
    await repository.completeRefund({ sessionId: id, providerStatus: "succeeded", refundedCents: 2500 - ended.totalCostCents });
    expect(await repository.session(id)).toMatchObject({ status: CommercialSessionStatus.COMPLETED, payment: { status: PaymentStatus.PAID, refundedCents: 2500 - ended.totalCostCents } });
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

  it("keeps a failed stop active and accepts a new session after hardware recovery", async () => {
    class StopFailureProvider extends MockGoodWeProvider {
      async stopCharge(chargerId: string) {
        return { commandId: "failed-stop", type: "STOP_CHARGE" as const, chargerId, status: "FAILED" as const, requestedAt: new Date().toISOString() };
      }
    }
    const repository = new CommercialRepository("memory://", new StopFailureProvider());
    repositories.push(repository);
    const failedId = "31000000-0000-4000-8000-000000000003";
    const recoveredId = "32000000-0000-4000-8000-000000000003";

    await repository.reserveSession({ id: failedId, establishmentId: "est_aurora_001", chargerCode: "AURORA-01", driverName: "Motorista Teste", method: "CARD", authorizedCents: 2500 });
    await repository.attachPayment(failedId, "pi_test_stop_failure", "requires_capture");
    await repository.recordPayment({ sessionId: failedId, paymentIntentId: "pi_test_stop_failure", status: PaymentStatus.AUTHORIZED, providerStatus: "requires_capture", receivedAmount: 0 });
    await repository.hardwareEvent("AURORA-01", "CONNECT");

    await expect(repository.stopSession(failedId)).rejects.toBeInstanceOf(CommercialConflictError);
    expect(await repository.session(failedId)).toMatchObject({ status: CommercialSessionStatus.CHARGING, currentPowerKw: 7 });
    expect((await repository.snapshot("est_aurora_001")).establishments[0]?.chargers[0]).toMatchObject({ physicalStatus: "CHARGING", currentSessionId: failedId });

    await repository.hardwareEvent("AURORA-01", "FAULT");
    expect(await repository.session(failedId)).toMatchObject({ status: CommercialSessionStatus.FAULTED });
    await repository.hardwareEvent("AURORA-01", "RECOVER");
    await repository.reserveSession({ id: recoveredId, establishmentId: "est_aurora_001", chargerCode: "AURORA-01", driverName: "Motorista Recuperado", method: "CARD", authorizedCents: 2500 });
    await repository.attachPayment(recoveredId, "pi_test_after_recovery", "requires_capture");
    await repository.recordPayment({ sessionId: recoveredId, paymentIntentId: "pi_test_after_recovery", status: PaymentStatus.AUTHORIZED, providerStatus: "requires_capture", receivedAmount: 0 });
    await repository.hardwareEvent("AURORA-01", "CONNECT");

    expect(await repository.session(recoveredId)).toMatchObject({ status: CommercialSessionStatus.CHARGING, currentPowerKw: 7 });
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

  it("expires a charger assignment only from the backend clock", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    for (let index = 1; index <= 6; index += 1) await repository.hardwareEvent(`AURORA-${String(index).padStart(2, "0")}`, "CONNECT");
    const entry = await repository.joinQueue({ driverId: "driver-expire", driverName: "Motorista Expira", driverVehicle: "EV Teste", establishmentId: "est_aurora_001" });
    await repository.hardwareEvent("AURORA-01", "DISCONNECT");
    await repository.expireQueueAssignments(new Date(Date.now() + 11 * 60_000));
    expect((await repository.queueSnapshot()).find((item) => item.id === entry.id)).toMatchObject({ status: QueueStatus.EXPIRED });
    expect((await repository.snapshot("est_aurora_001")).establishments[0]?.chargers[0]).toMatchObject({ commercialStatus: "AVAILABLE_TO_START", assignmentId: null });
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

  it("persists balanced plant telemetry from the backend clock without advancing on reads", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const id = "70000000-0000-4000-8000-000000000007";
    await repository.reserveSession({ id, establishmentId: "est_aurora_001", chargerCode: "AURORA-01", driverName: "Motorista Energia", method: "CARD", authorizedCents: 2500 });
    await repository.attachPayment(id, "pi_test_energy", "requires_capture");
    await repository.recordPayment({ sessionId: id, paymentIntentId: "pi_test_energy", status: PaymentStatus.AUTHORIZED, providerStatus: "requires_capture", receivedAmount: 0 });
    await repository.hardwareEvent("AURORA-01", "CONNECT");
    await repository.configurePlantTelemetry({ plantId: "plant_aurora_001", online: true, pvKw: 20, buildingLoadKw: 10 });
    const startedAt = new Date("2026-09-26T12:00:00.000Z");
    await repository.advancePlantTelemetry(startedAt);
    await repository.advancePlantTelemetry(new Date(startedAt.getTime() + 600_000));
    const measurement = await repository.plantEnergy("plant_aurora_001");
    const beforeRead = await repository.plantEnergySeries("plant_aurora_001");
    await repository.plantEnergy("plant_aurora_001");
    expect(measurement).toMatchObject({ pvKw: 20, buildingLoadKw: 10, evLoadKw: 7, gridImportKw: 0, gridExportKw: 3 });
    expect(measurement?.evWh).toBeCloseTo(1166.667, 3);
    expect(measurement?.solarToEvWh).toBeCloseTo(1166.667, 3);
    expect((await repository.plantEnergySeries("plant_aurora_001"))).toHaveLength(beforeRead.length);
    const report = await repository.operationalReport({ establishmentId: "est_aurora_001", from: "2026-09-26T11:00:00.000Z", to: "2026-09-26T13:00:00.000Z" });
    expect(report.energy).toMatchObject({ evWh: expect.closeTo(1166.667, 3), solarToEvWh: expect.closeTo(1166.667, 3), gridImportWh: 0 });
    const fullReport = await repository.operationalReport({ establishmentId: "est_aurora_001", from: "2020-01-01T00:00:00.000Z", to: "2100-01-01T00:00:00.000Z" });
    expect(fullReport.sessions).toContainEqual(expect.objectContaining({ id, publicCode: expect.stringMatching(/^CG-/), chargerCode: "AURORA-01", energyWh: expect.any(Number) }));
    expect(fullReport.chargers).toMatchObject({ total: 6, charging: 1 });

    await repository.configurePlantTelemetry({ plantId: "plant_aurora_001", online: false, pvKw: 20, buildingLoadKw: 10 });
    await repository.advancePlantTelemetry(new Date(startedAt.getTime() + 1_200_000));
    expect(await repository.plantEnergy("plant_aurora_001")).toMatchObject({ quality: "STALE", pvKw: 20 });
    expect((await repository.plantEnergySeries("plant_aurora_001"))).toHaveLength(beforeRead.length);
  }, 20_000);

  it("keeps the last simulated plant sample after a repository restart", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "chargegrid-energy-"));
    let repository: CommercialRepository | undefined;
    try {
      repository = new CommercialRepository(dataDir);
      await repository.configurePlantTelemetry({ plantId: "plant_aurora_001", online: true, pvKw: 20, buildingLoadKw: 10 });
      await repository.advancePlantTelemetry(new Date("2026-09-26T12:00:00.000Z"));
      await repository.close();
      repository = undefined;
      repository = new CommercialRepository(dataDir);
      expect(await repository.plantEnergy("plant_aurora_001")).toMatchObject({ quality: "FRESH", pvKw: 20, buildingLoadKw: 10, evLoadKw: 0 });
    } finally {
      if (repository) await repository.close();
      await rm(dataDir, { recursive: true, force: true });
    }
  }, 30_000);

  it("rejects a second repository using the same persistent PGlite directory", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "chargegrid-lock-"));
    let first: CommercialRepository | undefined;
    let reopened: CommercialRepository | undefined;
    try {
      first = new CommercialRepository(dataDir);
      await first.catalog();
      expect(() => new CommercialRepository(dataDir)).toThrow(/já está em uso/);
      await first.close();
      first = undefined;
      reopened = new CommercialRepository(dataDir);
      await expect(reopened.catalog()).resolves.toMatchObject({ establishments: expect.any(Array) });
    } finally {
      if (first) await first.close();
      if (reopened) await reopened.close();
      await rm(dataDir, { recursive: true, force: true });
    }
  }, 30_000);

  it("recovers a persistent PGlite lock owned by a terminated process", async () => {
    const dataDir = await mkdtemp(join(tmpdir(), "chargegrid-stale-lock-"));
    const lockDir = `${dataDir}.chargegrid-lock`;
    let repository: CommercialRepository | undefined;
    try {
      await mkdir(lockDir);
      await writeFile(join(lockDir, "owner.json"), JSON.stringify({ pid: 999_999_999, startedAt: new Date().toISOString() }));
      repository = new CommercialRepository(dataDir);
      await expect(repository.catalog()).resolves.toMatchObject({ establishments: expect.any(Array) });
    } finally {
      if (repository) await repository.close();
      await rm(dataDir, { recursive: true, force: true });
    }
  }, 30_000);

  it("admits, suspends and resumes charging from the persisted demand policy", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const firstId = "71000000-0000-4000-8000-000000000001";
    const secondId = "72000000-0000-4000-8000-000000000002";
    const now = new Date();
    await repository.configurePlantTelemetry({ plantId: "plant_aurora_001", online: true, pvKw: 0, buildingLoadKw: 0 });
    await repository.advancePlantTelemetry(now);
    for (const [id, code] of [[firstId, "AURORA-01"], [secondId, "AURORA-02"]] as const) {
      await repository.reserveSession({ id, establishmentId: "est_aurora_001", chargerCode: code, driverName: "Motorista Demanda", method: "CARD", authorizedCents: 2500 });
      await repository.attachPayment(id, `pi_test_demand_${id}`, "requires_capture");
      await repository.recordPayment({ sessionId: id, paymentIntentId: `pi_test_demand_${id}`, status: PaymentStatus.AUTHORIZED, providerStatus: "requires_capture", receivedAmount: 0 });
      await repository.hardwareEvent(code, "CONNECT");
      if (code === "AURORA-01") await repository.advancePlantTelemetry(new Date(now.getTime() + 1_000));
    }
    expect(await repository.session(firstId)).toMatchObject({ status: CommercialSessionStatus.CHARGING });
    expect(await repository.session(secondId)).toMatchObject({ status: CommercialSessionStatus.CHARGING });

    await repository.configurePlantTelemetry({ plantId: "plant_aurora_001", online: true, pvKw: 0, buildingLoadKw: 8 });
    await repository.advancePlantTelemetry(new Date(now.getTime() + 2_000));
    expect(await repository.session(secondId)).toMatchObject({ status: CommercialSessionStatus.SUSPENDED_BY_DEMAND, transitionReason: "DEMAND_CRITICAL" });
    expect(await repository.session(firstId)).toMatchObject({ status: CommercialSessionStatus.CHARGING });

    await repository.configurePlantTelemetry({ plantId: "plant_aurora_001", online: true, pvKw: 0, buildingLoadKw: 0 });
    await repository.advancePlantTelemetry(new Date(now.getTime() + 3_000));
    await repository.advancePlantTelemetry(new Date(now.getTime() + 34_000));
    expect(await repository.session(secondId)).toMatchObject({ status: CommercialSessionStatus.CHARGING });
  }, 30_000);

  it("persists deterministic energy insights without executing a human review", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const unavailable = await repository.insights("est_aurora_001");
    const telemetry = unavailable.alerts.find((item) => item.type === "TELEMETRY_STALE");
    expect(telemetry).toMatchObject({ conditionActive: true, reviewState: "OPEN", reasonCode: "TELEMETRY_UNAVAILABLE" });

    await repository.configurePlantTelemetry({ plantId: "plant_aurora_001", online: true, pvKw: 20, buildingLoadKw: 10 });
    await repository.advancePlantTelemetry();
    const available = await repository.insights("est_aurora_001");
    const solar = available.recommendations.find((item) => item.type === "SOLAR_OPPORTUNITY");
    expect(solar).toMatchObject({ conditionActive: true, reviewState: "OPEN", reasonCode: "SOLAR_SURPLUS" });

    const before = await repository.snapshot("est_aurora_001");
    const decided = await repository.decideInsight({ id: solar!.id, decision: "ACCEPT", reason: "Oferta revisada pela operação." });
    const after = await repository.snapshot("est_aurora_001");
    expect(decided).toMatchObject({ id: solar!.id, reviewState: "ACCEPTED" });
    expect(after.sessions).toEqual(before.sessions);
    expect((await repository.insights("est_aurora_001")).recommendations).toContainEqual(expect.objectContaining({ id: solar!.id, reviewState: "ACCEPTED" }));

    await repository.hardwareEvent("AURORA-01", "FAULT");
    const fault = (await repository.insights("est_aurora_001")).alerts.find((item) => item.type === "HARDWARE_FAULT");
    expect(fault).toMatchObject({ conditionActive: true, reasonCode: "FAULT" });
    await repository.hardwareEvent("AURORA-01", "RECOVER");
    expect((await repository.insights("est_aurora_001")).alerts).toContainEqual(expect.objectContaining({ id: fault!.id, conditionActive: false, reasonCode: "HARDWARE_RECOVERED" }));
    await repository.decideInsight({ id: fault!.id, decision: "RESOLVE", reason: "Equipamento recuperado pelo laboratório." });
    expect((await repository.insights("est_aurora_001")).alerts).toContainEqual(expect.objectContaining({ id: fault!.id, reviewState: "RESOLVED" }));
  }, 30_000);

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
      expect((await inspection.query<{ count: number }>("select count(*)::int as count from chargegrid_schema_migrations")).rows[0]?.count).toBe(9);
      await inspection.close();
    } finally {
      if (repository) await repository.close();
      await rm(dataDir, { recursive: true, force: true });
    }
  }, 30_000);
});
