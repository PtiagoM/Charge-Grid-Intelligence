// @ts-nocheck
import { assets } from '../constants/assets.js';
import devices from '../data/devices.json';
import energy from '../data/energy.json';
import queueData from '../data/queue.json';
import sessionsData from '../data/ev-sessions.json';
import { getDemandState } from '../core/demand-state.js';
import { buildOperationalMetrics } from '../core/operations.js';
import { calculateQueuePositions } from '../core/queue.js';
import { generateRecommendations } from '../core/recommendations.js';
import { generateCommercialReport } from '../core/reports.js';
import { enrichCommercialSession } from '../core/sessions.js';
import { formatDateTime, formatMoney, formatNumber } from '../ui/format.js';

const sessions = sessionsData.map(enrichCommercialSession);
const queue = calculateQueuePositions(queueData);
const demand = getDemandState({ powerMarginPercent: energy.snapshot.powerMarginPercent, socPercent: energy.snapshot.batterySocPercent });
const report = generateCommercialReport(sessions, queue);
const operation = buildOperationalMetrics({ sessions, chargers: devices, queue, energy });
const recommendations = generateRecommendations({
  demandState: demand.state,
  queueLength: queue.length,
  peakHour: energy.snapshot.peakHour,
  highSolar: energy.snapshot.highSolarGeneration,
  idleSessionsCount: sessions.filter((session) => session.idleBillableMinutes > 0).length,
  pendingPayments: report.pendingPayments,
  concentratedChargers: true
});

const tabs = [
  ['overview', 'Visão geral'],
  ['chargers', 'Carregadores'],
  ['sessions', 'Sessões'],
  ['commercial', 'Operação comercial'],
  ['energy', 'Energia e sustentabilidade'],
  ['reports', 'Relatórios'],
  ['recommendations', 'Recomendações']
];

const tone = (value) => ({
  active: 'green', finished: 'blue', blocked: 'danger', charging: 'green', available: 'green',
  occupied: 'yellow', idle: 'yellow', limited: 'yellow', offline: 'gray', fault: 'danger',
  Aprovado: 'green', Pendente: 'yellow', Recusado: 'danger', Alerta: 'yellow', Favorável: 'green', Crítico: 'danger'
}[value] ?? 'gray');

const sectionHeading = (eyebrow, title, action = '') => `
  <div class="section-heading"><div><span class="eyebrow">${eyebrow}</span><h2>${title}</h2></div>${action}</div>`;

const kpi = (id, label, value, detail, accent = '') => `
  <article class="kpi-card ${accent}" data-testid="${id}"><div><span>${label}</span><strong>${value}</strong><small>${detail}</small></div></article>`;

const sessionRows = (items = sessions) => items.map((session) => `
  <tr data-testid="session-row-${session.id}">
    <td><strong>${session.id}</strong><span>${session.chargerName} · Porta ${session.port}</span></td>
    <td>${session.cardId}</td>
    <td><span class="badge badge-${tone(session.status)}" data-testid="session-status-${session.id}">${session.status === 'active' ? 'Ativa' : session.status === 'finished' ? 'Finalizada' : 'Bloqueada'}</span></td>
    <td><strong>${formatDateTime(session.startedAt)}</strong><span>${session.durationMinutes} min</span></td>
    <td><strong data-testid="session-energy-${session.id}">${formatNumber(session.energyKwh)} kWh</strong><span>${formatNumber(session.estimatedRangeKm)} km estimados</span></td>
    <td><strong>${formatMoney(session.tariff.ratePerKwh)}/kWh</strong></td>
    <td><strong data-testid="session-value-${session.id}">${formatMoney(session.commercialValue)}</strong><span>${session.idleBillableMinutes} min ociosos</span></td>
    <td><span class="badge badge-${tone(session.payment.status)}" data-testid="session-payment-${session.id}">${session.payment.status}</span></td>
    <td><strong data-testid="session-origin-${session.id}">${session.origin.label}</strong></td>
    <td><button class="asset-action" data-testid="session-receipt-button-${session.id}"><img src="${assets.icons.reports}" alt="Comprovante" /></button></td>
  </tr>`).join('');

