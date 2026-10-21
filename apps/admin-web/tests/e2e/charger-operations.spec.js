import { expect, test } from '@playwright/test';

async function login(page, email = 'estabelecimento@teste.com') {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
}

test('operador monitora sessao autorizada sem substituir inicio automatico', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/charger?charger=CG-FIAP-03');

  await expect(page.getByTestId('charger-command-form')).toHaveCount(0);
  await expect(page.getByTestId('mvp-charger-detail')).toContainText('Somente monitoramento neste momento.');
  await page.getByRole('button', { name: 'Abrir registro de carregamento', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Registro de carregamento' })).toContainText('CG-2026-1002');
});

test('conector sem energia nao recebe comando local de liberacao', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/charger?charger=CG-FIAP-05');

  await expect(page.getByTestId('charger-command-form')).toHaveCount(0);
  await expect(page.getByTestId('mvp-charger-detail')).toContainText('Não conectado');
  await expect(page.getByTestId('mvp-charger-detail')).toContainText('0,00 kW');
});

test('estabelecimento nao acessa carregador fora do proprio escopo', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/charger?charger=CG-US-01');
  await expect(page).toHaveURL(/#\/mvp\/chargers$/);
  await expect(page.getByTestId('mvp-chargers-panel')).not.toContainText('CG-US-01');
});
