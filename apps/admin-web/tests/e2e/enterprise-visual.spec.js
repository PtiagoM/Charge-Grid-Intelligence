import { expect, test } from '@playwright/test';

async function login(page, email) {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
}

test('workspace empresarial permanece legivel em desktop e mobile', async ({ page }, testInfo) => {
  await login(page, 'goodwe@teste.com');
  await page.goto('/#/mvp/clients');
  await expect(page.getByRole('heading', { name: 'Clientes comerciais', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('goodwe-clients-desktop.png'), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/mvp/support');
  await expect(page.getByRole('heading', { name: 'Central de suporte', exact: true })).toBeVisible();
  await page.screenshot({ path: testInfo.outputPath('goodwe-support-mobile.png'), fullPage: true });

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
