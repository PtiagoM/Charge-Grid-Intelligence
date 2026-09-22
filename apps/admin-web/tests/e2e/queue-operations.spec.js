import { expect, test } from '@playwright/test';

async function login(page, email = 'estabelecimento@teste.com') {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
}

test('fila preserva FIFO e deixa admissao sob automacao da plataforma', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/queue');

  const queue = page.getByTestId('queue-operations-page');
  await expect(queue).toContainText('Marcos Silva');
  await expect(queue).toContainText('#1');
  await expect(queue).toContainText('#2');
  await expect(queue).toContainText('Automação ativa');
  await expect(queue.getByRole('button', { name: 'Chamar próximo' })).toHaveCount(0);
  await expect(queue.getByRole('button', { name: 'Confirmar chegada' })).toHaveCount(0);
  await expect(queue.getByRole('button', { name: 'Registrar no-show' })).toHaveCount(0);
  await expect(queue.getByRole('button', { name: 'Concluir admissão' })).toHaveCount(0);
});

test('Central GoodWe nao recebe operacao local de fila', async ({ page }) => {
  await login(page, 'goodwe@teste.com');
  await page.goto('/#/mvp/queue');
  await expect(page.getByTestId('access-denied')).toBeVisible();
});

test('operacao representa os carregadores da planta sem controles de cenario', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/operations');
  const operation = page.getByTestId('chargegrid-operation-stage');
  await expect(operation).toBeVisible();
  await expect(operation.getByTestId('chargegrid-operation-scenario')).toHaveCount(0);
  await expect(operation.locator('.cg-spot-hitbox')).toHaveCount(5);

  await operation.getByRole('button', { name: /A02.*CG-01.*Carregando/ }).click();
  await expect(page.getByTestId('chargegrid-selected-charger')).toContainText('Carregando');
  await operation.getByRole('button', { name: /A04.*CG-04.*Falha/ }).click();
  await expect(page.getByTestId('chargegrid-selected-charger')).toContainText('Falha');
});

test('dashboard operacional aparece no scroll e abre o novo detalhe da sessao', async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/#/mvp/operations');

  const dashboard = page.getByTestId('chargegrid-operations-dashboard');
  await dashboard.scrollIntoViewIfNeeded();
  await expect(dashboard).toBeVisible();
  await expect(dashboard).toContainText('Performance comercial');
  await expect(dashboard).toContainText('Monitoramento');
  await expect(dashboard).toContainText('Demanda e condição energética');
  await expect(dashboard).toContainText('Atenção');
  await expect(dashboard).not.toContainText('Sessões recentes');
  await expect(dashboard).not.toContainText('Fila atual');

  await dashboard.getByRole('button', { name: 'Energia', exact: true }).click();
  await expect(dashboard.getByRole('button', { name: 'Energia', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await dashboard.getByRole('button', { name: 'Semana' }).click();
  await expect(dashboard.getByRole('button', { name: 'Semana' })).toHaveAttribute('aria-pressed', 'true');

  const chargeGridNavigation = page.getByRole('tablist', { name: 'Navegação de ChargeGrid' });
  await chargeGridNavigation.getByRole('tab', { name: 'Sessões' }).click();
  await page.getByRole('link', { name: 'Abrir sessão ›' }).click();
  const detail = page.getByTestId('mvp-session-detail');
  await expect(detail).toBeVisible();
  await expect(detail).toContainText('Contexto da recarga');
  await expect(detail).toContainText('Pagamento e liquidação');
  await expect(detail).toContainText('Linha do tempo da sessão');
  await detail.getByRole('link', { name: 'Voltar à operação' }).click();
  await expect(page.getByTestId('chargegrid-operation-stage')).toBeVisible();
});
