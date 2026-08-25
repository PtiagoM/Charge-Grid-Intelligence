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

async function expectPrimaryNavigation(page, expected) {
  const navigation = page.getByRole('navigation', { name: 'Navegação principal' }).getByRole('link');
  await expect(navigation).toHaveCount(expected.length);
  for (const [index, label] of expected.entries()) {
    await expect(navigation.nth(index)).toHaveAttribute('title', label);
  }
}

test('Central GoodWe deriva do consultor com escopo completo e governança', async ({ page }) => {
  await login(page, 'goodwe@teste.com');
  await expectPrimaryNavigation(page, semsNavigation);
  await expect(page.getByLabel('Escopo operacional')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Gestão da organização' })).toBeVisible();

  await page.getByTitle('Lista de usinas').click();
  const context = page.getByRole('navigation', { name: 'Navegação de Lista de usinas' });
  await expect(context).toContainText('Lista de usinas');
  await expect(context).toContainText('Carteira comercial');
  await expect(context).not.toContainText('Ativações');
  await expect(context).not.toContainText('Contratos');

  await page.getByRole('link', { name: 'Gestão da organização' }).click();
  await expect(page.getByRole('button', { name: 'Usuários e funções' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Contratos e ativações' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gerenciamento de logs' })).toBeVisible();
  await page.goto('/#/mvp/operations');
  await expect(page.getByTestId('access-denied')).toBeVisible();
});

test('consultor acompanha a carteira sem governar usuários nem operar o estabelecimento', async ({ page }) => {
  await login(page, 'consultor@teste.com');
  await expectPrimaryNavigation(page, semsNavigation);
  await expect(page.getByRole('link', { name: 'Gestão da organização' })).toBeVisible();

  await page.getByRole('link', { name: 'Gestão da organização' }).click();
  await expect(page.getByRole('button', { name: 'Contratos e ativações' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Usuários e funções' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Gerenciamento de logs' })).toHaveCount(0);
  await page.goto('/#/mvp/sessions');
  await expect(page.getByTestId('access-denied')).toBeVisible();
});

test('proprietário comercial recebe ChargeGrid abaixo de dispositivos', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com');
  await expectPrimaryNavigation(page, [
    ...semsNavigation.slice(0, 3),
    'ChargeGrid',
    ...semsNavigation.slice(3)
  ]);

  await page.getByTitle('ChargeGrid').click();
  const context = page.getByRole('navigation', { name: 'Navegação de ChargeGrid' });
  await expect(context).toContainText('Operação');
  await expect(context).toContainText('Sessões');
  await expect(context).toContainText('Fila');
  await expect(context).toContainText('Resumo financeiro');

  await page.getByTitle('Central de relatórios').click();
  await expect(page.getByRole('navigation', { name: 'Navegação de Central de relatórios' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Gestão da organização' }).click();
  await expect(page.getByRole('link', { name: 'Política tarifária' })).toBeVisible();
});

test('instalador SEMS+ mantém organização técnica sem conteúdo ChargeGrid', async ({ page }) => {
  await login(page, 'instalador@teste.com');
  await expectPrimaryNavigation(page, semsNavigation);
  await expect(page.getByTitle('ChargeGrid')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Gestão da organização' })).toBeVisible();

  await page.getByRole('link', { name: 'Gestão da organização' }).click();
  await expect(page.getByText('Sem vínculo ChargeGrid', { exact: true }).last()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Contratos e ativações' })).toHaveCount(0);
  await page.goto('/#/mvp/operations');
  await expect(page.getByTestId('access-denied')).toBeVisible();
});

test('proprietário SEMS+ comum permanece sem qualquer vínculo ChargeGrid', async ({ page }) => {
  await login(page, 'usuario@teste.com');
  await expect(page).toHaveURL(/#\/mvp\/overview/);
  await expectPrimaryNavigation(page, semsNavigation);
  await expect(page.getByLabel('Assistente ChargeGrid')).toHaveCount(0);
  await expect(page.getByText('Camada ChargeGrid', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Gestão da organização' })).toHaveCount(0);
  await page.goto('/#/mvp/finance');
  await expect(page.getByTestId('access-denied')).toBeVisible();
});
