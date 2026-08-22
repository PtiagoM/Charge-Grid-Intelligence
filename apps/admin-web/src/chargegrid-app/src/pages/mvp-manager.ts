// @ts-nocheck
import { assets } from '../constants/assets.js';
import { buildDemandForecast, establishmentMetrics, goodweMetrics, locationMetrics } from '../state/metrics.js';
import {
  AUTH_PROFILES,
  getAccountsByEstablishment,
  getCurrentAccount,
  getCurrentUser,
  getEstablishmentById,
  getLocationById,
  getSessionById
} from '../state/store.js';
import {
  badge,
  histogram,
  kpiCard,
  sectionHeader,
  segmentedTabs,
  semsFilterToolbar,
  semsReportCard,
  semsStatusTabs,
  simpleTable,
  tone
} from '../ui/components.js';
import { formatDateTime, formatMoney, formatNumber } from '../ui/format.js';
import { renderDesktopShell } from '../ui/layouts.js';
import {
  auditPage,
  clientDetailPage,
  clientsPage,
  contractDetailPage,
  contractsPage,
  decisionCenter,
  documentsPage,
  enterpriseSettingsPage,
  expansionPage,
  financePage,
  installationDetailPage,
  installationsPage,
  newClientPage,
  operationsPage,
  supportPage,
  ticketDetailPage
} from './enterprise.js';

const goodweMenu = [
  { path: 'overview', href: '#/mvp/overview', label: 'Visao Geral', iconName: 'layout-dashboard' },
  { path: 'clients', href: '#/mvp/clients', label: 'Clientes', iconName: 'users-round', activeFor: ['client', 'new-client'] },
  { path: 'establishments', href: '#/mvp/establishments', label: 'Estabelecimentos', iconName: 'building-2', activeFor: ['establishment', 'new-establishment'] },
  { path: 'locations', href: '#/mvp/locations', label: 'Pontos de Recarga', iconName: 'map-pinned', activeFor: ['location', 'new-location'] },
  { path: 'chargers', href: '#/mvp/chargers', label: 'Carregadores', iconName: 'battery-charging', activeFor: ['charger'] },
  { path: 'installations', href: '#/mvp/installations', label: 'Implantacoes', iconName: 'clipboard-check', activeFor: ['installation'] },
  { path: 'contracts', href: '#/mvp/contracts', label: 'Contratos', iconName: 'file-signature', activeFor: ['contract'] },
  { path: 'finance', href: '#/mvp/finance', label: 'Financeiro', iconName: 'wallet-cards' },
  { path: 'operations', href: '#/mvp/operations', label: 'Operacao', iconName: 'activity' },
  { path: 'sessions', href: '#/mvp/sessions', label: 'Sessoes', iconName: 'history' },
  { path: 'energy', href: '#/mvp/energy', label: 'Demanda e Energia', iconName: 'zap' },
  { path: 'pricing', href: '#/mvp/pricing', label: 'Tarifacao e Pagamentos', iconName: 'badge-dollar-sign' },
  { path: 'ai', href: '#/mvp/ai', label: 'Inteligencia Artificial', iconName: 'brain-circuit' },
  { path: 'reports', href: '#/mvp/reports', label: 'Relatorios', iconName: 'file-chart-column' },
  { path: 'expansion', href: '#/mvp/expansion', label: 'Expansao', iconName: 'trending-up' },
  { path: 'audit', href: '#/mvp/audit', label: 'Auditoria', iconName: 'shield-check' }
];

const establishmentMenu = [
  { path: 'overview', href: '#/mvp/overview', label: 'Visao Geral', iconName: 'gauge' },
  { path: 'locations', href: '#/mvp/locations', label: 'Meus Pontos', iconName: 'map-pin', activeFor: ['location'] },
  { path: 'chargers', href: '#/mvp/chargers', label: 'Carregadores', iconName: 'plug-zap', activeFor: ['charger'] },
  { path: 'operations', href: '#/mvp/operations', label: 'Operacao', iconName: 'radio-tower' },
  { path: 'sessions', href: '#/mvp/sessions', label: 'Sessoes', iconName: 'clock-3' },
  { path: 'energy', href: '#/mvp/energy', label: 'Demanda e Energia', iconName: 'chart-no-axes-combined' },
  { path: 'pricing', href: '#/mvp/pricing', label: 'Tarifacao e Pagamentos', iconName: 'receipt-text' },
  { path: 'finance', href: '#/mvp/finance', label: 'Financeiro', iconName: 'landmark' },
  { path: 'contract', href: '#/mvp/contract', label: 'Contrato', iconName: 'scroll-text' },
  { path: 'documents', href: '#/mvp/documents', label: 'Documentos', iconName: 'folder-open' },
  { path: 'ai', href: '#/mvp/ai', label: 'Inteligencia Artificial', iconName: 'sparkles' },
  { path: 'reports', href: '#/mvp/reports', label: 'Relatorios', iconName: 'notebook-tabs' }
];

function locationCard(summary, establishmentId, monitorOnly = false) {
  const energy = summary.energy ?? { state: 'Sem dados', marginPercent: 0 };
  return `
    <article class="network-location-card" data-testid="location-card-${summary.location.id}">
      <img class="network-card-cover" src="${summary.location.coverImage || assets.plant}" alt="${summary.location.name}" />
      <div class="network-card-body">
        <div class="network-card-title"><div><h3>${summary.location.name}</h3><p>${summary.location.city}/${summary.location.state}</p></div>${badge(summary.location.status === 'Ativo' ? 'available' : 'offline')}</div>
        <p class="network-card-address">${summary.location.address}, ${summary.location.number}</p>
        <div class="network-card-stats">
          <span><strong>${summary.total}</strong> carregadores</span><span><strong>${summary.available}</strong> disponiveis</span><span><strong>${summary.inUse}</strong> em uso</span><span><strong>${summary.offline}</strong> offline</span>
        </div>
        <div class="network-card-meta"><span>Energia ${energy.state}</span><span>Health ${summary.healthScore ?? 100}/100</span><span>${summary.sessionsNow} sessoes</span></div>
        <a class="ghost-button" href="#/mvp/location?est=${establishmentId}&loc=${summary.location.id}">${monitorOnly ? 'Abrir monitoramento' : 'Abrir ponto'}</a>
      </div>
    </article>`;
}

function establishmentFolderCard(state, establishment) {
  const metrics = establishmentMetrics(state, establishment.id);
  const waiting = metrics.queue.filter((item) => item.status === 'waiting').length;
  const statusLabel =
    metrics.energy.state === 'Critico'
      ? 'Risco alto'
      : metrics.energy.state === 'Alerta'
        ? 'Atencao'
        : 'Operacao estavel';

  return `
    <article class="establishment-folder-card" data-testid="establishment-card-${establishment.id}">
      <div class="folder-thumb">
        <img src="${establishment.folderImage || assets.plant}" alt="${establishment.name}" />
      </div>
      <div class="folder-body">
        <h3>${establishment.name}</h3>
        <p>${establishment.city}/${establishment.state} · ${establishment.clientType ?? 'Cliente comercial'}</p>
        <div class="network-card-stats"><span><strong>${metrics.locations.length}</strong> pontos</span><span><strong>${metrics.chargers.length}</strong> carregadores</span><span><strong>${metrics.inUse}</strong> em uso</span><span><strong>${metrics.available}</strong> disponiveis</span></div>
        <p>${statusLabel} · ${waiting} em fila</p>
        <p>Conta: ${getAccountsByEstablishment(state, establishment.id)[0]?.email ?? 'Nao criada'}</p>
        <a class="ghost-button" href="#/mvp/establishment?est=${establishment.id}">Abrir pasta</a>
      </div>
    </article>`;
}

function locationNameFromMetrics(metrics, locationId) {
  return metrics.locations.find((location) => location.id === locationId)?.name ?? '--';
}

function commercialStatusTabs({ total = 0, active = 0, waiting = 0, offline = 0, danger = 0, building = 0 } = {}) {
  return semsStatusTabs({
    active: 'all',
    items: [
      { value: 'all', label: 'Todos', count: total, tone: 'info' },
      { value: 'created', label: 'Criados este mes', count: Math.max(1, Math.round(total / 3)), tone: 'muted' },
      { value: 'active', label: 'Em operacao', count: active, tone: 'good' },
      { value: 'waiting', label: 'Aguardando', count: waiting, tone: 'warn' },
      { value: 'offline', label: 'Offline', count: offline, tone: 'muted' },
      { value: 'danger', label: 'Falha', count: danger, tone: 'danger' },
      { value: 'building', label: 'Em implantacao', count: building, tone: 'info' }
    ]
  });
}

function salesFilterToolbar({ actions = '' } = {}) {
  return semsFilterToolbar({
    fields: [
      { name: 'searchTerm', label: 'Busca', placeholder: 'Nome, CNPJ, local ou carregador' },
      { name: 'address', label: 'Endereco', placeholder: 'Cidade, estado ou unidade' },
      { name: 'email', label: 'Email', placeholder: 'Contato comercial' }
    ],
    actions
  });
}

function mapPointFromCoordinates(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  return {
    x: Math.max(2, Math.min(98, ((lng + 180) / 360) * 100)),
    y: Math.max(2, Math.min(98, ((90 - lat) / 180) * 100))
  };
}

function chargerStatusSummary(chargers) {
  return {
    available: chargers.filter((charger) => charger.status === 'available').length,
    charging: chargers.filter((charger) => charger.status === 'charging').length,
    offline: chargers.filter((charger) => charger.status === 'offline').length,
    reserved: chargers.filter((charger) => charger.status === 'reserved').length
  };
}

function worldMapPaths() {
  return `
    <svg class="world-map-svg" viewBox="0 0 1000 500" role="img" aria-label="Mapa mundi de carregadores GoodWe">
      <path d="M120 118 172 86 238 94 262 126 242 178 188 206 154 250 120 230 96 176Z" />
      <path d="M252 210 302 242 322 306 292 392 250 468 222 396 192 336 210 268Z" />
      <path d="M442 116 512 82 586 96 638 132 708 118 794 156 860 206 832 258 738 236 676 278 612 252 532 278 470 238 410 202Z" />
      <path d="M520 280 584 274 630 326 618 410 566 456 528 384Z" />
      <path d="M790 318 874 324 928 374 898 430 820 422 770 366Z" />
      <path d="M410 92 462 70 516 80 498 118 438 130Z" />
    </svg>`;
}

function buildWorldMapLocations(state) {
  return state.locations
    .map((location) => {
      const point = mapPointFromCoordinates(location.latitude, location.longitude);
      const establishment = getEstablishmentById(state, location.establishmentId);
      const chargers = state.chargers.filter((charger) => charger.locationId === location.id);
      if (!point || !establishment || chargers.length === 0) return null;

      const status = chargerStatusSummary(chargers);
      const revenue = chargers.reduce((total, charger) => total + Number(charger.todayRevenue ?? 0), 0);
      const energy = chargers.reduce((total, charger) => total + Number(charger.todayEnergyKwh ?? 0), 0);

      return {
        location,
        establishment,
        chargers,
        status,
        revenue,
        energy,
        point
      };
    })
    .filter(Boolean);
}

function buildFallbackMapGroups(mapLocations) {
  const groups = [];
  const radius = 7;

  mapLocations.forEach((item) => {
    const nearby = groups.find((group) => {
      const distance = Math.hypot(group.point.x - item.point.x, group.point.y - item.point.y);
      return distance <= radius;
    });

    if (nearby) {
      nearby.items.push(item);
      nearby.point = {
        x: nearby.items.reduce((total, entry) => total + entry.point.x, 0) / nearby.items.length,
        y: nearby.items.reduce((total, entry) => total + entry.point.y, 0) / nearby.items.length
      };
      return;
    }

    groups.push({ items: [item], point: item.point });
  });

  return groups;
}

