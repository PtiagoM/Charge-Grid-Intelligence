import { expect, test } from '@playwright/test';

async function login(page, email = 'goodwe@teste.com') {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
}

test('pesquisa, severidade e usina filtram alarmes sem controles decorativos', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/incidents');
  const inbox = page.getByTestId('incident-inbox');

  await expect(inbox.getByRole('button', { name: 'Filtro', exact: true })).toHaveCount(0);
  await page.getByLabel('Buscar alarme').fill('inexistente');
  await expect(inbox).toContainText('Nenhum incidente neste filtro');
  await page.getByLabel('Limpar filtros').click();
  await page.getByLabel('Filtrar por severidade').selectOption('HIGH');
  await expect(inbox).toContainText('CG-MX-01 offline');
  await page.getByLabel('Filtrar alarmes por usina').selectOption('est-fiap');
  await expect(inbox).not.toContainText('CG-MX-01 offline');
});

test('GoodWe assume e resolve incidente com timeline auditavel', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/incidents');
  const row = page.getByRole('row').filter({ hasText: 'CG-MX-01 offline' });
  await expect(row).toContainText('Alta');
  await row.getByRole('link', { name: /Abrir/ }).click();

  const detail = page.getByTestId('incident-detail');
  await expect(detail).toContainText('GoodWe reportou COMMUNICATION_LOST');
  await detail.getByLabel('Responsavel').fill('NOC GoodWe');
  await detail.getByRole('button', { name: 'Assumir incidente' }).click();
  await expect(page.getByRole('status')).toContainText('Incidente atribuido');
  await detail.getByLabel('Resolucao').fill('Comunicacao do equipamento restabelecida.');
  await detail.getByRole('button', { name: 'Resolver incidente' }).click();
  await expect(page.getByRole('status')).toContainText('Incidente resolvido e auditado');
  await expect(detail).toContainText('RESOLVED');
  await expect(detail).toContainText('Comunicacao do equipamento restabelecida');
});

test('estabelecimento nao acessa incidente fora do seu escopo', async ({ page }) => {
  await login(page, 'estabelecimento@teste.com');
  await page.goto('/#/mvp/incident?incident=incident-goodwe-CG-MX-01-offline');
  await expect(page.getByTestId('access-denied')).toBeVisible();
});

test('aceitar recomendacao registra decisao sem autoexecutar comando', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/ai');
  const recommendation = page.locator('.recommendation-card').filter({ hasText: 'Monitorar margem antes da proxima admissao' });
  await expect(recommendation).toContainText('Aceitar nao executa comandos');
  await recommendation.getByRole('button', { name: 'Aceitar para revisao' }).click();
  await expect(page.getByRole('status')).toContainText('nenhuma acao foi executada automaticamente');
  await expect(recommendation).toContainText('Aceito');
  await expect(recommendation.getByRole('button', { name: 'Aceitar para revisao' })).toHaveCount(0);
});

test('adiar recomendacao exige e preserva justificativa humana', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/ai');
  const recommendation = page.locator('.recommendation-card').filter({ hasText: 'Monitorar margem antes da proxima admissao' });
  await recommendation.getByRole('button', { name: 'Adiar' }).click();
  await expect(page.getByRole('status')).toContainText('pelo menos 8 caracteres');
  await recommendation.getByLabel('Motivo para adiar ou rejeitar').fill('Aguardar leitura do proximo intervalo.');
  await recommendation.getByRole('button', { name: 'Adiar' }).click();
  await expect(page.getByRole('status')).toContainText('nenhuma acao foi executada automaticamente');
  await expect(recommendation).toContainText('Aguardar leitura do proximo intervalo');
});
