// @ts-nocheck
import { assets } from '../constants/assets.js';

const menuItems = [
  { id: 'sidebar-plants', href: '#/plants', icon: assets.icons.plants, label: 'Lista de plantas', route: 'plants' },
  { id: 'sidebar-devices', href: '#', icon: assets.icons.devices, label: 'Lista dispositivos' },
  { id: 'sidebar-alarms', href: '#', icon: assets.icons.alarms, label: 'Central de Alarmes' },
  { id: 'sidebar-reports', href: '#', icon: assets.icons.reports, label: 'Central de relatórios' },
  { id: 'sidebar-analysis', href: '#', icon: assets.icons.analysis, label: 'Analisar', suffix: '⌄' },
  { id: 'sidebar-services', href: '#', icon: assets.icons.services, label: 'Centro de serviço' },
  { id: 'sidebar-chargegrid', href: '#/chargegrid/overview', iconText: 'ϟ', label: 'ChargeGrid', route: 'chargegrid' }
];

export function renderShell(content, activeRoute) {
  const menu = menuItems.map((item) => `
    <a class="sidebar-item ${item.route === activeRoute ? 'is-active' : ''}" href="${item.href}" data-testid="${item.id}" title="${item.label}" aria-label="${item.label}">
      ${item.icon ? `<img src="${item.icon}" alt="" data-testid="${item.id}-asset" />` : `<span class="chargegrid-menu-icon">${item.iconText}</span>`}
      <span class="sidebar-label">${item.label}</span>
      ${item.suffix ? `<span class="sidebar-suffix">${item.suffix}</span>` : ''}
      ${item.route === activeRoute ? '<i data-testid="sidebar-active-indicator"></i>' : ''}
    </a>`).join('');

  return `
    <div class="app-shell" data-testid="app-shell">
      <aside class="sidebar" data-testid="sidebar">
        <a class="sidebar-logo" href="#/plants" data-testid="sidebar-logo" aria-label="GoodWe SEMS+">
          <img class="logo-expanded" src="${assets.logo}" alt="GoodWe" data-testid="goodwe-logo" />
          <img class="logo-collapsed" src="${assets.logoCollapsed}" alt="GoodWe" data-testid="goodwe-logo-collapsed" />
          <small>Smart Energy Management System</small>
        </a>
        <nav>${menu}</nav>
        <div class="sidebar-footer">
          <a class="sidebar-item" href="#" title="Organização e Gestão">
            <img src="${assets.icons.setting}" alt="" /><span class="sidebar-label">Organização e Gestão</span>
          </a>
          <button class="sidebar-toggle" type="button" data-testid="sidebar-toggle" aria-label="Expandir ou recolher menu">‹</button>
        </div>
      </aside>
      <main class="main-area">
        <header class="topbar" data-testid="topbar">
          <div class="topbar-promo"><img src="${assets.icons.solarInfo}" alt="" data-testid="topbar-solar-asset" /> Centro de Informações sobre Energia Solar</div>
          <div class="topbar-actions" aria-label="Ações">
            <button aria-label="Pesquisar"><img src="${assets.icons.search}" alt="" /></button>
            <button aria-label="Alertas"><img src="${assets.icons.alarms}" alt="" /></button>
            <button aria-label="Mensagens"><img src="${assets.icons.message}" alt="" /></button>
            <button aria-label="Idioma"><img src="${assets.icons.language}" alt="" /></button>
            <img class="avatar" src="${assets.avatar}" alt="Perfil" />
          </div>
        </header>
        <div class="page-content" data-testid="page-content">${content}</div>
      </main>
      <img class="assistant-orb" src="${assets.assistant}" alt="Assistente SEMS+" data-testid="assistant-asset" />
    </div>`;
}

