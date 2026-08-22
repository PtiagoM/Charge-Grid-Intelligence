// @ts-nocheck
import { assets } from '../constants/assets.js';
import { establishmentMetrics, intelligenceByRole } from '../state/metrics.js';
import { getCurrentUser } from '../state/store.js';
import { formatDateTime, formatMoney, formatNumber } from '../ui/format.js';
import { badge, histogram, kpiCard, sectionHeader, sessionRow, simpleTable, queueRow } from '../ui/components.js';
import { renderDesktopShell } from '../ui/layouts.js';

const businessMenu = [
  { path: 'overview', href: '#/business/overview', label: 'Visao Geral', icon: assets.icons.analysis },
  { path: 'chargers', href: '#/business/chargers', label: 'Carregadores', icon: assets.icons.devices },
  { path: 'sessions', href: '#/business/sessions', label: 'Sessoes', icon: assets.icons.reports },
  { path: 'queue', href: '#/business/queue', label: 'Fila', icon: assets.icons.waiting },
  { path: 'commercial', href: '#/business/commercial', label: 'Operacao Comercial', icon: assets.icons.reports },
  { path: 'finance', href: '#/business/finance', label: 'Financeiro', icon: assets.icons.reports },
  { path: 'energy', href: '#/business/energy', label: 'Energia e Sustentabilidade', icon: assets.icons.solarInfo },
  { path: 'intelligence', href: '#/business/intelligence', label: 'Inteligencia', icon: assets.icons.analysis },
  { path: 'reports', href: '#/business/reports', label: 'Relatorios', icon: assets.icons.reports },
  { path: 'settings', href: '#/business/settings', label: 'Configuracoes', icon: assets.icons.setting }
];

function overviewSection(metrics) {
  const alerts = [
    metrics.energy.state === 'Critico'
      ? 'Estado critico: novas sessoes devem permanecer em fila.'
      : metrics.energy.state === 'Alerta'
        ? 'Estado alerta: margem energetica reduzida, priorizar controle de fila.'
        : 'Estado favoravel: capacidade para novas sessoes.',
    metrics.pending > 0
      ? `${metrics.pending} sessao(oes) com validacao financeira pendente.`
      : 'Sem pendencias financeiras no momento.',
    metrics.queue.filter((entry) => entry.status === 'waiting').length > 0
      ? 'Fila ativa detectada; monitorar tempo de espera.'
      : 'Fila sem acumulacao significativa.'
  ];

  return `
    <section class="surface panel" data-testid="business-overview">
      <div class="kpi-grid four-cols" data-testid="business-kpis">
        ${kpiCard({ testId: 'business-kpi-available', label: 'Carregadores disponiveis', value: metrics.available, help: 'prontos para uso' })}
        ${kpiCard({ testId: 'business-kpi-inuse', label: 'Carregadores em uso', value: metrics.inUse, help: 'ocupacao atual', accent: 'danger' })}
        ${kpiCard({ testId: 'business-kpi-offline', label: 'Carregadores offline', value: metrics.offline, help: 'manutencao' })}
        ${kpiCard({ testId: 'business-kpi-active', label: 'Sessoes ativas', value: metrics.activeSessions.length, help: 'em andamento' })}
        ${kpiCard({ testId: 'business-kpi-queue', label: 'Fila atual', value: metrics.queue.filter((entry) => entry.status === 'waiting').length, help: 'aguardando liberacao', accent: 'warn' })}
        ${kpiCard({ label: 'Energia hoje', value: `${formatNumber(metrics.deliveredToday)} kWh`, help: 'entregue nas sessoes ativas' })}
        ${kpiCard({ label: 'Receita hoje', value: formatMoney(metrics.todayRevenue), help: 'parcial do dia', accent: 'danger' })}
        ${kpiCard({ label: 'Receita do mes', value: formatMoney(metrics.monthRevenue), help: 'historico de sessoes' })}
        ${kpiCard({ label: 'Ticket medio', value: formatMoney(metrics.ticket), help: 'por sessao' })}
        ${kpiCard({ label: 'Demanda atual', value: `${metrics.energy.demandKw} kW`, help: `limite ${metrics.energy.contractLimitKw} kW` })}
        ${kpiCard({ label: 'Margem energetica', value: `${metrics.energy.marginPercent}%`, help: metrics.energy.state, accent: toneToAccent(metrics.energy.state) })}
        ${kpiCard({ label: 'Geracao solar', value: `${metrics.energy.solarKw} kW`, help: `Bateria ${metrics.energy.batterySocPercent}%` })}
      </div>
      <article class="alert-box tone-${toneToAccent(metrics.energy.state)}">
        <h3>Status energetico: ${metrics.energy.state}</h3>
        <ul>${alerts.map((alert) => `<li>${alert}</li>`).join('')}</ul>
      </article>
    </section>`;
}

