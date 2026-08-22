import { expect, test } from '@playwright/test';

async function login(page, email, password) {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

test('Drive mobile-first possui navegação dedicada', async ({ page }) => {
  await login(page, 'usuario@teste.com', 'teste');

  await expect(page).toHaveURL(/#\/drive\/home/);
  await expect(page.getByTestId('driver-shell')).toBeVisible();
  await expect(page.getByTestId('driver-nav')).toBeVisible();
  await expect(page.getByTestId('drive-home')).toBeVisible();

  await page.goto('/#/drive/payment?charger=CG-FIAP-05');
  await expect(page.getByTestId('drive-payment')).toBeVisible();
  await expect(page.getByTestId('driver-payment-form')).toBeVisible();
});

test('ChargeGrid Quick funciona sem login via URL de QR', async ({ page }) => {
  await page.goto('/#/quick/charger/CG-FIAP-05');
  await expect(page.getByTestId('quick-shell')).toBeVisible();
  await expect(page.getByTestId('quick-charger-page')).toBeVisible();
  await page.getByTestId('quick-go-payment').click();
  await expect(page).toHaveURL(/#\/quick\/payment\/CG-FIAP-05/);
  await expect(page.getByTestId('quick-payment-page')).toBeVisible();
  await expect(page.getByTestId('quick-payment-form')).toBeVisible();
});