const sessionsTable = (items = sessions) => `
  <div class="table-wrap"><table class="data-table sessions-table" data-testid="commercial-sessions-table">
    <thead><tr><th>Sessão</th><th>Identificação</th><th>Status</th><th>Início / duração</th><th>Energia / autonomia</th><th>Tarifa</th><th>Valor / ociosidade</th><th>Pagamento</th><th>Origem estimada</th><th></th></tr></thead>
    <tbody>${sessionRows(items)}</tbody>
  </table></div>`;

const queueTable = () => `
  <div class="table-wrap"><table class="data-table queue-table" data-testid="queue-table">
    <thead><tr><th>Posição</th><th>Identificação</th><th>Carregador solicitado</th><th>Entrada</th><th>Espera estimada</th><th>Status</th><th>Motivo / recomendação</th></tr></thead>
    <tbody>${queue.map((item) => `<tr data-testid="queue-row-${item.id}">
      <td><span class="queue-position" data-testid="queue-position-${item.id}">${item.position}</span></td>
      <td><strong>${item.cardId}</strong></td><td>${item.chargerName}</td><td>${formatDateTime(item.enteredAt)}</td>
      <td><strong data-testid="queue-wait-time-${item.id}">~ ${item.estimatedWaitMinutes} min</strong></td>
      <td><span class="badge badge-yellow">Aguardando</span></td><td><strong>${item.reason}</strong><span>${item.recommendation}</span></td>
    </tr>`).join('')}</tbody>
  </table></div>`;

const recommendationCards = (items = recommendations) => `
  <div class="recommendation-grid">${items.map((rec) => `
    <article class="recommendation-card severity-${rec.severity}" data-testid="recommendation-card-${rec.id}">
      <div data-testid="recommendation-card"><div class="recommendation-top"><span data-testid="recommendation-severity-${rec.id}">${rec.severity.toUpperCase()}</span><small>${rec.module}</small></div>
      <h3 data-testid="recommendation-title-${rec.id}">${rec.title}</h3>
      <dl><div><dt>Evidência analisada</dt><dd>${rec.evidence}</dd></div><div><dt>Impacto operacional</dt><dd>${rec.impact}</dd></div><div><dt>Ação sugerida</dt><dd>${rec.action}</dd></div><div><dt>Critério de decisão</dt><dd>${rec.rule}</dd></div></dl></div>
    </article>`).join('')}</div>`;

const reportItems = [
  ['report-total-sessions', 'Total de sessões', report.totalSessions],
  ['report-total-energy', 'Energia total entregue', `${formatNumber(report.totalEnergyKwh)} kWh`],
  ['report-total-revenue', 'Receita estimada', formatMoney(report.estimatedRevenue)],
  ['report-average-tariff', 'Tarifa média', `${formatMoney(report.averageTariff)}/kWh`],
  ['report-approved-payments', 'Pagamentos aprovados', report.approvedPayments],
  ['report-pending-payments', 'Pagamentos pendentes', report.pendingPayments],
  ['report-declined-payments', 'Pagamentos recusados', report.declinedPayments],
  ['report-idle-minutes', 'Ociosidade cobrável', `${report.totalIdleMinutes} min`],
  ['report-most-used-charger', 'Carregador mais usado', 'CG-EV-02'],
  ['report-dominant-origin', 'Origem predominante', `${report.dominantOrigin} estimada`]
];

const barChart = (items, valueKey, label, testId) => {
  const max = Math.max(...items.map((item) => item[valueKey]), 1);
  return `<div class="bar-chart" data-testid="${testId}">${items.map((item) => `
    <div class="bar-column"><div class="bar-value">${formatNumber(item[valueKey])}</div><div class="bar-track"><i style="height:${Math.max(7, item[valueKey] / max * 100)}%"></i></div><span>${item[label]}</span></div>`).join('')}</div>`;
};

