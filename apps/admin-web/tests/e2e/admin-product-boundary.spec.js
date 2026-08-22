import { expect, test } from '@playwright/test';

async function login(page, email, password) {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

test('Admin não oferece conta nem jornada de motorista', async ({ page }) => {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await expect(page.getByTestId('demo-account-list')).toContainText('GOODWE');
  await expect(page.getByTestId('demo-account-list')).toContainText('ESTABELECIMENTO');
  await expect(page.getByTestId('demo-account-list')).not.toContainText('USUARIO');
  await expect(page.getByTestId('auth-shell')).not.toContainText('ChargeGrid Quick');
});

test('rotas do PWA não são implementadas pelo Admin', async ({ page }) => {
  await page.goto('/#/logout');
  await page.goto('/#/quick/charger/CG-FIAP-05');
  await expect(page).toHaveURL(/#\/login/);

  await login(page, 'goodwe@teste.com', 'teste');
  await page.goto('/#/drive/home');
  await expect(page).toHaveURL(/#\/mvp\/overview/);
  await expect(page.getByTestId('desktop-shell')).toBeVisible();
});
