import { expect, test } from '@playwright/test';

async function login(page, email, password) {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

test('cada conta demo entra no ambiente correto', async ({ page }) => {
  await login(page, 'goodwe@teste.com', 'teste');
  await expect(page).toHaveURL(/#\/mvp\/overview/);

  await page.goto('/#/logout');
  await login(page, 'estabelecimento@teste.com', 'teste');
  await expect(page).toHaveURL(/#\/mvp\/overview/);

  await page.goto('/#/logout');
  await login(page, 'usuario@teste.com', 'teste');
  await expect(page).toHaveURL(/#\/drive\/home/);
});

test('guardas de rota impedem acesso entre perfis', async ({ page }) => {
  await login(page, 'usuario@teste.com', 'teste');
  await expect(page).toHaveURL(/#\/drive\/home/);

  await page.goto('/#/mvp/overview');
  await expect(page).toHaveURL(/#\/drive\/home/);

  await page.goto('/#/goodwe/overview');
  await expect(page).toHaveURL(/#\/drive\/home/);

  await page.goto('/#/logout');
  await login(page, 'goodwe@teste.com', 'teste');
  await page.goto('/#/drive/home');
  await expect(page).toHaveURL(/#\/mvp\/overview/);

  await page.goto('/#/logout');
  await login(page, 'estabelecimento@teste.com', 'teste');

  await page.goto('/#/mvp/establishments');
  await expect(page).toHaveURL(/#\/mvp\/overview/);

  await page.goto('/#/mvp/location?est=est-mercadox&loc=loc-mercadox-pinheiros');
  await expect(page).toHaveURL(/#\/mvp\/overview/);
});