const overview = () => `
  <div class="kpi-grid">
    ${kpi('kpi-active-sessions', 'Sessões ativas', report.activeSessions, '2 carregadores em operação', 'red')}
    ${kpi('kpi-energy-delivered', 'Energia entregue', `${formatNumber(report.totalEnergyKwh)} kWh`, 'sessões monitoradas')}
    ${kpi('kpi-estimated-revenue', 'Receita estimada', formatMoney(report.estimatedRevenue), 'status financeiro monitorado')}
    ${kpi('kpi-average-tariff', 'Tarifa média', formatMoney(report.averageTariff), 'por kWh')}
    ${kpi('kpi-queue-size', 'Fila atual', queue.length, '35 min primeira posição', 'yellow')}
    ${kpi('kpi-demand-state', 'Estado energético', demand.state, `${energy.snapshot.powerMarginPercent}% de margem`, tone(demand.state))}
    ${kpi('kpi-energy-origin', 'Origem predominante', `${report.dominantOrigin} estimada`, 'classificação comercial', 'green')}
  </div>
  <section class="surface content-card current-decision-panel" data-testid="overview-current-decision">
    ${sectionHeading('Síntese conectada', 'Decisão atual do sistema', '<a href="#/chargegrid/energy">Analisar energia</a>')}
    <div class="current-decision-layout">
      <div class="decision-state"><span>Estado</span><strong>Atenção</strong><small>Impacto: preserva margem e reduz risco de pico</small></div>
      <dl><div><dt>Fator principal</dt><dd>Fila ativa + margem energética em alerta.</dd></div><div><dt>Decisão aplicada</dt><dd>Manter tarifa de pico e limitar sessões rápidas.</dd></div><div><dt>Próxima revisão</dt><dd>Próxima atualização dos dados energéticos e comerciais.</dd></div></dl>
    </div>
  </section>
  <div class="overview-charts">
    <section class="surface content-card">${sectionHeading('Desempenho comercial', 'Energia entregue por carregador', '<a href="#/chargegrid/chargers">Ver carregadores</a>')}${barChart(devices, 'todayEnergyKwh', 'name', 'chart-energy-by-charger')}</section>
    <section class="surface content-card">${sectionHeading('Uso da infraestrutura', 'Ocupação dos carregadores', '<a href="#/chargegrid/chargers">Abrir operação</a>')}
      <div class="donut-layout" data-testid="chart-charger-occupancy"><div class="donut-chart"><strong>6</strong><span>carregadores</span></div><div class="legend-list">
        <span><i class="dot green"></i>Disponível / carregando <strong>2</strong></span><span><i class="dot yellow"></i>Ocupado / ocioso / limitado <strong>3</strong></span><span><i class="dot gray"></i>Offline <strong>1</strong></span>
      </div></div></section>
  </div>
  <div class="overview-previews">
    <section class="surface content-card" data-testid="commercial-sessions-section">${sectionHeading('Últimas movimentações', 'Últimas sessões', '<a href="#/chargegrid/sessions">Ver todas</a>')}${sessionsTable(sessions.slice(0, 4))}</section>
    <section class="surface content-card" data-testid="recommendations-panel">${sectionHeading('Lógica determinística', 'Recomendações principais', '<a href="#/chargegrid/recommendations">Ver todas</a>')}${recommendationCards(recommendations.slice(0, 3))}</section>
  </div>`;

const chargers = () => `<section class="surface content-card" data-testid="chargers-section">${sectionHeading('Infraestrutura comercial', 'Carregadores da planta', '<span class="section-badge">6 unidades</span>')}
  <div class="charger-grid">${devices.map((device) => `<article class="charger-card" data-testid="charger-card-${device.id}">
    <div class="charger-card-top"><img src="${assets.charger}" alt="" /><div><strong>${device.id}</strong><span>Porta ${device.port} · ${device.maxPowerKw} kW</span></div><span class="badge badge-${tone(device.status)}">${device.statusLabel}</span></div>
    <div class="charger-power"><span>Potência atual</span><strong>${formatNumber(device.currentPowerKw)} kW</strong><i><b style="width:${device.currentPowerKw / device.maxPowerKw * 100}%"></b></i></div>
    <dl><div><dt>Taxa de ocupação</dt><dd>${device.occupancyPercent}%</dd></div><div><dt>Energia hoje</dt><dd>${formatNumber(device.todayEnergyKwh)} kWh</dd></div><div><dt>Receita estimada</dt><dd>${formatMoney(device.estimatedRevenue)}</dd></div><div><dt>Situação comercial</dt><dd>${device.commercialStatus}</dd></div></dl>
    <p class="charger-recommendation"><strong>Recomendação:</strong> ${device.recommendation}</p>
  </article>`).join('')}</div></section>`;

