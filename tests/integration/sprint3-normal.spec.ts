import { expect, test, type APIRequestContext } from "@playwright/test";

const api = "http://127.0.0.1:3333";
const pwa = "http://localhost:5174";
const admin = "http://localhost:5173";
const e2eDriverId = "sprint3-e2e-driver";
const codes = Array.from({ length: 6 }, (_, index) => `AURORA-${String(index + 1).padStart(2, "0")}`);

async function hardware(request: APIRequestContext, code: string, action: string) {
  const response = await request.post(`${api}/commercial/chargers/${code}/hardware`, { data: { action } });
  expect(response.ok(), await response.text()).toBe(true);
}

async function resetTestData(request: APIRequestContext) {
  const response = await request.post(`${api}/commercial/test-data/reset`);
  expect(response.ok(), await response.text()).toBe(true);
}

test.beforeEach(async ({ request }) => { await resetTestData(request); });
test.afterEach(async ({ request }) => { await resetTestData(request); });

test("laboratório reinicia o estado operacional sem apagar o catálogo Aurora", async ({ page, request }) => {
  await hardware(request, "AURORA-02", "CONNECT");
  await page.goto(`${admin}/#/login`);
  await page.getByTestId("login-email").fill("aurora@teste.com");
  await page.getByTestId("login-password").fill("teste");
  await page.getByTestId("login-submit").click();
  await page.goto(`${admin}/#/admin`);
  await expect(page.getByTestId("hardware-lab")).toContainText("Veículo conectado");
  page.once("dialog", (dialog) => void dialog.accept());
  await page.getByRole("button", { name: "Reiniciar dados de teste" }).click();
  await expect(page.getByRole("status")).toContainText("Os seis carregadores estão disponíveis");

  const snapshot = await (await request.get(`${api}/commercial/snapshot?establishmentId=est_aurora_001`)).json();
  expect(snapshot.sessions).toEqual([]);
  expect(snapshot.queue).toEqual([]);
  expect(snapshot.establishments[0].chargers).toHaveLength(6);
  expect(snapshot.establishments[0].chargers.every((charger: { physicalStatus: string; commercialStatus: string }) => charger.physicalStatus === "AVAILABLE" && charger.commercialStatus === "AVAILABLE_TO_START")).toBe(true);
});

test("código operacional e falha física usam o mesmo carregador persistido", async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${pwa}/scan`);
  await page.getByLabel("Código do carregador").fill("AURORA-01");
  await page.getByRole("button", { name: "Confirmar código" }).click();
  await expect(page).toHaveURL(`${pwa}/qr/AURORA-01`);
  await expect(page.getByRole("heading", { name: "AURORA-01" })).toBeVisible();

  await hardware(request, "AURORA-01", "OFFLINE");
  await expect(page.getByText("Falha no equipamento")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Falha no equipamento")).toBeVisible();
  await hardware(request, "AURORA-01", "RECOVER");
  await expect(page.getByText("Disponível para iniciar")).toBeVisible();
});

test("fila normal sincroniza PWA e Admin e atribui o carregador liberado", async ({ browser, request }) => {
  const driverId = e2eDriverId;
  for (const code of codes) await hardware(request, code, "CONNECT");

  const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await mobileContext.addInitScript((profile) => localStorage.setItem("chargegrid.driver.v2", JSON.stringify({
    version: 2,
    account: { profile, authProvider: "local" },
    isAuthenticated: true,
    theme: "light",
    selectedEstablishmentId: "est_aurora_001",
    selectedChargerId: "AURORA-01",
    session: null,
    queue: null,
    receipts: [],
    notifications: []
  })), { id: driverId, fullName: "Motorista E2E Sprint 3", email: `${driverId}@chargegrid.test`, vehicleName: "EV E2E" });
  const mobile = await mobileContext.newPage();
  await mobile.goto(`${pwa}/place/est_aurora_001`);
  await expect(mobile.getByText("Lotado · fila ativa")).toBeVisible();
  await mobile.getByRole("button", { name: "Entrar na fila da planta" }).click();
  await mobile.getByRole("button", { name: "Confirmar entrada na fila" }).click();
  await expect(mobile.getByRole("heading", { name: "Você está na fila" })).toBeVisible();

  const desktopContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const desktop = await desktopContext.newPage();
  await desktop.goto(`${admin}/#/login`);
  await desktop.getByTestId("login-email").fill("aurora@teste.com");
  await desktop.getByTestId("login-password").fill("teste");
  await desktop.getByTestId("login-submit").click();
  await desktop.waitForTimeout(2500);
  await desktop.goto(`${admin}/#/mvp/queue?est=est_aurora_001`);
  await expect(desktop.getByText("Motorista E2E Sprint 3", { exact: true }).first()).toBeVisible();

  await hardware(request, "AURORA-03", "DISCONNECT");
  await expect(mobile.getByRole("heading", { name: "É a sua vez" })).toBeVisible();
  await expect(mobile.getByText("AURORA-03 · vaga C03")).toBeVisible();
  await expect(desktop.getByText(/Motorista E2E Sprint 3 em admissão automática/)).toBeVisible();
  await mobile.reload();
  await expect(mobile.getByRole("heading", { name: "É a sua vez" })).toBeVisible();

  await mobile.getByRole("button", { name: "Sair da fila" }).click();
  await expect.poll(async () => (await (await request.get(`${api}/commercial/queue/driver/${driverId}`)).json()).entry).toBeNull();
  await mobileContext.close();
  await desktopContext.close();
});
