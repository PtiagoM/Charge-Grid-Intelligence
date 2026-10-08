import { readFile } from "node:fs/promises";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const api = "http://127.0.0.1:3433";
const pwa = "http://127.0.0.1:5274";
const admin = "http://127.0.0.1:5273";
const establishmentId = "est_aurora_001";
const driverToken = "sprint4-test-driver-token";
const driverHeaders = { Authorization: `Bearer ${driverToken}` };

async function reset(request: APIRequestContext) {
  const response = await request.post(`${api}/commercial/test-data/reset`);
  expect(response.ok(), await response.text()).toBe(true);
}

async function loginAdmin(page: Page) {
  await page.goto(`${admin}/#/login`);
  await page.getByTestId("login-email").fill("aurora@teste.com");
  await page.getByTestId("login-password").fill("teste");
  await page.getByTestId("login-submit").click();
  await expect(page.getByRole("link", { name: "Lista de usinas" })).toBeVisible();
}

test.beforeEach(async ({ request }) => reset(request));
test.afterEach(async ({ request }) => reset(request));

test("E03: authenticated queue assignment is shared with Admin and can proceed to checkout", async ({ page, request }) => {
  const guestJoin = await request.post(`${api}/commercial/queue`, { data: { establishmentId } });
  expect(guestJoin.status()).toBe(401);

  for (let index = 1; index <= 6; index += 1) {
    const code = `AURORA-${String(index).padStart(2, "0")}`;
    const connected = await request.post(`${api}/commercial/chargers/${code}/hardware`, { data: { action: "CONNECT" } });
    expect(connected.ok(), await connected.text()).toBe(true);
  }

  const queueResponse = await request.post(`${api}/commercial/queue`, { headers: driverHeaders, data: { establishmentId } });
  expect(queueResponse.status(), await queueResponse.text()).toBe(201);
  const joined = await queueResponse.json();
  expect(joined).toMatchObject({ driverId: "driver_sprint4_test_001", driverName: "Motorista Sprint 4", status: "WAITING", position: 1 });

  const duplicate = await request.post(`${api}/commercial/queue`, { headers: driverHeaders, data: { establishmentId } });
  expect(duplicate.status(), await duplicate.text()).toBe(201);
  expect((await duplicate.json()).id).toBe(joined.id);

  await loginAdmin(page);
  await page.goto(`${admin}/#/mvp/queue?est=${establishmentId}`);
  const queuePage = page.getByTestId("queue-operations-page");
  await expect(queuePage).toContainText("Motorista Sprint 4");
  await expect(queuePage).toContainText("#1");

  const released = await request.post(`${api}/commercial/chargers/AURORA-01/hardware`, { data: { action: "DISCONNECT" } });
  expect(released.ok(), await released.text()).toBe(true);
  await expect.poll(async () => {
    const snapshot = await (await request.get(`${api}/commercial/snapshot?establishmentId=${establishmentId}`)).json();
    return snapshot.queue.find((entry: { id: string }) => entry.id === joined.id);
  }).toMatchObject({ status: "CALLED", chargerCode: "AURORA-01", position: 0 });

  const myQueue = await request.get(`${api}/commercial/queue/driver/driver_sprint4_test_001`, { headers: driverHeaders });
  expect((await myQueue.json()).entry).toMatchObject({ id: joined.id, status: "CALLED", chargerCode: "AURORA-01" });
  await expect(queuePage).toContainText("AURORA-01");

  const catalog = await (await request.get(`${api}/commercial/catalog`)).json();
  const charger = catalog.establishments.find((item: { id: string }) => item.id === establishmentId).chargers.find((item: { code: string }) => item.code === "AURORA-01");
  const quoteResponse = await request.post(`${api}/commercial/quotes`, { headers: driverHeaders, data: { chargerId: charger.id, establishmentId } });
  expect(quoteResponse.status(), await quoteResponse.text()).toBe(201);
  const { quote } = await quoteResponse.json();
  const sessionId = "6f0e03be-82f0-4e0c-8c8f-1f9ce28a6042";
  const intentResponse = await request.post(`${api}/payments/intents`, {
    headers: { ...driverHeaders, "Idempotency-Key": `queue-checkout-${sessionId}` },
    data: { sessionId, quoteId: quote.id, method: "CARD", amount: 25 }
  });
  expect(intentResponse.status(), await intentResponse.text()).toBe(201);
  const intent = await intentResponse.json();
  const authorized = await request.get(`${api}/payments/${intent.paymentIntentId}`, { headers: driverHeaders });
  expect((await authorized.json()).session).toMatchObject({ id: sessionId, chargerCode: "AURORA-01", status: "WAITING_START" });
  expect((await (await request.get(`${api}/commercial/snapshot?establishmentId=${establishmentId}`)).json()).queue).toContainEqual(expect.objectContaining({ id: joined.id, status: "ASSIGNED", sessionId }));
});

