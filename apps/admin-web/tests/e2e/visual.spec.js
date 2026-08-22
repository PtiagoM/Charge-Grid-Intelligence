import { expect, test } from '@playwright/test';

test('smoke das experiências Login, Quick e Drive', async ({ page }) => {
  await page.goto('/#/login');
  await expect(page.getByTestId('auth-shell')).toBeVisible();

  await page.goto('/#/quick/charger/CG-FIAP-05');
  await expect(page.getByTestId('quick-shell')).toBeVisible();

  await page.goto('/#/login');
  await page.getByTestId('login-email').fill('usuario@teste.com');
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('driver-shell')).toBeVisible();
});
