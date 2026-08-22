import { expect, test } from '@playwright/test';

test('login apresenta somente contas administrativas', async ({ page }) => {
  await page.goto('/#/login');

  await expect(page.getByTestId('auth-shell')).toBeVisible();
  await expect(page.getByTestId('login-card')).toBeVisible();
  await expect(page.getByTestId('login-email')).toBeVisible();
  await expect(page.getByTestId('login-password')).toBeVisible();
  await expect(page.getByTestId('demo-account-list')).toContainText('GOODWE');
  await expect(page.getByTestId('demo-account-list')).toContainText('ESTABELECIMENTO');
  await expect(page.getByTestId('demo-account-list')).not.toContainText('USUARIO');
});
