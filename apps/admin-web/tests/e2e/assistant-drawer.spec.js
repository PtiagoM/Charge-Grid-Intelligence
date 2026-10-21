import { expect, test } from '@playwright/test';

async function login(page, email, password) {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

test('inteligencia abre recomendacoes sem prometer assistente generativo', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com', 'teste');
  await page.goto('/#/mvp/overview');

  await expect(page.locator('.assistant-orb-button')).toHaveCount(0);
  await expect(page.getByTestId('goodwe-ai-drawer')).toHaveCount(0);
  await page.goto('/#/mvp/recommendations');
  await expect(page.getByRole('heading', { name: 'Recomendações operacionais' })).toBeVisible();
});
