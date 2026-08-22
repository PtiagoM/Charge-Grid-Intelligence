import { expect, test } from '@playwright/test';

async function login(page, email, password) {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

test('GoodWe navega entre módulos estratégicos do MVP', async ({ page }) => {
  await login(page, 'goodwe@teste.com', 'teste');
  await expect(page.getByTestId('sidebar')).toBeVisible();

  await page.goto('/#/mvp/energy');
  await expect(page.getByTestId('mvp-energy-panel')).toBeVisible();
  await expect(page.getByTestId('mvp-queue-panel')).toBeVisible();

  await page.goto('/#/mvp/ai');
  await expect(page.getByTestId('mvp-ai-panel')).toBeVisible();
  await expect(page.getByTestId('mvp-architecture-panel')).toBeVisible();

  await page.goto('/#/mvp/reports');
  await expect(page.getByTestId('mvp-reports-panel')).toBeVisible();
});

test('Estabelecimento navega entre sessões, tarifação e relatórios do MVP', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com', 'teste');

  await page.goto('/#/mvp/sessions');
  await expect(page.getByTestId('mvp-sessions-active')).toBeVisible();

  await page.goto('/#/mvp/pricing');
  await expect(page.getByTestId('mvp-pricing-panel')).toBeVisible();

  await page.goto('/#/mvp/reports');
  await expect(page.getByTestId('mvp-reports-panel')).toBeVisible();
});
