// @ts-nocheck
import { formatDateTime, formatMoney, formatNumber } from './format.js';

const toneMap = {
  Favoravel: 'good',
  Alerta: 'warn',
  Critico: 'danger',
  available: 'good',
  charging: 'danger',
  reserved: 'warn',
  limited: 'warn',
  offline: 'muted',
  waiting: 'warn',
  released: 'good',
  Aprovado: 'good',
  Pendente: 'warn',
  Validando: 'warn',
  Recusado: 'danger',
  active: 'danger',
  finished: 'good'
};

export function tone(value) {
  return toneMap[value] ?? 'muted';
}

export function statusLabel(value) {
  const labels = {
    available: 'Disponivel',
    charging: 'Carregando',
    reserved: 'Reservado',
    queue: 'Em fila',
    limited: 'Limitado',
    offline: 'Offline',
    waiting: 'Aguardando',
    released: 'Liberado',
    active: 'Ativa',
    finished: 'Finalizada',
    cancelled: 'Cancelada'
  };

  return labels[value] ?? value;
}

export function badge(value) {
  return `<span class="badge tone-${tone(value)}">${statusLabel(value)}</span>`;
}

export function kpiCard({ testId, label, value, help = '', accent = 'default' }) {
  return `
    <article class="kpi-card accent-${accent}" ${testId ? `data-testid="${testId}"` : ''}>
      <span>${label}</span>
      <strong>${value}</strong>
      <small>${help}</small>
    </article>`;
}

export function semsStatusTabs({ items, active = 'all', testId = '' }) {
  return `
    <div class="sems-status-tabs" role="tablist" ${testId ? `data-testid="${testId}"` : ''}>
      ${items
        .map(
          (item) => `
        <span class="sems-status-tab tone-${item.tone ?? 'muted'} ${item.value === active ? 'is-active' : ''}">
          <i></i>${item.label}${item.count !== undefined ? ` <b>(${item.count})</b>` : ''}
        </span>`
        )
        .join('')}
    </div>`;
}

export function semsFilterToolbar({ fields = [], actions = '' }) {
  return `
    <div class="sems-filter-toolbar">
      <button type="button" class="sems-filter-button">
        <span>Filter</span>
      </button>
      ${fields
        .map(
          (field) => `
        <label class="sems-filter-field">
          <span>${field.label}</span>
          ${
            field.options
              ? `<select name="${field.name}">${field.options
                  .map(
                    (option) =>
                      `<option value="${option.value}" ${option.value === field.value ? 'selected' : ''}>${option.label}</option>`
                  )
                  .join('')}</select>`
              : `<input name="${field.name}" value="${field.value ?? ''}" placeholder="${field.placeholder ?? ''}" />`
          }
        </label>`
        )
        .join('')}
      <button type="submit" class="sems-icon-action" aria-label="Pesquisar">⌕</button>
      <button type="button" class="sems-icon-action" data-action="tick" aria-label="Atualizar">↻</button>
      ${actions}
    </div>`;
}

export function semsReportCard({ title, lines, icon = '' }) {
  return `
    <article class="sems-report-card">
      ${icon ? `<img src="${icon}" alt="" />` : '<div class="sems-report-illustration"></div>'}
      <h3>${title}</h3>
      <ul>${lines.map((line) => `<li>${line}</li>`).join('')}</ul>
    </article>`;
}

export function sectionHeader({ eyebrow = '', title, subtitle = '', action = '' }) {
  return `
    <header class="section-header">
      <div>
        ${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ''}
        <h2>${title}</h2>
        ${subtitle ? `<p>${subtitle}</p>` : ''}
      </div>
      ${action ? `<div class="section-action">${action}</div>` : ''}
    </header>`;
}

export function simpleTable({ testId = '', columns, rows }) {
  return `
    <div class="table-wrap sems-table-wrap">
      <table class="data-table" ${testId ? `data-testid="${testId}"` : ''}>
        <thead>
          <tr>${columns.map((column) => `<th>${column}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows.length > 0 ? rows.map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('') : '<tr><td colspan="99" class="empty-cell">Sem dados para exibir.</td></tr>'}
        </tbody>
      </table>
    </div>`;
}

export function sessionRow(session) {
  return [
    `<strong>${session.id}</strong>`,
    `${session.driverName}<span>${session.vehicle}</span>`,
    `${session.chargerId}<span>${session.establishmentId}</span>`,
    badge(session.status),
    `<strong>${formatDateTime(session.startedAt)}</strong><span>${session.durationMinutes} min</span>`,
    `<strong>${formatNumber(session.energyKwh)} kWh</strong>`,
    `<strong>${formatMoney(session.tariffPerKwh)}/kWh</strong>`,
    `<strong>${formatMoney(session.status === 'finished' ? session.finalAmount ?? session.consumedAmount : session.consumedAmount)}</strong><span>limite ${formatMoney(session.limitAmount)}</span>`,
    `<span class="badge tone-${tone(session.payment.status)}">${session.payment.status}</span>`
  ];
}

export function queueRow(entry, index) {
  return [
    `<strong>${index + 1}</strong>`,
    `${entry.driverName}<span>${entry.vehicle}</span>`,
    `${entry.chargerPreference ?? 'Primeira vaga'}`,
    `${formatDateTime(entry.enteredAt)}`,
    badge(entry.status),
    `${entry.note ?? '--'}`
  ];
}

export function driverSpotCard({ establishment, chargers, queueSize, distanceKm, recommendationTag }) {
  const available = chargers.filter((charger) => charger.status === 'available').length;
  const occupied = chargers.filter((charger) => charger.status === 'charging').length;

  return `
    <article class="driver-spot" data-establishment-id="${establishment.id}">
      <div>
        <h3>${establishment.name}</h3>
        <p>${establishment.city} - ${establishment.state}</p>
      </div>
      <ul>
        <li><strong>${distanceKm.toFixed(1)} km</strong><span>distancia</span></li>
        <li><strong>${formatMoney(establishment.pricePerKwh)}</strong><span>por kWh</span></li>
        <li><strong>${available}</strong><span>disponiveis</span></li>
        <li><strong>${occupied}</strong><span>ocupados</span></li>
        <li><strong>${queueSize}</strong><span>fila</span></li>
      </ul>
      <div class="driver-spot-footer">
        <span>${recommendationTag}</span>
        <a href="#/drive/map?est=${establishment.id}" class="ghost-button">Ver no mapa</a>
      </div>
    </article>`;
}

export function histogram(items) {
  const max = Math.max(...items.map((item) => item.value), 1);
  return `<div class="histogram">${items.map((item) => `
    <div class="histogram-item">
      <span>${item.label}</span>
      <i><b style="width:${Math.max(6, (item.value / max) * 100)}%"></b></i>
      <strong>${item.valueLabel ?? item.value}</strong>
    </div>`).join('')}</div>`;
}

export function segmentedTabs({ name, options, value, testId = '' }) {
  return `
    <div class="segmented-tabs" role="tablist" data-testid="${testId}">
      ${options
        .map(
          (option) => `
        <label class="segmented-tab ${option.value === value ? 'is-active' : ''}">
          <input type="radio" name="${name}" value="${option.value}" ${option.value === value ? 'checked' : ''} />
          <span>${option.label}</span>
        </label>`
        )
        .join('')}
    </div>`;
}

export function infoGroup({ title, testId = '', open = true, body }) {
  return `
    <details class="info-group" ${open ? 'open' : ''} data-testid="${testId}">
      <summary>${title}</summary>
      <div class="info-group-body">${body}</div>
    </details>`;
}

