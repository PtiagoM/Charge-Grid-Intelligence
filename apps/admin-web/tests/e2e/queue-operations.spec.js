import { expect, test } from '@playwright/test';

async function login(page, email = 'estabelecimento@teste.com') {
  await page.goto('/#/logout');
  await page.goto('/#/login');
  await page.getByTestId('login-email').fill(email);
  await page.getByTestId('login-password').fill('teste');
  await page.getByTestId('login-submit').click();
}

test('fila chama em FIFO, confirma chegada e conclui admissao', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/queue');

  const queue = page.getByTestId('queue-operations-page');
  await expect(queue).toContainText('Marcos Silva');
  await expect(queue).toContainText('#1');
  await page.getByRole('button', { name: 'Chamar proximo' }).click();
  await expect(page.getByRole('status')).toContainText('chamado com sucesso');
  await expect(queue).toContainText('CG-FIAP-03');
  await expect(queue).toContainText('sem reserva tecnica');

  await page.getByRole('button', { name: 'Confirmar chegada' }).click();
  await expect(page.getByRole('status')).toContainText('Comparecimento confirmado');
  await expect(queue).toContainText('Admitido');
  await page.getByRole('button', { name: 'Concluir admissao' }).click();
  await expect(page.getByRole('status')).toContainText('removida da fila ativa');
  await expect(queue).toContainText('Concluido');
});

test('Central GoodWe nao recebe operacao local de fila', async ({ page }) => {
  await login(page, 'goodwe@teste.com');
  await page.goto('/#/mvp/queue');
  await expect(page.getByTestId('access-denied')).toBeVisible();
});

test('central operacional oferece progressao vertical para fila e sessoes', async ({ page }) => {
  await login(page);
  await page.goto('/#/mvp/operations');
  await expect(page.getByRole('heading', { name: /Central/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Gerenciar fila/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Acompanhar sessoes/ })).toBeVisible();
});