function worldChargerMap(state, network) {
  const mapLocations = buildWorldMapLocations(state);
  const fallbackGroups = buildFallbackMapGroups(mapLocations);
  const totalPowerKw = state.chargers.reduce((total, charger) => total + Number(charger.powerKw ?? 0), 0);
  const selectedId =
    mapLocations.find((item) => item.location.id === state.ui.selectedMapLocationId)?.location.id ??
    mapLocations[0]?.location.id ??
    null;

  return `
    <div class="sems-map-canvas world-map-canvas" data-testid="world-charger-map">
      <div id="chargegrid-goodwe-world-map" class="google-world-map" data-testid="google-world-map"></div>
      <div class="world-map-fallback" data-testid="world-map-fallback">
        ${worldMapPaths()}
        <div class="world-map-grid-lines" aria-hidden="true"></div>
        <span class="world-map-label label-americas">AMERICAS</span>
        <span class="world-map-label label-europe">EUROPE</span>
        <span class="world-map-label label-asia">ASIA</span>
        <span class="world-map-label label-oceania">OCEANIA</span>
        ${fallbackGroups
          .map(
            (group) => {
              const primary = group.items[0];
              const selected = group.items.some((item) => item.location.id === selectedId);
              const hasAlert = group.items.some((item) => item.status.offline > 0);
              const label = group.items.length > 1 ? String(group.items.length) : '';
              const ariaLabel =
                group.items.length > 1
                  ? `${group.items.length} pontos GoodWe agrupados`
                  : `${primary.location.name}: ponto com carregador`;

              return `
          <button
            type="button"
            class="world-map-marker ${selected ? 'is-selected' : ''} ${hasAlert ? 'has-alert' : ''}"
            data-testid="world-map-marker-${primary.location.id}"
            style="--x:${group.point.x.toFixed(2)}%; --y:${group.point.y.toFixed(2)}%;"
            data-action="select-map-location"
            data-location-id="${primary.location.id}"
            aria-label="${ariaLabel}"
          >
            <span>${label}</span>
          </button>`;
            }
          )
          .join('')}
      </div>
    </div>
    <article class="sems-station-summary world-station-summary" data-testid="mvp-overview-kpis">
      <div class="station-row station-row-main">
        <div class="station-map-illustration" aria-hidden="true">
          <span></span><i></i><b></b><em></em>
        </div>
        <div class="station-value">
          <p><strong>${network.totals.totalLocations}</strong><button type="button" aria-label="Expandir estacoes">⌄</button></p>
          <span>Station Number <small>?</small></span>
        </div>
      </div>
      <div class="station-row">
        <div class="station-solar-illustration" aria-hidden="true"><span></span><span></span><span></span></div>
        <div class="station-value">
          <p><strong>${formatNumber(totalPowerKw)}</strong><small>kWp</small></p>
          <span>Capacity</span>
        </div>
      </div>
      <div class="station-row">
        <div class="station-storage-illustration" aria-hidden="true"><span></span><span></span><span></span></div>
        <div class="station-value">
          <p><strong>${formatNumber(network.totals.delivered)}</strong><small>kWh</small></p>
          <span>Capacity</span>
        </div>
      </div>
    </article>
    `;
}

function resolveContext(state, route) {
  const account = getCurrentAccount(state);
  const user = getCurrentUser(state);
  const profile = account?.profile;

  const establishmentId =
    profile === AUTH_PROFILES.ESTABELECIMENTO
      ? account.establishmentId
      : route.query.est ?? state.ui.selectedEstablishmentId ?? state.establishments[0]?.id;

  const establishment = getEstablishmentById(state, establishmentId);
  const estMetrics = establishment ? establishmentMetrics(state, establishment.id) : null;
  const availableLocations = estMetrics?.locations ?? [];

  const requestedLocationId = route.query.loc ?? state.ui.selectedLocationId;
  const locationId =
    availableLocations.find((location) => location.id === requestedLocationId)?.id ??
    availableLocations[0]?.id ??
    null;

  const location = locationId ? getLocationById(state, locationId) : null;
  const locationSummary =
    estMetrics?.locationSummaries.find((item) => item.location.id === locationId) ?? null;

  return {
    account,
    user,
    profile,
    establishment,
    estMetrics,
    location,
    locationSummary
  };
}

function goodweOverview(state) {
  const network = goodweMetrics(state);
  const waitingTotal = state.queues.filter((item) => item.status === 'waiting').length;
  const activeTotal = network.totals.charging + network.totals.available;
  const offlineTotal = state.chargers.filter((charger) => charger.status === 'offline').length;
  const buildingTotal = state.establishments.filter((establishment) => establishment.status !== 'Ativo').length;

  return `
    <section class="sems-dashboard-map" data-testid="mvp-overview-panel">
      ${worldChargerMap(state, network)}
      <div class="sems-dashboard-title">
        <h2>Dashboard comercial</h2>
        <p>Rede de vendas, implantacao e operacao ChargeGrid sobre o ecossistema GoodWe.</p>
      </div>
    </section>
    <section class="surface panel sems-panel" data-testid="goodwe-establishments-overview">
      ${sectionHeader({ title: 'Rede comercial', subtitle: 'Indicadores principais do funil operacional GoodWe.' })}
      ${commercialStatusTabs({
        total: network.totals.totalChargers,
        active: activeTotal,
        waiting: waitingTotal,
        offline: offlineTotal,
        building: buildingTotal
      })}
      <div class="kpi-grid four-cols" data-testid="mvp-overview-kpis">
        ${kpiCard({ testId: 'mvp-kpi-available', label: 'Disponiveis', value: network.totals.available, help: 'prontos para vender kWh', accent: 'good' })}
        ${kpiCard({ testId: 'mvp-kpi-inuse', label: 'Em uso', value: network.totals.charging, help: 'receita em tempo real', accent: 'danger' })}
        ${kpiCard({ testId: 'mvp-kpi-active-sessions', label: 'Sessoes acontecendo', value: network.totals.activeSessions, help: 'agora' })}
        ${kpiCard({ testId: 'mvp-kpi-demand-state', label: 'Locais cadastrados', value: network.totals.totalLocations, help: 'unidades ativas' })}
        ${kpiCard({ label: 'Receita GoodWe', value: formatMoney(network.totals.goodweRevenue), help: 'participacoes e taxas' })}
        ${kpiCard({ label: 'Energia entregue', value: `${formatNumber(network.totals.delivered)} kWh`, help: 'consolidado' })}
        ${kpiCard({ label: 'Fila comercial', value: waitingTotal, help: 'clientes aguardando carga', accent: waitingTotal ? 'warn' : 'good' })}
        ${kpiCard({ label: 'Status da carteira', value: waitingTotal > 0 ? 'Atencao' : 'Estavel', help: 'prioridade IA', accent: waitingTotal > 0 ? 'warn' : 'good' })}
      </div>
    </section>
    <section class="sems-dashboard-grid">
      <article class="surface panel sems-chart-card">
        ${sectionHeader({ title: 'Potencia', subtitle: 'Leitura comercial de ocupacao por horario.' })}
        ${utilizationChart({})}
      </article>
      <article class="surface panel sems-chart-card">
        ${sectionHeader({ title: 'Revenue', subtitle: 'Receita e cobranca das recargas.' })}
        <div class="detail-grid">
          <article><h3>Receita movimentada</h3><p>${formatMoney(network.totals.movedRevenue)}</p></article>
          <article><h3>Receita GoodWe</h3><p>${formatMoney(network.totals.goodweRevenue)}</p></article>
          <article><h3>Ticket operacional</h3><p>${formatMoney(network.totals.activeSessions ? network.totals.movedRevenue / network.totals.activeSessions : 0)}</p></article>
        </div>
      </article>
      <article class="surface panel sems-chart-card">
        ${sectionHeader({ title: 'Alarmes comerciais', subtitle: 'Sinais de operacao e vendas.' })}
        <div class="detail-grid">
          <article><h3>Fila</h3><p>${waitingTotal} aguardando</p></article>
          <article><h3>Offline</h3><p>${offlineTotal} equipamentos</p></article>
          <article><h3>Implantacao</h3><p>${buildingTotal} clientes</p></article>
        </div>
      </article>
      <article class="surface panel sems-chart-card" data-testid="mvp-overview-recommendation">
        ${sectionHeader({ title: 'IA comercial', subtitle: 'Acao recomendada para a rede.' })}
        <article class="assistant-card">
          <p>Fila atual: ${waitingTotal} aguardando na rede. ${waitingTotal > 0 ? 'Priorizar estabelecimentos com maior ocupacao e acelerar expansao de locais.' : 'Operacao sem fila relevante no momento.'}</p>
        </article>
      </article>
    </section>
    <section class="surface panel" data-testid="goodwe-create-establishment-panel">
      ${sectionHeader({ title: 'Cadastrar estabelecimento e acesso', subtitle: 'No mesmo cadastro a GoodWe cria o estabelecimento, o local principal e o login/senha do gestor.' })}
      <form class="simulator-grid" data-form="create-establishment">
        <label>Nome do estabelecimento<input name="name" required /></label>
        <label>Razao social<input name="corporateName" required /></label>
        <label>CNPJ<input name="cnpj" required /></label>
        <label>Responsavel<input name="responsible" required /></label>
        <label>Telefone<input name="phone" required /></label>
        <label>Email<input name="email" type="email" required /></label>
        <label>Cidade<input name="city" required /></label>
        <label>Estado<input name="state" value="SP" required /></label>
        <label>Endereco<input name="address" required /></label>
        <label>Numero<input name="number" required /></label>
        <label>Complemento<input name="complement" /></label>
        <label>CEP<input name="zipCode" required /></label>
        <label>Nome do local principal<input name="locationName" placeholder="Unidade Principal" /></label>
        <label>Descricao do local<textarea name="locationDescription" rows="3"></textarea></label>
        <label>Tarifa base (R$/kWh)<input name="pricePerKwh" type="number" min="0" step="0.01" value="2.95" required /></label>
        <label>Status
          <select name="status">
            <option value="Ativo" selected>Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </label>
        <label>Observacoes<textarea name="notes" rows="3"></textarea></label>
        <label>Nome de acesso do gestor<input name="accountName" required /></label>
        <label>Email de acesso<input name="accountEmail" type="email" required /></label>
        <label>Senha de acesso<input name="accountPassword" required /></label>
        <label>Status da conta
          <select name="accountStatus">
            <option value="Ativo" selected>Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </label>
        <button type="submit">Criar estabelecimento com login</button>
      </form>
    </section>`;
}

function goodweEstablishmentsPage(state) {
  const network = goodweMetrics(state);
  const rows = state.establishments.map((establishment) => {
    const metrics = establishmentMetrics(state, establishment.id);
    const waiting = metrics.queue.filter((item) => item.status === 'waiting').length;
    const firstLocation = metrics.locations[0];
    return [
      `<div class="sems-entity-cell"><img src="${establishment.folderImage || assets.plant}" alt="" /><strong>${establishment.name}</strong><span>${establishment.city}/${establishment.state} · ${establishment.cnpj}</span></div>`,
      badge(establishment.status === 'Ativo' ? 'available' : 'reserved'),
      `${metrics.locations.length}`,
      `${metrics.chargers.length}`,
      `${metrics.activeSessions.length}`,
      `${waiting}`,
      formatMoney(metrics.monthRevenue),
      `<a class="ghost-button" href="#/mvp/establishment?est=${establishment.id}">Abrir</a>${
        firstLocation ? ` <a class="ghost-button" href="#/mvp/location?est=${establishment.id}&loc=${firstLocation.id}">Local</a>` : ''
      }`
    ];
  });

  return `
    <section class="surface panel sems-list-page" data-testid="goodwe-establishments-overview">
      ${sectionHeader({ title: 'Lista de estabelecimentos', subtitle: 'Clientes comerciais cadastrados, implantacao, receita e operacao.' })}
      <form data-form="search-establishments">
        ${salesFilterToolbar({
          actions: '<a class="sems-primary-action" href="#/mvp/establishments">+ Novo estabelecimento</a>'
        })}
      </form>
      ${commercialStatusTabs({
        total: state.establishments.length,
        active: state.establishments.filter((item) => item.status === 'Ativo').length,
        waiting: network.totals.activeSessions,
        offline: network.totals.offline,
        building: state.establishments.filter((item) => item.status !== 'Ativo').length
      })}
      ${simpleTable({
        columns: ['Informacoes do cliente', 'Status', 'Locais', 'Carregadores', 'Sessoes', 'Fila', 'Receita', 'Operacao'],
        rows
      })}
    </section>
    <section class="surface panel sems-panel" data-testid="goodwe-create-establishment-panel">
      ${sectionHeader({ title: 'Cadastrar estabelecimento e acesso', subtitle: 'A GoodWe cria o cliente, o local principal e o login do gestor.' })}
      <form class="simulator-grid" data-form="create-establishment">
        <label>Nome do estabelecimento<input name="name" required /></label>
        <label>Razao social<input name="corporateName" required /></label>
        <label>CNPJ<input name="cnpj" required /></label>
        <label>Responsavel<input name="responsible" required /></label>
        <label>Telefone<input name="phone" required /></label>
        <label>Email<input name="email" type="email" required /></label>
        <label>Cidade<input name="city" required /></label>
        <label>Estado<input name="state" value="SP" required /></label>
        <label>Endereco<input name="address" required /></label>
        <label>Numero<input name="number" required /></label>
        <label>Complemento<input name="complement" /></label>
        <label>CEP<input name="zipCode" required /></label>
        <label>Nome do local principal<input name="locationName" placeholder="Unidade Principal" /></label>
        <label>Descricao do local<textarea name="locationDescription" rows="3"></textarea></label>
        <label>Tarifa base (R$/kWh)<input name="pricePerKwh" type="number" min="0" step="0.01" value="2.95" required /></label>
        <label>Status
          <select name="status">
            <option value="Ativo" selected>Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </label>
        <label>Observacoes<textarea name="notes" rows="3"></textarea></label>
        <label>Nome de acesso do gestor<input name="accountName" required /></label>
        <label>Email de acesso<input name="accountEmail" type="email" required /></label>
        <label>Senha de acesso<input name="accountPassword" required /></label>
        <label>Status da conta
          <select name="accountStatus">
            <option value="Ativo" selected>Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </label>
        <button type="submit">Criar estabelecimento com login</button>
      </form>
    </section>`;
}