function toneToAccent(stateLabel) {
  if (stateLabel === 'Critico') return 'danger';
  if (stateLabel === 'Alerta') return 'warn';
  return 'good';
}

function chargersSection(metrics) {
  const cards = metrics.chargers.map(
    (charger) => `
      <article class="charger-card" data-testid="business-charger-${charger.id}">
        <div class="charger-header">
          <h3>${charger.id}</h3>
          ${badge(charger.status)}
        </div>
        <p>${charger.model} · ${charger.serial}</p>
        <dl>
          <div><dt>Potencia</dt><dd>${charger.powerKw} kW</dd></div>
          <div><dt>Sessao atual</dt><dd>${charger.linkedSessionId ?? 'Sem sessao'}</dd></div>
          <div><dt>Energia do dia</dt><dd>${formatNumber(charger.todayEnergyKwh)} kWh</dd></div>
          <div><dt>Receita do dia</dt><dd>${formatMoney(charger.todayRevenue)}</dd></div>
          <div><dt>Taxa de utilizacao</dt><dd>${charger.utilizationPercent}%</dd></div>
        </dl>
        <button class="ghost-button" data-action="select-charger" data-charger-id="${charger.id}">Detalhes</button>
      </article>`
  );

  const selected = metrics.chargers.find((item) => item.id === (metrics.selectedChargerId ?? metrics.chargers[0].id));

  return `
    <section class="surface panel" data-testid="business-chargers-panel">
      ${sectionHeader({ title: 'Carregadores do estabelecimento', subtitle: 'Shopping FIAP com 5 carregadores dinamicos.' })}
      <div class="charger-grid">${cards.join('')}</div>
    </section>
    ${selected ? chargerDetailSection(metrics, selected) : ''}`;
}

function chargerDetailSection(metrics, charger) {
  const sessions = metrics.sessions.filter((session) => session.chargerId === charger.id).slice(0, 5);
  const peakHours = ['11:00-13:00', '17:00-20:00'];

  return `
    <section class="surface panel" data-testid="business-charger-detail">
      ${sectionHeader({ title: `Detalhes ${charger.id}`, subtitle: 'Indicadores operacionais, comerciais e recomendacoes para o gestor.' })}
      <div class="detail-grid">
        <article><h3>Identificacao</h3><p>${charger.model}</p><p>${charger.serial}</p></article>
        <article><h3>Status</h3><p>${badge(charger.status)}</p><p>Sessao atual: ${charger.linkedSessionId ?? '--'}</p></article>
        <article><h3>Energia</h3><p>Dia: ${formatNumber(charger.todayEnergyKwh)} kWh</p><p>Mensal: ${formatNumber(charger.todayEnergyKwh * 21)} kWh</p></article>
        <article><h3>Receita</h3><p>Diaria: ${formatMoney(charger.todayRevenue)}</p><p>Mensal: ${formatMoney(charger.todayRevenue * 21)}</p></article>
        <article><h3>Ocupacao</h3><p>${charger.utilizationPercent}%</p><p>Tempo medio uso: 42 min</p></article>
        <article><h3>Picos de uso</h3><p>${peakHours.join(' e ')}</p><p>Recomendacao: manter fila virtual.</p></article>
      </div>
      ${simpleTable({
        columns: ['Ultimas sessoes', 'Motorista', 'Status', 'Duracao', 'Energia', 'Valor'],
        rows: sessions.map((session) => [
          session.id,
          session.driverName,
          badge(session.status),
          `${session.durationMinutes} min`,
          `${formatNumber(session.energyKwh)} kWh`,
          formatMoney(session.status === 'finished' ? session.finalAmount ?? session.consumedAmount : session.consumedAmount)
        ])
      })}
    </section>`;
}

