import { expect, test } from '@playwright/test';

async function login(page, email) {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByLabel('E-mail').fill(email);
  await page.getByLabel('Senha').fill('teste');
  await page.getByRole('button', { name: 'Acessar' }).click();
}

async function expectViewportIntegrity(page) {
  await expect(page.getByRole('main')).toHaveCount(1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

test('login preserva rótulos, ordem de foco e erro identificável', async ({ page }) => {
  await page.goto('/#/login');
  const email = page.getByLabel('E-mail');
  const password = page.getByLabel('Senha');

  await email.focus();
  await expect(email).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(password).toBeFocused();

  await email.fill('conta-inexistente@teste.com');
  await password.fill('invalida');
  await page.getByRole('button', { name: 'Acessar' }).click();
  await expect(page.getByTestId('login-error')).toBeVisible();
});

test('matriz de papéis e viewports mantém rotas críticas sem overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await login(page, 'goodwe@teste.com');
  await page.goto('/#/mvp/clients');
  await expect(page.getByTestId('clients-panel')).toBeVisible();
  await expectViewportIntegrity(page);

  await page.setViewportSize({ width: 1440, height: 900 });
  await login(page, 'estabelecimento@teste.com');
  await page.goto('/#/mvp/finance');
  await expect(page.getByTestId('finance-dashboard')).toBeVisible();
  await expectViewportIntegrity(page);

  await page.setViewportSize({ width: 390, height: 844 });
  await login(page, 'operador@teste.com');
  await page.goto('/#/mvp/chargers');
  await expect(page.getByTestId('mvp-chargers-panel')).toBeVisible();
  await expect(page.getByTestId('sidebar').getByRole('link', { name: 'Comercial' })).toHaveCount(0);
  await expectViewportIntegrity(page);

  await login(page, 'relatorios@teste.com');
  await page.goto('/#/mvp/reports');
  await expect(page.getByTestId('reports-operations-page')).toBeVisible();
  await expect(page.getByTestId('report-subscription-form')).toHaveCount(0);
  await expectViewportIntegrity(page);
});