function establishmentArea(state, context) {
  const metrics = context.estMetrics;
  if (!metrics) {
    return '<section class="surface panel"><p>Nenhum estabelecimento selecionado.</p></section>';
  }

  const accounts = getAccountsByEstablishment(state, metrics.establishment.id);

  return `
    <section class="surface panel sems-panel" data-testid="goodwe-establishment-page">
      ${sectionHeader({
        title: `Estabelecimento: ${metrics.establishment.name}`,
        subtitle: 'A GoodWe administra informacoes, locais, carregadores e conta de acesso.'
      })}
      <div class="detail-grid">
        <article><h3>Informacoes do estabelecimento</h3><p>${metrics.establishment.corporateName}</p><p>CNPJ ${metrics.establishment.cnpj}</p><p>Responsavel ${metrics.establishment.responsible}</p></article>
        <article><h3>Contato</h3><p>${metrics.establishment.phone}</p><p>${metrics.establishment.email}</p><p>Status ${metrics.establishment.status}</p></article>
        <article><h3>Resumo operacional</h3><p>${metrics.locations.length} locais</p><p>${metrics.chargers.length} carregadores</p><p>${metrics.activeSessions.length} sessoes ativas</p></article>
        <article><h3>Status energetico</h3><p>${metrics.energy.state}</p><p>Demanda ${metrics.energy.demandKw} kW</p><p>Margem ${metrics.energy.marginPercent}%</p></article>
      </div>
    </section>
    <section class="surface panel sems-list-page" data-testid="goodwe-locations-panel">
      ${sectionHeader({ title: 'Locais', subtitle: 'Cada local pertence a este estabelecimento.' })}
      <div class="intel-grid">
        ${metrics.locationSummaries.map((summary) => locationCard(summary, metrics.establishment.id)).join('') || '<p>Nenhum local cadastrado.</p>'}
      </div>
      <form class="simulator-grid" data-form="create-location">
        <input type="hidden" name="establishmentId" value="${metrics.establishment.id}" />
        <label>Nome do local<input name="name" required /></label>
        <label>Endereco<input name="address" required /></label>
        <label>Numero<input name="number" required /></label>
        <label>Complemento<input name="complement" /></label>
        <label>Cidade<input name="city" required /></label>
        <label>Estado<input name="state" value="SP" required /></label>
        <label>CEP<input name="zipCode" required /></label>
        <label>Descricao<textarea name="description" rows="3"></textarea></label>
        <label>Qtd inicial de carregadores (opcional)<input name="initialChargers" type="number" min="0" value="0" /></label>
        <label>Status
          <select name="status">
            <option value="Ativo" selected>Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </label>
        <button type="submit">Cadastrar local</button>
      </form>
    </section>
    <section class="surface panel sems-list-page" data-testid="goodwe-access-panel">
      ${sectionHeader({ title: 'Acesso ao ChargeGrid', subtitle: 'A conta do estabelecimento e criada pela GoodWe.' })}
      ${simpleTable({
        columns: ['Email', 'Responsavel', 'Status', 'Perfil'],
        rows: accounts.map((account) => {
          const user = state.users.find((item) => item.id === account.userId);
          return [account.email, user?.name ?? '--', account.status, account.profile];
        })
      })}
      <form class="simulator-grid" data-form="create-establishment-account">
        <input type="hidden" name="establishmentId" value="${metrics.establishment.id}" />
        <label>Nome do responsavel<input name="name" required /></label>
        <label>Email<input name="email" type="email" required /></label>
        <label>Senha temporaria<input name="password" required /></label>
        <label>Telefone<input name="phone" /></label>
        <label>Status
          <select name="status">
            <option value="Ativo" selected>Ativo</option>
            <option value="Inativo">Inativo</option>
          </select>
        </label>
        <button type="submit">Criar conta do estabelecimento</button>
      </form>
    </section>
    <section class="surface panel sems-panel" data-testid="goodwe-transfer-panel">
      ${sectionHeader({ title: 'Movimentacao de carregador', subtitle: 'Transferencia com historico registrado automaticamente.' })}
      <form class="simulator-grid" data-form="transfer-charger">
        <label>Carregador
          <select name="chargerId" required>
            ${metrics.chargers.map((charger) => `<option value="${charger.id}">${charger.id} · ${charger.model}</option>`).join('')}
          </select>
        </label>
        <label>Local de destino
          <select name="toLocationId" required>
            ${metrics.locations.map((location) => `<option value="${location.id}">${location.name}</option>`).join('')}
          </select>
        </label>
        <label>Motivo<input name="reason" placeholder="Transferencia operacional" /></label>
        <button type="submit">Transferir carregador</button>
      </form>
    </section>`;
}

function locationDetail(state, context, monitorOnly) {
  const summary = context.locationSummary;
  if (!summary) {
    return '<section class="surface panel"><p>Local nao encontrado para este perfil.</p></section>';
  }

  const rows = summary.chargers.map((charger) => {
    const activeSession = context.estMetrics.activeSessions.find((session) => session.chargerId === charger.id);
    return [
      charger.id,
      charger.model,
      `${charger.powerKw} kW`,
      badge(charger.status),
      activeSession?.id ?? 'Sem sessao',
      `${formatNumber(charger.todayEnergyKwh)} kWh`,
      formatMoney(charger.todayRevenue),
      formatDateTime(charger.lastCommunication)
    ];
  });

  const movementRows = state.chargerMovements
    .filter(
      (movement) =>
        movement.toLocationId === summary.location.id || movement.fromLocationId === summary.location.id
    )
    .slice(0, 8)
    .map((movement) => {
      const from = getLocationById(state, movement.fromLocationId);
      const to = getLocationById(state, movement.toLocationId);
      return [
        movement.chargerId,
        from?.name ?? '--',
        to?.name ?? '--',
        movement.reason,
        formatDateTime(movement.changedAt)
      ];
    });

  return `
    <section class="surface panel sems-panel" data-testid="mvp-location-detail-panel">
      ${sectionHeader({
        title: `Local: ${summary.location.name}`,
        subtitle: monitorOnly
          ? 'Monitoramento operacional do local atribuido ao estabelecimento.'
          : 'GoodWe administra estrutura e carregadores deste local.'
      })}
      <div class="kpi-grid four-cols">
        ${kpiCard({ label: 'Carregadores', value: summary.total, help: 'instalados no local' })}
        ${kpiCard({ label: 'Disponiveis', value: summary.available, help: 'prontos para sessao' })}
        ${kpiCard({ label: 'Em uso', value: summary.inUse, help: 'tempo real', accent: 'danger' })}
        ${kpiCard({ label: 'Offline', value: summary.offline, help: 'indisponiveis' })}
        ${kpiCard({ label: 'Sessoes acontecendo', value: summary.sessionsNow, help: 'agora' })}
        ${kpiCard({ label: 'Energia entregue', value: `${formatNumber(summary.deliveredMonth)} kWh`, help: 'acumulado' })}
        ${kpiCard({ label: 'Receita', value: formatMoney(summary.monthRevenue), help: 'acumulado local' })}
        ${kpiCard({ label: 'Status energetico', value: context.estMetrics.energy.state, help: `${context.estMetrics.energy.marginPercent}% margem`, accent: tone(context.estMetrics.energy.state) })}
      </div>
      <article class="assistant-card">
        <h3>Endereco</h3>
        <p>${summary.location.address}, ${summary.location.number} ${summary.location.complement ?? ''}</p>
        <p>${summary.location.city}/${summary.location.state} · CEP ${summary.location.zipCode}</p>
      </article>
    </section>
    <section class="surface panel sems-list-page" data-testid="mvp-location-chargers">
      ${sectionHeader({ title: 'Carregadores do local', subtitle: 'Lista unica de equipamentos compartilhada entre perfis.' })}
      ${simpleTable({
        columns: ['Identificacao', 'Modelo', 'Potencia', 'Status', 'Sessao atual', 'Energia', 'Receita', 'Ultima comunicacao'],
        rows
      })}
    </section>
    ${
      monitorOnly
        ? ''
        : `
      <section class="surface panel sems-panel" data-testid="goodwe-create-charger-panel">
        ${sectionHeader({ title: 'Cadastrar carregador', subtitle: 'Vinculo obrigatorio ao estabelecimento e ao local.' })}
        <form class="simulator-grid" data-form="create-charger">
          <input type="hidden" name="establishmentId" value="${context.establishment.id}" />
          <input type="hidden" name="locationId" value="${summary.location.id}" />
          <label>Nome ou identificacao<input name="identifier" required /></label>
          <label>ID interno<input name="internalId" required /></label>
          <label>Numero de serie<input name="serial" required /></label>
          <label>Modelo<input name="model" required /></label>
          <label>Potencia nominal (kW)<input name="powerKw" type="number" min="1" required /></label>
          <label>Data de instalacao<input name="installationDate" type="date" required /></label>
          <label>Status
            <select name="status">
              <option value="available" selected>Disponivel</option>
              <option value="offline">Offline</option>
              <option value="reserved">Reservado</option>
            </select>
          </label>
          <label>Dados tecnicos<textarea name="technicalNotes" rows="3"></textarea></label>
          <button type="submit">Cadastrar carregador</button>
        </form>
      </section>
      <section class="surface panel sems-list-page" data-testid="goodwe-movement-history-panel">
        ${sectionHeader({ title: 'Historico de movimentacao', subtitle: 'Preparado para auditoria de transferencias.' })}
        ${simpleTable({
          columns: ['Carregador', 'Origem', 'Destino', 'Motivo', 'Data'],
          rows: movementRows
        })}
      </section>`
    }`;
}

function establishmentOverview(context) {
  const metrics = context.estMetrics;
  const cards = metrics.locationSummaries
    .map((summary) => locationCard(summary, metrics.establishment.id, true))
    .join('');
  const waiting = metrics.queue.filter((item) => item.status === 'waiting').length;
  const locationNames = metrics.locations.map((location) => location.name).join(', ');

  return `
    <section class="surface panel sems-panel" data-testid="mvp-overview-panel">
      ${sectionHeader({
        title: `Operacao de ${metrics.establishment.name}`,
        subtitle: 'O estabelecimento recebe estrutura pronta e monitora sua operacao.'
      })}
      ${commercialStatusTabs({
        total: metrics.chargers.length,
        active: metrics.available + metrics.inUse,
        waiting,
        offline: metrics.offline,
        building: metrics.locations.length
      })}
      <div class="kpi-grid four-cols" data-testid="mvp-overview-kpis">
        ${kpiCard({ testId: 'mvp-kpi-available', label: 'Carregadores disponiveis', value: metrics.available, help: 'nos seus locais' })}
        ${kpiCard({ testId: 'mvp-kpi-inuse', label: 'Carregadores em uso', value: metrics.inUse, help: 'tempo real', accent: 'danger' })}
        ${kpiCard({ testId: 'mvp-kpi-active-sessions', label: 'Sessoes acontecendo', value: metrics.activeSessions.length, help: 'agora' })}
        ${kpiCard({ testId: 'mvp-kpi-demand-state', label: 'Estado da demanda', value: metrics.energy.state, help: `${metrics.energy.marginPercent}% margem`, accent: tone(metrics.energy.state) })}
        ${kpiCard({ label: 'Locais atribuidos', value: metrics.locations.length, help: 'cadastro GoodWe' })}
        ${kpiCard({ label: 'Energia entregue', value: `${formatNumber(metrics.deliveredMonth)} kWh`, help: 'acumulado' })}
        ${kpiCard({ label: 'Receita', value: formatMoney(metrics.monthRevenue), help: 'operacao' })}
        ${kpiCard({ label: 'Fila atual', value: metrics.queue.filter((item) => item.status === 'waiting').length, help: 'aguardando' })}
      </div>
    </section>
    <section class="surface panel sems-list-page" data-testid="mvp-overview-recommendation">
      ${sectionHeader({ title: 'Resumo por local', subtitle: 'Clique para acompanhar cada ponto separadamente.' })}
      <div class="intel-grid">${cards || '<p>Nenhum local vinculado.</p>'}</div>
      <article class="assistant-card">
        <h3>Recomendacao principal</h3>
        <p>Locais monitorados: ${locationNames || 'nenhum local cadastrado'}. Fila atual: ${waiting} aguardando. ${waiting > 0 ? 'Priorizar monitoramento dos locais com maior ocupacao.' : 'Operacao sem fila critica neste momento.'}</p>
      </article>
    </section>`;
}