function sessionsSection(metrics, filter) {
  const filteredSessions = metrics.sessions.filter((session) => {
    if (filter === 'active') return session.status === 'active';
    if (filter === 'finished') return session.status === 'finished';
    if (filter === 'pending') return session.payment.status === 'Pendente';
    if (filter === 'approved') return session.payment.status === 'Aprovado';
    if (filter === 'declined') return session.payment.status === 'Recusado';
    return true;
  });

  return `
    <section class="surface panel" data-testid="business-sessions-panel">
      ${sectionHeader({ title: 'Sessoes em andamento e historico', subtitle: 'Filtros por estado da sessao e status financeiro.' })}
      <form class="inline-form" data-form="business-session-filter">
        <select name="sessionFilter">
          <option value="all" ${filter === 'all' ? 'selected' : ''}>Todas</option>
          <option value="active" ${filter === 'active' ? 'selected' : ''}>Ativas</option>
          <option value="finished" ${filter === 'finished' ? 'selected' : ''}>Finalizadas</option>
          <option value="pending" ${filter === 'pending' ? 'selected' : ''}>Pagamento pendente</option>
          <option value="approved" ${filter === 'approved' ? 'selected' : ''}>Pagamento aprovado</option>
          <option value="declined" ${filter === 'declined' ? 'selected' : ''}>Pagamento recusado</option>
        </select>
        <button type="submit">Aplicar</button>
      </form>
      ${simpleTable({
        testId: 'business-sessions-table',
        columns: ['ID', 'Motorista / Veiculo', 'Carregador', 'Status', 'Inicio / duracao', 'Energia', 'Tarifa', 'Valor', 'Pagamento'],
        rows: filteredSessions.map((session) => sessionRow(session))
      })}
    </section>`;
}

function queueSection(metrics) {
  const rows = metrics.queue.map((entry, index) => queueRow(entry, index));

  return `
    <section class="surface panel" data-testid="business-queue-panel">
      ${sectionHeader({ title: 'Fila virtual', subtitle: 'Acompanhamento de posicao, espera e liberacao automatica apos encerramento de sessao.' })}
      <p class="sim-note">Quando uma sessao termina, o proximo motorista em espera recebe status Liberado automaticamente.</p>
      ${simpleTable({
        testId: 'business-queue-table',
        columns: ['Posicao', 'Usuario / Veiculo', 'Carregador provavel', 'Entrada', 'Status', 'Observacao'],
        rows
      })}
    </section>`;
}

function commercialSection(metrics) {
  const byCharger = metrics.chargers.map((charger) => ({
    label: charger.id,
    value: round(charger.todayRevenue),
    valueLabel: formatMoney(charger.todayRevenue)
  }));

  const lowUtilization = metrics.chargers
    .slice()
    .sort((a, b) => a.utilizationPercent - b.utilizationPercent)[0];
  const highRevenue = metrics.chargers
    .slice()
    .sort((a, b) => b.todayRevenue - a.todayRevenue)[0];

  return `
    <section class="surface panel" data-testid="business-commercial-panel">
      <div class="kpi-grid four-cols">
        ${kpiCard({ label: 'Receita do dia', value: formatMoney(metrics.todayRevenue), help: 'parcial', accent: 'danger' })}
        ${kpiCard({ label: 'Receita projetada', value: formatMoney(metrics.monthRevenue * 1.14), help: 'projecao mensal' })}
        ${kpiCard({ label: 'Ticket medio', value: formatMoney(metrics.ticket), help: 'sessoes da planta' })}
        ${kpiCard({ label: 'Taxa de conversao', value: `${Math.max(20, 100 - metrics.queue.length * 6)}%`, help: 'entradas x sessoes iniciadas' })}
        ${kpiCard({ label: 'Ociosidade estimada', value: `${Math.max(2, 100 - metrics.occupancyRate)}%`, help: 'capacidade sem uso' })}
        ${kpiCard({ label: 'Perdas estimadas', value: formatMoney(metrics.pending * 24), help: 'pagamentos nao confirmados' })}
        ${kpiCard({ label: 'Mais rentavel', value: highRevenue.id, help: formatMoney(highRevenue.todayRevenue) })}
        ${kpiCard({ label: 'Menos utilizado', value: lowUtilization.id, help: `${lowUtilization.utilizationPercent}% uso` })}
      </div>
    </section>
    <section class="surface panel">
      ${sectionHeader({ title: 'Receita por carregador e horario', subtitle: 'Visualizacao das alavancas de desempenho comercial.' })}
      ${histogram(byCharger)}
    </section>`;
}

