import { expect, test } from '@playwright/test';

async function login(page, email, password) {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

test('cada conta administrativa entra no ambiente correto', async ({ page }) => {
  await login(page, 'goodwe@teste.com', 'teste');
  await expect(page).toHaveURL(/#\/mvp\/overview/);
  const goodweDomains = page.getByRole('navigation', { name: 'Domínios principais' }).getByRole('link');
  await expect(goodweDomains).toHaveCount(6);
  await expect(goodweDomains).toHaveText(['Visão geral', 'Rede', 'Operação', 'Energia', 'Comercial', 'Inteligência']);
  await page.getByRole('link', { name: 'Rede', exact: true }).click();
  await expect(page.getByRole('navigation', { name: 'Navegação de Rede' })).toContainText('Clientes');

  await page.goto('/#/logout');
  await login(page, 'estabelecimento@teste.com', 'teste');
  await expect(page).toHaveURL(/#\/mvp\/overview/);
  await page.getByRole('link', { name: 'Rede', exact: true }).click();
  const establishmentContext = page.getByRole('navigation', { name: 'Navegação de Rede' }).getByRole('link');
  await expect(establishmentContext).toHaveText(['Pontos de recarga', 'Carregadores']);
  await expect(page.getByTestId('establishment-locations-panel')).toBeVisible();
  await expect(page.getByLabel('Estabelecimento')).toHaveCount(0);
});

test('guardas de rota e escopo impedem acesso indevido', async ({ page }) => {
  await login(page, 'goodwe@teste.com', 'teste');
  await page.goto('/#/drive/home');
  await expect(page).toHaveURL(/#\/mvp\/overview/);

  await page.goto('/#/logout');
  await login(page, 'estabelecimento@teste.com', 'teste');

  await page.goto('/#/mvp/establishments');
  await expect(page).toHaveURL(/#\/mvp\/overview/);

  await page.goto('/#/mvp/location?est=est-mercadox&loc=loc-mercadox-pinheiros');
  await expect(page).toHaveURL(/#\/mvp\/overview/);
});

test('escopo GoodWe permanece na navegação entre domínios', async ({ page }) => {
  await login(page, 'goodwe@teste.com', 'teste');
  await page.getByLabel('Escopo operacional').selectOption('est-fiap');
  await page.getByRole('link', { name: 'Energia', exact: true }).click();

  await expect(page).toHaveURL(/#\/mvp\/energy\?est=est-fiap/);
  await expect(page.getByTestId('mvp-energy-panel')).toContainText('76,00 kW');
  await expect(page.getByLabel('Escopo operacional')).toHaveValue('est-fiap');
});
