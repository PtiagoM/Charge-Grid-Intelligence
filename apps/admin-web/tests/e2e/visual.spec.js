import { expect, test } from '@playwright/test';

test('smoke das experiências administrativas GoodWe e estabelecimento', async ({ page }) => {
  await page.goto('/#/login');
  await expect(page.getByTestId('auth-shell')).toBeVisible();

  await page.getByTestId('login-email').fill('goodwe@teste.com');
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('desktop-shell')).toBeVisible();

  await page.goto('/#/logout');
  await page.getByTestId('login-email').fill('estabelecimento@teste.com');
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
  await expect(page.getByTestId('desktop-shell')).toBeVisible();
});