const sessionsSection = () => `<section class="surface content-card" data-testid="commercial-sessions-section">${sectionHeading('Operação comercial', 'Sessões comerciais completas', '<button class="outline-button">Exportar relatório</button>')}${sessionsTable()}</section>`;

const commercialSection = () => `<div class="commercial-layout" data-testid="commercial-operation-section">
  <div class="commercial-summary-strip">
    ${kpi('commercial-revenue-today', 'Receita estimada do dia', formatMoney(operation.revenueToday), 'consolidado das sessões', 'red')}
    ${kpi('commercial-projected-revenue', 'Receita projetada do mês', formatMoney(operation.projectedMonthRevenue), 'projeção determinística')}
    ${kpi('commercial-average-ticket', 'Ticket médio por sessão', formatMoney(operation.averageTicket), 'por sessão')}
    ${kpi('commercial-most-profitable', 'Carregador mais rentável', operation.mostProfitableCharger, 'maior receita estimada', 'green')}
  </div>
  <div class="commercial-analysis-grid">
    <section class="surface content-card">${sectionHeading('Desempenho financeiro', 'Receita por carregador')}${barChart(devices, 'estimatedRevenue', 'name', 'chart-revenue-by-charger')}</section>
    <section class="surface content-card">${sectionHeading('Conversão financeira', 'Pagamentos e perdas')}
      <div class="payment-analysis" data-testid="commercial-payment-analysis">
        <div class="payment-ring"><strong>${operation.paidSessions}</strong><span>sessões pagas</span></div>
        <dl><div><dt>Pendentes</dt><dd>${operation.pendingSessions}</dd></div><div><dt>Recusadas</dt><dd>${operation.declinedSessions}</dd></div><div><dt>Perda por bloqueios</dt><dd>${formatMoney(operation.blockedLoss)}</dd></div><div><dt>Perda por ociosidade</dt><dd>${formatMoney(operation.idleLoss)}</dd></div></dl>
      </div>
    </section>
  </div>
  <section class="surface content-card">${sectionHeading('Comportamento diário', 'Receita por faixa horária')}
    <div class="hourly-revenue-chart" data-testid="chart-revenue-by-period">${[['08h–11h',34],['11h–14h',52],['14h–17h',66],['17h–20h',100],['20h–23h',48]].map(([label, value]) => `<div><span>${label}</span><i><b style="width:${value}%"></b></i><strong>${formatMoney(operation.revenueToday * value / 300)}</strong></div>`).join('')}</div>
  </section>
  <section class="surface content-card manager-reading" data-testid="manager-reading">${sectionHeading('Insight comercial', 'Leitura do gestor')}<p>${operation.managerReading}</p><div class="pillar-tags"><span>Controle inteligente de demanda</span><span>Tarifação e pagamento</span><span>Gestão sustentável de energia</span><span>Recomendação determinística</span></div></section>
  <section class="surface content-card" data-testid="commercial-queue-context">${sectionHeading('Pressão de demanda', 'Fila e demanda comercial', `<span class="section-badge">${queue.length} aguardando</span>`)}${queueTable()}</section>
  <section class="surface content-card">${sectionHeading('Resultado por infraestrutura', 'Desempenho comercial por carregador')}
    <div class="table-wrap"><table class="data-table commercial-table"><thead><tr><th>Carregador</th><th>Sessões hoje</th><th>Energia entregue</th><th>Receita estimada</th><th>Taxa de ocupação</th><th>Ociosidade</th><th>Pagamentos pendentes</th><th>Situação comercial</th></tr></thead><tbody>${devices.map((device) => `<tr><td><strong>${device.id}</strong></td><td>${device.todaySessions}</td><td>${formatNumber(device.todayEnergyKwh)} kWh</td><td>${formatMoney(device.estimatedRevenue)}</td><td>${device.occupancyPercent}%</td><td>${device.idleMinutes} min</td><td>${device.pendingPayments}</td><td><span class="badge badge-${device.estimatedRevenue === 0 ? 'gray' : device.idleMinutes > 15 ? 'yellow' : 'green'}">${device.commercialStatus}</span></td></tr>`).join('')}</tbody></table></div>
  </section>
</div>`;

