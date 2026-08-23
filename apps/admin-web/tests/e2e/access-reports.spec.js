import { expect, test } from '@playwright/test';

async function login(page, email = 'goodwe@teste.com') {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
}

test('GoodWe altera papel e escopo com historico preservado', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/access');
  const access = page.getByTestId('access-management-page');
  await expect(access).toContainText('Usuarios e acessos');
  const editor = access.locator('.access-editor');
  await editor.getByLabel('Conta').selectOption('acc-operator-fiap');
  await editor.getByLabel('Papel').selectOption('REPORT_VIEWER');
  await editor.getByLabel('Shopping FIAP').check();
  await editor.getByRole('button', { name: 'Registrar concessao' }).click();
  await expect(page.getByRole('status')).toContainText('Concessao registrada e auditada');
  const rows = page.getByRole('row').filter({ hasText: 'Operacao FIAP' });
  await expect(rows).toHaveCount(2);
  await expect(rows.filter({ hasText: 'Analista de relatorios' })).toContainText('Vigente');
  await expect(rows.filter({ hasText: 'Operador do estabelecimento' })).toContainText('Revogado');
});

test('administrador local revoga operador e o proximo login e bloqueado', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com');
  await page.goto('/#/mvp/access');
  const access = page.getByTestId('access-management-page');
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
  await expect(page.getByTestId('login-error')).toContainText('Credenciais demonstrativas invalidas');
});

test('operador tem navegacao reduzida e rotas sensiveis bloqueadas no dominio', async ({ page }) => {
  await login(page, 'operador@teste.com');
  await expect(page.getByTestId('sidebar').getByRole('link', { name: 'Comercial' })).toHaveCount(0);
  await expect(page.getByTestId('sidebar').getByRole('link', { name: 'Inteligencia' })).toHaveCount(0);
  await page.goto('/#/mvp/pricing');
  await expect(page.getByTestId('access-denied')).toContainText('papel nao permite');
  await page.goto('/#/mvp/reports');
  await expect(page.getByTestId('access-denied')).toBeVisible();
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

test('analista exporta somente FIAP e nao administra assinatura ou financeiro', async ({ page }) => {
  await login(page, 'relatorios@teste.com');
  await page.goto('/#/mvp/reports');
  const reports = page.getByTestId('reports-operations-page');
  await expect(reports).toContainText('Shopping FIAP');
  await expect(reports).not.toContainText('MercadoX Pinheiros');
  await expect(page.getByTestId('report-subscription-form')).toHaveCount(0);
  await page.goto('/#/mvp/finance');
  await expect(page.getByTestId('access-denied')).toBeVisible();
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
