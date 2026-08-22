// @ts-nocheck
import { assets } from '../constants/assets.js';
import plants from '../data/plants.json';
import { formatNumber } from '../ui/format.js';

const statusTabs = [
  ['all', 'Todos', 1, null],
  ['new-month', 'Novo Este Mês', 0, null],
  ['working', 'Funcionando', 0, assets.icons.working],
  ['waiting', 'Aguardando', 0, assets.icons.waiting],
  ['offline', 'Offline', 1, assets.icons.offline],
  ['fault', 'Falha', 0, assets.icons.fault],
  ['building', 'Construindo', 0, assets.icons.building]
];

const plantRow = (plant) => `
  <tr data-testid="plant-row-lab-fiap">
    <td><div class="plant-info">
      <img src="${plant.image}" alt="" />
      <div><div class="plant-name-line">
        <strong data-testid="plant-name-lab-fiap">${plant.shortName ?? plant.name}</strong>
        ${plant.shared ? '<span class="badge badge-shared" data-testid="plant-shared-badge-lab-fiap">Partilhado</span>' : ''}
      </div><span>${plant.subtitle ?? plant.address}</span><small>▣ ${String(plant.installedPowerKw).replace('.', ',')} kW</small></div>
    </div></td>
    <td><span class="badge badge-${plant.status}" data-testid="plant-status-lab-fiap"><img src="${assets.icons.offline}" alt="" />${plant.statusLabel}</span></td>
    <td><strong>${formatNumber(plant.todayGenerationKwh)}</strong></td>
    <td><strong>${formatNumber(plant.totalGenerationKwh)}</strong></td>
    <td><strong>${plant.pvPowerKw === null ? '--' : formatNumber(plant.pvPowerKw)}</strong></td>
    <td><span class="observation">${plant.observation}</span></td>
    <td><div class="row-actions">
      ${plant.chargeGridEnabled ? '<a href="#/chargegrid/overview" class="chargegrid-shortcut" data-testid="plant-chargegrid-shortcut">ChargeGrid</a>' : ''}
      <button aria-label="Favoritar"><img src="${assets.icons.favorite}" alt="" /></button>
      <button aria-label="Mais ações"><img src="${assets.icons.more}" alt="" /></button>
    </div></td>
  </tr>`;

export function renderPlantsPage() {
  return `
    <section class="page page-plants" data-testid="page-plants">
      <h1 data-testid="plants-title">Lista de plantas</h1>
      <div class="surface plants-surface">
        <div class="filter-row">
          <button class="filter-button" data-testid="filter-button"><img src="${assets.icons.filter}" alt="" data-testid="filter-asset" /> Filtro</button>
          <label class="search-field"><span>▣</span><input data-testid="search-plant-input" placeholder="Estação/Dispositivo Nome, SN" /></label>
          <label class="search-field"><span>⌾</span><input data-testid="search-address-input" placeholder="Endereço da planta" /></label>
          <label class="search-field email-field"><span>□</span><input data-testid="search-email-input" placeholder="Email" /></label>
          <button class="icon-button" data-testid="search-button" aria-label="Pesquisar"><img src="${assets.icons.search}" alt="" data-testid="search-asset" /></button>
          <button class="icon-button refresh-button" data-testid="refresh-button" aria-label="Atualizar">↻</button>
          <button class="new-installation" data-testid="new-installation-button"><span>＋</span> Nova Instalação</button>
        </div>
        <div class="status-tabs" data-testid="status-tabs">
          ${statusTabs.map(([id, label, count, icon], index) => `<button class="${index === 0 ? 'is-active' : ''}" data-testid="status-tab-${id}">${icon ? `<img src="${icon}" alt="" data-testid="status-${id}-asset" />` : ''}${label} <strong>(${count})</strong></button>`).join('')}
        </div>
        <div class="table-wrap"><table class="plants-table" data-testid="plants-table">
          <thead><tr><th>Informações da planta</th><th>Status da usina</th><th>Geração de hoje (kWh)</th><th>Geração de energia<br/>cumulativa (kWh)</th><th>Potência PV (kW)</th><th>Observação</th><th>Operação</th></tr></thead>
          <tbody>${plants.map(plantRow).join('')}</tbody>
        </table></div>
        <div class="pagination" data-testid="pagination"><button disabled>‹</button><button class="current">1</button><button disabled>›</button><button class="per-page">15 / página⌄</button></div>
      </div>
    </section>`;
}