function locationsMonitor(context) {
  const metrics = context.estMetrics;
  const rows = metrics.locationSummaries.map((summary) => [
    `<div class="sems-entity-cell"><img src="${context.establishment.folderImage || assets.plant}" alt="" /><strong>${summary.location.name}</strong><span>${summary.location.city}/${summary.location.state} · ${summary.location.address}</span></div>`,
    badge(summary.inUse > 0 ? 'charging' : 'available'),
    `${summary.available}`,
    `${summary.inUse}`,
    `${summary.offline}`,
    `${formatNumber(summary.deliveredMonth)} kWh`,
    formatMoney(summary.monthRevenue),
    `<a class="ghost-button" href="#/mvp/location?est=${context.establishment.id}&loc=${summary.location.id}">Abrir monitoramento</a>`
  ]);

  return `
    <section class="surface panel sems-list-page" data-testid="establishment-locations-panel">
      ${sectionHeader({ title: 'Meus locais', subtitle: 'Locais atribuidos pela GoodWe para monitoramento operacional.' })}
      <form>${salesFilterToolbar()}</form>
      ${commercialStatusTabs({
        total: metrics.locations.length,
        active: metrics.locationSummaries.filter((summary) => summary.inUse > 0 || summary.available > 0).length,
        waiting: metrics.queue.filter((item) => item.status === 'waiting').length,
        offline: metrics.locationSummaries.filter((summary) => summary.offline > 0).length,
        building: metrics.locations.length
      })}
      ${simpleTable({
        columns: ['Informacoes do local', 'Status', 'Disponiveis', 'Em uso', 'Offline', 'Energia', 'Receita', 'Operacao'],
        rows
      })}
    </section>`;
}

function chargersSection(state, context, isGoodwe) {
  const metrics = context.estMetrics;

  if (!metrics) {
    return `
      <section class="surface panel" data-testid="mvp-chargers-panel">
        ${sectionHeader({
          title: 'Carregadores',
          subtitle: 'Nenhum estabelecimento cadastrado ainda.'
        })}
        <p>Cadastre o primeiro estabelecimento na aba Estabelecimentos para liberar o cadastro de carregadores.</p>
      </section>`;
  }

  const selectedLocation = state.ui.monitorLocationFilter ?? 'all';
  const selectedStatus = state.ui.monitorStatusFilter ?? 'all';

  const locationRows = [{ value: 'all', label: 'Todos os locais' }].concat(
    metrics.locations.map((location) => ({ value: location.id, label: location.name }))
  );

  const filtered = metrics.chargers.filter((charger) => {
    if (selectedLocation !== 'all' && charger.locationId !== selectedLocation) return false;
    if (selectedStatus !== 'all' && charger.status !== selectedStatus) return false;
    return true;
  });

  const rows = filtered.map((charger) => {
    const location = getLocationById(state, charger.locationId);
    const activeSession = metrics.activeSessions.find((session) => session.chargerId === charger.id);
    return [
      `<strong>${charger.id}</strong><span>${charger.internalId}</span>`,
      location?.name ?? '--',
      badge(charger.status),
      `${charger.powerKw} kW`,
      `${formatNumber(charger.currentPowerKw)} kW`,
      activeSession?.id ?? 'Sem sessao',
      `${formatNumber(charger.todayEnergyKwh)} kWh`,
      `${charger.utilizationPercent}%`,
      `<button class="ghost-button" data-action="select-charger" data-charger-id="${charger.id}">Selecionar</button>`
    ];
  });

  const selectedChargerId =
    state.ui.selectedChargerId ?? filtered[0]?.id ?? metrics.chargers[0]?.id ?? null;
  const selectedCharger = metrics.chargers.find((charger) => charger.id === selectedChargerId) ?? null;
  const selectedSession = metrics.activeSessions.find(
    (session) => session.chargerId === selectedCharger?.id
  );

  const table = `
    <section class="surface panel sems-list-page" data-testid="mvp-chargers-panel">
      ${sectionHeader({
        title: isGoodwe ? 'Carregadores administrados pela GoodWe' : 'Carregadores dos meus locais',
        subtitle: isGoodwe
          ? 'Cadastro e vinculos centralizados pela GoodWe.'
          : 'Monitoramento operacional sem alterar estrutura cadastral.'
      })}
      <div class="sems-device-tabs">
        <span class="is-active">Carregador AC/DC</span>
        <span>Gateway</span>
        <span>Medidor</span>
        <span>Terceiros</span>
      </div>
      <form data-form="monitor-filters">
        ${semsFilterToolbar({
          fields: [
            { name: 'monitorLocationFilter', label: 'Local', value: selectedLocation, options: locationRows },
            {
              name: 'monitorStatusFilter',
              label: 'Status',
              value: selectedStatus,
              options: [
                { value: 'all', label: 'Todos' },
                { value: 'charging', label: 'Carregando' },
                { value: 'available', label: 'Disponivel' },
                { value: 'offline', label: 'Offline' }
              ]
            }
          ],
          actions: isGoodwe ? '<a class="sems-primary-action" href="#/mvp/chargers">+ Novo carregador</a>' : ''
        })}
      </form>
      ${semsStatusTabs({
        active: selectedStatus,
        items: [
          { value: 'all', label: 'Todos', count: metrics.chargers.length, tone: 'info' },
          { value: 'available', label: 'Em operacao', count: metrics.available, tone: 'good' },
          { value: 'charging', label: 'Em uso', count: metrics.inUse, tone: 'danger' },
          { value: 'reserved', label: 'Em espera', count: metrics.chargers.filter((charger) => charger.status === 'reserved').length, tone: 'warn' },
          { value: 'offline', label: 'Offline', count: metrics.offline, tone: 'muted' }
        ]
      })}
      ${simpleTable({
        columns: ['Equipamento', 'Local', 'Status', 'Potencia', 'Potencia atual', 'Sessao atual', 'Energia dia', 'Utilizacao', 'Detalhe'],
        rows
      })}
    </section>`;

  const detail =
    selectedCharger
      ? `
    <section class="surface panel" data-testid="mvp-charger-detail">
      ${sectionHeader({ title: `Detalhes ${selectedCharger.id}`, subtitle: 'Dados operacionais do equipamento selecionado.' })}
      <div class="detail-grid">
        <article><h3>Identificacao</h3><p>${selectedCharger.id}</p><p>${selectedCharger.internalId}</p></article>
        <article><h3>Local</h3><p>${getLocationById(state, selectedCharger.locationId)?.name ?? '--'}</p><p>${context.establishment.name}</p></article>
        <article><h3>Status</h3><p>${badge(selectedCharger.status)}</p><p>Potencia nominal ${selectedCharger.powerKw} kW</p></article>
        <article><h3>Sessao atual</h3><p>${selectedSession?.id ?? 'Sem sessao ativa'}</p><p>${selectedSession?.durationMinutes ?? 0} min</p></article>
        <article><h3>Energia dia</h3><p>${formatNumber(selectedCharger.todayEnergyKwh)} kWh</p><p>Receita ${formatMoney(selectedCharger.todayRevenue)}</p></article>
        <article><h3>Historico</h3><p>Ultima comunicacao ${formatDateTime(selectedCharger.lastCommunication)}</p><p>Utilizacao ${selectedCharger.utilizationPercent}%</p></article>
      </div>
    </section>`
      : '';

  let creationPanel = '';

  if (isGoodwe) {
    const selectedEstablishmentId =
      state.ui.selectedEstablishmentId ?? context.establishment?.id ?? state.establishments[0]?.id ?? '';
    const selectedEstablishment =
      state.establishments.find((establishment) => establishment.id === selectedEstablishmentId) ?? null;
    const selectedLocations = state.locations.filter(
      (location) => location.establishmentId === selectedEstablishmentId
    );
    const selectedLocationId =
      selectedLocations.find((location) => location.id === state.ui.selectedLocationId)?.id ??
      selectedLocations[0]?.id ??
      '';

    creationPanel = `
      <section class="surface panel" data-testid="goodwe-charger-onboarding-panel">
        ${sectionHeader({
          title: 'Cadastrar novo carregador',
          subtitle: 'Selecione um estabelecimento cadastrado e vincule um novo equipamento.'
        })}
        <form class="inline-form" data-form="select-charger-establishment">
          <label>Estabelecimento
            <select name="establishmentId" required>
              ${state.establishments
                .map(
                  (establishment) =>
                    `<option value="${establishment.id}" ${
                      establishment.id === selectedEstablishmentId ? 'selected' : ''
                    }>${establishment.name}</option>`
                )
                .join('')}
            </select>
          </label>
          <button type="submit">Selecionar estabelecimento</button>
        </form>
        <form class="simulator-grid" data-form="create-charger-by-establishment">
          <input type="hidden" name="establishmentId" value="${selectedEstablishmentId}" />
          <label>Local do carregador
            <select name="locationId" required>
              ${selectedLocations
                .map(
                  (location) =>
                    `<option value="${location.id}" ${location.id === selectedLocationId ? 'selected' : ''}>${location.name}</option>`
                )
                .join('')}
            </select>
          </label>
          <label>Nome ou identificacao<input name="identifier" required /></label>
          <label>ID interno<input name="internalId" required /></label>
          <label>Numero de serie<input name="serial" required /></label>
          <label>Modelo<input name="model" required /></label>
          <label>Potencia nominal (kW)<input name="powerKw" type="number" min="1" required /></label>
          <label>Data de instalacao<input name="installationDate" type="date" required /></label>
          <label>Status
            <select name="status">
              <option value="available" selected>Disponivel</option>
              <option value="offline">Offline</option>
              <option value="reserved">Reservado</option>
            </select>
          </label>
          <label>Dados tecnicos<textarea name="technicalNotes" rows="3"></textarea></label>
          <button type="submit" ${selectedLocations.length === 0 ? 'disabled' : ''}>Cadastrar carregador</button>
        </form>
        ${
          !selectedEstablishment
            ? '<p>Nenhum estabelecimento disponivel.</p>'
            : selectedLocations.length === 0
              ? '<p>Este estabelecimento ainda nao possui local. Cadastre um local primeiro.</p>'
              : ''
        }
      </section>`;
  }

  return `${table}${detail}${creationPanel}`;
}

function sessionsSection(state, context) {
  const metrics = context.estMetrics;
  const finishedRows = metrics.finishedSessions.map((session) => [
    session.id,
    getLocationById(state, session.locationId)?.name ?? '--',
    session.chargerId,
    session.driverName,
    formatDateTime(session.startedAt),
    `${session.durationMinutes} min`,
    `${formatNumber(session.energyKwh)} kWh`,
    formatMoney(session.status === 'finished' ? session.finalAmount ?? session.consumedAmount : session.consumedAmount),
    session.payment.status
  ]);

  const selectedSession = getSessionById(
    state,
    state.ui.selectedSessionId ?? metrics.activeSessions[0]?.id ?? metrics.finishedSessions[0]?.id
  );

  return `
    <section class="surface panel sems-list-page" data-testid="mvp-sessions-active">
      ${sectionHeader({ title: 'Sessoes ativas', subtitle: 'Acompanhamento em tempo real por local e carregador.' })}
      ${semsStatusTabs({
        active: 'active',
        items: [
          { value: 'all', label: 'Todos', count: metrics.sessions.length, tone: 'info' },
          { value: 'active', label: 'Em ocorrencia', count: metrics.activeSessions.length, tone: 'danger' },
          { value: 'finished', label: 'Resolvidos', count: metrics.finishedSessions.length, tone: 'good' },
          { value: 'waiting', label: 'Fila', count: metrics.queue.filter((item) => item.status === 'waiting').length, tone: 'warn' }
        ]
      })}
      <div class="intel-grid">
        ${metrics.activeSessions
          .map(
            (session) => `
          <article class="intel-card">
            <h3>${session.id}</h3>
            <p>${session.chargerId} · ${getLocationById(state, session.locationId)?.name ?? '--'}</p>
            <p>${session.durationMinutes} min · ${formatNumber(session.energyKwh)} kWh</p>
            <p>${formatMoney(session.tariffPerKwh)}/kWh · ${formatMoney(session.consumedAmount)}</p>
            <button class="ghost-button" data-action="select-session" data-session-id="${session.id}">Abrir sessao</button>
          </article>`
          )
          .join('') || '<p>Sem sessoes ativas.</p>'}
      </div>
    </section>
    <section class="surface panel sems-list-page" data-testid="mvp-sessions-finished">
      ${sectionHeader({ title: 'Historico de sessoes', subtitle: 'Registro consolidado da operacao.' })}
      ${simpleTable({
        columns: ['ID', 'Local', 'Carregador', 'Usuario', 'Inicio', 'Duracao', 'Energia', 'Valor', 'Pagamento'],
        rows: finishedRows
      })}
    </section>
    ${
      selectedSession
        ? `<section class="surface panel" data-testid="mvp-session-detail">
      ${sectionHeader({ title: `Detalhes da sessao ${selectedSession.id}` })}
      <div class="detail-grid">
        <article><h3>Local</h3><p>${getLocationById(state, selectedSession.locationId)?.name ?? '--'}</p></article>
        <article><h3>Carregador</h3><p>${selectedSession.chargerId}</p></article>
        <article><h3>Energia</h3><p>${formatNumber(selectedSession.energyKwh)} kWh</p></article>
        <article><h3>Tempo</h3><p>${selectedSession.durationMinutes} min</p></article>
        <article><h3>Tarifa</h3><p>${formatMoney(selectedSession.tariffPerKwh)}/kWh</p></article>
        <article><h3>Pagamento</h3><p>${selectedSession.payment.status}</p></article>
      </div>
    </section>`
        : ''
    }`;
}

