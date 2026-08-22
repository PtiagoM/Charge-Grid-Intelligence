import { expect, test } from '@playwright/test';

async function login(page, email, password) {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

test('bolinha da IA abre agente lateral sem sair da tela atual', async ({ page }) => {
  await login(page, 'goodwe@teste.com', 'teste');
  await page.goto('/#/mvp/overview');

  await page.locator('.assistant-orb-button').click();
  await expect(page).toHaveURL(/#\/mvp\/overview/);
  await expect(page.getByTestId('goodwe-ai-drawer')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Agente de IA GoodWe' })).toBeVisible();

  await page.getByLabel('Fechar agente').click();
  await expect(page.getByTestId('goodwe-ai-drawer')).toHaveCount(0);
});
