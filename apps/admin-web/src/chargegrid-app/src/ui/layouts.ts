// @ts-nocheck
import { assets } from '../constants/assets.js';

function assistantOrb() {
  return `
    <button type="button" class="assistant-orb-button" data-action="open-assistant" aria-label="Assistente ChargeGrid">
      <img src="${assets.assistant}" alt="" />
      <span class="assistant-orb-eye"></span>
    </button>`;
}

function sidebarItem(item, activePath) {
  const isActive = activePath === item.path || item.activeFor?.includes(activePath);
  return `
    <a class="sidebar-item ${isActive ? 'is-active' : ''}" href="${item.href}" title="${item.label}" aria-label="${item.label}" data-testid="${item.testId ?? ''}">
      ${item.iconName ? `<i class="sidebar-lucide" data-lucide="${item.iconName}" aria-hidden="true"></i>` : item.icon ? `<img src="${item.icon}" alt="" />` : `<span class="menu-char">${item.char ?? '>'}</span>`}
      <span class="sidebar-tooltip">${item.label}</span>
    </a>`;
}

export function renderDesktopShell({
  activePath,
  menu,
  content,
  profile,
  title,
  subtitle,
  userName
}) {
  const refreshTime = new Date().toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return `
    <div class="app-shell desktop-shell" data-testid="desktop-shell">
      <aside class="sidebar" data-testid="sidebar">
        <a class="sidebar-logo" href="#/mvp/overview" aria-label="GoodWe">
          <img class="logo-collapsed" src="${assets.logoCollapsed}" alt="GoodWe" />
        </a>
        <nav class="sidebar-nav">
          ${menu.map((item) => sidebarItem(item, activePath)).join('')}
        </nav>
      </aside>
      <main class="main-area">
        <header class="topbar" data-testid="topbar">
          <div class="topbar-promo">
            <img src="${assets.icons.solarInfo}" alt="" />
            Hub Comercial ChargeGrid
          </div>
          <div class="topbar-actions">
            <button class="topbar-icon-button" type="button" aria-label="Pesquisar"><img src="${assets.icons.search}" alt="" /></button>
            <button class="topbar-icon-button" type="button" aria-label="Alarmes"><img src="${assets.icons.alarms}" alt="" /></button>
            <button class="topbar-icon-button" type="button" aria-label="Mensagens"><img src="${assets.icons.message}" alt="" /></button>
            <button class="topbar-icon-button" type="button" aria-label="Idioma"><img src="${assets.icons.language}" alt="" /></button>
            <span class="profile-chip">${profile}</span>
            <span class="profile-name">${userName}</span>
            <img class="avatar" src="${assets.avatar}" alt="Perfil" />
            <a class="topbar-account-action" href="#/mvp/settings" aria-label="Configuracoes" title="Configuracoes">
              <i data-lucide="settings" aria-hidden="true"></i>
            </a>
            <a class="topbar-account-action is-logout" href="#/logout" aria-label="Sair do sistema" title="Sair do sistema">
              <i data-lucide="log-out" aria-hidden="true"></i>
            </a>
          </div>
        </header>
        <section class="page-content">
          <header class="page-heading">
            <div>
              <h1>${title}</h1>
              <p>${subtitle}</p>
              <small>Tempo de atualizacao de dados: ${refreshTime}</small>
            </div>
            <div class="page-heading-actions">
              <button data-action="tick">Atualizar dados</button>
            </div>
          </header>
          ${content}
        </section>
      </main>
      ${assistantOrb()}
    </div>`;
}

export function renderDriverShell({ activePath, content, title, subtitle }) {
  const tabs = [
    ['home', 'Inicio', '#/drive/home'],
    ['payment', 'Pagamento', '#/drive/payment'],
    ['current', 'Recarga Atual', '#/drive/current'],
    ['history', 'Historico', '#/drive/history']
  ];

  return `
    <div class="driver-shell" data-testid="driver-shell">
      <header class="driver-topbar">
        <div>
          <small>ChargeGrid Drive</small>
          <h1>${title}</h1>
          <p>${subtitle}</p>
        </div>
        <a href="#/logout" class="ghost-button">Sair</a>
      </header>
      <main class="driver-main">${content}</main>
      <nav class="driver-nav" data-testid="driver-nav">
        ${tabs
          .map(
            ([id, label, href]) =>
              `<a href="${href}" class="${activePath === id ? 'is-active' : ''}" data-testid="driver-tab-${id}">${label}</a>`
          )
          .join('')}
      </nav>
      ${assistantOrb()}
    </div>`;
}

export function renderPublicShell({ content, title, subtitle }) {
  return `
    <div class="quick-shell" data-testid="quick-shell">
      <header>
        <span>ChargeGrid Quick</span>
        <h1>${title}</h1>
        <p>${subtitle}</p>
      </header>
      <main>${content}</main>
      ${assistantOrb()}
    </div>`;
}

export function renderAuthShell(content) {
  return `
    <div class="auth-shell" data-testid="auth-shell">
      <aside class="auth-brand">
        <img src="${assets.logo}" alt="GoodWe" />
        <h1>CHARGEGRID INTELLIGENCE</h1>
        <p>SEMS+ monitora a operacao energetica. ChargeGrid organiza a operacao comercial da recarga.</p>
        <ul>
          <li>Central GoodWe: visao nacional de rede comercial.</li>
          <li>Business: operacao do estabelecimento em tempo real.</li>
          <li>Drive e Quick: experiencia de recarga para motorista e visitante.</li>
        </ul>
      </aside>
      ${content}
    </div>`;
}

