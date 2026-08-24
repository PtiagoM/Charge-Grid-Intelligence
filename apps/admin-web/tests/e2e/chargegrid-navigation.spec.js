import { expect, test } from '@playwright/test';

async function login(page, email, password = 'teste') {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

const semsNavigation = [
  'Painel',
  'Lista de usinas',
  'Lista de dispositivos',
  'Central de alarmes',
  'Central de relatórios',
  'Ferramentas de análise',
  'Centro de serviço'
];

test('a Central GoodWe mantém o shell SEMS+ e recebe somente visão estratégica', async ({ page }) => {
  await login(page, 'goodwe@teste.com');
  const navigation = page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link');
  await expect(navigation).toHaveCount(7);
  for (const [index, label] of semsNavigation.entries()) {
    await expect(navigation.nth(index)).toHaveAttribute('title', label);
  }

  await page.getByTitle('Lista de usinas').click();
  const context = page.getByRole('navigation', { name: 'Navegação de Lista de usinas' });
  await expect(context).toContainText('Lista de usinas');
  await expect(context).toContainText('Carteira comercial');
  await expect(context).not.toContainText('Ativações ChargeGrid');

  await page.goto('/#/mvp/operations');
  await expect(page.getByTestId('access-denied')).toBeVisible();
});

test('consultor enxerga carteira atribuída, ativações e contratos sem operar sessões', async ({ page }) => {
  await login(page, 'consultor@teste.com');
  await page.getByTitle('Lista de usinas').click();
  const context = page.getByRole('navigation', { name: 'Navegação de Lista de usinas' });
  await expect(context).toContainText('Ativações ChargeGrid');
  await expect(context).toContainText('Contratos por planta');

  await page.goto('/#/mvp/plants');
  await expect(page.getByText('GoodWe California Solar Hub')).toHaveCount(0);
  await page.goto('/#/mvp/sessions');
  await expect(page.getByTestId('access-denied')).toBeVisible();
});

test('conta SEMS+ comum funciona sem qualquer vínculo ChargeGrid', async ({ page }) => {
  await login(page, 'usuario@teste.com');
  await expect(page).toHaveURL(/#\/mvp\/overview/);
  await expect(page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link')).toHaveCount(7);
  await expect(page.getByLabel('Assistente ChargeGrid')).toHaveCount(0);
  await expect(page.getByText('Camada ChargeGrid', { exact: true })).toHaveCount(0);
  await expect(page.getByTitle('Gestão da organização')).toHaveCount(0);

  await page.getByTitle('Lista de dispositivos').click();
  await expect(page.getByText('Operação ChargeGrid', { exact: true })).toHaveCount(0);
  await page.goto('/#/mvp/finance');
  await expect(page.getByTestId('access-denied')).toBeVisible();
});

test('escopo GoodWe permanece ao alternar entre superfícies', async ({ page }) => {
  await login(page, 'consultor@teste.com');
  await page.getByLabel('Escopo operacional').selectOption('est-fiap');
  await page.getByTitle('Ferramentas de análise').click();
  await expect(page).toHaveURL(/#\/mvp\/analysis-iv\?est=est-fiap/);
  await page.getByRole('link', { name: 'Energia e demanda' }).click();
  await expect(page).toHaveURL(/#\/mvp\/energy\?est=est-fiap/);
  await expect(page.getByLabel('Escopo operacional')).toHaveValue('est-fiap');
});