function financeSection(metrics, state) {
  const entries = state.financeLedger.filter((entry) => entry.establishmentId === metrics.establishment.id);
  const gross = entries.reduce((sum, entry) => sum + entry.movedAmount, 0);
  const goodweFee = entries.reduce((sum, entry) => sum + entry.goodweShare, 0);
  const energyCost = gross * 0.41;
  const taxes = gross * 0.07;
  const net = gross - energyCost - taxes - goodweFee;

  return `
    <section class="surface panel" data-testid="business-finance-panel">
      <div class="kpi-grid four-cols">
        ${kpiCard({ label: 'Receita bruta', value: formatMoney(gross), help: 'historico consolidado', accent: 'danger' })}
        ${kpiCard({ label: 'Custo energetico estimado', value: formatMoney(energyCost), help: 'estimativa por consumo' })}
        ${kpiCard({ label: 'Taxas financeiras', value: formatMoney(taxes), help: 'adquirencia e meios de pagamento' })}
        ${kpiCard({ label: 'Taxa ChargeGrid/GoodWe', value: formatMoney(goodweFee), help: 'conforme contrato' })}
        ${kpiCard({ label: 'Receita liquida', value: formatMoney(net), help: 'resultado estimado do estabelecimento' })}
        ${kpiCard({ label: 'Receita diaria', value: formatMoney(metrics.todayRevenue), help: 'parcial hoje' })}
        ${kpiCard({ label: 'Receita semanal', value: formatMoney(metrics.todayRevenue * 7), help: 'estimativa semanal' })}
        ${kpiCard({ label: 'Receita anual', value: formatMoney(net * 12), help: 'projecao anual' })}
      </div>
      ${simpleTable({
        columns: ['Data', 'Origem', 'Tipo', 'Valor', 'Participacao GoodWe', 'Status'],
        rows: entries.map((entry) => [
          entry.date,
          entry.source,
          entry.revenueType,
          formatMoney(entry.movedAmount),
          formatMoney(entry.goodweShare),
          badge(entry.status)
        ])
      })}
    </section>`;
}

function energySection(metrics) {
  const energy = metrics.energy;

  return `
    <section class="surface panel" data-testid="business-energy-panel">
      ${sectionHeader({ title: 'Energia e sustentabilidade', subtitle: 'Estados Favoravel, Alerta e Critico para controle da recarga.' })}
      <div class="energy-state-grid">
        <article class="state-card tone-${toneToAccent(energy.state)}">
          <h3>${energy.state}</h3>
          <p>Margem atual: ${energy.marginPercent}%</p>
          <p>Demanda: ${energy.demandKw} kW de ${energy.contractLimitKw} kW</p>
        </article>
        <article><h3>Demanda total da planta</h3><p>${energy.demandKw} kW</p><p>Base ${energy.baseLoadKw} kW + carregadores ${energy.chargerLoadKw} kW</p></article>
        <article><h3>Solar e bateria</h3><p>Solar ${energy.solarKw} kW</p><p>Bateria SOC ${energy.batterySocPercent}%</p></article>
        <article><h3>Rede eletrica</h3><p>${Math.max(0, energy.demandKw - energy.solarKw - energy.batteryKw)} kW</p><p>Composicao energetica estimada</p></article>
      </div>
      <div class="three-states-help">
        <p><strong>Favoravel:</strong> capacidade disponivel para novas sessoes.</p>
        <p><strong>Alerta:</strong> margem reduzida, manter controle de fila e potencia.</p>
        <p><strong>Critico:</strong> bloquear novas sessoes e priorizar seguranca da infraestrutura.</p>
      </div>
    </section>`;
}