function energySection(context) {
  const metrics = context.estMetrics;

  const queueRows = metrics.queue
    .filter((item) => item.status === 'waiting' || item.status === 'released')
    .map((item, index) => [
      String(index + 1),
      item.driverName,
      locationNameFromMetrics(metrics, item.locationId),
      item.chargerPreference ?? '-',
      item.status,
      item.note ?? '--'
    ]);

  return `
    <section class="surface panel" data-testid="mvp-energy-panel">
      ${sectionHeader({ title: 'Demanda e Energia', subtitle: 'Monitoramento operacional da infraestrutura recebida.' })}
      <div class="kpi-grid four-cols">
        ${kpiCard({ label: 'Demanda atual', value: `${metrics.energy.demandKw} kW`, help: 'consumo total instantaneo' })}
        ${kpiCard({ label: 'Limite contratado', value: `${metrics.energy.contractLimitKw} kW`, help: 'capacidade maxima' })}
        ${kpiCard({ label: 'Carga dos carregadores', value: `${metrics.energy.chargerLoadKw} kW`, help: 'consumo de recarga' })}
        ${kpiCard({ label: 'Margem', value: `${metrics.energy.marginPercent}%`, help: metrics.energy.state, accent: tone(metrics.energy.state) })}
        ${kpiCard({ label: 'Solar', value: `${metrics.energy.solarKw} kW`, help: 'geracao renovavel' })}
        ${kpiCard({ label: 'Bateria', value: `${metrics.energy.batterySocPercent}%`, help: 'SOC estimado' })}
        ${kpiCard({ label: 'Sessoes em andamento', value: metrics.activeSessions.length, help: 'tempo real' })}
        ${kpiCard({ label: 'Fila', value: metrics.queue.filter((item) => item.status === 'waiting').length, help: 'aguardando vaga' })}
      </div>
    </section>
    <section class="surface panel" data-testid="mvp-queue-panel">
      ${sectionHeader({ title: 'Fila de espera', subtitle: 'Concentrada por disponibilidade e condicao energetica.' })}
      ${simpleTable({
        columns: ['Posicao', 'Usuario', 'Local', 'Carregador provavel', 'Status', 'Observacao'],
        rows: queueRows
      })}
    </section>
    <section class="surface panel sems-list-page">
      ${sectionHeader({ title: 'Condicao por ponto', subtitle: 'Cada local possui demanda, limite e margem independentes.' })}
      <div class="intel-grid">${metrics.locationSummaries.map((summary) => `<article class="intel-card"><div class="network-card-title"><h3>${summary.location.name}</h3>${badge(summary.energy?.state ?? 'offline')}</div><p>Demanda ${formatNumber(summary.energy?.demandKw ?? 0)} kW de ${formatNumber(summary.energy?.contractLimitKw ?? 0)} kW</p><p>Solar ${formatNumber(summary.energy?.solarKw ?? 0)} kW · Bateria ${formatNumber(summary.energy?.batterySocPercent ?? 0)}%</p><p>Margem ${formatNumber(summary.energy?.marginPercent ?? 0)}% · ${summary.inUse} em uso</p><a class="ghost-button" href="#/mvp/location?est=${metrics.establishment.id}&loc=${summary.location.id}">Abrir ponto</a></article>`).join('')}</div>
    </section>`;
}

function pricingSection(context) {
  const metrics = context.estMetrics;
  const sampleSession = metrics.activeSessions[0] ?? metrics.finishedSessions[0];
  const rows = metrics.sessions.slice(0, 10).map((session) => [
    session.id,
    locationNameFromMetrics(metrics, session.locationId),
    session.payment.method,
    formatMoney(session.limitAmount),
    formatMoney(session.status === 'finished' ? session.finalAmount ?? session.consumedAmount : session.consumedAmount),
    session.payment.status
  ]);

  return `
    <section class="surface panel" data-testid="mvp-pricing-panel">
      ${sectionHeader({ title: 'Tarifacao e Pagamentos', subtitle: 'Regras comerciais aplicadas sobre uma base de dados compartilhada.' })}
      <div class="detail-grid">
        <article><h3>Tarifa base</h3><p>${formatMoney(metrics.establishment.pricePerKwh)}/kWh</p></article>
        <article><h3>Receita acumulada</h3><p>${formatMoney(metrics.monthRevenue)}</p></article>
        <article><h3>Pagamentos aprovados</h3><p>${metrics.approved}</p></article>
        <article><h3>Pagamentos pendentes</h3><p>${metrics.pending}</p></article>
      </div>
      ${
        sampleSession
          ? `<article class="assistant-card">
        <h3>Sessao de referencia ${sampleSession.id}</h3>
        <p>${formatNumber(sampleSession.energyKwh)} kWh x ${formatMoney(sampleSession.tariffPerKwh)}/kWh</p>
        <p>Valor: ${formatMoney(sampleSession.status === 'finished' ? sampleSession.finalAmount ?? sampleSession.consumedAmount : sampleSession.consumedAmount)}</p>
      </article>`
          : ''
      }
    </section>
    <section class="surface panel" data-testid="mvp-payments-table">
      ${sectionHeader({ title: 'Cobranca das recargas', subtitle: 'Historico financeiro por sessao.' })}
      ${simpleTable({ columns: ['Sessao', 'Local', 'Metodo', 'Limite', 'Valor', 'Status'], rows })}
    </section>`;
}

function aiTopics({ metrics, forecast, state }) {
  const waiting = metrics.queue.filter((item) => item.status === 'waiting').length;
  const offline = metrics.chargers.filter((charger) => charger.status === 'offline').length;
  const active = metrics.activeSessions.length;
  const customQuestion = state.ui.aiChatQuestion?.trim();

  return [
    {
      id: 'station-devices',
      title: 'Station/Devices',
      subtitle: `${metrics.locations.length} locais · ${metrics.chargers.length} carregadores`,
      answerTitle: 'Recomendacoes objetivas',
      answer: `A rede possui ${metrics.locations.length} locais vinculados e ${metrics.chargers.length} carregadores. Priorize locais com carregadores offline (${offline}) e acompanhe sessoes ativas (${active}) antes de liberar novas campanhas comerciais.`
    },
    {
      id: 'indicator-lights',
      title: 'Indicator Lights',
      subtitle: `${offline} alertas tecnicos na carteira`,
      answerTitle: 'Status dos indicadores',
      answer: offline
        ? `Existem ${offline} carregadores offline. A recomendacao e abrir manutencao, confirmar comunicacao e validar se o estabelecimento recebeu alerta operacional.`
        : 'Nao ha carregadores offline no momento. A operacao esta apta para novas sessoes e acompanhamento comercial.'
    },
    {
      id: 'demand-forecast',
      title: 'Demand Forecast',
      subtitle: `${forecast.demand30} kW em 30 min`,
      answerTitle: 'Previsao de demanda',
      answer: `${forecast.relationship} Demanda atual ${forecast.demandNow} kW, previsao de ${forecast.demand30} kW em 30 minutos e ${forecast.demand60} kW em 60 minutos.`
    },
    {
      id: 'sessions-payments',
      title: 'Sessions/Payments',
      subtitle: `${active} sessoes · ${metrics.approved} aprovados`,
      answerTitle: 'Sessoes e pagamentos',
      answer: `Ha ${active} sessoes em andamento, ${metrics.approved} pagamentos aprovados e ${metrics.pending} pendentes. Use essa visao para confirmar receita antes de expandir pontos de recarga.`
    },
    {
      id: 'queue-energy',
      title: 'Queue/Energy',
      subtitle: `${waiting} em fila · risco ${forecast.risk}`,
      answerTitle: 'Fila e energia',
      answer: waiting
        ? `A fila atual tem ${waiting} usuarios. Antes de liberar novos carregamentos, confirme margem energetica de ${metrics.energy.marginPercent}% e risco ${forecast.risk}.`
        : `Sem fila relevante agora. Margem energetica em ${metrics.energy.marginPercent}% e risco ${forecast.risk}.`
    },
    {
      id: 'custom',
      title: customQuestion || 'Pergunta interna',
      subtitle: 'Resposta pelos dados do sistema',
      answerTitle: 'Resposta do agente',
      answer: customQuestion
        ? `Analisei sua pergunta: "${customQuestion}". Pelos dados atuais, a rede tem ${metrics.chargers.length} carregadores, ${active} sessoes ativas, ${waiting} usuarios em fila e risco ${forecast.risk}.`
        : 'Digite uma pergunta interna sobre locais, carregadores, sessoes, energia, pagamentos ou fila para o agente cruzar os dados do sistema.'
    }
  ];
}

export function renderGoodweAiAgent(state, context, { drawer = false } = {}) {
  const forecast = buildDemandForecast(state, context.establishment.id);
  const metrics = context.estMetrics;
  const topics = aiTopics({ metrics, forecast, state });
  const selectedTopicId = state.ui.selectedAiTopic ?? 'station-devices';
  const selectedTopic = topics.find((topic) => topic.id === selectedTopicId) ?? topics[0];

  return `
    <section class="goodwe-ai-agent ${drawer ? 'goodwe-ai-drawer' : 'surface panel sems-ai-panel'}" data-testid="${
      drawer ? 'goodwe-ai-drawer' : 'mvp-ai-panel'
    }">
      <header class="goodwe-ai-header">
        <h2>${drawer ? 'Agente de IA GoodWe' : 'GoodWe AI Agent'}</h2>
        <div class="goodwe-ai-window-actions">
          <button type="button" aria-label="Expandir agente">⛶</button>
          <button type="button" data-action="close-assistant" aria-label="Fechar agente">×</button>
        </div>
      </header>
      <button type="button" class="goodwe-ai-side-icon" aria-label="Menu do agente">≡</button>
      <button type="button" class="goodwe-ai-new-chat" aria-label="Nova pergunta">⊞</button>
      <div class="goodwe-ai-intro">
        <img src="${assets.assistant}" alt="" />
        <h3>Ola! Sou a Assistente de IA da GoodWe.</h3>
        <p>Se tiver duvidas sobre nossos produtos ou o sistema, fique a vontade para perguntar.</p>
      </div>
      <div class="goodwe-ai-body">
        <aside class="goodwe-ai-topic-list" aria-label="Perguntas internas do sistema">
          ${topics
            .filter((topic) => topic.id !== 'custom' || state.ui.aiChatQuestion)
            .map(
              (topic) => `
          <button
            type="button"
            class="${topic.id === selectedTopic.id ? 'is-active' : ''}"
            data-action="select-ai-topic"
            data-topic="${topic.id}"
          >
            <strong>${topic.title}</strong>
            <span>${topic.subtitle}</span>
          </button>`
            )
            .join('')}
        </aside>
        <article class="assistant-card sems-ai-answer goodwe-ai-answer">
          <small>Resposta interna</small>
          <h3>${selectedTopic.answerTitle}</h3>
          <p>${selectedTopic.answer}</p>
          <ul>${forecast.recommendations.map((line) => `<li>${line}</li>`).join('')}</ul>
        </article>
      </div>
      <form class="goodwe-ai-compose" data-form="assistant-question">
        <button type="button" data-action="select-ai-topic" data-topic="station-devices">Usina/Dispositivos ›</button>
        <input name="question" value="${state.ui.aiChatQuestion ?? ''}" placeholder="Faca-me qualquer pergunta sobre o sistema." required />
        <button type="submit" aria-label="Enviar pergunta">↑</button>
      </form>
    </section>`;
}