test("E06: tariff versions affect new quotes only and Admin CSV exports persisted sessions", async ({ page, request }) => {
  const telemetry = await request.post(`${api}/commercial/plants/plant_aurora_001/hardware`, { data: { online: true, pvKw: 0, buildingLoadKw: 10 } });
  expect(telemetry.ok(), await telemetry.text()).toBe(true);
  const catalog = await (await request.get(`${api}/commercial/catalog`)).json();
  const establishment = catalog.establishments.find((item: { id: string }) => item.id === establishmentId);
  const charger = establishment.chargers.find((item: { code: string }) => item.code === "AURORA-01");
  const quoteResponse = await request.post(`${api}/commercial/quotes`, { data: { chargerId: charger.id, establishmentId } });
  expect(quoteResponse.status(), await quoteResponse.text()).toBe(201);
  const { quote: acceptedQuote, guestToken } = await quoteResponse.json();
  expect(acceptedQuote.energyCentsPerKwh).toBe(190);

  const sessionId = "6f0e03be-82f0-4e0c-8c8f-1f9ce28a6043";
  const intentResponse = await request.post(`${api}/payments/intents`, {
    headers: { "X-Session-Token": guestToken, "Idempotency-Key": `tariff-session-${sessionId}` },
    data: { sessionId, quoteId: acceptedQuote.id, method: "CARD", amount: 25 }
  });
  expect(intentResponse.status(), await intentResponse.text()).toBe(201);
  const intent = await intentResponse.json();
  const authorizedResponse = await request.get(`${api}/payments/${intent.paymentIntentId}`, { headers: { "X-Session-Token": guestToken } });
  expect((await authorizedResponse.json()).session.quote).toMatchObject({ id: acceptedQuote.id, energyCentsPerKwh: 190 });

  await loginAdmin(page);
  await page.goto(`${admin}/#/mvp/pricing?est=${establishmentId}`);
  const pricing = page.getByTestId("mvp-pricing-panel");
  await expect(pricing).toContainText("1,90");
  await page.getByRole("button", { name: "Nova versao" }).click();
  const editor = page.getByTestId("tariff-editor-form");
  await editor.locator("input[name=energyPrice]").fill("2.15");
  await editor.locator("input[name=idlePrice]").fill("0.60");
  await editor.locator("textarea[name=reason]").fill("Ajuste controlado para validar nova cotacao.");
  await editor.getByRole("button", { name: "Publicar politica" }).click();
  await expect(pricing).toContainText("Nova tarifa publicada pela API.");
  await expect(pricing).toContainText("2,15");
  await expect(pricing).toContainText("Historico de versoes");

  const updatedSnapshot = await (await request.get(`${api}/commercial/snapshot?establishmentId=${establishmentId}`)).json();
  expect(updatedSnapshot.tariffs).toHaveLength(2);
  expect(updatedSnapshot.sessions[0].quote).toMatchObject({ id: acceptedQuote.id, energyCentsPerKwh: 190 });
  const newCatalog = await (await request.get(`${api}/commercial/catalog`)).json();
  const newCharger = newCatalog.establishments.find((item: { id: string }) => item.id === establishmentId).chargers.find((item: { code: string }) => item.code === "AURORA-02");
  const nextQuoteResponse = await request.post(`${api}/commercial/quotes`, { data: { chargerId: newCharger.id, establishmentId } });
  expect((await nextQuoteResponse.json()).quote).toMatchObject({ energyCentsPerKwh: 215, idleCentsPerMinute: 60 });

  await page.goto(`${pwa}/qr/AURORA-02`);
  await expect(page.getByRole("heading", { name: "AURORA-02" })).toBeVisible();
  await page.getByRole("link", { name: "Continuar como visitante" }).click();
  await expect(page.locator(".checkout-summary")).toContainText("R$ 2,15/kWh");

  const today = new Date();
  const from = new Date(today);
  from.setUTCDate(from.getUTCDate() - 1);
  const dateInputValue = (date: Date) => date.toISOString().slice(0, 10);
  await page.goto(`${admin}/#/mvp/reports?est=${establishmentId}`);
  const reportForm = page.getByTestId("report-builder");
  await reportForm.locator("select[name=type]").selectOption("SESSIONS");
  await reportForm.locator("input[name=periodFrom]").fill(dateInputValue(from));
  await reportForm.locator("input[name=periodTo]").fill(dateInputValue(today));
  await reportForm.getByRole("button").click();
  await expect(page.getByRole("status")).toContainText("Relatorio pronto com 1 registro");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar CSV" }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  const csv = await readFile(path!, "utf8");
  expect(csv).toContain(sessionId);
  expect(csv).toContain("AURORA-01");
});
