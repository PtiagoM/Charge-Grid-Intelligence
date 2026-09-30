import { expect, test } from '@playwright/test';

async function login(page, email, password = 'teste') {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

test('proprietário comercial recebe visão agregada de energia e da camada ChargeGrid', async ({ page }) => {
  const summaryRequests = [];
  await page.route('**/commercial/dashboard-summary**', async (route) => {
    const url = new URL(route.request().url());
    summaryRequests.push(url);
    const metric = (value) => ({ value, provenance: 'DERIVED', quality: 'FRESH', unavailableReason: null });
    await route.fulfill({ json: {
      contractVersion: 'S4-C2',
      establishmentId: url.searchParams.get('establishmentId'),
      plantId: null,
      period: { from: url.searchParams.get('from'), to: url.searchParams.get('to') },
      generatedAt: new Date().toISOString(),
      energy: { evWh: metric(12_000), solarToEvWh: metric(4_000), gridImportWh: metric(8_000), gridExportWh: metric(0) },
      financial: { capturedCents: metric(1_800), refundedCents: metric(0), netCapturedCents: metric(1_800) },
      demand: { currentGridImportKw: metric(8.5), peakGridImportKw: metric(11), limitKw: metric(20) },
      utilization: { occupiedChargerSeconds: metric(25_200), publishedChargerSeconds: metric(33_600), ratio: metric(0.75) },
      counts: { sessionsCreatedInPeriod: metric(3), activeSessionsAtGeneration: metric(1), chargersAtGeneration: metric(4), availableChargersAtGeneration: metric(3), queuedEntriesAtGeneration: metric(0) }
    } });
  });
  await login(page, 'estabelecimento@teste.com');

  await expect(page).toHaveURL(/#\/mvp\/overview/);
  await expect(page.getByTestId('mvp-overview-panel')).toBeVisible();
  await expect(page.getByTestId('mvp-overview-kpis')).toBeVisible();
  await expect(page.getByTestId('dashboard-chargegrid-summary')).toBeVisible();
  await expect(page.getByTestId('dashboard-chargegrid-summary')).toContainText('Carregadores publicados');
  await expect(page.getByText('Operação dos carregadores', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Fila atual', { exact: true })).toHaveCount(0);
  await expect(page.getByTestId('dashboard-summary-metrics')).toContainText('12,00 kWh');
  await page.getByRole('button', { name: 'Receita ChargeGrid' }).click();
  await expect(page.getByTestId('dashboard-summary-metrics')).toContainText('R$ 18,00');
  await page.getByRole('button', { name: 'Demanda ChargeGrid' }).click();
  await expect(page.getByTestId('dashboard-summary-metrics')).toContainText('8,50 kW');
  await expect(page.getByTestId('dashboard-summary-metrics')).toContainText('11,00 kW');
  await expect(page.getByTestId('dashboard-summary-metrics')).toContainText('20,00 kW');
  await page.getByRole('button', { name: 'Utilização ChargeGrid' }).click();
  await expect(page.getByTestId('dashboard-summary-metrics')).toContainText('75,00%');
  await expect(page.getByTestId('dashboard-summary-metrics')).toContainText('3/4');
  await page.getByRole('button', { name: '24h' }).click();
  await expect.poll(() => summaryRequests.at(-1)?.searchParams.get('from')).not.toBe(summaryRequests[0]?.searchParams.get('from'));
  const dayRequest = summaryRequests.at(-1);
  expect(dayRequest?.searchParams.get('establishmentId')).toBeTruthy();
  expect(Date.parse(dayRequest.searchParams.get('to')) - Date.parse(dayRequest.searchParams.get('from'))).toBe(24 * 60 * 60 * 1000);
  await expect(page.getByTestId('dashboard-environment-card')).toContainText('Solar para recarga');
  await expect(page.getByTestId('dashboard-environment-card')).toContainText('4,00 kWh');
  await expect(page.getByTestId('dashboard-environment-card')).toContainText('CO₂ evitado (estimativa)');
  await expect(page.getByTestId('dashboard-environment-card')).toContainText('Indisponível');
  await expect(page.getByTestId('dashboard-economy-metrics')).toContainText('0,00 kWh');
  await expect(page.getByTestId('dashboard-economy-metrics')).toContainText('12,00 kWh');
  await expect(page.getByTestId('dashboard-economy-metrics')).toContainText('Economia estimada na conta');
});

test('Central GoodWe mantém mapa agregado e mostra a prévia comercial somente ao selecionar uma usina', async ({ page }) => {
  await login(page, 'goodwe@teste.com');

  await expect(page.getByTestId('world-charger-map')).toBeVisible();
  await expect(page.getByTestId('google-world-map')).toBeVisible();
  await expect(page.getByTestId('mvp-overview-kpis')).toContainText('Usinas monitoradas');
  await expect(page.locator('[data-form="google-map-address-search"]')).toHaveCount(0);
  await expect(page.getByTestId('world-map-popover')).toBeVisible();
  await expect(page.getByTestId('world-map-popover')).toContainText('Operação ChargeGrid');
  await page.getByRole('button', { name: 'Expandir resumo das usinas' }).click();
  await expect(page.getByTestId('dashboard-station-state-list')).toBeVisible();
  await expect(page.getByTestId('dashboard-chargegrid-summary')).toBeVisible();
  await expect(page.getByTestId('mvp-kpi-active-sessions')).toHaveCount(0);
  await expect(page.getByText('Operação dos carregadores', { exact: true })).toHaveCount(0);
});

test('proprietário comercial acessa carregadores, sessões e tarifação', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com');

  await page.goto('/#/mvp/chargers');
  await expect(page.getByTestId('mvp-chargers-panel')).toBeVisible();
  await page.getByRole('tab', { name: 'Carregador veicular' }).click();
  await page.getByRole('link', { name: /Abrir CG-FIAP/ }).first().click();
  await expect(page.getByTestId('mvp-charger-detail')).toBeVisible();

  await page.goto('/#/mvp/sessions');
  await expect(page.getByTestId('mvp-sessions-active')).toBeVisible();
  await expect(page.getByTestId('mvp-sessions-finished')).toBeVisible();

  await page.goto('/#/mvp/pricing?est=est-fiap');
  await expect(page.getByTestId('mvp-pricing-panel')).toBeVisible();
  await page.goto('/#/mvp/finance?est=est-fiap');
  await expect(page.getByTestId('mvp-payments-table')).toBeVisible();
});
