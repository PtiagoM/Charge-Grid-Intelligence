import { expect, test } from '@playwright/test';

async function login(page, email = 'estabelecimento@teste.com') {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
}

test('falha da API ao publicar tarifa preserva a versao exibida', async ({ page }) => {
  await page.route('**/commercial/**', (route) => route.abort());
  await login(page);
  await page.goto('/#/mvp/pricing?est=est-fiap');
  await expect(page.getByTestId('mvp-pricing-panel')).toContainText('Versao 1');
  await page.getByRole('button', { name: 'Nova versao' }).click();
  const form = page.getByTestId('tariff-editor-form');
  await form.getByLabel('Preco da energia (R$/kWh)').fill('3.25');
  await form.getByLabel('Ociosidade (R$/min)').fill('0.70');
  await form.getByLabel('Motivo da alteracao').fill('Reajuste contratual anual');
  await form.getByRole('button', { name: 'Publicar politica' }).click();
  await expect(page.getByTestId('mvp-pricing-panel').getByRole('status')).toContainText('Failed to fetch');
  await expect(page.getByTestId('mvp-pricing-panel')).toContainText('Versao 1');
  await expect(form).toBeVisible();
});

test('financeiro separa captura de taxas e repasse indisponiveis no sandbox', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/finance?est=est-fiap');
  const dashboard = page.getByTestId('finance-dashboard');
  await expect(dashboard).toContainText('Capturado');
  await expect(dashboard).toContainText('Taxas e repasse');
  await expect(dashboard).toContainText('não recebidos do Stripe sandbox');
  const capturedRow = page.getByRole('row').filter({ hasText: 'CG-2026-0998' });
  await capturedRow.getByRole('link', { name: 'Abrir detalhe' }).click();
  const detail = page.getByTestId('financial-session-detail');
  await expect(detail.getByRole('button', { name: 'Conciliar pagamento' })).toHaveCount(0);
  await expect(detail).toContainText('Não informado');
  await detail.getByRole('link', { name: 'Voltar ao financeiro' }).click();
  await expect(capturedRow).toContainText('Capturado');
});

test('detalhe do pagamento preserva sessao, navegacao e auditoria financeira', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/session?est=est-fiap&session=CG-2026-0998');
  await page.getByRole('link', { name: 'Abrir pagamento' }).click();
  await expect(page).toHaveURL(/financial-session\?est=est-fiap&transaction=pay-CG-2026-0998/);
  await expect(page.getByRole('tab', { name: 'Resumo financeiro' })).toHaveAttribute('aria-selected', 'true');
  const detail = page.getByTestId('financial-session-detail');
  await expect(detail).toContainText('Política tariff-est-fiap-v1');
  await expect(detail.getByRole('heading', { name: 'Do consumo ao valor líquido' })).toBeVisible();
  await expect(detail.getByRole('heading', { name: 'Histórico do pagamento' })).toBeVisible();
  await expect(page.getByTestId('refund-form')).toHaveCount(0);
  await expect(detail).toContainText('CG-2026-0998');
  await expect(detail).toContainText('Capturado');
});

test('proprietario administrador consulta e gerencia tarifa e financeiro', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com');
  await page.goto('/#/mvp/pricing');
  await expect(page.getByTestId('mvp-pricing-panel')).toContainText('R$ 2,95/kWh');
  await expect(page.getByRole('button', { name: 'Nova versao' })).toBeVisible();
  await page.goto('/#/mvp/finance');
  await expect(page.getByTestId('finance-dashboard')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Conciliar' })).toHaveCount(0);
  await expect(page.getByTestId('finance-dashboard')).toContainText('o painel apenas observa o ciclo financeiro persistido');
});
