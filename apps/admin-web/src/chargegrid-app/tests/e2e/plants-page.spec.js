import { expect, test } from '@playwright/test';

test('login apresenta contas demo e atalho Quick', async ({ page }) => {
  await page.goto('/#/login');

  await expect(page.getByTestId('auth-shell')).toBeVisible();
  await expect(page.getByTestId('login-card')).toBeVisible();
  await expect(page.getByTestId('login-email')).toBeVisible();
  await expect(page.getByTestId('login-password')).toBeVisible();
  await expect(page.getByTestId('quick-login-list')).toContainText('GOODWE');
  await expect(page.getByTestId('quick-login-list')).toContainText('ESTABELECIMENTO');
  await expect(page.getByTestId('quick-login-list')).toContainText('USUARIO');
  await expect(page.getByTestId('quick-public-link')).toBeVisible();
});
