import { expect, test } from '@playwright/test';

async function login(page, email = 'goodwe@teste.com', password = 'teste') {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

test('login apresenta somente contas administrativas', async ({ page }) => {
  await page.goto('/#/login');

  await expect(page.getByTestId('auth-shell')).toBeVisible();
  await expect(page.getByTestId('login-card')).toBeVisible();
  await expect(page.getByTestId('login-email')).toBeVisible();
  await expect(page.getByTestId('login-password')).toBeVisible();
  await expect(page.getByTestId('demo-account-list')).toContainText('GOODWE');
  await expect(page.getByTestId('demo-account-list')).toContainText('ESTABELECIMENTO');
  await expect(page.getByTestId('demo-account-list')).not.toContainText('USUARIO');
});

test('GoodWe vincula planta existente sem recadastrar dados técnicos', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/plants');

  await expect(page.getByTestId('plants-portfolio')).toBeVisible();
  await expect(page.getByTestId('plant-card-gw-plant-fiap-vila-mariana')).toContainText('Disponível');
  await page.getByRole('link', { name: 'Vincular planta' }).click();

  const withoutEv = page.locator('.plant-picker-grid article').filter({ hasText: 'Centro Solar sem EV' });
  await withoutEv.getByRole('button', { name: 'Verificar planta' }).click();
  await expect(page.getByRole('alert')).toContainText('Nenhum carregador EV foi detectado');

  const eligible = page.locator('.plant-picker-grid article').filter({ hasText: 'FIAP Vila Mariana' });
  await eligible.getByRole('button', { name: 'Verificar planta' }).click();
  await page.getByTestId('onboarding-establishment').selectOption('est-fiap');
  await page.getByTestId('onboarding-commercial-name').fill('Hub FIAP Vila Mariana');

  await page.goto('/#/mvp/plants');
  await page.goto('/#/mvp/plant-onboarding');
  await expect(page.getByText('Rascunho retomado', { exact: true })).toBeVisible();
  await expect(page.getByTestId('onboarding-establishment')).toHaveValue('est-fiap');
  await expect(page.getByTestId('onboarding-commercial-name')).toHaveValue('Hub FIAP Vila Mariana');
  await page.getByRole('button', { name: 'Revisar publicação' }).click();

  await expect(page.getByTestId('onboarding-review')).toContainText('2 carregadores');
  await expect(page.getByTestId('onboarding-review')).toContainText('Pré-condições atendidas');
  await page.getByTestId('publish-plant').click();

  await expect(page).toHaveURL(/#\/mvp\/plant\?plant=gw-plant-fiap-vila-mariana/);
  await expect(page.getByTestId('plant-detail')).toContainText('Vinculada');
  await expect(page.locator('#plant-commercial')).toContainText('Hub FIAP Vila Mariana');
  await expect(page.locator('#plant-commercial')).toContainText('Shopping FIAP');
});

test('estabelecimento não acessa catálogo técnico de plantas', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com');
  await page.goto('/#/mvp/plants');
  await expect(page).toHaveURL(/#\/mvp\/overview/);
  await expect(page.getByTestId('plants-portfolio')).toHaveCount(0);
});