function aiSection(state, context) {
  const priorities = context.estMetrics.locationSummaries
    .slice()
    .sort((a, b) => (a.energy?.marginPercent ?? 100) - (b.energy?.marginPercent ?? 100));
  return `
    ${renderGoodweAiAgent(state, context)}
    <section class="surface panel sems-list-page">
      ${sectionHeader({ title: 'Inteligencia por ponto', subtitle: 'Health score, anomalias e previsao no escopo fisico correto.' })}
      <div class="intel-grid">${priorities.map((summary) => { const forecastDemand = Math.round((summary.energy?.demandKw ?? 0) * (summary.waiting ? 1.18 : 1.08)); const risk = forecastDemand >= (summary.energy?.contractLimitKw ?? Infinity) * 0.9 ? 'Alto' : forecastDemand >= (summary.energy?.contractLimitKw ?? Infinity) * 0.75 ? 'Medio' : 'Baixo'; return `<article class="intel-card"><div class="network-card-title"><h3>${summary.location.name}</h3><strong>${summary.healthScore}/100</strong></div><p>Demanda prevista em 30 min: ${forecastDemand} kW</p><p>Risco de saturacao: ${risk} · ${summary.waiting} em fila</p><p>${summary.offline ? `${summary.offline} equipamento(s) offline. Verificar comunicacao e manutencao.` : 'Sem anomalia critica nos equipamentos.'}</p><a class="ghost-button" href="#/mvp/location?est=${summary.establishment?.id ?? context.establishment.id}&loc=${summary.location.id}">Investigar</a></article>`; }).join('')}</div>
    </section>
    <section class="surface panel" data-testid="mvp-architecture-panel">
      ${sectionHeader({ title: 'Arquitetura funcional', subtitle: 'GoodWe administra. Estabelecimento monitora dados vinculados.' })}
      <div class="architecture-flow">
        <div><strong>GoodWe</strong><span>cadastra estabelecimento, local, carregador e conta</span></div>
        <i>↓</i>
        <div><strong>Relacionamento</strong><span>conta vinculada ao estabelecimento correto</span></div>
        <i>↓</i>
        <div><strong>Monitoramento</strong><span>estabelecimento enxerga apenas o que recebeu</span></div>
      </div>
    </section>`;
}

function reportsSection(state, context) {
  const metrics = context.estMetrics;
  const period = state.ui.reportPeriod ?? 'day';

  const filtered = metrics.sessions.filter((session) => {
    if (period === 'active') return session.status === 'active';
    if (period === 'finished') return session.status === 'finished';
    return true;
  });

  return `
    <section class="surface panel sems-report-center" data-testid="mvp-reports-panel">
      ${sectionHeader({ title: 'Relatorios', subtitle: 'Consolidados por sessoes, energia e valores.' })}
      <div class="sems-report-toolbar">
        <span>Nao inscrito</span>
        <button type="button" class="sems-toggle" aria-label="Assinatura de relatorios"><i></i></button>
        <button type="button" class="sems-secondary-action">Meus relatorios</button>
      </div>
      <div class="sems-report-grid">
        ${semsReportCard({
          icon: assets.icons.reports,
          title: 'Relatorio comercial',
          lines: ['Geracao de receita por estabelecimento', 'Comparacao de varias unidades']
        })}
        ${semsReportCard({
          icon: assets.icons.devices,
          title: 'Relatorio de carregadores',
          lines: ['Dados de operacao por equipamento', 'Comparativo de multiplos dispositivos']
        })}
      </div>
      <form class="inline-form" data-form="mvp-report-filter">
        ${segmentedTabs({
          name: 'reportPeriod',
          testId: 'mvp-report-period-tabs',
          value: period,
          options: [
            { value: 'day', label: 'Periodo atual' },
            { value: 'active', label: 'Sessoes ativas' },
            { value: 'finished', label: 'Sessoes encerradas' }
          ]
        })}
        <button type="submit">Aplicar periodo</button>
      </form>
      <div class="intel-grid">
        <article class="intel-card"><h3>Sessoes</h3><p>${filtered.length} registros.</p></article>
        <article class="intel-card"><h3>Energia</h3><p>${formatNumber(filtered.reduce((sum, item) => sum + item.energyKwh, 0))} kWh</p></article>
        <article class="intel-card"><h3>Tarifa media</h3><p>${formatMoney(filtered.length ? filtered.reduce((sum, item) => sum + item.tariffPerKwh, 0) / filtered.length : 0)}/kWh</p></article>
        <article class="intel-card"><h3>Pagamentos aprovados</h3><p>${filtered.filter((item) => item.payment.status === 'Aprovado').length}</p></article>
      </div>
      ${simpleTable({
        columns: ['Sessao', 'Local', 'Carregador', 'Energia', 'Tarifa', 'Valor', 'Pagamento'],
        rows: filtered.map((session) => [
          session.id,
          getLocationById(state, session.locationId)?.name ?? '--',
          session.chargerId,
          `${formatNumber(session.energyKwh)} kWh`,
          `${formatMoney(session.tariffPerKwh)}/kWh`,
          formatMoney(
            session.status === 'finished' ? session.finalAmount ?? session.consumedAmount : session.consumedAmount
          ),
          session.payment.status
        ])
      })}
    </section>`;
}

function utilizationChart(metrics) {
  return histogram(
    [42, 55, 62, 71, 79, 86].map((value, index) => ({
      label: ['09h', '11h', '13h', '15h', '17h', '19h'][index],
      value,
      valueLabel: `${value}%`
    }))
  );
}

function defaultSection(context) {
  return `
    <section class="surface panel" data-testid="mvp-overview-panel">
      ${sectionHeader({ title: 'Resumo operacional', subtitle: 'Visao consolidada da operacao vinculada ao perfil.' })}
      <div class="two-col-grid">
        <article class="surface panel">${utilizationChart(context.estMetrics)}</article>
        <article class="assistant-card" data-testid="mvp-overview-recommendation">
          <h3>Recomendacao principal</h3>
          <p>${
            context.estMetrics.energy.state === 'Critico'
              ? 'Manter novas sessoes em espera para proteger a infraestrutura.'
              : context.estMetrics.energy.state === 'Alerta'
                ? 'Aplicar limitacao de potencia e monitorar fila.'
                : 'Cenario favoravel para operacao controlada.'
          }</p>
          <p>Fila atual: ${context.estMetrics.queue.filter((item) => item.status === 'waiting').length}</p>
        </article>
      </div>
    </section>`;
}

function networkOverviewPage(state) {
  const network = goodweMetrics(state);
  const waiting = state.queues.filter((item) => item.status === 'waiting').length;
  const alerts = network.totals.offline + state.locations.filter((location) => (state.energyByLocation?.[location.id]?.state ?? '') === 'Critico').length;
  const priority = state.locations
    .map((location) => locationMetrics(state, location.id))
    .filter(Boolean)
    .sort((a, b) => (a.energy?.marginPercent ?? 100) - (b.energy?.marginPercent ?? 100))[0];

  return `
    <section class="sems-dashboard-map" data-testid="mvp-overview-panel">
      ${worldChargerMap(state, network)}
      <div class="sems-dashboard-title"><h2>Visao geral da rede</h2><p>Cada marcador representa um ponto fisico de recarga.</p></div>
    </section>
    <section class="surface panel sems-panel">
      ${sectionHeader({ title: 'Resumo executivo', subtitle: 'Os numeros essenciais da operacao comercial GoodWe.' })}
      <div class="kpi-grid four-cols">
        ${kpiCard({ label: 'Estabelecimentos', value: state.establishments.length, help: 'clientes GoodWe' })}
        ${kpiCard({ label: 'Pontos de recarga', value: state.locations.length, help: 'locais fisicos' })}
        ${kpiCard({ label: 'Carregadores', value: network.totals.totalChargers, help: 'equipamentos vinculados' })}
        ${kpiCard({ testId: 'mvp-kpi-available', label: 'Disponiveis', value: network.totals.available, help: 'prontos para uso', accent: 'good' })}
        ${kpiCard({ testId: 'mvp-kpi-inuse', label: 'Em uso', value: network.totals.charging, help: 'carregadores ocupados', accent: 'danger' })}
        ${kpiCard({ testId: 'mvp-kpi-active-sessions', label: 'Sessoes acontecendo', value: network.totals.activeSessions, help: 'agora' })}
        ${kpiCard({ label: 'Offline', value: network.totals.offline, help: 'requerem atencao', accent: network.totals.offline ? 'warn' : 'good' })}
        ${kpiCard({ label: 'Energia entregue', value: `${formatNumber(network.totals.delivered)} kWh`, help: 'rede consolidada' })}
        ${kpiCard({ label: 'Receita movimentada', value: formatMoney(network.totals.movedRevenue), help: 'sessoes e pagamentos' })}
        ${kpiCard({ testId: 'mvp-kpi-demand-state', label: 'Alarmes', value: alerts, help: 'energia e equipamentos', accent: alerts ? 'warn' : 'good' })}
      </div>
    </section>
    ${decisionCenter(state)}`;
}

function establishmentCatalogPage(state) {
  return `
    <section class="surface panel sems-list-page" data-testid="goodwe-establishments-overview">
      ${sectionHeader({ title: 'Estabelecimentos', subtitle: 'Clientes administrados pela GoodWe e sua estrutura vinculada.', action: '<a class="sems-primary-action" href="#/mvp/new-establishment">Cadastrar novo estabelecimento</a>' })}
      <div class="establishment-folder-grid">${state.establishments.map((item) => establishmentFolderCard(state, item)).join('') || '<p>Nenhum estabelecimento cadastrado.</p>'}</div>
    </section>`;
}

function newEstablishmentPage(state, route) {
  const selectedClientId = route?.query?.client ?? state.clients[0]?.id ?? '';
  return `
    <section class="surface panel entity-form-page" data-testid="goodwe-create-establishment-panel">
      ${sectionHeader({ title: 'Cadastrar novo estabelecimento', subtitle: 'Crie o cliente e a conta que sera entregue ao gestor.' })}
      <form class="entity-form" data-form="create-establishment">
        <fieldset><legend>1. Dados empresariais</legend><div class="form-section-grid">
          <label>Cliente comercial<select name="clientId" required>${state.clients.map((item) => `<option value="${item.id}" ${item.id === selectedClientId ? 'selected' : ''}>${item.name}</option>`).join('')}</select></label><label>Nome comercial<input name="name" required /></label><label>Razao social<input name="corporateName" required /></label><label>CNPJ<input name="cnpj" required /></label><label>Telefone<input name="phone" required /></label><label>Email<input name="email" type="email" required /></label><label>Responsavel<input name="responsible" required /></label><label>Status<select name="status"><option>Ativo</option><option>Inativo</option></select></label><label>Cidade principal<input name="city" required /></label><label>Estado<input name="state" value="SP" required /></label>
        </div></fieldset>
        <fieldset><legend>2. Dados gerais</legend><div class="form-section-grid">
          <label>Tipo de cliente<select name="clientType"><option>Shopping</option><option>Varejo</option><option>Estacionamento</option><option>Corporativo</option></select></label><label>Entrada na rede<input name="networkEntryDate" type="date" value="2026-08-21" /></label><label>Imagem principal (URL)<input name="folderImage" placeholder="https://..." /></label><label>Tarifa base (R$/kWh)<input name="pricePerKwh" type="number" step="0.01" value="2.95" /></label><label class="form-span">Observacoes<textarea name="notes" rows="3"></textarea></label><label class="form-span">Informacoes internas<textarea name="internalInformation" rows="3"></textarea></label>
        </div></fieldset>
        <fieldset><legend>3. Endereco administrativo</legend><div class="form-section-grid">
          <label>Endereco<input name="address" required /></label><label>Numero<input name="number" required /></label><label>Complemento<input name="complement" /></label><label>CEP<input name="zipCode" required /></label>
        </div></fieldset>
        <fieldset><legend>4. Conta do estabelecimento</legend><div class="form-section-grid">
          <label>Nome do gestor<input name="accountName" required /></label><label>Email de acesso<input name="accountEmail" type="email" required /></label><label>Senha temporaria<input name="accountPassword" required /></label><label>Status da conta<select name="accountStatus"><option>Ativo</option><option>Inativo</option></select></label>
        </div></fieldset>
        <fieldset><legend>5. Governanca</legend><div class="form-section-grid"><label class="form-span">Motivo do cadastro<input name="reason" value="Expansao da estrutura do cliente" required /></label></div></fieldset>
        <div class="form-actions"><a class="ghost-button" href="#/mvp/establishments">Cancelar</a><button type="submit">Criar estabelecimento</button></div>
      </form>
    </section>`;
}

function globalLocationsPage(state, context) {
  const establishmentFilter = state.ui.networkEstablishmentFilter ?? 'all';
  const statusFilter = state.ui.networkLocationStatusFilter ?? 'all';
  const summaries = state.locations
    .filter((location) => establishmentFilter === 'all' || location.establishmentId === establishmentFilter)
    .filter((location) => statusFilter === 'all' || location.status === statusFilter)
    .map((location) => locationMetrics(state, location.id))
    .filter(Boolean);
  return `
    <section class="surface panel sems-list-page">
      ${sectionHeader({ title: 'Pontos de Recarga', subtitle: 'Mapa e blocos de todos os locais fisicos da rede.' })}
      <form class="inline-form" data-form="network-location-filters"><label>Estabelecimento<select name="establishmentId"><option value="all">Todos</option>${state.establishments.map((item) => `<option value="${item.id}" ${item.id === establishmentFilter ? 'selected' : ''}>${item.name}</option>`).join('')}</select></label><label>Status<select name="status"><option value="all">Todos</option><option value="Ativo" ${statusFilter === 'Ativo' ? 'selected' : ''}>Ativo</option><option value="Inativo" ${statusFilter === 'Inativo' ? 'selected' : ''}>Inativo</option></select></label><button type="submit">Filtrar</button></form>
      <div class="network-view-tabs"><span class="is-active">Blocos</span><a href="#/mvp/overview">Mapa</a></div>
      <div class="network-location-grid">${summaries.map((summary) => locationCard(summary, summary.establishment.id)).join('') || '<p>Nenhum ponto encontrado.</p>'}</div>
    </section>`;
}

