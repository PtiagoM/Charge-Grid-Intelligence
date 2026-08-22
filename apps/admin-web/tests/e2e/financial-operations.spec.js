import { expect, test } from '@playwright/test';

async function login(page, email = 'goodwe@teste.com') {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
}

test('GoodWe publica nova versao de tarifa com parametros explicitos', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/pricing?est=est-fiap');
  await expect(page.getByTestId('mvp-pricing-panel')).toContainText('Versao 1');
  await page.getByRole('button', { name: 'Nova versao' }).click();
  const form = page.getByTestId('tariff-editor-form');
  await form.getByLabel('Preco da energia (R$/kWh)').fill('3.25');
  await form.getByLabel('Ociosidade (R$/min)').fill('0.70');
  await form.getByLabel('Carencia (min)').fill('8');
  await form.getByLabel('Participacao (%)').fill('6.50');
  await form.getByLabel('Inicio da vigencia').fill('2026-09-01T00:00');
  await form.getByLabel('Motivo da alteracao').fill('Reajuste contratual anual');
  await form.getByRole('button', { name: 'Publicar politica' }).click();
  await expect(page.getByRole('status')).toContainText('Tarifa v2 publicada');
  await expect(page.getByTestId('mvp-pricing-panel')).toContainText('R$ 3,25/kWh');
});

test('financeiro separa captura, participacao, liquido e conciliacao', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/finance?est=est-fiap');
  const dashboard = page.getByTestId('finance-dashboard');
  await expect(dashboard).toContainText('Capturado');
  await expect(dashboard).toContainText('Participacao');
  await expect(dashboard).toContainText('Liquido estabelecimentos');
  const capturedRow = page.getByRole('row').filter({ hasText: 'CG-2026-0998' });
  await capturedRow.getByRole('button', { name: 'Conciliar' }).click();
  await expect(page.getByRole('status')).toContainText('Liquidacao conciliada');
  await expect(capturedRow).toContainText('Liquidado');
});

test('reembolso fica ligado a transacao e timeline financeira', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/financial-session?transaction=pay-CG-2026-0998');
  const detail = page.getByTestId('financial-session-detail');
  await expect(detail).toContainText('Politica tariff-est-fiap-v1');
  const form = page.getByTestId('refund-form');
  await form.getByLabel('Valor (R$)').fill('10.00');
  await form.getByLabel('Motivo').fill('Compensacao comercial aprovada');
  await form.getByRole('button', { name: 'Registrar reembolso' }).click();
  await expect(page.getByRole('status')).toContainText('Reembolso registrado');
  await expect(detail).toContainText('Reembolso parcial');
  await expect(detail).toContainText('REFUNDED');
});

test('estabelecimento consulta tarifa e financeiro sem controles de gestao', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com');
  await page.goto('/#/mvp/pricing');
  await expect(page.getByTestId('mvp-pricing-panel')).toContainText('R$ 2,95/kWh');
  await expect(page.getByRole('button', { name: 'Nova versao' })).toHaveCount(0);
  await page.goto('/#/mvp/finance');
  await expect(page.getByTestId('finance-dashboard')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Conciliar' })).toHaveCount(0);
});
