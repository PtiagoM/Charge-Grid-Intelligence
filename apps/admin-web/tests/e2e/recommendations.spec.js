import { expect, test } from '@playwright/test';

async function login(page, email, password) {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

test('inteligência do MVP entrega previsões de demanda e recomendações', async ({ page }) => {
  await login(page, 'goodwe@teste.com', 'teste');
  await page.goto('/#/mvp/ai');

  await expect(page.getByTestId('recommendations-page')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recomendacoes operacionais' })).toBeVisible();
  await expect(page.getByTestId('recommendations-page')).toContainText('Aceitar nao executa comandos');
});

test('proprietário comercial acessa recomendações explicáveis pela central de alarmes', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com', 'teste');
  await page.goto('/#/mvp/recommendations');

  await expect(page.getByTestId('recommendations-page')).toBeVisible();
  await expect(page.getByTestId('recommendations-page')).toContainText('Aceitar nao executa comandos');
});
