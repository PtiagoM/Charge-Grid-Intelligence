import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

const api = "http://127.0.0.1:3433";
const control = "http://127.0.0.1:3434";
const pwa = "http://127.0.0.1:5274";
const admin = "http://127.0.0.1:5273";
const establishmentId = "est_aurora_001";
const chargerCode = "AURORA-01";

async function reset(request: APIRequestContext) {
  const response = await request.post(`${api}/commercial/test-data/reset`);
  expect(response.ok(), await response.text()).toBe(true);
}

async function loginAdmin(page: Page) {
  await page.goto(`${admin}/#/login`);
  await page.getByTestId("login-email").fill("aurora@teste.com");
  await page.getByTestId("login-password").fill("teste");
  await page.getByTestId("login-submit").click();
  await expect(page.getByRole("link", { name: "ChargeGrid" })).toBeVisible();
}

test.beforeEach(async ({ request }) => reset(request));
test.afterEach(async ({ request }) => reset(request));

test("E01/E02: quote Aurora, persist one authorized session and preserve it through API restart", async ({ page, request }) => {
  const config = await (await request.get(`${api}/payments/config`)).json();
  expect(config).toEqual({ provider: "stripe", mode: "test", configured: false });
  expect(await (await request.get(`${api}/test-harness`)).json()).toMatchObject({ isolated: true, paymentProvider: "deterministic-test-only" });
  const telemetry = await request.post(`${api}/commercial/plants/plant_aurora_001/hardware`, { data: { online: true, pvKw: 20, buildingLoadKw: 10 } });
  expect(telemetry.ok(), await telemetry.text()).toBe(true);

  const catalog = await (await request.get(`${api}/commercial/catalog`)).json();
  const establishment = catalog.establishments.find((item: { id: string }) => item.id === establishmentId);
  const charger = establishment.chargers.find((item: { code: string }) => item.code === chargerCode);
  expect(charger).toMatchObject({ code: chargerCode, commercialStatus: "AVAILABLE_TO_START" });

  await page.goto(`${pwa}/qr/${chargerCode}`);
  await expect(page.getByRole("heading", { name: chargerCode })).toBeVisible();
  await expect(page.getByText("Disponível para iniciar")).toBeVisible();
  await page.getByRole("link", { name: "Continuar como visitante" }).click();
  await expect(page.getByRole("heading", { name: "Defina seu limite" })).toBeVisible();
  await expect(page.locator(".checkout-summary")).toContainText(chargerCode);

  const quoteResponse = await request.post(`${api}/commercial/quotes`, { data: { chargerId: charger.id, establishmentId } });
  expect(quoteResponse.status(), await quoteResponse.text()).toBe(201);
  const { quote, guestToken } = await quoteResponse.json();
  expect(quote.chargerId).toBe(charger.id);

  const sessionId = "6f0e03be-82f0-4e0c-8c8f-1f9ce28a6041";
  const intentResponse = await request.post(`${api}/payments/intents`, {
    headers: { "X-Session-Token": guestToken, "Idempotency-Key": `intent-${sessionId}-CARD-2500` },
    data: { sessionId, quoteId: quote.id, method: "CARD", amount: 25 }
  });
  expect(intentResponse.status(), await intentResponse.text()).toBe(201);
  const intent = await intentResponse.json();
  expect(intent.paymentIntentId).toContain(sessionId.replaceAll("-", ""));

  const authorizationResponse = await request.get(`${api}/payments/${intent.paymentIntentId}`, { headers: { "X-Session-Token": guestToken } });
  expect(authorizationResponse.ok(), await authorizationResponse.text()).toBe(true);
  const authorized = await authorizationResponse.json();
  expect(authorized.session).toMatchObject({ id: sessionId, chargerId: charger.id, chargerCode, status: "WAITING_START" });
  expect(authorized.session.payment).toMatchObject({ paymentIntentId: intent.paymentIntentId, status: "AUTHORIZED", authorizedCents: 2500 });
  const sessionPublicCode = authorized.session.publicCode;
  expect(sessionPublicCode).toMatch(/^CG-/);

  await loginAdmin(page);
  await page.goto(`${admin}/#/mvp/operations?est=${establishmentId}`);
  const operation = page.getByTestId("chargegrid-operation-stage");
  await expect(operation).toContainText(chargerCode);
  await expect(operation).toContainText("Aguardando");

  const connected = await request.post(`${api}/commercial/chargers/${chargerCode}/hardware`, { data: { action: "CONNECT" } });
  expect(connected.ok(), await connected.text()).toBe(true);
  await expect.poll(async () => {
    const snapshot = await (await request.get(`${api}/commercial/snapshot?establishmentId=${establishmentId}`)).json();
    return snapshot.sessions[0]?.status;
  }).toBe("CHARGING");

  let snapshot = await (await request.get(`${api}/commercial/snapshot?establishmentId=${establishmentId}`)).json();
  expect(snapshot.sessions).toHaveLength(1);
  expect(snapshot.sessions[0]).toMatchObject({ id: sessionId, chargerId: charger.id, chargerCode, status: "CHARGING" });
  expect(snapshot.establishments[0].chargers.find((item: { code: string }) => item.code === chargerCode)).toMatchObject({ currentSessionId: sessionId, physicalStatus: "CHARGING", commercialStatus: "OCCUPIED" });

  await expect(operation).toContainText("Carregando");
  await expect(operation).toContainText(sessionId.slice(0, 8));

  await page.goto(`${admin}/#/mvp/sessions?est=${establishmentId}`);
  const sessions = page.getByTestId("mvp-sessions-active");
  await expect(sessions).toContainText("Sessões de recarga");
  await expect(sessions).toContainText(chargerCode);
  await expect(sessions).toContainText(sessionPublicCode);

  const restarted = await request.post(`${control}/restart`);
  expect(restarted.ok(), await restarted.text()).toBe(true);
  await expect.poll(async () => (await (await request.get(`${api}/test-harness`)).json()).isolated).toBe(true);
  snapshot = await (await request.get(`${api}/commercial/snapshot?establishmentId=${establishmentId}`)).json();
  expect(snapshot.sessions).toHaveLength(1);
  expect(snapshot.sessions[0]).toMatchObject({ id: sessionId, chargerId: charger.id, chargerCode, status: "CHARGING" });
  expect(snapshot.sessions[0].payment).toMatchObject({ paymentIntentId: intent.paymentIntentId, status: "AUTHORIZED" });

  await page.reload();
  await expect(page.getByTestId("mvp-sessions-active")).toContainText(sessionPublicCode);
  await page.goto(`${pwa}/qr/${chargerCode}`);
  await expect(page.getByText("Em uso no momento")).toBeVisible();
});
