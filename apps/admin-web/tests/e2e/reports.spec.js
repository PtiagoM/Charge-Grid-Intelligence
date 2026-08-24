import { expect, test } from '@playwright/test';

async function login(page, email, password) {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

test('MVP exibe relatórios e tarifação detalhada', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com', 'teste');

  await page.goto('/#/mvp/reports');
  await expect(page.getByTestId('mvp-reports-panel')).toBeVisible();

  await page.goto('/#/mvp/pricing');
  await expect(page.getByTestId('mvp-pricing-panel')).toBeVisible();

  await page.goto('/#/mvp/finance');
  await expect(page.getByTestId('mvp-payments-table')).toBeVisible();
});

test('MVP exibe sessões e histórico consolidado', async ({ page }) => {
  await login(page, 'goodwe@teste.com', 'teste');
  await page.goto('/#/mvp/sessions');

  await expect(page.getByTestId('mvp-sessions-active')).toBeVisible();
  await expect(page.getByTestId('mvp-sessions-finished')).toBeVisible();
});
