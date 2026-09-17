import { expect, test, type Page } from "@playwright/test";

const api = "http://127.0.0.1:3333";
const pwa = "http://127.0.0.1:5174";

async function openAdmin(page: Page) {
  await page.goto("/#/login");
  await page.getByTestId("login-email").fill("estabelecimento@teste.com");
  await page.getByTestId("login-password").fill("teste");
  await page.getByTestId("login-submit").click();
  await expect(page.getByTestId("desktop-shell")).toBeVisible();
  await page.goto("/#/admin");
  await expect(page.getByTestId("demo-console")).toBeVisible();
}

test.beforeEach(async ({ request }) => {
  await expect.poll(async () => {
    try { return (await request.get(`${api}/health`)).status(); } catch { return 0; }
  }).toBe(200);
  const reset = await request.post(`${api}/demo/reset`);
  expect(reset.ok()).toBeTruthy();
});

test("motorista inicia, Admin mede e para, e ambos recuperam a mesma sessão após reload", async ({ page, browser, request }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const mobile = await mobileContext.newPage();
  mobile.on("pageerror", (error) => errors.push(error.message));
  try {
    await openAdmin(page);
    await mobile.goto(`${pwa}/demo`);
    await mobile.getByLabel("Nome do motorista").fill("Ana Sprint 3");
    await mobile.getByLabel("Limite simulado (R$)").fill("25");
    await mobile.getByRole("button", { name: "Iniciar recarga simulada" }).click();
    const mobileSession = mobile.getByTestId("demo-session-DEMO-SESSION-1");
    await expect(mobileSession).toContainText("Recarga em andamento");
    await expect(page.getByTestId("demo-sessions")).toContainText("Ana Sprint 3");
    await page.getByRole("button", { name: "Avançar 10 minutos", exact: true }).click();
    await expect(mobileSession).toContainText("1.167 kWh");
    await expect(mobileSession).toContainText(/1,98/);
    const snapshot = await (await request.get(`${api}/demo/state`)).json();
    expect(snapshot.sessions[0].energyKwh).toBeCloseTo(7 / 6, 5);
    expect(snapshot.plant.solarKw + snapshot.plant.gridKw).toBeCloseTo(snapshot.plant.buildingKw + snapshot.plant.evKw, 5);
    expect(snapshot.sessions[0].amount).toBe(1.98);
    await mobile.reload();
    await page.reload();
    await expect(mobileSession).toContainText("1.167 kWh");
    await expect(page.getByTestId("demo-sessions")).toContainText("Ana Sprint 3");
    await mobile.getByRole("button", { name: "Encerrar recarga de Ana Sprint 3" }).click();
    await expect(mobileSession).toContainText("Comprovante simulado");
    await expect.poll(async () => (await (await request.get(`${api}/demo/state`)).json()).plant.evKw).toBe(0);
    await expect(page.getByTestId("demo-events")).toContainText("STOP_CHARGE");
    expect(await mobile.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
    expect(errors).toEqual([]);
  } finally {
    await mobileContext.close();
  }
});

test("recusa e condição crítica bloqueiam início; teto encerra automaticamente", async ({ page, browser, request }) => {
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  try {
    await openAdmin(page);
    await mobile.goto(`${pwa}/demo`);
    await mobile.getByLabel("Resultado do pagamento simulado").selectOption("declined");
    await mobile.getByRole("button", { name: "Iniciar recarga simulada" }).click();
    await expect(mobile.getByRole("alert")).toContainText("recusada");
    expect((await (await request.get(`${api}/demo/state`)).json()).sessions).toHaveLength(0);
    await page.getByRole("button", { name: "Crítico", exact: true }).click();
    await expect.poll(async () => (await (await request.get(`${api}/demo/state`)).json()).scenario).toBe("critical");
    await mobile.getByLabel("Resultado do pagamento simulado").selectOption("approved");
    await mobile.getByRole("button", { name: "Iniciar recarga simulada" }).click();
    await expect(mobile.getByRole("alert")).toContainText("energética");
    await page.getByRole("button", { name: "Solar", exact: true }).click();
    await expect.poll(async () => (await (await request.get(`${api}/demo/state`)).json()).scenario).toBe("solar");
    await mobile.getByLabel("Limite simulado (R$)").fill("1");
    await mobile.getByRole("button", { name: "Iniciar recarga simulada" }).click();
    await expect(mobile.getByTestId("demo-session-DEMO-SESSION-1")).toContainText("Recarga em andamento");
    await page.getByRole("button", { name: "Avançar 10 minutos", exact: true }).click();
    await expect(mobile.getByTestId("demo-session-DEMO-SESSION-1")).toContainText("limite financeiro atingido");
    const snapshot = await (await request.get(`${api}/demo/state`)).json();
    expect(snapshot.sessions[0].amount).toBe(1);
    expect(snapshot.sessions[0].status).toBe("completed");
    expect(snapshot.chargers[0].status).toBe("available");
    expect(snapshot.plant.evKw).toBe(0);
  } finally {
    await mobile.close();
  }
});

test("offline encerra a sessão e indisponibilidade da API é recuperável", async ({ page, browser, request }) => {
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try {
    await openAdmin(page);
    await mobile.goto(`${pwa}/demo`);
    await mobile.getByRole("button", { name: "Iniciar recarga simulada" }).click();
    await expect(mobile.getByTestId("demo-session-DEMO-SESSION-1")).toContainText("Recarga em andamento");
    await page.getByRole("button", { name: "Offline", exact: true }).click();
    await expect(mobile.getByTestId("demo-session-DEMO-SESSION-1")).toContainText("carregador offline");
    await expect(mobile.getByRole("button", { name: "Iniciar recarga simulada" })).toBeDisabled();
    const stateBeforeFailure = await (await request.get(`${api}/demo/state`)).json();
    await mobile.route("**/demo/state", (route) => route.abort());
    await expect(mobile.getByRole("alert")).toBeVisible();
    await mobile.unroute("**/demo/state");
    await mobile.getByRole("button", { name: "Tentar novamente" }).click();
    await expect(mobile.getByRole("alert")).toHaveCount(0);
    expect((await (await request.get(`${api}/demo/state`)).json()).revision).toBe(stateBeforeFailure.revision);
  } finally {
    await mobile.close();
  }
});