const energySection = () => `<div class="energy-layout">
  <section class="surface energy-decision-panel state-alert" data-testid="energy-decision-panel">
    <div class="decision-state-large"><span>Estado energético</span><strong>${demand.state}</strong><small>Margem disponível em ${energy.snapshot.powerMarginPercent}%</small></div>
    <div class="decision-narrative"><span class="eyebrow">Painel de decisão energética</span><h2>Limitar novas sessões rápidas e manter fila</h2><dl><div><dt>Motivo</dt><dd>Margem disponível em ${energy.snapshot.powerMarginPercent}%, demanda elevada e dois carregadores em operação.</dd></div><div><dt>Impacto</dt><dd>Reduz risco de pico e preserva a margem operacional da planta.</dd></div><div><dt>Próxima ação sugerida</dt><dd>Priorizar carregadores de 11 kW até a margem superar 30%.</dd></div></dl></div>
  </section>
  <section class="surface content-card" data-testid="energy-demand-visualization">${sectionHeading('Pressão sobre a infraestrutura', 'Demanda da planta versus limite')}
    <div class="capacity-overview"><div class="capacity-stack"><span>Uso atual: ${energy.snapshot.buildingDemandKw + energy.snapshot.chargersPowerKw} kW de ${energy.snapshot.plantLimitKw} kW</span><i><b class="building" style="width:60%"></b><b class="chargers" style="width:32%"></b></i><small><em></em>Edifício ${energy.snapshot.buildingDemandKw} kW <em></em>Carregadores ${energy.snapshot.chargersPowerKw} kW <em></em>Margem ${energy.snapshot.powerMarginPercent}%</small></div>
      <div class="demand-comparison">${[['Limite da planta',energy.snapshot.plantLimitKw,100,'energy-plant-limit'],['Demanda base do edifício',energy.snapshot.buildingDemandKw,60,'energy-building-demand'],['Potência atual dos carregadores',energy.snapshot.chargersPowerKw,32,'energy-chargers-power'],['Energia solar disponível',energy.snapshot.pvPowerKw,36,'energy-solar-available'],['Energia da rede em uso',energy.snapshot.gridPowerKw,57,'energy-grid-power']].map(([label,value,width,id])=>`<div data-testid="${id}"><span>${label}</span><i><b style="width:${width}%"></b></i><strong>${value} kW</strong></div>`).join('')}</div>
      <div class="capacity-facts"><div data-testid="energy-power-margin"><span>Margem disponível</span><strong>${energy.snapshot.powerMarginPercent}%</strong></div><div data-testid="energy-battery-soc"><span>SOC da bateria</span><strong>${energy.snapshot.batterySocPercent}%</strong></div><div><span>Reserva mínima</span><strong>${energy.snapshot.batteryReservePercent}%</strong></div></div>
    </div>
  </section>
  <section class="surface content-card" data-testid="energy-charger-scatter">${sectionHeading('Relação entre variáveis', 'Relação entre ocupação, potência e impacto energético')}
    <div class="scatter-layout"><div class="scatter-y-label">Potência atual (kW)</div><div class="scatter-plot"><div class="scatter-zone zone-low-low"><span>Baixa ocupação<br>Baixa potência</span></div><div class="scatter-zone zone-high-low"><span>Alta ocupação<br>Baixa potência</span></div><div class="scatter-zone zone-low-high"><span>Baixa ocupação<br>Alta potência</span></div><div class="scatter-zone zone-high-high"><span>Alta ocupação<br>Alta potência</span></div><div class="scatter-y-ticks"><span>22</span><span>11</span><span>0</span></div><div class="scatter-x-ticks"><span>0</span><span>50</span><span>100%</span></div>${devices.map((device) => `<button class="scatter-point status-${device.status}" style="left:${Math.max(3, Math.min(97, device.occupancyPercent))}%;bottom:${Math.max(4, device.currentPowerKw / 22 * 88)}%;width:${22 + Math.sqrt(device.todayEnergyKwh) * 4}px;height:${22 + Math.sqrt(device.todayEnergyKwh) * 4}px" title="${device.id}: ${device.statusLabel}, ${formatNumber(device.currentPowerKw)} kW, ${device.occupancyPercent}% de ocupação, ${formatNumber(device.todayEnergyKwh)} kWh, ${formatMoney(device.estimatedRevenue)}"><span>${device.id.replace('CG-EV-','')}</span></button>`).join('')}<div class="scatter-x-label">Taxa de ocupação (%)</div></div><div class="scatter-legend">${devices.map((device)=>`<span><i class="status-${device.status}"></i><strong>${device.id}</strong> ${device.statusLabel} · ${device.occupancyPercent}% · ${formatNumber(device.currentPowerKw)} kW</span>`).join('')}</div></div>
  </section>
  <section class="surface content-card">${sectionHeading('Composição estimada', 'Composição estimada da energia entregue')}
    <div class="origin-analysis" data-testid="energy-origin-estimated"><div class="composition-bar"><i class="solar" style="width:42%"></i><i class="hybrid" style="width:35%"></i><i class="grid" style="width:23%"></i></div><div class="origin-meaning"><article><strong>42%</strong><span>Solar/Bateria estimada</span><p>Recargas com menor impacto na rede.</p></article><article><strong>35%</strong><span>Híbrida estimada</span><p>Combinação estimada de solar/bateria e rede.</p></article><article><strong>23%</strong><span>Rede estimada</span><p>Recargas com maior dependência da rede.</p></article></div><p class="classification-note">A classificação é estimada com base nos dados energéticos da planta no período das sessões.</p><p class="hybrid-explanation" data-testid="hybrid-origin-explanation"><strong>Entender Híbrida estimada:</strong> Híbrida estimada indica que a sessão foi atendida por uma combinação estimada de energia solar/bateria e energia da rede. Essa classificação considera o comportamento energético da planta no período da recarga.</p></div>
  </section>
  <section class="surface content-card" data-testid="energy-decision-matrix">${sectionHeading('Lógica determinística', 'Matriz de decisão operacional')}
    <div class="table-wrap"><table class="data-table decision-matrix"><thead><tr><th>Condição da planta</th><th>Situação dos carregadores</th><th>Decisão comercial</th><th>Impacto esperado</th></tr></thead><tbody><tr><td>Margem &gt; 30% e SOC ≥ 60%</td><td>Capacidade disponível</td><td>Liberar novas sessões e tarifa sustentável</td><td>Maior aproveitamento solar</td></tr><tr class="is-current"><td>Margem entre 10% e 30%</td><td>Manter sessões atuais</td><td>Limitar novas sessões rápidas</td><td>Preservar margem energética</td></tr><tr><td>Margem &lt; 10% ou SOC &lt; 40%</td><td>Capacidade crítica</td><td>Bloquear novas sessões comerciais e manter espera</td><td>Evitar sobrecarga</td></tr><tr><td>Alta geração solar</td><td>Capacidade renovável disponível</td><td>Incentivar recarga e aplicar desconto sustentável</td><td>Reduzir dependência da rede</td></tr></tbody></table></div>
  </section>
  <section class="surface content-card">${sectionHeading('Gestão sustentável de energia', 'Indicadores de sustentabilidade')}<div class="sustainability-table">${[['Energia renovável estimada usada',`${formatNumber(energy.sustainability.renewableEnergyKwh)} kWh`,'Participação solar/bateria nas sessões'],['Energia da rede evitada',`${formatNumber(energy.sustainability.avoidedGridEnergyKwh)} kWh`,'Redução estimada de consumo externo'],['CO₂ evitado estimado',`${formatNumber(energy.sustainability.avoidedCo2Kg)} kg`,'Impacto ambiental estimado'],['Sessões favorecidas por alta geração solar',energy.sustainability.solarFavoredSessions,'Melhor aproveitamento energético'],['Sessões deslocadas para menor demanda',energy.sustainability.shiftedSessions,'Alívio da demanda em pico']].map(([label,value,detail])=>`<div><span>${label}</span><strong>${value}</strong><small>${detail}</small></div>`).join('')}</div></section>
  </div>`;

