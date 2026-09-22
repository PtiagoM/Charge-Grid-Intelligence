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

async function restoreChargers(request: APIRequestContext) {
  for (const code of codes) {
    const snapshot = await (await request.get(`${api}/commercial/snapshot`)).json();
    const charger = snapshot.establishments[0].chargers.find((item: { code: string }) => item.code === code);
    if (charger.physicalStatus === "CHARGING") {
      await hardware(request, code, "STOP");
      await hardware(request, code, "DISCONNECT");
    } else if (["OFFLINE", "FAULT"].includes(charger.physicalStatus)) await hardware(request, code, "RECOVER");
    else if (charger.physicalStatus !== "AVAILABLE") await hardware(request, code, "DISCONNECT");
  }
}

async function clearE2eQueue(request: APIRequestContext) {
  const { entry } = await (await request.get(`${api}/commercial/queue/driver/${e2eDriverId}`)).json();
  if (entry) await request.post(`${api}/commercial/queue/${entry.id}/leave`, { data: { driverId: e2eDriverId } });
}

test.beforeEach(async ({ request }) => { await clearE2eQueue(request); await restoreChargers(request); });
test.afterEach(async ({ request }) => { await clearE2eQueue(request); await restoreChargers(request); });

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
