import { expect, test } from '@playwright/test';

async function login(page, email = 'goodwe@teste.com') {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
}

test('inventario preserva abas tecnicas e integra a camada ChargeGrid nos carregadores', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/chargers');
  const inventory = page.getByTestId('mvp-chargers-panel');

  await expect(page.getByRole('tab', { name: 'Inversor', exact: true })).toHaveAttribute('aria-selected', 'true');
  await expect(inventory).toContainText('ES LD');
  await page.getByLabel('Filtrar por usina').selectOption('est-fiap');
  await expect(inventory).toContainText('ES LD');
  await page.getByLabel('Limpar filtros').click();
  await expect(inventory.getByRole('button', { name: 'Filtro', exact: true })).toBeVisible();
  await inventory.getByRole('button', { name: 'Filtro', exact: true }).click();
  await expect(page.getByLabel('Filtros avançados de dispositivos')).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar' }).click();

  await page.getByRole('tab', { name: 'Carregador veicular' }).click();
  await page.getByLabel('Buscar dispositivo').fill('CG-FIAP-03');
  await expect(inventory).toContainText('CG-FIAP-03');
  await expect(inventory).not.toContainText('CG-FIAP-01');
  await page.getByLabel('Limpar filtros').click();
  await expect(inventory).toContainText('CG-FIAP-01');

  await expect(page.getByRole('tab', { name: 'Carregador veicular' })).toHaveAttribute('aria-selected', 'true');
  await expect(inventory).toContainText('ChargeGrid publicado');
  await expect(inventory.getByRole('button', { name: /Carregamento/ })).toContainText('(2)');

  await page.getByRole('tab', { name: 'Dongle' }).click();
  await expect(inventory).toContainText('Dongle 16');
  await expect(inventory).toContainText('Dongle 14');
  await expect(inventory.getByRole('button', { name: /Online/ })).toContainText('(1)');
  await expect(inventory.getByRole('button', { name: /Offline/ })).toContainText('(1)');

  await page.getByRole('tab', { name: 'Inversor de terceiros' }).click();
  await expect(inventory).toContainText('Third-party Inverter 1');
  await expect(inventory).not.toContainText('ChargeGrid publicado');
});

test('detalhe do carregador combina telemetria SEMS e contexto ChargeGrid', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com');
  await page.goto('/#/mvp/charger?charger=CG-FIAP-01');

  const detail = page.getByTestId('mvp-charger-detail');
  await expect(detail).toContainText('Detalhes do dispositivo');
  await expect(detail).toContainText('Último carregamento');
  await expect(detail).toContainText('Monitoramento operacional');
  await expect(detail).toContainText('Camada ChargeGrid');
  await expect(detail.getByAltText(/Carregador/)).toBeVisible();

  await detail.getByRole('button', { name: 'Abrir detalhes do dispositivo' }).click();
  const deviceInfo = page.getByRole('dialog', { name: 'Detalhes do dispositivo' });
  await expect(deviceInfo).toContainText('Carregador veicular');
  await expect(deviceInfo).toContainText('Número de portas de carregamento');
  await deviceInfo.getByRole('button', { name: 'Fechar detalhes do dispositivo' }).click();

  await detail.getByRole('button', { name: 'Abrir registro de carregamento' }).click();
  const chargeRecords = page.getByRole('dialog', { name: 'Registro de carregamento' });
  await expect(chargeRecords).toContainText('CG-2026-0998');
  await expect(chargeRecords).toContainText('Paulo Lima');
  await chargeRecords.getByRole('button', { name: 'Fechar registro de carregamento' }).click();

  await detail.getByRole('button', { name: 'Abrir registro de controle' }).first().click();
  const controlRecords = page.getByRole('dialog', { name: 'Registro de controle' });
  await expect(controlRecords).toContainText('Somente comandos ChargeGrid validados');
  await controlRecords.getByRole('button', { name: 'Fechar registro de controle' }).click();
});
