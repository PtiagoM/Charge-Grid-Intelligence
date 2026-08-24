import { expect, test } from '@playwright/test';

async function login(page, email) {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
}

test('não existem cadastros manuais de ponto ou carregador GoodWe no fluxo publicado', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com');
  await page.goto('/#/mvp/establishment?est=est-fiap');
  await expect(page.getByText('Cadastrar novo ponto')).toHaveCount(0);

  await page.goto('/#/mvp/location?est=est-fiap&loc=loc-fiap-aclimacao');
  await expect(page.getByText('Cadastro de carregador')).toHaveCount(0);
  await expect(page.locator('[data-form="create-charger"]')).toHaveCount(0);

  await page.goto('/#/mvp/new-location?est=est-fiap');
  await expect(page).toHaveURL(/#\/mvp\/overview/);
});

test('administrador local controla a publicação individual do carregador', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com');
  await page.goto('/#/mvp/charger?est=est-fiap&charger=CG-FIAP-01');
  await expect(page.getByRole('heading', { name: 'Publicação comercial' })).toBeVisible();
  await expect(page.getByText('PUBLISHED', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Suspender publicação' }).click();
  await expect(page.getByText('SUSPENDED', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Publicar no ChargeGrid' })).toBeVisible();
});

test('técnico mantém diagnóstico SEMS+ sem dados comerciais ou pessoais', async ({ page }) => {
  await login(page, 'suporte@teste.com');
  await page.goto('/#/mvp/charger?est=est-fiap&charger=CG-FIAP-01');
  await expect(page.getByText('Monitoramento operacional', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Publicação comercial' })).toHaveCount(0);
  await expect(page.getByText('Ana Souza', { exact: true })).toHaveCount(0);
  await expect(page.getByTestId('charger-command-form')).toHaveCount(0);
});

test('seção de contratos fica explícita na URL da governança', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com');
  await page.goto('/#/mvp/access?section=contracts');
  await expect(page).toHaveURL(/section=contracts/);
  await expect(page.getByRole('heading', { name: 'Contratos e ativações por planta' })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/section=contracts/);
  await expect(page.getByRole('heading', { name: 'Contratos e ativações por planta' })).toBeVisible();
});
