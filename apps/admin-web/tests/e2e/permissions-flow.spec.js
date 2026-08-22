import { expect, test } from '@playwright/test';

async function login(page, email, password) {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

async function createCharger(page, values) {
  await page.getByText('Cadastro de carregador', { exact: true }).click();
  const form = page.locator('[data-form="create-charger"]');
  await form.locator('input[name="identifier"]').fill(values.identifier);
  await form.locator('input[name="internalId"]').fill(values.internalId);
  await form.locator('input[name="serial"]').fill(values.serial);
  await form.locator('input[name="model"]').fill(values.model);
  await form.locator('input[name="powerKw"]').fill(String(values.powerKw));
  await form.locator('input[name="installationDate"]').fill(values.installationDate);
  await form.locator('button[type="submit"]').click();
}

test('GoodWe cadastra local e carregadores, estabelecimento recebe tudo automaticamente', async ({ page }) => {
  await login(page, 'goodwe@teste.com', 'teste');
  await expect(page).toHaveURL(/#\/mvp\/overview/);

  await page.goto('/#/mvp/establishment?est=est-fiap');
  await expect(page.getByRole('heading', { name: 'Shopping FIAP', exact: true })).toBeVisible();

  await page.goto('/#/mvp/new-location?est=est-fiap');

  const createLocationForm = page.locator('[data-form="create-location"]');
  await createLocationForm.locator('input[name="name"]').fill('Shopping FIAP Paulista Demo');
  await createLocationForm.locator('input[name="address"]').fill('Av. Paulista');
  await createLocationForm.locator('input[name="number"]').fill('1000');
  await createLocationForm.locator('input[name="city"]').fill('Sao Paulo');
  await createLocationForm.locator('input[name="state"]').fill('SP');
  await createLocationForm.locator('input[name="zipCode"]').fill('01310-100');
  await createLocationForm.locator('button[type="submit"]').click();

  await expect(page).toHaveURL(/#\/mvp\/location\?est=est-fiap&loc=/);
  await expect(page.getByRole('heading', { name: 'Shopping FIAP Paulista Demo', exact: true })).toBeVisible();

  const hash = new URL(page.url()).hash;
  const query = hash.includes('?') ? hash.split('?')[1] : '';
  const params = new URLSearchParams(query);
  const locationId = params.get('loc');
  expect(locationId).toBeTruthy();

  await createCharger(page, {
    identifier: 'CARREGADOR06DEMO',
    internalId: 'FIAP-PAU-06',
    serial: 'GWFIAPPAU0006',
    model: 'GoodWe AC 22',
    powerKw: 22,
    installationDate: '2026-08-18'
  });

  await createCharger(page, {
    identifier: 'CARREGADOR07DEMO',
    internalId: 'FIAP-PAU-07',
    serial: 'GWFIAPPAU0007',
    model: 'GoodWe AC 22',
    powerKw: 22,
    installationDate: '2026-08-18'
  });

  await expect(page.getByText('FIAP-PAU-06', { exact: true })).toBeVisible();
  await expect(page.getByText('FIAP-PAU-07', { exact: true })).toBeVisible();

  await page.goto('/#/logout');

  await login(page, 'estabelecimento@teste.com', 'teste');
  await expect(page).toHaveURL(/#\/mvp\/overview/);
  await expect(page.getByTestId('mvp-overview-recommendation')).toContainText('Shopping FIAP Paulista Demo');

  await page.goto('/#/mvp/locations');
  await expect(page.getByTestId('establishment-locations-panel')).toContainText('Shopping FIAP Paulista Demo');

  await page.goto(`/#/mvp/location?est=est-fiap&loc=${locationId}`);
  await expect(page.getByRole('heading', { name: 'Shopping FIAP Paulista Demo', exact: true })).toBeVisible();
  await expect(page.getByText('FIAP-PAU-06', { exact: true })).toBeVisible();
  await expect(page.getByText('FIAP-PAU-07', { exact: true })).toBeVisible();

  await expect(page.getByText('Cadastrar local')).toHaveCount(0);
  await expect(page.getByText('Adicionar carregador')).toHaveCount(0);
  await expect(page.getByText('Criar conta do estabelecimento')).toHaveCount(0);
  await expect(page.getByText('Transferir carregador')).toHaveCount(0);

  await page.goto('/#/mvp/establishments');
  await expect(page).toHaveURL(/#\/mvp\/overview/);

  await page.goto('/#/mvp/location?est=est-mercadox&loc=loc-mercadox-pinheiros');
  await expect(page).toHaveURL(/#\/mvp\/overview/);
});
