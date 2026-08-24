import { expect, test } from '@playwright/test';

async function login(page, email) {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
}

test('GoodWe administra cliente comercial e registra auditoria', async ({ page }) => {
  await login(page, 'goodwe@teste.com');
  await page.goto('/#/mvp/clients');
  await expect(page.getByRole('heading', { name: 'Clientes comerciais', exact: true })).toBeVisible();
  await expect(page.getByText('Rede FIAP', { exact: true })).toBeVisible();

  await page.goto('/#/mvp/new-client');
  const form = page.locator('[data-form="create-client"]');
  await form.locator('input[name="name"]').fill('Grupo ChargeGrid Demo');
  await form.locator('input[name="corporateName"]').fill('Grupo ChargeGrid Demo S.A.');
  await form.locator('input[name="document"]').fill('11.222.333/0001-44');
  await form.locator('input[name="owner"]').fill('Executiva GoodWe');
  await form.locator('input[name="contactName"]').fill('Gestora Demo');
  await form.locator('input[name="contactEmail"]').fill('gestora.demo@chargegrid.local');
  await form.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/#\/mvp\/client\?client=cli-grupo-chargegrid-demo/);
  await expect(page.getByRole('heading', { name: 'Grupo ChargeGrid Demo', exact: true })).toBeVisible();

  await page.goto('/#/mvp/audit');
  await expect(page.getByText('Cliente Grupo ChargeGrid Demo criado', { exact: true })).toBeVisible();
});

test('Business consulta contrato e abre chamado somente no proprio escopo', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com');

  await page.goto('/#/mvp/contract');
  await expect(page.getByRole('heading', { name: 'Meu contrato', exact: true })).toBeVisible();
  await expect(page.getByText('CG-CTR-2026-001', { exact: true })).toBeVisible();

  await page.goto('/#/mvp/support');
  await page.getByRole('button', { name: 'Abrir chamado', exact: true }).click();
  const form = page.locator('[data-form="create-support-ticket"]');
  await form.locator('input[name="title"]').fill('Validacao operacional Business');
  await form.locator('textarea[name="description"]').fill('Solicitacao criada pelo portal do estabelecimento para validar o fluxo compartilhado.');
  await form.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/#\/mvp\/ticket\?ticket=/);
  await expect(page.getByRole('heading', { name: 'Validacao operacional Business', exact: true })).toBeVisible();

  await page.goto('/#/mvp/audit');
  await expect(page).toHaveURL(/#\/mvp\/overview/);
});