const reportCatalog = [
  ['report-sessions-card','Relatório de sessões','Detalhamento comercial das recargas, pagamentos e energia entregue.',[['report-total-sessions','Sessões',report.totalSessions],['report-total-energy','Energia',`${formatNumber(report.totalEnergyKwh)} kWh`],['report-approved-payments','Aprovadas',report.approvedPayments]]],
  ['report-energy-card','Relatório energético','Pressão da recarga sobre a planta e uso sustentável estimado.',[['report-dominant-origin','Origem predominante',`${report.dominantOrigin} estimada`],['report-renewable-energy','Renovável estimada',`${formatNumber(energy.sustainability.renewableEnergyKwh)} kWh`],['report-avoided-co2','CO₂ evitado estimado',`${formatNumber(energy.sustainability.avoidedCo2Kg)} kg`]]],
  ['report-tariff-card','Relatório tarifário','Receita, tarifa média e conversão financeira das sessões.',[['report-total-revenue','Receita estimada',formatMoney(report.estimatedRevenue)],['report-average-tariff','Tarifa média',`${formatMoney(report.averageTariff)}/kWh`],['report-pending-payments','Pendentes',report.pendingPayments]]],
  ['report-queue-card','Relatório de fila e ociosidade','Espera comercial, ocupação e perdas operacionais estimadas.',[['report-max-queue','Fila máxima',operation.maxQueue],['report-average-wait','Espera média',`${formatNumber(operation.averageWaitMinutes)} min`],['report-idle-minutes','Ociosidade',`${report.totalIdleMinutes} min`]]],
  ['report-recommendations-card','Relatório de recomendações','Decisões gerenciais sugeridas a partir das regras determinísticas.',[['report-active-recommendations','Recomendações ativas',recommendations.length],['report-most-used-charger','Mais usado','CG-EV-02'],['report-underused-charger','Subutilizado','CG-EV-05']]]
];
const reportsSection = () => `<div class="reports-layout" data-testid="commercial-report-section">
  <section class="surface content-card">${sectionHeading('Central de relatórios', 'Relatórios disponíveis para análise')}<div class="report-catalog">${reportCatalog.map(([id,title,description,metrics])=>`<article class="report-export-card" data-testid="${id}"><div class="report-export-top"><div><span class="eyebrow">Período: hoje</span><h3>${title}</h3><p>${description}</p></div><span class="badge badge-green">Disponível para análise</span></div><div class="report-export-metrics">${metrics.map(([metricId,label,value])=>`<div data-testid="${metricId}"><span>${label}</span><strong>${value}</strong></div>`).join('')}</div><div class="report-actions"><button class="outline-button">Visualizar relatório</button><button class="outline-button">Exportar relatório</button></div></article>`).join('')}</div></section>
</div>`;
const recommendationsSection = () => `<section class="surface content-card" data-testid="recommendations-panel">${sectionHeading('Critérios gerenciais', 'Recomendações determinísticas', `<span class="section-badge">${recommendations.length} ativas</span>`)}${recommendationCards()}</section>`;

