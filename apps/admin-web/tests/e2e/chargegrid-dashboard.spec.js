import { expect, test } from '@playwright/test';

async function login(page, email, password = 'teste') {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

test('proprietário comercial recebe visão agregada de energia e da camada ChargeGrid', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com');

  await expect(page).toHaveURL(/#\/mvp\/overview/);
  await expect(page.getByTestId('mvp-overview-panel')).toBeVisible();
  await expect(page.getByTestId('mvp-overview-kpis')).toBeVisible();
  await expect(page.getByTestId('dashboard-chargegrid-summary')).toBeVisible();
  await expect(page.getByTestId('dashboard-chargegrid-summary')).toContainText('Carregadores publicados');
  await expect(page.getByText('Operação dos carregadores', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Fila atual', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Receita ChargeGrid' }).click();
  await page.getByTestId('dashboard-chart-point-2').hover();
  await expect(page.getByText('Receita ChargeGrid', { exact: true }).last()).toBeVisible();
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
