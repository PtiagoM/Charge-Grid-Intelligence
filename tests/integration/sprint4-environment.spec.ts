import { expect, test } from "@playwright/test";

const api = "http://127.0.0.1:3433";

test("uses an isolated Aurora database without Stripe credentials", async ({ request }) => {
  const health = await request.get(`${api}/health`);
  expect(health.ok()).toBe(true);
  const payments = await request.get(`${api}/payments/config`);
  expect((await payments.json()).configured).toBe(false);
  const catalog = await request.get(`${api}/commercial/catalog`);
  expect((await catalog.json()).establishments[0]).toMatchObject({ id: "est_aurora_001", chargers: expect.arrayContaining([expect.objectContaining({ code: "AURORA-01" })]) });
});
