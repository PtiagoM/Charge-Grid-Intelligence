import { expect, test } from '@playwright/test';

async function login(page, email = 'estabelecimento@teste.com') {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
}

test('estabelecimento entende demanda, frescor, origem e impacto operacional', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/energy');

  const energy = page.getByTestId('mvp-energy-panel');
  await expect(energy).toContainText('Shopping FIAP');
  await expect(energy).toContainText('76,00 kW');
  await expect(energy).toContainText('Novos inicios');
  await expect(energy).toContainText('Permitidos');
  await expect(energy).toContainText('renovavel no periodo');
  await expect(page.getByTestId('energy-recommendation')).toContainText('Monitorar margem');
  await expect(page.getByTestId('mvp-queue-panel')).toContainText('motoristas aguardando');
});

test('GoodWe abre unidade critica e recebe recomendacao sem autoexecucao', async ({ page }) => {
  await login(page, 'goodwe@teste.com');
  await page.goto('/#/mvp/energy');
  await expect(page.getByTestId('energy-portfolio')).toContainText('MercadoX Pinheiros');
  await page.getByRole('link', { name: 'Abrir energia' }).nth(1).click();

  const energy = page.getByTestId('mvp-energy-panel');
  await expect(energy).toContainText('Critico');
  await expect(energy).toContainText('Bloqueados');
  await expect(page.getByTestId('energy-recommendation')).toContainText('Pausar novos inicios');
  await expect(page.getByTestId('energy-recommendation').getByRole('link')).toHaveCount(0);
});

test('navegacao preserva escopo GoodWe na vertical de energia', async ({ page }) => {
  await login(page, 'goodwe@teste.com');
  await page.getByLabel('Escopo operacional').selectOption('est-fiap');
  await page.getByRole('link', { name: 'Energia', exact: true }).click();
  await expect(page).toHaveURL(/#\/mvp\/energy\?est=est-fiap/);
  await expect(page.getByTestId('mvp-energy-panel')).toContainText('Shopping FIAP');
});
