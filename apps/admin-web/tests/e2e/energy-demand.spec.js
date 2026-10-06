import { expect, test } from '@playwright/test';

async function login(page, email = 'estabelecimento@teste.com') {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
}

test('energia distingue ausência de sincronização de uma medição operacional', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/energy');

  const energy = page.getByTestId('mvp-energy-panel');
  await expect(energy).toContainText('Shopping FIAP');
  await expect(energy).toContainText('Sem telemetria');
  await expect(energy).toContainText('Operação compartilhada indisponível');
  await expect(energy).not.toContainText('76,00 kW');
  await expect(page.getByRole('navigation', { name: 'Seções de Energia e demanda' }).getByRole('link')).toHaveCount(5);
  await expect(page.getByTestId('energy-forecast')).toBeVisible();
  // Section navigation must scroll within the page, preserving the HashRouter route.
  const sections = page.getByRole('navigation', { name: 'Seções de Energia e demanda' });
  await sections.getByRole('link', { name: 'Impacto', exact: true }).click();
  await expect(page).toHaveURL(/#\/mvp\/energy/);
  await sections.getByRole('link', { name: 'Política', exact: true }).click();
  await expect(page).toHaveURL(/#\/mvp\/energy/);
  await expect(energy).toBeVisible();
});

test('GoodWe não apresenta fixtures locais como decisão energética compartilhada', async ({ page }) => {
  await login(page, 'goodwe@teste.com');
  await page.goto('/#/mvp/energy');
  await expect(page.getByTestId('energy-portfolio')).toContainText('MercadoX Pinheiros');
  await page.getByRole('link', { name: 'Abrir energia' }).nth(1).click();

  const energy = page.getByTestId('mvp-energy-panel');
  await expect(energy).toContainText('MercadoX Pinheiros');
  await expect(energy).toContainText('Sem telemetria');
  await expect(page.getByTestId('energy-recommendation')).toContainText('Sem decisão da API');
  await expect(energy).not.toContainText('Novos inícios bloqueados');
  await expect(page.getByTestId('energy-recommendation').getByRole('link')).toHaveCount(0);
});

test('contexto GoodWe e selecionado dentro da vertical de energia', async ({ page }) => {
  await login(page, 'goodwe@teste.com');
  await page.goto('/#/mvp/energy');
  await page.getByRole('link', { name: 'Abrir energia' }).first().click();
  await expect(page).toHaveURL(/#\/mvp\/energy\?est=est-fiap/);
  await expect(page.getByTestId('mvp-energy-panel')).toContainText('Shopping FIAP');
});