function establishmentCenterPage(state, context) {
  const metrics = context.estMetrics;
  const accounts = getAccountsByEstablishment(state, metrics.establishment.id);
  return `
    <section class="entity-hero"><img src="${metrics.establishment.folderImage || assets.plant}" alt="${metrics.establishment.name}" /><div><span>ESTABELECIMENTO</span><h2>${metrics.establishment.name}</h2><p>${metrics.establishment.corporateName} · ${metrics.establishment.city}/${metrics.establishment.state}</p><div class="entity-hero-stats"><strong>${metrics.locations.length} pontos</strong><strong>${metrics.chargers.length} carregadores</strong><strong>${metrics.establishment.status}</strong><strong>${accounts[0]?.email ?? 'Sem conta'}</strong></div></div></section>
    <nav class="entity-tabs"><a href="#est-summary">Resumo</a><a class="is-active" href="#est-points">Pontos</a><a href="#est-accounts">Contas de acesso</a><a href="#est-operation">Operacao</a><a href="#est-history">Historico</a></nav>
    <section id="est-points" class="surface panel sems-list-page">${sectionHeader({ title: 'Pontos do estabelecimento', subtitle: 'Locais fisicos entregues e administrados pela GoodWe.', action: `<a class="sems-primary-action" href="#/mvp/new-location?est=${metrics.establishment.id}">Cadastrar novo ponto</a>` })}<div class="network-location-grid">${metrics.locationSummaries.map((summary) => locationCard(summary, metrics.establishment.id)).join('') || '<p>Nenhum ponto cadastrado. Use o botao acima para iniciar a estrutura.</p>'}</div></section>
    <section id="est-accounts" class="surface panel sems-list-page">${sectionHeader({ title: 'Contas de acesso', subtitle: 'Gestores vinculados exclusivamente a este estabelecimento.' })}${simpleTable({ columns: ['Nome', 'Email', 'Status', 'Perfil', 'Ultimo acesso'], rows: accounts.map((account) => { const user = state.users.find((item) => item.id === account.userId); return [user?.name ?? '--', account.email, badge(account.status === 'Ativo' ? 'available' : 'offline'), account.profile, account.lastAccess ?? 'Primeiro acesso']; }) })}<details class="admin-details"><summary>Criar conta de gestor</summary><form class="simulator-grid" data-form="create-establishment-account"><input type="hidden" name="establishmentId" value="${metrics.establishment.id}" /><label>Nome<input name="name" required /></label><label>Email<input name="email" type="email" required /></label><label>Senha temporaria<input name="password" required /></label><label>Cargo<input name="role" /></label><label>Telefone<input name="phone" /></label><label>Status<select name="status"><option>Ativo</option><option>Inativo</option></select></label><button type="submit">Criar conta</button></form></details></section>
    <section class="surface panel account-management"><h3>Administrar contas</h3><div class="account-action-grid">${accounts.map((account) => `<div><span>${account.email}</span><button class="ghost-button" data-action="toggle-account-status" data-account-id="${account.id}" data-status="${account.status === 'Ativo' ? 'Inativo' : 'Ativo'}">${account.status === 'Ativo' ? 'Desativar' : 'Reativar'}</button><button class="ghost-button" data-action="reset-account-password" data-account-id="${account.id}">Redefinir senha</button></div>`).join('')}</div></section>
    <section id="est-operation" class="surface panel"><div class="kpi-grid four-cols">${kpiCard({ label: 'Disponiveis', value: metrics.available, help: 'na rede do cliente' })}${kpiCard({ label: 'Em uso', value: metrics.inUse, help: 'agora', accent: 'danger' })}${kpiCard({ label: 'Sessoes ativas', value: metrics.activeSessions.length, help: 'operacao' })}${kpiCard({ label: 'Receita', value: formatMoney(metrics.monthRevenue), help: 'acumulado' })}</div></section>
    <section id="est-history" class="surface panel sems-list-page">${sectionHeader({ title: 'Historico administrativo', subtitle: 'Transferencias e alteracoes estruturais.' })}${simpleTable({ columns: ['Carregador', 'Origem', 'Destino', 'Responsavel', 'Data'], rows: state.chargerMovements.filter((item) => item.fromEstablishmentId === metrics.establishment.id || item.toEstablishmentId === metrics.establishment.id).map((item) => [item.chargerId, getLocationById(state, item.fromLocationId)?.name ?? '--', getLocationById(state, item.toLocationId)?.name ?? '--', item.responsible ?? 'GoodWe', formatDateTime(item.changedAt)]) })}</section>`;
}

function newLocationPage(state, context) {
  const establishment = context.establishment;
  return `<section class="surface panel entity-form-page">${sectionHeader({ title: 'Cadastrar novo ponto', subtitle: `Estabelecimento responsavel: ${establishment.name}` })}<form class="entity-form" data-form="create-location"><input type="hidden" name="establishmentId" value="${establishment.id}" />
    <fieldset><legend>1. Identificacao</legend><div class="form-section-grid"><label>Nome do ponto<input name="name" required /></label><label>Estabelecimento<input value="${establishment.name}" disabled /></label><label class="form-span">Descricao<textarea name="description"></textarea></label></div></fieldset>
    <fieldset><legend>2. Localizacao</legend><div class="form-section-grid"><label>Endereco<input name="address" required /></label><label>Numero<input name="number" required /></label><label>Complemento<input name="complement" /></label><label>CEP<input name="zipCode" required /></label><label>Cidade<input name="city" required /></label><label>Estado<input name="state" value="SP" required /></label></div></fieldset>
    <fieldset><legend>3. Imagens do ponto</legend><div class="form-section-grid"><label class="form-span">Imagem de capa (URL)<input name="coverImage" placeholder="https://..." /></label><label>Galeria: fachada (URL)<input name="galleryImage1" /></label><label>Galeria: carregadores (URL)<input name="galleryImage2" /></label></div></fieldset>
    <fieldset><legend>4. Operacao</legend><div class="form-section-grid"><label>Horario de funcionamento<input name="operatingHours" value="24 horas" /></label><label>Status<select name="status"><option>Ativo</option><option>Inativo</option></select></label><label class="form-span">Observacoes<textarea name="operationalNotes"></textarea></label><input type="hidden" name="initialChargers" value="0" /></div></fieldset>
    <div class="form-actions"><a class="ghost-button" href="#/mvp/establishment?est=${establishment.id}">Cancelar</a><button type="submit">Salvar ponto</button></div></form></section>`;
}

function chargerVisualCard(state, charger, context, monitorOnly) {
  const active = state.sessions.find((session) => session.chargerId === charger.id && session.status === 'active');
  return `<article class="charger-visual-card"><img src="${charger.image || assets.charger}" alt="${charger.model}" /><div><div class="network-card-title"><h3>${charger.internalId || charger.id}</h3>${badge(charger.status)}</div><p>${charger.model} · ${charger.powerKw} kW</p><p>${active ? `Sessao ${active.id} · ${active.durationMinutes} min` : 'Sem sessao ativa'}</p><div class="network-card-meta"><span>Health ${charger.healthScore ?? 92}/100</span><span>${formatNumber(charger.todayEnergyKwh)} kWh hoje</span></div><a class="ghost-button" href="#/mvp/charger?est=${charger.establishmentId}&loc=${charger.locationId}&charger=${charger.id}">Ver equipamento</a>${monitorOnly ? '' : ''}</div></article>`;
}

function locationOperationsPage(state, context, monitorOnly) {
  const summary = context.locationSummary;
  if (!summary) return '<section class="surface panel"><p>Ponto nao encontrado para este perfil.</p></section>';
  const energy = summary.energy ?? context.estMetrics.energy;
  const movements = state.chargerMovements.filter((item) => item.fromLocationId === summary.location.id || item.toLocationId === summary.location.id);
  return `
    <section class="entity-hero location-hero"><img src="${summary.location.coverImage || assets.plant}" alt="${summary.location.name}" /><div><span>PONTO DE RECARGA</span><h2>${summary.location.name}</h2><p>${context.establishment.name} · ${summary.location.address}, ${summary.location.number} · ${summary.location.city}/${summary.location.state}</p><div class="entity-hero-stats"><strong>${summary.total} carregadores</strong><strong>${summary.sessionsNow} sessoes ativas</strong><strong>Energia ${energy.state}</strong><strong>Health ${summary.healthScore}/100</strong></div></div></section>
    <nav class="entity-tabs"><a class="is-active" href="#point-summary">Resumo</a><a href="#point-chargers">Carregadores</a><a href="#point-operation">Operacao</a><a href="#point-energy">Energia</a><a href="#point-history">Historico</a></nav>
    <section id="point-summary" class="surface panel"><div class="kpi-grid four-cols">${kpiCard({ label: 'Carregadores', value: summary.total, help: 'instalados' })}${kpiCard({ label: 'Disponiveis', value: summary.available, help: 'prontos para uso', accent: 'good' })}${kpiCard({ label: 'Em uso', value: summary.inUse, help: 'agora', accent: 'danger' })}${kpiCard({ label: 'Offline', value: summary.offline, help: 'indisponiveis' })}${kpiCard({ label: 'Sessoes hoje', value: summary.sessionsNow, help: 'ativas' })}${kpiCard({ label: 'Energia entregue', value: `${formatNumber(summary.deliveredMonth)} kWh`, help: 'acumulado' })}${kpiCard({ label: 'Fila', value: summary.waiting, help: 'aguardando' })}${kpiCard({ label: 'Receita', value: formatMoney(summary.monthRevenue), help: 'ponto' })}</div></section>
    <section id="point-chargers" class="surface panel sems-list-page">${sectionHeader({ title: 'Carregadores instalados', subtitle: 'Equipamentos que pertencem atualmente a este ponto.', action: monitorOnly ? '' : '<a class="sems-primary-action" href="#new-charger">Adicionar carregador</a>' })}<div class="charger-visual-grid">${summary.chargers.map((charger) => chargerVisualCard(state, charger, context, monitorOnly)).join('') || '<p>Nenhum carregador instalado.</p>'}</div>${monitorOnly ? '' : `<details id="new-charger" class="admin-details"><summary>Cadastro de carregador</summary><form class="entity-form" data-form="create-charger"><input type="hidden" name="establishmentId" value="${context.establishment.id}" /><input type="hidden" name="locationId" value="${summary.location.id}" /><fieldset><legend>Identificacao</legend><div class="form-section-grid"><label>Nome do equipamento<input name="identifier" required /></label><label>ID interno<input name="internalId" required /></label><label>Numero de serie<input name="serial" required /></label><label>Patrimonio<input name="assetTag" /></label><label>Modelo<input name="model" list="charger-models" required /><datalist id="charger-models">${[...new Set(state.chargers.map((item) => item.model))].map((model) => `<option value="${model}">`).join('')}</datalist></label></div></fieldset><fieldset><legend>Caracteristicas tecnicas</legend><div class="form-section-grid"><label>Potencia nominal (kW)<input name="powerKw" type="number" min="1" required /></label><label>Numero de portas<input name="ports" type="number" min="1" value="1" /></label><label>Tipo de conexao<input name="connectionType" value="Tipo 2" /></label><label>Firmware<input name="firmware" /></label><label>Status<select name="status"><option value="available">Disponivel</option><option value="offline">Offline</option><option value="reserved">Reservado</option></select></label><label>Data de instalacao<input name="installationDate" type="date" value="2026-08-21" /></label></div></fieldset><fieldset><legend>Garantia e manutencao</legend><div class="form-section-grid"><label>Fim da garantia<input name="warrantyEndDate" type="date" /></label><label>Plano de manutencao<select name="maintenancePlan"><option>Preventiva semestral</option><option>Preventiva trimestral</option><option>Sob demanda</option></select></label><label>Proxima manutencao<input name="nextMaintenanceDate" type="date" /></label><label>Comissionamento<select name="commissioningStatus"><option>Pendente</option><option>Comissionado</option></select></label></div></fieldset><fieldset><legend>Vinculo e imagem</legend><div class="form-section-grid"><label>Estabelecimento<input value="${context.establishment.name}" disabled /></label><label>Ponto<input value="${summary.location.name}" disabled /></label><label class="form-span">Imagem do modelo (URL)<input name="image" /></label><label class="form-span">Dados tecnicos<textarea name="technicalNotes"></textarea></label><label class="form-span">Motivo do cadastro<input name="reason" value="Instalacao de equipamento" required /></label></div></fieldset><div class="form-actions"><button type="submit">Cadastrar carregador</button></div></form></details>`}</section>
    <section id="point-operation" class="surface panel"><div class="detail-grid"><article><h3>Operacao</h3><p>${summary.sessionsNow} sessoes em andamento</p><p>${summary.waiting} usuarios na fila</p><p>Horario: ${summary.location.operatingHours ?? '24 horas'}</p></article><article><h3>Tarifa</h3><p>${formatMoney(context.establishment.pricePerKwh)}/kWh</p><p>${formatMoney(summary.monthRevenue)} movimentados</p></article></div></section>
    <section id="point-energy" class="surface panel"><div class="detail-grid"><article><h3>Demanda</h3><p>${formatNumber(energy.demandKw)} kW</p><p>Limite ${formatNumber(energy.contractLimitKw)} kW</p></article><article><h3>Fontes</h3><p>Solar ${formatNumber(energy.solarKw)} kW</p><p>Bateria ${formatNumber(energy.batteryKw)} kW</p></article><article><h3>Carregadores</h3><p>${formatNumber(energy.chargerLoadKw)} kW</p><p>Margem ${formatNumber(energy.marginPercent)}%</p></article></div></section>
    <section id="point-history" class="surface panel sems-list-page">${sectionHeader({ title: 'Historico do ponto', subtitle: 'Transferencias, eventos e alteracoes.' })}${simpleTable({ columns: ['Carregador', 'Origem', 'Destino', 'Responsavel', 'Data'], rows: movements.map((item) => [item.chargerId, getLocationById(state, item.fromLocationId)?.name ?? '--', getLocationById(state, item.toLocationId)?.name ?? '--', item.responsible ?? 'GoodWe', formatDateTime(item.changedAt)]) })}</section>`;
}

