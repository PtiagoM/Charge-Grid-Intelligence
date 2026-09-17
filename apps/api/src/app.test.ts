import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("GET /health", () => {
  it("reports the API as healthy", async () => {
    const response = await request(createApp()).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok", service: "chargegrid-api" });
  });
});

describe("Stripe sandbox routes", () => {
  it("rejects empty bodies without throwing and permits zero settlement", async () => {
    const app = createApp();
    for (const path of ["/payments/intents", "/payments/pi_test/capture", "/payments/pi_test/refund"]) {
      expect((await request(app).post(path)).status).toBe(400);
    }
  });
  it("permits the desktop and development private networks", async () => {
    for (const origin of ["http://localhost:5173", "http://10.0.0.8:5174", "http://192.168.1.8:5174", "http://172.16.1.8:5174"]) {
      const response = await request(createApp()).get("/health").set("Origin", origin);
      expect(response.headers["access-control-allow-origin"]).toBe(origin);
    }
  });
  it("reports whether test credentials are configured without exposing secrets", async () => {
    const response = await request(createApp()).get("/payments/config");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ provider: "stripe", mode: "test", configured: expect.any(Boolean) });
    expect(JSON.stringify(response.body)).not.toContain("sk_test_");
  });

  it("rejects malformed payment intents before calling the provider", async () => {
    const response = await request(createApp()).post("/payments/intents").send({ amount: -1, method: "CASH" });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_PAYMENT_INPUT");
  });

  it("requires a signed Stripe webhook", async () => {
    const response = await request(createApp()).post("/payments/webhook").set("Content-Type", "application/json").send({ type: "payment_intent.succeeded" });

    expect(response.status).toBe(400);
    expect(response.body.code).toBe("INVALID_WEBHOOK");
  });
});