function intelligenceSection(metrics) {
  const cards = intelligenceByRole({ ...metrics.stateRef }, 'business', metrics.establishment.id).map(
    (item) => `<article class="intel-card"><h3>${item.title}</h3><p>${item.text}</p></article>`
  );

  return `
    <section class="surface panel" data-testid="business-intelligence-panel">
      ${sectionHeader({ title: 'Inteligencia operacional', subtitle: 'Previsao de pico, risco de fila e sugestoes para receita e ocupacao.' })}
      <div class="intel-grid">${cards.join('')}</div>
      <article class="assistant-card">
        <h3>Assistente da operacao</h3>
        <p>Pergunta sugerida: Qual horario provavelmente ficara mais cheio hoje?</p>
        <p class="assistant-answer">Com base no historico simulado, o pico esperado esta entre 17h e 20h. Recomendacao: manter carregadores AC para fila e priorizar DC para maior rotatividade.</p>
      </article>
    </section>`;
}

function reportsSection(metrics) {
  const hourly = [
    ['08h-11h', 31],
    ['11h-14h', 44],
    ['14h-17h', 62],
    ['17h-20h', 94],
    ['20h-23h', 52]
  ];

  return `
    <section class="surface panel" data-testid="business-reports-panel">
      ${sectionHeader({ title: 'Relatorios operacionais', subtitle: 'Visao consolidada de sessoes, energia e receita por faixa horaria.' })}
      ${histogram(hourly.map(([label, value]) => ({ label, value, valueLabel: `${value}%` })))}
      ${simpleTable({
        columns: ['Indicador', 'Valor'],
        rows: [
          ['Sessoes ativas', String(metrics.activeSessions.length)],
          ['Sessoes finalizadas', String(metrics.finishedSessions.length)],
          ['Energia entregue no mes', `${formatNumber(metrics.deliveredMonth)} kWh`],
          ['Receita do mes', formatMoney(metrics.monthRevenue)],
          ['Fila atual', String(metrics.queue.filter((entry) => entry.status === 'waiting').length)]
        ]
      })}
    </section>`;
}

function settingsSection() {
  return `
    <section class="surface panel" data-testid="business-settings-panel">
      ${sectionHeader({ title: 'Configuracoes', subtitle: 'Preferencias locais da operacao comercial.' })}
      <div class="settings-list">
        <div><h3>Notificacoes</h3><p>Alertas de demanda, fila e pagamentos podem ser ajustados futuramente.</p></div>
        <div><h3>Integracoes</h3><p>Gateway financeiro, OCPP e SEMS+ real estao marcados como integracao futura.</p></div>
      </div>
    </section>`;
}

function round(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function renderBusinessPage(state, tab = 'overview') {
  const user = getCurrentUser(state);
  const establishmentId = user?.establishmentId ?? 'est-fiap';
  const metrics = establishmentMetrics(state, establishmentId);
  metrics.stateRef = state;
  metrics.selectedChargerId = state.ui.selectedChargerId;

  const viewMap = {
    overview: () => overviewSection(metrics),
    chargers: () => chargersSection(metrics),
    sessions: () => sessionsSection(metrics, state.ui.selectedSessionFilter ?? 'all'),
    queue: () => queueSection(metrics),
    commercial: () => commercialSection(metrics),
    finance: () => financeSection(metrics, state),
    energy: () => energySection(metrics),
    intelligence: () => intelligenceSection(metrics),
    reports: () => reportsSection(metrics),
    settings: () => settingsSection(metrics)
  };

  const renderer = viewMap[tab] ?? viewMap.overview;

  return {
    html: renderDesktopShell({
      activePath: tab,
      menu: businessMenu,
      content: renderer(),
      profile: 'ESTABELECIMENTO',
      title: 'ChargeGrid Business',
      subtitle: `${metrics.establishment.name} · Operacao local sincronizada com GoodWe e Drive.`,
      userName: user?.name ?? 'Gestor'
    }),
    page: 'business'
  };
}

