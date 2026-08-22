// @ts-nocheck
import { DEMO_ACCOUNTS } from '../state/demo-state.js';
import { renderAuthShell } from '../ui/layouts.js';

function demoButtons() {
  return DEMO_ACCOUNTS.map(
    (account) => `
      <button type="button" class="quick-login" data-action="fill-login" data-email="${account.email}" data-password="${account.password}">
        ${account.profile} · ${account.email}
      </button>`
  ).join('');
}

export function renderAuthPage(state) {
  const error = state.auth.error;
  const quickChargerId = state.chargers[0]?.id ?? null;

  const card = `
    <section class="auth-card" data-testid="login-card">
      <h2>Entrar no ChargeGrid</h2>
      <p>Use as credenciais demonstrativas para acessar cada ambiente.</p>
      <form data-form="login" class="auth-form">
        <label>
          E-mail
          <input name="email" type="email" placeholder="seuemail@teste.com" required data-testid="login-email" />
        </label>
        <label>
          Senha
          <input name="password" type="password" placeholder="******" required data-testid="login-password" />
        </label>
        <button type="submit" data-testid="login-submit">Acessar</button>
      </form>
      ${error ? `<p class="auth-error" data-testid="login-error">${error}</p>` : ''}
      <div class="quick-login-list" data-testid="quick-login-list">
        <h3>Conta inicial</h3>
        ${demoButtons()}
      </div>
      <footer>
        ${
          quickChargerId
            ? `<span>Quick sem login por QR:</span><a href="#/quick/charger/${quickChargerId}" data-testid="quick-public-link">Abrir ChargeGrid Quick</a>`
            : '<span>Quick sem login por QR: disponivel apos cadastrar o primeiro carregador.</span>'
        }
      </footer>
    </section>`;

  return {
    html: renderAuthShell(card),
    page: 'auth'
  };
}