function chargerDetailPage(state, context, monitorOnly, route) {
  const chargerId = route.query?.charger;
  const charger = state.chargers.find((item) => item.id === chargerId && (!monitorOnly || item.establishmentId === context.establishment.id));
  if (!charger) return '<section class="surface panel"><p>Carregador nao encontrado para este perfil.</p></section>';
  const location = getLocationById(state, charger.locationId);
  const sessions = state.sessions.filter((item) => item.chargerId === charger.id);
  const active = sessions.find((item) => item.status === 'active');
  return `<section class="charger-detail-hero"><img src="${charger.image || assets.charger}" alt="${charger.model}" /><div><span>CARREGADOR</span><h2>${charger.internalId || charger.id}</h2><p>${charger.model} · ${location?.name} · ${context.establishment.name}</p><div class="entity-hero-stats"><strong>${badge(charger.status)}</strong><strong>${charger.powerKw} kW</strong><strong>Health ${charger.healthScore ?? 92}/100</strong></div></div></section><section class="surface panel"><div class="detail-grid"><article><h3>Resumo</h3><p>Potencia atual ${formatNumber(charger.currentPowerKw)} kW</p><p>${formatNumber(charger.todayEnergyKwh)} kWh hoje</p><p>Utilizacao ${charger.utilizationPercent}%</p></article><article><h3>Sessao atual</h3><p>${active?.driverName ?? 'Sem sessao ativa'}</p><p>${active ? `${active.durationMinutes} min · ${formatMoney(active.consumedAmount)}` : 'Aguardando uso'}</p></article><article><h3>Inteligencia</h3><p>${charger.healthScore < 75 ? 'Anomalia detectada: verificar queda de potencia e comunicacao.' : 'Comportamento dentro do padrao esperado.'}</p><p>Risco operacional ${charger.healthScore < 75 ? 'alto' : 'baixo'}.</p></article></div></section><section class="surface panel sems-list-page">${sectionHeader({ title: 'Historico de sessoes', subtitle: 'Uso e pagamentos deste equipamento.' })}${simpleTable({ columns: ['Sessao', 'Motorista', 'Inicio', 'Energia', 'Valor', 'Status'], rows: sessions.map((item) => [item.id, item.driverName, formatDateTime(item.startedAt), `${formatNumber(item.energyKwh)} kWh`, formatMoney(item.finalAmount ?? item.consumedAmount), badge(item.status)]) })}</section>${monitorOnly ? '' : `<section class="surface panel"><details class="admin-details"><summary>Transferir carregador</summary><form class="simulator-grid" data-form="transfer-charger"><input type="hidden" name="chargerId" value="${charger.id}" /><label>Ponto de destino<select name="toLocationId">${state.locations.filter((item) => item.id !== charger.locationId).map((item) => `<option value="${item.id}">${getEstablishmentById(state, item.establishmentId)?.name} · ${item.name}</option>`).join('')}</select></label><label>Motivo<input name="reason" value="Transferencia operacional" /></label><label>Responsavel<input name="responsible" value="GoodWe" /></label><button type="submit">Confirmar transferencia</button></form></details></section>`}`;
}

function settingsPage(state) {
  return `<section class="surface panel">${sectionHeader({ title: 'Configuracoes', subtitle: 'Parametros gerais e integracoes da plataforma.' })}<div class="settings-list"><div><strong>Google Maps</strong><span>Chave carregada por variavel local; nao e exposta no repositorio.</span></div><div><strong>Persistencia</strong><span>Dados compartilhados entre perfis no armazenamento local.</span></div><div><strong>Perfis</strong><span>${state.accounts.length} contas com escopo por funcao e estabelecimento.</span></div></div></section>`;
}

export function renderMvpManagerPage(state, route) {
  const tab = route.tab ?? 'overview';
  const context = resolveContext(state, route);
  const profile = context.profile;

  if (!context.establishment) {
    if (profile === AUTH_PROFILES.GOODWE && ['overview', 'clients', 'new-client', 'client', 'establishments', 'new-establishment', 'locations', 'installations', 'installation', 'contracts', 'contract', 'finance', 'operations', 'support', 'ticket', 'audit', 'expansion', 'settings'].includes(tab)) {
      const emptyGoodweContent = tab === 'new-establishment'
        ? newEstablishmentPage(state, route)
        : tab === 'clients'
          ? clientsPage(state)
          : tab === 'new-client'
            ? newClientPage()
            : tab === 'client'
              ? clientDetailPage(state, route)
        : tab === 'establishments'
          ? establishmentCatalogPage(state)
          : tab === 'locations'
            ? globalLocationsPage(state, context)
            : tab === 'installations'
              ? installationsPage(state)
              : tab === 'installation'
                ? installationDetailPage(state, route)
                : tab === 'contracts'
                  ? contractsPage(state)
                  : tab === 'contract'
                    ? contractDetailPage(state, route)
                    : tab === 'finance'
                      ? financePage(state)
                      : tab === 'operations'
                        ? operationsPage(state)
                        : tab === 'support'
                          ? supportPage(state)
                          : tab === 'ticket'
                            ? ticketDetailPage(state, route)
                            : tab === 'audit'
                              ? auditPage(state)
                              : tab === 'expansion'
                                ? expansionPage(state)
                                : tab === 'settings'
                                  ? enterpriseSettingsPage(state)
                                  : networkOverviewPage(state);
      return {
        html: renderDesktopShell({
          activePath: tab,
          menu: goodweMenu,
          content: emptyGoodweContent,
          profile: 'GOODWE',
          title: 'ChargeGrid Intelligence GoodWe',
          subtitle: 'Fluxo limpo: comece criando estabelecimentos, acessos e carregadores do zero.',
          userName: context.user?.name ?? 'Gestor'
        }),
        page: 'mvp-manager'
      };
    }

    const emptyMessage =
      profile === AUTH_PROFILES.GOODWE
        ? 'Nenhum estabelecimento cadastrado ainda. Acesse a aba Estabelecimentos para iniciar o cadastro.'
        : 'Nao foi possivel resolver o estabelecimento deste perfil.';

    return {
      html: renderDesktopShell({
        activePath: tab,
        menu: profile === AUTH_PROFILES.GOODWE ? goodweMenu : establishmentMenu,
        content: `<section class="surface panel"><p>${emptyMessage}</p></section>`,
        profile: profile === AUTH_PROFILES.GOODWE ? 'GOODWE' : 'ESTABELECIMENTO',
        title: 'ChargeGrid Intelligence MVP',
        subtitle: 'Dados indisponiveis para o perfil atual.',
        userName: context.user?.name ?? 'Usuario'
      }),
      page: 'mvp-manager'
    };
  }

  const isGoodwe = profile === AUTH_PROFILES.GOODWE;

  let content;

  if (isGoodwe) {
    if (tab === 'overview') {
      content = networkOverviewPage(state);
    } else if (tab === 'clients') {
      content = clientsPage(state);
    } else if (tab === 'new-client') {
      content = newClientPage();
    } else if (tab === 'client') {
      content = clientDetailPage(state, route);
    } else if (tab === 'establishments') {
      content = establishmentCatalogPage(state);
    } else if (tab === 'new-establishment') {
      content = newEstablishmentPage(state, route);
    } else if (tab === 'establishment') {
      content = establishmentCenterPage(state, context);
    } else if (tab === 'locations') {
      content = globalLocationsPage(state, context);
    } else if (tab === 'new-location') {
      content = newLocationPage(state, context);
    } else if (tab === 'location') {
      content = locationOperationsPage(state, context, false);
    } else if (tab === 'charger') {
      content = chargerDetailPage(state, context, false, route);
    } else if (tab === 'chargers') {
      content = chargersSection(state, context, true);
    } else if (tab === 'sessions') {
      content = sessionsSection(state, context);
    } else if (tab === 'operations') {
      content = operationsPage(state);
    } else if (tab === 'installations') {
      content = installationsPage(state);
    } else if (tab === 'installation') {
      content = installationDetailPage(state, route);
    } else if (tab === 'contracts') {
      content = contractsPage(state);
    } else if (tab === 'contract') {
      content = contractDetailPage(state, route);
    } else if (tab === 'finance') {
      content = financePage(state);
    } else if (tab === 'energy') {
      content = energySection(context);
    } else if (tab === 'pricing') {
      content = pricingSection(context);
    } else if (tab === 'ai') {
      content = aiSection(state, context);
    } else if (tab === 'reports') {
      content = reportsSection(state, context);
    } else if (tab === 'support') {
      content = supportPage(state);
    } else if (tab === 'ticket') {
      content = ticketDetailPage(state, route);
    } else if (tab === 'audit') {
      content = auditPage(state);
    } else if (tab === 'expansion') {
      content = expansionPage(state);
    } else if (tab === 'settings') {
      content = enterpriseSettingsPage(state);
    } else {
      content = defaultSection(context);
    }
  } else {
    if (tab === 'overview') {
      content = establishmentOverview(context);
    } else if (tab === 'locations') {
      content = locationsMonitor(context);
    } else if (tab === 'location') {
      content = locationOperationsPage(state, context, true);
    } else if (tab === 'charger') {
      content = chargerDetailPage(state, context, true, route);
    } else if (tab === 'chargers') {
      content = chargersSection(state, context, false);
    } else if (tab === 'sessions') {
      content = sessionsSection(state, context);
    } else if (tab === 'operations') {
      content = operationsPage(state, context.establishment.id);
    } else if (tab === 'energy') {
      content = energySection(context);
    } else if (tab === 'pricing') {
      content = pricingSection(context);
    } else if (tab === 'finance' || tab === 'invoices') {
      content = financePage(state, context.establishment.id);
    } else if (tab === 'contract') {
      content = contractsPage(state, context.establishment.id);
    } else if (tab === 'support') {
      content = supportPage(state);
    } else if (tab === 'ticket') {
      content = ticketDetailPage(state, route);
    } else if (tab === 'documents') {
      content = documentsPage(state);
    } else if (tab === 'ai') {
      content = aiSection(state, context);
    } else if (tab === 'reports') {
      content = reportsSection(state, context);
    } else if (tab === 'settings') {
      content = enterpriseSettingsPage(state, context.establishment.id);
    } else {
      content = establishmentOverview(context);
    }
  }

  return {
    html: renderDesktopShell({
      activePath: tab,
      menu: isGoodwe ? goodweMenu : establishmentMenu,
      content,
      profile: isGoodwe ? 'GOODWE' : 'ESTABELECIMENTO',
      title: isGoodwe ? 'ChargeGrid Intelligence GoodWe' : 'ChargeGrid Intelligence Estabelecimento',
      subtitle: isGoodwe
        ? 'A GoodWe controla a rede e administra estrutura, vinculos e contas.'
        : `${context.establishment.name} monitora apenas locais e carregadores atribuidos pela GoodWe.`,
      userName: context.user?.name ?? 'Gestor'
    }),
    page: 'mvp-manager'
  };
}

