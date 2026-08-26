import { expect, test } from '@playwright/test';

async function login(page, email = 'consultor@teste.com', password = 'teste') {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();
}

test('login apresenta contas SEMS+ com e sem responsabilidade ChargeGrid', async ({ page }) => {
  await page.goto('/#/login');
  await expect(page.getByTestId('auth-shell')).toBeVisible();
  await expect(page.getByTestId('demo-account-list')).toContainText('GOODWE');
  await expect(page.getByTestId('demo-account-list')).toContainText('ESTABLISHMENT_ADMIN');
  await expect(page.getByTestId('demo-account-list')).toContainText('Somente SEMS+');
  await expect(page.getByTestId('demo-account-list')).toContainText('instalador@teste.com');
});

test('consultor pesquisa e combina filtros dentro da carteira na lista SEMS+', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/plants');

  await expect(page.getByTestId('plants-portfolio')).toBeVisible();
  await expect(page.getByTestId('plant-card-gw-plant-fiap-vila-mariana')).toContainText('Em operação');
  await page.getByLabel('Buscar planta ou dispositivo').fill('Vila Mariana');
  await page.getByTestId('plants-portfolio').getByRole('button', { name: 'Pesquisar', exact: true }).click();
  await expect(page.getByTestId('plant-card-gw-plant-fiap-vila-mariana')).toBeVisible();
  await expect(page.getByTestId('plant-card-gw-plant-mercadox-pinheiros')).toHaveCount(0);
  await page.getByLabel('Redefinir busca e filtros').click();
  await page.getByRole('button', { name: 'Filtro', exact: true }).click();
  await expect(page.getByLabel('Filtros avançados')).toBeVisible();
  await page.getByRole('button', { name: 'Usina residencial com baterias' }).click();
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByTestId('plant-card-gw-plant-fiap-vila-mariana')).toBeVisible();
  await expect(page.getByTestId('plant-card-gw-plant-mercadox-pinheiros')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ativar planta comercial' })).toHaveCount(0);

  await page.getByRole('link', { name: 'Gestão da organização' }).click();
  await page.getByRole('button', { name: 'Contratos e ativações' }).click();
  await expect(page).toHaveURL(/#\/mvp\/access\?section=contracts/);
  await expect(page.getByRole('heading', { name: 'Contratos e ativações por planta' })).toBeVisible();
  await expect(page.getByText('Ativações conduzidas pela carteira', { exact: true })).toBeVisible();
});

test('usuário SEMS+ acessa plantas técnicas sem receber a camada comercial', async ({ page }) => {
  await login(page, 'usuario@teste.com');
  await page.goto('/#/mvp/plants');
  await expect(page.getByTestId('plants-portfolio')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Ativar planta comercial' })).toHaveCount(0);
  await page.goto('/#/mvp/plant?plant=gw-plant-mercadox-pinheiros');
  await expect(page.locator('#plant-commercial')).toHaveCount(0);
});

test('Central GoodWe filtra plantas com camada ChargeGrid no painel SEMS+', async ({ page }) => {
  await login(page, 'goodwe@teste.com');
  await page.goto('/#/mvp/plants');
  await page.getByRole('button', { name: 'Filtro', exact: true }).click();
  await page.getByRole('button', { name: 'Planta ChargeGrid' }).click();
  await page.getByRole('button', { name: 'Confirmar' }).click();
  await expect(page.getByTestId('plant-card-gw-plant-fiap-aclimacao')).toContainText('ChargeGrid');
  await expect(page.getByTestId('plant-card-gw-plant-fiap-vila-mariana')).toHaveCount(0);
});
