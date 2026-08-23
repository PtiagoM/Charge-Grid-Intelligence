import { expect, test } from '@playwright/test';

async function login(page, email, password) {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

test('MVP exibe visão executiva com indicadores essenciais', async ({ page }) => {
  await login(page, 'goodwe@teste.com', 'teste');

  await expect(page).toHaveURL(/#\/mvp\/overview/);
  await expect(page.getByTestId('mvp-overview-panel')).toBeVisible();
  await expect(page.getByTestId('mvp-overview-kpis')).toBeVisible();
  await expect(page.getByTestId('mvp-kpi-available')).toBeVisible();
  await expect(page.getByTestId('mvp-kpi-inuse')).toBeVisible();
  await expect(page.getByTestId('mvp-kpi-active-sessions')).toBeVisible();
  await expect(page.getByTestId('mvp-kpi-demand-state')).toBeVisible();
  await expect(page.getByTestId('mvp-overview-recommendation')).toContainText('Fila atual');
});

test('Mapa mundial mostra carregadores por endereco cadastrado', async ({ page }) => {
  await login(page, 'goodwe@teste.com', 'teste');

  await expect(page.getByTestId('world-charger-map')).toBeVisible();
  await expect(page.getByTestId('google-world-map')).toBeVisible();
  await expect(page.getByTestId('mvp-overview-kpis')).toContainText('Station Number');
  await expect(page.locator('[data-form="google-map-address-search"]')).toHaveCount(0);
  await expect(page.getByTestId('world-map-popover')).toHaveCount(0);
});

test('MVP mostra carregadores, sessões e tarifação', async ({ page }) => {
  await login(page, 'goodwe@teste.com', 'teste');

  await page.goto('/#/mvp/chargers');
  await expect(page.getByTestId('mvp-chargers-panel')).toBeVisible();
  await page.getByRole('link', { name: 'Abrir carregador' }).first().click();
  await expect(page.getByTestId('mvp-charger-detail')).toBeVisible();

  await page.goto('/#/mvp/sessions');
  await expect(page.getByTestId('mvp-sessions-active')).toBeVisible();
  await expect(page.getByTestId('mvp-sessions-finished')).toBeVisible();

  await page.goto('/#/mvp/pricing?est=est-fiap');
  await expect(page.getByTestId('mvp-pricing-panel')).toBeVisible();
  await page.goto('/#/mvp/finance?est=est-fiap');
  await expect(page.getByTestId('mvp-payments-table')).toBeVisible();
});
