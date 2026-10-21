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
    expect((await request(app).get("/sessions").set("Authorization", "Bearer token-a")).body.sessions).toEqual([expect.objectContaining({ id: firstSessionId })]);

    const joined = await request(app).post("/queue").set("Authorization", "Bearer token-a").send({ establishmentId: "est_aurora_001", driverId: "driver-b", driverName: "Outro nome", driverVehicle: "Outro veículo" });
    expect(joined.status).toBe(201);
    expect(joined.body).toMatchObject({ driverId: "driver-a", driverName: "Motorista A", driverVehicle: "EV A" });
  }, 20_000);

  it("exposes the canonical dashboard summary and rejects invalid periods", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const app = express();
    app.use(express.json());
    app.use(createCommercialRouter({ repository, verifyDriver }));
    const query = "?establishmentId=est_aurora_001&from=2020-01-01T00%3A00%3A00.000Z&to=2020-01-02T00%3A00%3A00.000Z";

    const summary = await request(app).get(`/dashboard-summary${query}`);
    expect(summary.status).toBe(200);
    expect(summary.body).toMatchObject({
      contractVersion: "S4-C2",
      establishmentId: "est_aurora_001",
      plantId: "plant_aurora_001",
      period: { from: "2020-01-01T00:00:00.000Z", to: "2020-01-02T00:00:00.000Z" },
      energy: { evWh: { value: null, quality: "UNAVAILABLE" } }
    });
    expect((await request(app).get("/dashboard-summary?establishmentId=est_aurora_001&from=2020-01-01&to=2020-02-02")).status).toBe(400);
    expect((await request(app).get(`/dashboard-summary${query.replace("est_aurora_001", "unknown")}`)).status).toBe(404);
  }, 20_000);

  it("applies a persisted hardware energy scenario through the commercial API", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const app = express();
    app.use(express.json());
    app.use(createCommercialRouter({ repository, verifyDriver }));

    const applied = await request(app).post("/plants/plant_aurora_001/hardware").send({ scenarioId: "SOLAR_SURPLUS", seed: 4 });
    const energy = await request(app).get("/plants/plant_aurora_001/energy");
    expect(applied.status).toBe(200);
    expect(energy.status).toBe(200);
    expect(energy.body.simulation).toMatchObject({ scenarioId: "SOLAR_SURPLUS", version: 1, seed: 4, stepSeconds: 60 });
    expect(energy.body.snapshot).toMatchObject({ source: "SIMULATED", pvKw: 30, buildingLoadKw: 8 });
  }, 20_000);

  it("reports an unavailable forecast instead of inventing a value before the first persisted prediction", async () => {
    const repository = new CommercialRepository("memory://");
    repositories.push(repository);
    const app = express();
    app.use(express.json());
    app.use(createCommercialRouter({ repository, verifyDriver }));

    const response = await request(app).get("/plants/plant_aurora_001/forecast");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ forecast: null, availability: "UNAVAILABLE", unavailableReason: "FORECAST_NOT_GENERATED" });
    expect((await request(app).get("/plants/unknown/forecast")).status).toBe(404);
  }, 20_000);
});
