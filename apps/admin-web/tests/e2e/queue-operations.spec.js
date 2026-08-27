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

test('operacao representa cinco vagas e atualiza o detalhe pela selecao', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/operations');
  const operation = page.getByTestId('chargegrid-operation-stage');
  await expect(operation).toBeVisible();
  await operation.getByTestId('chargegrid-operation-scenario').selectOption('live');
  await expect(operation.getByRole('button', { name: /^A0[1-5],/ })).toHaveCount(5);
  await operation.getByRole('button', { name: /A02.*Carregando/ }).click();
  await expect(page.getByTestId('chargegrid-selected-charger')).toContainText('Carregando');

  await operation.getByRole('button', { name: /A04.*Falha/ }).click();
  await expect(page.getByTestId('chargegrid-selected-charger')).toContainText('Falha de comunicação com o veículo');
  await expect(page.getByRole('link', { name: 'Ver ocorrência' })).toBeVisible();

  await operation.getByRole('button', { name: /A05.*Disponível/ }).click();
  const availableCharger = page.getByTestId('chargegrid-selected-charger');
  await expect(availableCharger).toContainText('Disponível');
  await expect(availableCharger.getByRole('link', { name: 'Ver sessão' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Liberar recarga' })).toBeVisible();
});

test('carrossel mantem cinco posicoes e percorre carregadores adicionais sem alterar a fixture principal', async ({ page }) => {
  await login(page);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/#/mvp/operations');

  const operation = page.getByTestId('chargegrid-operation-stage');
  await expect(operation.getByTestId('chargegrid-operation-scenario')).toHaveValue('full');
  const stage = operation.getByRole('region', { name: 'Vagas e carregadores da planta' });
  const visibleSpots = operation.getByRole('button', { name: /^A\d{2},/ });
  const next = operation.getByRole('button', { name: 'Mostrar próximas vagas' });
  const previous = operation.getByRole('button', { name: 'Mostrar vagas anteriores' });

  await expect(visibleSpots).toHaveCount(5);
  await expect(operation.getByRole('button', { name: /^A01,/ })).toBeVisible();
  const vehicles = operation.getByTestId('chargegrid-connected-vehicle');
  await expect(vehicles).toHaveCount(5);
  for (let index = 0; index < 5; index += 1) {
    await expect(vehicles.nth(index)).toHaveAttribute('src', new RegExp(`vehicle-bay-a0${index + 1}\\.png$`));
  }
  await expect(operation.locator('.cg-bay-line, .cg-bay-glow')).toHaveCount(0);
  await expect(next).toBeEnabled();
  await expect(previous).toBeDisabled();
  await stage.screenshot({ path: 'output/playwright/chargegrid-operation-all-vehicles-test.png' });

  await stage.focus();
  await stage.press('ArrowRight');
  await expect(operation.getByRole('button', { name: /^A06,/ })).toBeVisible();
  await expect(operation.getByRole('button', { name: /^A01,/ })).toHaveCount(0);

  await next.click();
  await next.click();
  await expect(operation.getByRole('button', { name: /^A08,/ })).toBeVisible();
  await expect(visibleSpots).toHaveCount(5);
  await expect(operation.getByTestId('chargegrid-connected-vehicle')).toHaveCount(5);
  await expect(next).toBeDisabled();
  await expect(previous).toBeEnabled();
  await stage.screenshot({ path: 'output/playwright/chargegrid-operation-all-vehicles-shifted-test.png' });
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
