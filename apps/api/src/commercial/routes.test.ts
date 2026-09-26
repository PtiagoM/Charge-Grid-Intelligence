import express from "express";
import request from "supertest";
import { afterEach, describe, expect, it } from "vitest";
import { DriverAuthenticationError, type DriverVerifier } from "./driver-auth.js";
import { CommercialRepository } from "./repository.js";
import { createCommercialRouter } from "./routes.js";

const drivers = {
  "token-a": { id: "driver-a", fullName: "Motorista A", email: "a@example.test", vehicleName: "EV A" },
  "token-b": { id: "driver-b", fullName: "Motorista B", email: "b@example.test", vehicleName: "EV B" }
} as const;

const verifyDriver: DriverVerifier = async (token) => {
  const driver = drivers[token as keyof typeof drivers];
  if (!driver) throw new DriverAuthenticationError("Credencial de motorista inválida.");
  return driver;
};

describe("commercial ownership routes", () => {
  const repositories: CommercialRepository[] = [];
  afterEach(async () => Promise.all(repositories.splice(0).map((repository) => repository.close())));

  it("never trusts a driver ID from the request body or a session UUID alone", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const firstSessionId = "70000001-0000-4000-8000-000000000001";
    const secondSessionId = "70000002-0000-4000-8000-000000000002";
    await repository.reserveSession({ id: firstSessionId, establishmentId: "est_aurora_001", chargerCode: "AURORA-01", driverId: "driver-a", driverName: "Motorista A", method: "CARD", authorizedCents: 2500 });
    await repository.reserveSession({ id: secondSessionId, establishmentId: "est_aurora_001", chargerCode: "AURORA-02", driverId: "driver-b", driverName: "Motorista B", method: "CARD", authorizedCents: 2500 });
    for (let index = 1; index <= 6; index += 1) await repository.hardwareEvent(`AURORA-${String(index).padStart(2, "0")}`, "CONNECT");

    const app = express();
    app.use(express.json());
    app.use(createCommercialRouter({ repository, verifyDriver }));

    expect((await request(app).get(`/sessions/${firstSessionId}`)).status).toBe(401);
    expect((await request(app).get(`/sessions/${firstSessionId}`).set("Authorization", "Bearer token-b")).status).toBe(404);
    expect((await request(app).get(`/sessions/${firstSessionId}`).set("Authorization", "Bearer token-a")).status).toBe(200);

    const joined = await request(app).post("/queue").set("Authorization", "Bearer token-a").send({ establishmentId: "est_aurora_001", driverId: "driver-b", driverName: "Outro nome", driverVehicle: "Outro veículo" });
    expect(joined.status).toBe(201);
    expect(joined.body).toMatchObject({ driverId: "driver-a", driverName: "Motorista A", driverVehicle: "EV A" });
  }, 20_000);
});
