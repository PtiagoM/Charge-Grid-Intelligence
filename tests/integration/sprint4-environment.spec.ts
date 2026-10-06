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

test("projects the same Aurora plant, charger and energy state across Admin surfaces", async ({ page, request }) => {
  await request.post(`${api}/commercial/test-data/reset`);
  await request.post(`${api}/commercial/plants/plant_aurora_001/hardware`, { data: { online: true, pvKw: 20, buildingLoadKw: 10 } });

  await page.goto("http://127.0.0.1:5273/#/login");
  await page.getByTestId("login-email").fill("aurora@teste.com");
  await page.getByTestId("login-password").fill("teste");
  await page.getByTestId("login-submit").click();
  await expect(page.getByRole("link", { name: "ChargeGrid" })).toBeVisible();

  await page.goto("http://127.0.0.1:5273/#/mvp/plants?est=est_aurora_001");
  await expect(page.getByRole("link", { name: "Abrir Hub Solar Aurora" })).toHaveAttribute("href", "#/mvp/plant?plant=plant_aurora_001");

  await page.goto("http://127.0.0.1:5273/#/mvp/operations?est=est_aurora_001");
  await expect(page.getByRole("button", { name: /A01, AURORA-01, Disponível/ })).toBeVisible();

  await request.post(`${api}/commercial/chargers/AURORA-01/hardware`, { data: { action: "FAULT" } });
  await page.goto("http://127.0.0.1:5273/#/mvp/chargers?est=est_aurora_001");
  await page.getByRole("tab", { name: "Carregador veicular" }).click();
  const aurora01 = page.getByRole("row").filter({ hasText: "AURORA-01" });
  await expect(aurora01).toContainText("Falha");
  await request.post(`${api}/commercial/chargers/AURORA-01/hardware`, { data: { action: "RECOVER" } });
  await expect(aurora01).toContainText("Inativo");

  await page.goto("http://127.0.0.1:5273/#/mvp/energy?est=est_aurora_001");
  await expect(page.getByText("20,00 kW", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("demand-v1", { exact: true })).toBeVisible();

  await page.goto("http://127.0.0.1:5273/#/mvp/reports?est=est_aurora_001");
  await expect(page.getByRole("checkbox", { name: "Hub Solar Aurora" }).first()).toBeChecked();
  await expect(page.getByText("Outras plantas permanecem indisponíveis neste protótipo")).toBeVisible();
});

test("shows the persisted simulated forecast and admission decision in Admin", async ({ page, request }) => {
  await request.post(`${api}/commercial/test-data/reset`);
  const applied = await request.post(`${api}/commercial/plants/plant_aurora_001/hardware`, { data: { scenarioId: "DEMAND_RAMP", seed: 3 } });
  expect(applied.ok()).toBe(true);

  await expect.poll(async () => {
    const response = await request.get(`${api}/commercial/plants/plant_aurora_001/forecast`);
    if (!response.ok()) return null;
    return (await response.json()).availability;
  }, { timeout: 30_000, intervals: [500, 1_000, 2_000] }).toBe("AVAILABLE");

  const [forecastResponse, energyResponse] = await Promise.all([
    request.get(`${api}/commercial/plants/plant_aurora_001/forecast`),
    request.get(`${api}/commercial/plants/plant_aurora_001/energy`)
  ]);
  const forecast = (await forecastResponse.json()).forecast;
  const energy = await energyResponse.json();
  const predictedKw = forecast.points[0].predictedGridImportKw as number;
  expect(forecast).toMatchObject({ plantId: "plant_aurora_001", provenance: "SIMULATED", horizonMinutes: 60 });
  expect(energy.decision).toMatchObject({ canAdmit: false, forecastDecision: { outcome: "PREDICTED_CRITICAL", evidence: { forecastId: forecast.id } } });

  await page.goto("http://127.0.0.1:5273/#/login");
  await page.getByTestId("login-email").fill("aurora@teste.com");
  await page.getByTestId("login-password").fill("teste");
  await page.getByTestId("login-submit").click();
  await expect(page.getByRole("link", { name: "ChargeGrid" })).toBeVisible();
  await page.goto("http://127.0.0.1:5273/#/mvp/energy?est=est_aurora_001");

  const forecastPanel = page.getByTestId("energy-forecast");
  await expect(forecastPanel).toContainText("SIMULATED_COMPOSITE · benchmark");
  await expect(forecastPanel).toContainText("Horizonte de 60 min");
  await expect(forecastPanel).toContainText(`${new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(predictedKw)} kW`);
  await expect(page.locator("#energy-decision")).toContainText("Inícios bloqueados");
  await expect(page.locator("#energy-decision")).toContainText(energy.decision.reasonCode);
});
