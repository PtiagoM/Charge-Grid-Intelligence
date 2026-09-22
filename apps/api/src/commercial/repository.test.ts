import { CommercialSessionStatus, PaymentStatus } from "@chargegrid/shared";
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
});
