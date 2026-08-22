import { expect, test } from '@playwright/test';

async function login(page, email, password) {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

test('sessão ativa referencia um carregador existente e abre seu detalhe', async ({ page }) => {
  await login(page, 'goodwe@teste.com', 'teste');

  await page.goto('/#/mvp/sessions');
  await expect(page.getByTestId('mvp-sessions-active')).toContainText('CG-FIAP-01');
  await page.getByRole('button', { name: 'Abrir sessao' }).first().click();
  await expect(page.getByTestId('mvp-session-detail')).toContainText('CG-FIAP-01');

  await page.goto('/#/logout');
});
