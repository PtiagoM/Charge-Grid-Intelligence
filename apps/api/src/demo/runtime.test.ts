import { mkdtempSync, readFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";

let directory: string;
const start = { chargerId: "DEMO-01", driverName: "Motorista Demo", authorizedAmount: 30, paymentScenario: "approved" };
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), "chargegrid-demo-"));
  vi.stubEnv("CHARGEGRID_DEMO_ENABLED", "true");
  vi.stubEnv("CHARGEGRID_DEMO_STATE_PATH", join(directory, "state.json"));
  vi.stubEnv("NODE_ENV", "test");
});
afterEach(() => { vi.unstubAllEnvs(); rmSync(directory, { recursive: true, force: true }); });

describe("Opt-in deterministic integration demo", () => {
  it("is unavailable by default and in production", async () => {
    vi.stubEnv("CHARGEGRID_DEMO_ENABLED", "false");
    expect((await request(createApp()).get("/demo/state")).status).toBe(404);
    vi.stubEnv("CHARGEGRID_DEMO_ENABLED", "true");
    vi.stubEnv("NODE_ENV", "production");
    expect((await request(createApp()).get("/demo/state")).status).toBe(404);
  });
  it("starts, meters coherent energy/cost, preserves state after restart and stops idempotently", async () => {
    const app = createApp();
    const started = await request(app).post("/demo/sessions").send(start);
    expect(started.status).toBe(201);
    expect(started.body.plant.evKw).toBe(7);
    const measured = await request(app).post("/demo/advance").send({ minutes: 30 });
    const session = measured.body.sessions[0];
    expect(session.energyKwh).toBeCloseTo(3.5);
    expect(session.amount).toBe(5.95);
    expect(session.solarEnergyKwh).toBeCloseTo(3.5);
    expect(session.gridEnergyKwh).toBe(0);
    expect(measured.body.plant.solarKw + measured.body.plant.gridKw).toBe(measured.body.plant.buildingKw + measured.body.plant.evKw);
    expect((await request(createApp()).get("/demo/state")).body).toEqual(measured.body);
    const stopped = await request(app).post(`/demo/sessions/${session.id}/stop`);
    expect(stopped.body.sessions[0].status).toBe("completed");
    expect(stopped.body.plant.evKw).toBe(0);
    expect((await request(app).post(`/demo/sessions/${session.id}/stop`)).body).toEqual(stopped.body);
  });
  it("enforces the exact financial limit inside a time interval and redistributes available solar", async () => {
    const app = createApp();
    await request(app).post("/demo/sessions").send({ ...start, authorizedAmount: 1.7 });
    await request(app).post("/demo/sessions").send({ ...start, chargerId: "DEMO-02" });
    const result = await request(app).post("/demo/advance").send({ minutes: 60 });
    const [first, second] = result.body.sessions;
    expect(first).toMatchObject({ status: "completed", energyKwh: 1, amount: 1.7, stopReason: "financial_limit" });
    expect(Date.parse(first.endedAt) - Date.parse(first.startedAt)).toBeCloseTo(3600_000 / 7, -1);
    expect(second.energyKwh).toBeCloseTo(7);
    expect(second.solarEnergyKwh).toBeCloseTo(6 + 6 / 7);
    expect(second.gridEnergyKwh).toBeCloseTo(1 / 7);
    for (const session of result.body.sessions) expect(session.solarEnergyKwh + session.gridEnergyKwh).toBeCloseTo(session.energyKwh);
  });
  it("rejects declined payments, busy/unknown chargers and critical capacity without mutation", async () => {
    const app = createApp();
    const initial = (await request(app).get("/demo/state")).body;
    expect((await request(app).post("/demo/sessions").send({ ...start, paymentScenario: "declined" })).status).toBe(402);
    expect((await request(app).get("/demo/state")).body).toEqual(initial);
    expect((await request(app).post("/demo/sessions").send({ ...start, chargerId: "missing" })).status).toBe(404);
    await request(app).post("/demo/sessions").send(start);
    expect((await request(app).post("/demo/sessions").send(start)).body.error.code).toBe("CHARGER_BUSY");
    await request(app).post("/demo/scenario").send({ scenario: "critical" });
    expect((await request(app).post("/demo/sessions").send({ ...start, chargerId: "DEMO-02" })).body.error.code).toBe("ENERGY_CAPACITY");
  });
  it("freezes tariff at authorization and models offline stop without invented consumption", async () => {
    const app = createApp();
    await request(app).post("/demo/scenario").send({ scenario: "peak" });
    await request(app).post("/demo/sessions").send(start);
    await request(app).post("/demo/scenario").send({ scenario: "solar" });
    const before = await request(app).post("/demo/advance").send({ minutes: 10 });
    expect(before.body.sessions[0].ratePerKwh).toBe(2.6);
    const offline = await request(app).post("/demo/scenario").send({ scenario: "offline" });
    expect(offline.body.sessions[0]).toMatchObject({ status: "completed", stopReason: "offline", energyKwh: before.body.sessions[0].energyKwh });
    expect(offline.body.chargers.every((charger: { status: string }) => charger.status === "offline")).toBe(true);
    expect((await request(app).post("/demo/sessions").send(start)).body.error.code).toBe("CHARGER_OFFLINE");
  });
  it("validates empty/malformed input and resets deterministically", async () => {
    const app = createApp();
    for (const route of ["/demo/sessions", "/demo/advance", "/demo/scenario"]) expect((await request(app).post(route)).status).toBe(400);
    for (const minutes of [0, -1, 61, 0.5, null, "1"]) expect((await request(app).post("/demo/advance").send({ minutes })).status).toBe(400);
    expect((await request(app).post("/demo/sessions").send({ ...start, authorizedAmount: null })).status).toBe(400);
    expect((await request(app).post("/demo/scenario").send({ scenario: "constructor" })).status).toBe(400);
    await request(app).post("/demo/sessions").send(start);
    const reset = await request(app).post("/demo/reset");
    expect(reset.body).toMatchObject({ now: "2026-09-16T15:00:00.000Z", scenario: "solar", sessions: [], revision: 2 });
  });
  it("keeps previous persisted/in-memory state when atomic writing fails", async () => {
    const app = createApp();
    const before = (await request(app).get("/demo/state")).body;
    mkdirSync(join(directory, "state.json.tmp"));
    const result = await request(app).post("/demo/advance").send({ minutes: 1 });
    expect(result.status).toBe(500);
    expect(result.body.error.code).toBe("DEMO_STORAGE_ERROR");
    expect((await request(app).get("/demo/state")).body).toEqual(before);
    expect(JSON.parse(readFileSync(join(directory, "state.json"), "utf8"))).toEqual(before);
  });
});
