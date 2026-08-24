import { expect, test } from '@playwright/test';

async function login(page, email = 'goodwe@teste.com') {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
}

test('Central GoodWe altera responsabilidade e escopo com historico preservado', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/access');
  const access = page.getByTestId('access-management-page');
  await access.getByRole('button', { name: 'Usuários e funções' }).click();
  await expect(access).toContainText('Usuários e funções');
  await expect(page.getByRole('row').filter({ hasText: 'Central GoodWe Brasil' })).toContainText('Administrador');
  await expect(page.getByRole('row').filter({ hasText: 'Consultora GoodWe SP' })).toContainText('Navegador');
  await expect(page.getByRole('row').filter({ hasText: 'Suporte técnico GoodWe' })).toContainText('Técnico');
  const editor = access.locator('.access-editor');
  await editor.getByLabel('Conta').selectOption('acc-operator-fiap');
  await editor.getByLabel('Papel ChargeGrid').selectOption('REPORT_VIEWER');
  await editor.getByLabel('Shopping FIAP').check();
  await editor.getByRole('button', { name: 'Registrar concessão' }).click();
  await expect(page.getByRole('status')).toContainText('Concessão registrada');
  const rows = page.getByRole('row').filter({ hasText: 'Operacao FIAP' });
  await expect(rows).toHaveCount(2);
  await expect(rows.filter({ hasText: 'Financeiro e relatórios' })).toContainText('Vigente');
  await expect(rows.filter({ hasText: 'Operador comercial do estabelecimento' })).toContainText('Revogado');
});

test('administrador local revoga somente a camada ChargeGrid e preserva a conta SEMS+', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com');
  await page.goto('/#/mvp/access');
  const access = page.getByTestId('access-management-page');
  await access.getByRole('button', { name: 'Usuários e funções' }).click();
  await expect(access).not.toContainText('goodwe@teste.com');
  const row = page.getByRole('row').filter({ hasText: 'Operacao FIAP' });
  await row.getByLabel('Motivo para revogar Operacao FIAP').fill('Colaborador removido da escala local.');
  await row.getByRole('button', { name: 'Revogar' }).click();
  await expect(page.getByRole('status')).toContainText('Acesso revogado imediatamente');

  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill('operador@teste.com');
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
  await expect(page).toHaveURL(/#\/mvp\/overview/);
  await expect(page.getByText('Camada ChargeGrid', { exact: true })).toHaveCount(0);
  await page.locator('.topbar-account-menu summary').click();
  await expect(page.locator('.topbar-account-menu')).toContainText('Somente SEMS+');
});

test('contrato autorizado libera somente a planta coberta pelo codigo', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com');
  await page.goto('/#/mvp/access');
  const governance = page.getByTestId('access-management-page');
  await governance.getByRole('button', { name: 'Contratos e ativações' }).click();
  await governance.getByLabel('Código de ativação').fill('CG-ACT-FIAP-VM');
  await governance.getByRole('button', { name: 'Validar contrato' }).click();
  await expect(page.getByRole('status')).toContainText('Contrato confirmado');
  await governance.getByRole('link', { name: 'Continuar onboarding' }).click();
  await expect(page).toHaveURL(/contract=contract-fiap-vila-mariana/);
  await expect(page.getByTestId('plant-onboarding')).toContainText('CG-CTR-2026-006');
  await expect(page.getByTestId('onboarding-establishment')).toHaveValue('est-fiap');
  await expect(page.getByTestId('onboarding-establishment')).toBeDisabled();
});

test('operador tem navegacao reduzida e rotas sensiveis bloqueadas no dominio', async ({ page }) => {
  await login(page, 'operador@teste.com');
  await expect(page.getByLabel('Assistente ChargeGrid')).toHaveCount(0);
  await page.goto('/#/mvp/pricing');
  await expect(page.getByTestId('access-denied')).toContainText('papel nao permite');
  await page.goto('/#/mvp/reports');
  await expect(page.getByTestId('reports-operations-page')).toBeVisible();
});

test('administrador gera e baixa CSV por tarefa assincrona', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com');
  await page.goto('/#/mvp/reports');
  const reports = page.getByTestId('reports-operations-page');
  const builder = page.getByTestId('report-builder');
  await expect(reports).toContainText('Nenhum relatorio gerado');
  await page.getByTestId('report-subscription-form').getByRole('button', { name: 'Salvar assinatura' }).click();
  await expect(page.getByRole('status')).toContainText('Assinatura atualizada e auditada');
  await expect(reports.locator('.subscription-summary')).toContainText('Vigente');
  await builder.getByLabel('Tipo').selectOption('SESSIONS');
  await builder.getByRole('button', { name: 'Gerar relatorio' }).click();
  await expect(page.getByRole('status')).toContainText('Relatorio pronto');
  const readyRow = page.getByRole('row').filter({ hasText: 'report-sessions-' });
  await expect(readyRow).toContainText('Pronto');
  const downloadPromise = page.waitForEvent('download');
  await readyRow.getByRole('button', { name: 'Baixar CSV' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('chargegrid-sessions-2026-08-01-2026-08-22.csv');
  await expect(reports).toContainText('Central de tarefas');
});

test('analista exporta e acompanha financeiro somente no escopo FIAP', async ({ page }) => {
  await login(page, 'relatorios@teste.com');
  await page.goto('/#/mvp/reports');
  const reports = page.getByTestId('reports-operations-page');
  await expect(reports).toContainText('Shopping FIAP');
  await expect(reports).not.toContainText('MercadoX Pinheiros');
  await expect(page.getByTestId('report-subscription-form')).toBeVisible();
  await page.goto('/#/mvp/finance');
  await expect(page.getByTestId('finance-dashboard')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Conciliar' })).toHaveCount(0);
});

test('falha de exportacao pode ser repetida sem apagar o historico', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/reports');
  const failed = page.getByRole('row').filter({ hasText: 'report-incidents-demo-failed' });
  await expect(failed).toContainText('Falhou');
  await failed.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('status')).toContainText('Nova tarefa concluida');
  await expect(failed).toContainText('Falhou');
  await expect(page.getByRole('row').filter({ hasText: 'Incidentes' }).filter({ hasText: 'Pronto' })).toHaveCount(1);
});
