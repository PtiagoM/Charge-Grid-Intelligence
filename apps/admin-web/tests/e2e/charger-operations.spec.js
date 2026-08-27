import { expect, test } from '@playwright/test';

async function login(page, email = 'estabelecimento@teste.com') {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
}

test('operador inicia sessao autorizada e ve confirmacao por telemetria', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/charger?charger=CG-FIAP-03');

  const form = page.getByTestId('charger-command-form');
  await expect(form).toContainText('Liberar recarga');
  await form.getByPlaceholder('Descreva por que este comando esta sendo enviado').fill('Motorista confirmou conexao presencial');
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: 'Liberar recarga' }).click();

  await expect(page.getByRole('status')).toContainText('confirmado pela telemetria');
  await expect(page.getByTestId('mvp-charger-detail')).toContainText('18,60 kW');
  await expect(page.getByTestId('mvp-charger-detail')).toContainText('Confirmado');
  await page.getByRole('link', { name: 'Abrir linha do tempo' }).click();
  await expect(page.getByTestId('mvp-session-detail')).toContainText('Energia confirmada no conector');
});

test('falha de partida permanece distinta de recarga ativa', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/charger?charger=CG-FIAP-05');

  const form = page.getByTestId('charger-command-form');
  await form.getByPlaceholder('Descreva por que este comando esta sendo enviado').fill('Inicio assistido solicitado pelo motorista');
  await form.getByRole('checkbox').check();
  await form.getByRole('button', { name: 'Liberar recarga' }).click();

  await expect(page.getByRole('status')).toContainText('handshake');
  await expect(page.getByTestId('mvp-charger-detail')).toContainText('Falhou');
  await expect(page.getByTestId('mvp-charger-detail')).toContainText('0,00 kW');
});

test('estabelecimento nao acessa carregador fora do proprio escopo', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/charger?charger=CG-US-01');
  await expect(page).toHaveURL(/#\/mvp\/chargers$/);
  await expect(page.getByTestId('mvp-chargers-panel')).not.toContainText('CG-US-01');
});
