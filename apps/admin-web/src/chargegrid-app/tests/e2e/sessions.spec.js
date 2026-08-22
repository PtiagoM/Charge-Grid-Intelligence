import { expect, test } from '@playwright/test';

async function login(page, email, password) {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

test('sessão iniciada no Drive aparece na visão de sessões do MVP', async ({ page }) => {
  await login(page, 'usuario@teste.com', 'teste');
  await page.goto('/#/drive/payment?charger=CG-FIAP-03');

  await page.locator('[data-form="driver-validate-payment"] select[name="limitAmount"]').selectOption('100');
  await page.locator('[data-form="driver-validate-payment"] select[name="paymentMethod"]').selectOption('Cartao');
  await page.getByRole('button', { name: 'Validar pagamento' }).click();
  await expect(page.getByTestId('drive-start-session-form')).toBeVisible();
  await page.getByTestId('drive-start-session-submit').click();

  await expect(page).toHaveURL(/#\/drive\/current/);
  await expect(page.getByTestId('drive-current')).toContainText('CG-FIAP-03');

  await page.goto('/#/logout');
  await login(page, 'goodwe@teste.com', 'teste');

  await page.goto('/#/mvp/sessions');
  await expect(page.getByTestId('mvp-sessions-active')).toContainText('CG-FIAP-03');

  await page.goto('/#/logout');
});
