import { CommercialSessionStatus, PaymentStatus, QueueStatus } from "@chargegrid/shared";
import { afterEach, describe, expect, it } from "vitest";
import { CommercialConflictError, CommercialRepository } from "./repository.js";

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
    const snapshot = await repository.snapshot("est_aurora_001");
    expect(snapshot.sessions).toEqual([expect.objectContaining({ id, payment: expect.objectContaining({ paymentIntentId: "pi_test_chargegrid" }) })]);
    expect(snapshot.establishments[0]?.chargers[0]).toEqual(expect.objectContaining({ code: "AURORA-01", commercialStatus: "OCCUPIED" }));
    await expect(repository.reserveSession({
      id: "20000000-0000-4000-8000-000000000002",
      establishmentId: "est_aurora_001",
      chargerCode: "AURORA-01",
      driverName: "Outro Motorista",
      method: "PIX",
      authorizedCents: 2500
    })).rejects.toBeInstanceOf(CommercialConflictError);
  }, 20_000);

  it("applies simulated hardware events and advances energy only from the backend clock", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const id = "30000000-0000-4000-8000-000000000003";
    await repository.reserveSession({ id, establishmentId: "est_aurora_001", chargerCode: "AURORA-01", driverName: "Motorista Teste", method: "CARD", authorizedCents: 2500 });
    await repository.attachPayment(id, "pi_test_hardware", "requires_capture");
    await repository.recordPayment({ sessionId: id, paymentIntentId: "pi_test_hardware", status: PaymentStatus.AUTHORIZED, providerStatus: "requires_capture", receivedAmount: 0 });

    await repository.hardwareEvent("AURORA-01", "CONNECT");
    await repository.hardwareEvent("AURORA-01", "START", 7);
    const started = await repository.session(id);
    await repository.advanceEnergy(new Date(Date.parse(started.startedAt!) + 3_600_000));
    const charging = await repository.session(id);

    expect(charging).toMatchObject({ status: CommercialSessionStatus.CHARGING, currentPowerKw: 7, costCents: 1330 });
    expect(charging.energyWh).toBeCloseTo(7000, 0);
    await repository.stopSession(id);
    expect(await repository.session(id)).toMatchObject({ status: CommercialSessionStatus.ENERGY_FINISHED, currentPowerKw: 0 });
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
    await repository.hardwareEvent("AURORA-01", "START", 7);
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
});