export function renderChargeGridPage(activeTab = 'overview') {
  const content = ({ overview, chargers, sessions: sessionsSection, commercial: commercialSection, energy: energySection, reports: reportsSection, recommendations: recommendationsSection }[activeTab] ?? overview)();
  return `<section class="page chargegrid-page" data-testid="page-chargegrid-dashboard">
    <div class="page-heading"><div><a href="#/plants" data-testid="chargegrid-back-to-plants">‹ Lista de plantas</a><h1 data-testid="chargegrid-title">ChargeGrid <span>Intelligence</span></h1><p data-testid="chargegrid-plant-name">LAB FIAP Eco Smart Home <i></i> Operação comercial ativa · 6 carregadores · Estado energético: ${demand.state} · Fila: ${queue.length} solicitações</p></div><div class="heading-status"><span>Última atualização</span><strong>14 jun 2026, 18:42</strong><button>↻ Atualizar dados</button></div></div>
    <nav class="chargegrid-tabs" data-testid="chargegrid-tabs">${tabs.map(([id, label]) => `<a href="#/chargegrid/${id}" class="${activeTab === id ? 'is-active' : ''}" data-testid="chargegrid-tab-${id}">${label}</a>`).join('')}</nav>
    <div class="tab-content" data-testid="chargegrid-view-${activeTab}">${content}</div>
  </section>`;
}

