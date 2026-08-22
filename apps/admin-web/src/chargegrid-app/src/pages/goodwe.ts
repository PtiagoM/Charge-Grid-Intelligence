// @ts-nocheck
import { assets } from '../constants/assets.js';
import { goodweMetrics, intelligenceByRole, stateDistribution, establishmentMetrics } from '../state/metrics.js';
import { getChargerById, getCurrentUser } from '../state/store.js';
import { formatDateTime, formatMoney, formatNumber } from '../ui/format.js';
import { badge, histogram, kpiCard, sectionHeader, simpleTable, tone } from '../ui/components.js';
import { renderDesktopShell } from '../ui/layouts.js';

const goodweMenu = [
  { path: 'overview', href: '#/goodwe/overview', label: 'Visao Geral', icon: assets.icons.analysis },
  { path: 'network', href: '#/goodwe/network', label: 'Rede', icon: assets.icons.plants },
  { path: 'establishments', href: '#/goodwe/establishments', label: 'Estabelecimentos', icon: assets.icons.services },
  { path: 'chargers', href: '#/goodwe/chargers', label: 'Carregadores', icon: assets.icons.devices },
  { path: 'contracts', href: '#/goodwe/contracts', label: 'Contratos', icon: assets.icons.reports },
  { path: 'finance', href: '#/goodwe/finance', label: 'Financeiro', icon: assets.icons.reports },
  { path: 'intelligence', href: '#/goodwe/intelligence', label: 'Inteligencia', icon: assets.icons.analysis },
  { path: 'simulator', href: '#/goodwe/simulator', label: 'Simulador Comercial', icon: assets.icons.filter },
  { path: 'reports', href: '#/goodwe/reports', label: 'Relatorios', icon: assets.icons.reports },
  { path: 'settings', href: '#/goodwe/settings', label: 'Configuracoes', icon: assets.icons.setting }
];

function getSimulatorInput(state) {
  return {
    clientName: state.ui.simClientName ?? 'Novo Cliente ChargeGrid',
    chargers: Number(state.ui.simChargers ?? 8),
    investment: Number(state.ui.simInvestment ?? 260000),
    sellKwh: Number(state.ui.simSellKwh ?? 2.98),
    costKwh: Number(state.ui.simCostKwh ?? 1.11),
    sessionsDay: Number(state.ui.simSessionsDay ?? 36),
    energyPerSession: Number(state.ui.simEnergyPerSession ?? 17),
    monthlyFee: Number(state.ui.simMonthlyFee ?? 2200),
    perCharger: Number(state.ui.simPerCharger ?? 210),
    goodweShare: Number(state.ui.simGoodweShare ?? 8),
    otherCosts: Number(state.ui.simOtherCosts ?? 3900)
  };
}

function computeSimulator(input) {
  const sessionsMonth = input.sessionsDay * 30;
  const energyMonth = sessionsMonth * input.energyPerSession;
  const gross = energyMonth * input.sellKwh;
  const energyCost = energyMonth * input.costKwh;
  const platform = input.monthlyFee + input.perCharger * input.chargers;
  const margin = gross - energyCost - input.otherCosts;
  const goodweRevenue = platform + margin * (input.goodweShare / 100);
  const estRevenue = margin - margin * (input.goodweShare / 100);
  const annual = gross * 12;
  const payback = input.investment / Math.max(1, estRevenue);

  return {
    gross,
    annual,
    energyCost,
    margin,
    goodweRevenue,
    estRevenue,
    ticket: gross / Math.max(1, sessionsMonth),
    payback,
    resultByCharger: estRevenue / Math.max(1, input.chargers)
  };
}

function renderOverview(state) {
  const metrics = goodweMetrics(state);
  const distribution = stateDistribution(state);

  const growthBars = histogram(
    metrics.growth.map((value, idx) => ({ label: `M${idx + 1}`, value, valueLabel: `${value}%` }))
  );

  const occupancyBars = histogram(
    metrics.utilization.map((value, idx) => ({ label: `M${idx + 1}`, value, valueLabel: `${value}%` }))
  );

  return `
    <section class="surface panel" data-testid="goodwe-overview">
      <div class="kpi-grid four-cols" data-testid="goodwe-kpis">
        ${kpiCard({ testId: 'goodwe-kpi-establishments', label: 'Total de estabelecimentos', value: metrics.totals.totalEstablishments, help: 'base comercial ativa' })}
        ${kpiCard({ testId: 'goodwe-kpi-chargers', label: 'Total de carregadores', value: metrics.totals.totalChargers, help: 'rede nacional' })}
        ${kpiCard({ testId: 'goodwe-kpi-active', label: 'Sessoes acontecendo agora', value: metrics.totals.activeSessions, help: 'operacao em tempo real', accent: 'danger' })}
        ${kpiCard({ testId: 'goodwe-kpi-month', label: 'Sessoes realizadas no mes', value: metrics.totals.sessionsMonth, help: 'historico consolidado' })}
        ${kpiCard({ label: 'Energia entregue', value: `${formatNumber(metrics.totals.delivered)} kWh`, help: 'rede consolidada' })}
        ${kpiCard({ label: 'Receita movimentada', value: formatMoney(metrics.totals.movedRevenue), help: 'sessoes + historico', accent: 'danger' })}
        ${kpiCard({ label: 'Receita ChargeGrid', value: formatMoney(metrics.totals.goodweRevenue), help: 'participacoes e taxas' })}
        ${kpiCard({ label: 'Receita recorrente mensal', value: formatMoney(metrics.recurringRevenue), help: `${metrics.contractsActive} contratos ativos` })}
        ${kpiCard({ label: 'Carregadores disponiveis', value: metrics.totals.available, help: 'prontos para novas sessoes' })}
        ${kpiCard({ label: 'Carregadores carregando', value: metrics.totals.charging, help: 'demanda em uso', accent: 'danger' })}
        ${kpiCard({ label: 'Carregadores offline', value: metrics.totals.offline, help: 'manutencao ou falha' })}
        ${kpiCard({ label: 'Crescimento da rede', value: '19%', help: 'ultimos 6 meses', accent: 'good' })}
      </div>
    </section>
    <section class="surface panel" data-testid="goodwe-map-panel">
      ${sectionHeader({ eyebrow: 'Rede nacional', title: 'Distribuicao por estado (simulada)', subtitle: 'Representacao geograficamente coerente com a operacao comercial GoodWe.' })}
      <div class="state-map-grid">
        ${distribution
          .map(
            (item) => `
          <article>
            <h3>${item.state}</h3>
            <strong>${item.chargers}</strong>
            <span>carregadores</span>
            <i><b style="width:${Math.max(10, item.chargers * 12)}%"></b></i>
          </article>`
          )
          .join('')}
      </div>
    </section>
    <div class="two-col-grid">
      <section class="surface panel" data-testid="goodwe-growth-chart">
        ${sectionHeader({ title: 'Crescimento da rede', subtitle: 'evolucao de expansao comercial' })}
        ${growthBars}
      </section>
      <section class="surface panel" data-testid="goodwe-usage-chart">
        ${sectionHeader({ title: 'Taxa media de ocupacao', subtitle: 'utilizacao media dos ativos' })}
        ${occupancyBars}
      </section>
    </div>`;
}

function renderNetwork(state) {
  const rows = state.establishments
    .map((establishment) => {
      const metrics = establishmentMetrics(state, establishment.id);
      return [
        `Brasil > ${establishment.state} > ${establishment.city} > ${establishment.name}`,
        `${metrics.chargers.length} carregadores`,
        `${metrics.activeSessions.length} sessoes ativas`,
        `${metrics.queue.filter((entry) => entry.status === 'waiting').length} em fila`,
        `${metrics.energy.state}`
      ];
    })
    .sort((a, b) => b[1].localeCompare(a[1]));

  return `
    <section class="surface panel" data-testid="goodwe-network-panel">
      ${sectionHeader({ title: 'Visao hierarquica da rede', subtitle: 'Brasil > Estado > Cidade > Estabelecimento > Carregador' })}
      ${simpleTable({
        columns: ['Hierarquia', 'Infraestrutura', 'Sessoes', 'Fila', 'Estado energetico'],
        rows
      })}
    </section>`;
}

function renderEstablishments(state) {
  const searchTerm = (state.ui.searchTerm ?? '').toLowerCase();
  const filtered = state.establishments.filter((item) =>
    `${item.name} ${item.city} ${item.state}`.toLowerCase().includes(searchTerm)
  );

  const rows = filtered.map((establishment) => {
    const metrics = establishmentMetrics(state, establishment.id);
    const contract = state.contracts.find((item) => item.id === establishment.contractId);
    return [
      `<strong>${establishment.name}</strong><span>${establishment.city}/${establishment.state}</span>`,
      `${metrics.chargers.length}`,
      `${metrics.available}`,
      `${metrics.inUse}`,
      `${metrics.sessions.length}`,
      `${formatNumber(metrics.deliveredMonth)} kWh`,
      `${metrics.occupancyRate}%`,
      `${formatMoney(metrics.monthRevenue)}`,
      `${contract?.model ?? '--'}`,
      `<button class="ghost-button" data-action="select-establishment" data-establishment-id="${establishment.id}">Detalhes</button>`
    ];
  });

  const selectedId = state.ui.selectedEstablishmentId ?? state.establishments[0].id;
  const selectedMetrics = establishmentMetrics(state, selectedId);
  const selectedContract = state.contracts.find(
    (contract) => contract.id === selectedMetrics.establishment.contractId
  );

  const opportunities = [
    `Alta taxa de ocupacao detectada em ${selectedMetrics.occupancyRate}%.`,
    selectedMetrics.queue.filter((item) => item.status === 'waiting').length > 0
      ? 'Fila recorrente nos horarios de pico.'
      : 'Sem fila recorrente no momento.',
    'Possivel necessidade de 2 novos carregadores em ate 90 dias.',
    `Potencial estimado de expansao: ${Math.min(95, selectedMetrics.occupancyRate + 9)}%.`
  ];

  return `
    <section class="surface panel" data-testid="goodwe-establishments-panel">
      ${sectionHeader({ title: 'Clientes comerciais da rede', subtitle: 'Filtros e pesquisa com visao consolidada de operacao e receita.' })}
      <form class="inline-form" data-form="search-establishments">
        <input name="searchTerm" value="${state.ui.searchTerm ?? ''}" placeholder="Buscar por nome, cidade ou estado" />
        <button type="submit">Filtrar</button>
      </form>
      ${simpleTable({
        testId: 'goodwe-establishments-table',
        columns: [
          'Nome',
          'Carregadores',
          'Ativos',
          'Em uso',
          'Sessoes mes',
          'Energia entregue',
          'Taxa ocupacao',
          'Receita movimentada',
          'Contrato',
          'Detalhes'
        ],
        rows
      })}
    </section>
    <section class="surface panel" data-testid="goodwe-establishment-detail">
      ${sectionHeader({ title: `Detalhes de ${selectedMetrics.establishment.name}`, subtitle: 'Resumo cadastral, contrato, operacao, energia, fila e oportunidades.' })}
      <div class="detail-grid">
        <article><h3>Dados cadastrais</h3><p>${selectedMetrics.establishment.address}</p><p>${selectedMetrics.establishment.city}/${selectedMetrics.establishment.state}</p></article>
        <article><h3>Contrato</h3><p>${selectedContract.model}</p><p>Renovacao: ${selectedContract.renewalDate}</p></article>
        <article><h3>Carregadores</h3><p>${selectedMetrics.chargers.length} unidades</p><p>${selectedMetrics.inUse} em uso</p></article>
        <article><h3>Sessoes</h3><p>${selectedMetrics.activeSessions.length} ativas</p><p>${selectedMetrics.sessions.length} no mes</p></article>
        <article><h3>Financeiro</h3><p>${formatMoney(selectedMetrics.monthRevenue)} no mes</p><p>${formatMoney(selectedMetrics.todayRevenue)} hoje</p></article>
        <article><h3>Energia e utilizacao</h3><p>${selectedMetrics.energy.state}</p><p>Margem ${selectedMetrics.energy.marginPercent}%</p></article>
      </div>
      <article class="opportunity-panel" data-testid="goodwe-opportunities">
        <h3>Oportunidades</h3>
        <ul>${opportunities.map((line) => `<li>${line}</li>`).join('')}</ul>
      </article>
    </section>`;
}

function renderChargers(state) {
  const rows = state.chargers.map((charger) => {
    const est = state.establishments.find((item) => item.id === charger.establishmentId);
    const sessionCount = state.sessions.filter((session) => session.chargerId === charger.id).length;
    return [
      `<strong>${charger.id}</strong><span>${charger.serial}</span>`,
      charger.model,
      `${charger.powerKw} kW`,
      `${est.name}`,
      `${est.city}/${est.state}`,
      badge(charger.status),
      `${sessionCount}`,
      `${formatNumber(charger.todayEnergyKwh)} kWh`,
      `${formatMoney(charger.todayRevenue)}`,
      `${charger.utilizationPercent}%`,
      `${formatDateTime(charger.lastCommunication)}`,
      `<button class="ghost-button" data-action="select-charger" data-charger-id="${charger.id}">Abrir</button>`
    ];
  });

  const selectedCharger = getChargerById(state, state.ui.selectedChargerId ?? state.chargers[0].id);
  const selectedSession = state.sessions.find((session) => session.id === selectedCharger.linkedSessionId);

  return `
    <section class="surface panel" data-testid="goodwe-chargers-panel">
      ${sectionHeader({ title: 'Carregadores comerciais da rede', subtitle: 'Inventario completo com status, ultima comunicacao e performance.' })}
      ${simpleTable({
        testId: 'goodwe-chargers-table',
        columns: [
          'ID / Serial',
          'Modelo',
          'Potencia',
          'Estabelecimento',
          'Cidade/Estado',
          'Status',
          'Sessoes',
          'Energia',
          'Receita',
          'Utilizacao',
          'Ultima comunicacao',
          'Detalhes'
        ],
        rows
      })}
    </section>
    <section class="surface panel" data-testid="goodwe-charger-detail">
      ${sectionHeader({ title: `Carregador ${selectedCharger.id}`, subtitle: 'Pagina individual com historico, alertas e recomendacoes (simulacao).' })}
      <div class="detail-grid">
        <article><h3>Identificacao</h3><p>${selectedCharger.model}</p><p>${selectedCharger.serial}</p></article>
        <article><h3>Localizacao</h3><p>${state.establishments.find((item) => item.id === selectedCharger.establishmentId).name}</p><p>Status ${badge(selectedCharger.status)}</p></article>
        <article><h3>Sessao atual</h3><p>${selectedSession ? selectedSession.id : 'Sem sessao ativa'}</p><p>${selectedSession ? selectedSession.driverName : 'Aguardando uso'}</p></article>
        <article><h3>Energia</h3><p>Dia: ${formatNumber(selectedCharger.todayEnergyKwh)} kWh</p><p>Receita dia: ${formatMoney(selectedCharger.todayRevenue)}</p></article>
        <article><h3>Utilizacao</h3><p>${selectedCharger.utilizationPercent}% ocupacao</p><p>Ultimo ping: ${formatDateTime(selectedCharger.lastCommunication)}</p></article>
        <article><h3>Alertas e recomendacoes</h3><p>Acoes de controle sao simuladas.</p><p>Priorizar monitoramento preventivo.</p></article>
      </div>
      <p class="sim-note">Todas as acoes desta tela sao simuladas para demonstracao. Nao ha comando fisico enviado ao equipamento.</p>
    </section>`;
}

function renderContracts(state) {
  const rows = state.contracts.map((contract) => {
    return [
      `<strong>${contract.id}</strong><span>${contract.model}</span>`,
      formatMoney(contract.monthlyFee),
      formatMoney(contract.perActiveCharger),
      formatMoney(contract.perSession),
      `${contract.revenueSharePercent}%`,
      `${contract.marginSharePercent}%`,
      contract.startDate,
      contract.renewalDate,
      badge(contract.status)
    ];
  });

  return `
    <section class="surface panel" data-testid="goodwe-contracts-panel">
      ${sectionHeader({ title: 'Sistema de contratos configuravel', subtitle: 'Mensalidade, valor por carregador, taxa por sessao, participacao percentual e modelo hibrido.' })}
      ${simpleTable({
        columns: [
          'Contrato',
          'Mensalidade',
          'Valor por carregador ativo',
          'Taxa por sessao',
          'Participacao percentual',
          'Participacao margem',
          'Inicio',
          'Renovacao',
          'Status'
        ],
        rows
      })}
    </section>`;
}

function renderFinance(state) {
  const monthEntries = state.financeLedger.filter((entry) => entry.date.startsWith('2026-08'));
  const monthRevenue = monthEntries.reduce((sum, entry) => sum + entry.goodweShare, 0);
  const recurring = state.contracts.reduce((sum, contract) => sum + contract.monthlyFee, 0);
  const perSession = monthEntries
    .filter((entry) => entry.revenueType.includes('sessao'))
    .reduce((sum, entry) => sum + entry.goodweShare, 0);

  const rows = monthEntries.map((entry) => {
    const est = state.establishments.find((item) => item.id === entry.establishmentId);
    return [
      entry.date,
      est.name,
      entry.source,
      entry.revenueType,
      formatMoney(entry.movedAmount),
      formatMoney(entry.goodweShare),
      badge(entry.status)
    ];
  });

  return `
    <section class="surface panel" data-testid="goodwe-finance-panel">
      <div class="kpi-grid four-cols">
        ${kpiCard({ label: 'Receita ChargeGrid do mes', value: formatMoney(monthRevenue), help: 'participacao consolidada', accent: 'danger' })}
        ${kpiCard({ label: 'Receita recorrente mensal', value: formatMoney(recurring), help: 'mensalidades de contratos' })}
        ${kpiCard({ label: 'Receita por sessao', value: formatMoney(perSession), help: 'taxas e participacoes' })}
        ${kpiCard({ label: 'Projecao anual', value: formatMoney(monthRevenue * 12), help: 'estimativa com base no mes atual' })}
        ${kpiCard({ label: 'Clientes pagantes', value: state.establishments.length, help: 'base ativa' })}
        ${kpiCard({ label: 'Crescimento mensal', value: '11.4%', help: 'receita x mes anterior' })}
        ${kpiCard({ label: 'Receita acumulada', value: formatMoney(state.financeLedger.reduce((sum, item) => sum + item.goodweShare, 0)), help: 'historico no ambiente demo' })}
        ${kpiCard({ label: 'Projecao mensal', value: formatMoney(monthRevenue * 1.08), help: 'estimativa de fechamento' })}
      </div>
    </section>
    <section class="surface panel">
      ${sectionHeader({ title: 'Lancamentos financeiros', subtitle: 'Tabela de movimentacoes por cliente e origem de receita.' })}
      ${simpleTable({
        testId: 'goodwe-financial-table',
        columns: ['Data', 'Estabelecimento', 'Origem', 'Tipo de receita', 'Valor movimentado', 'Participacao GoodWe', 'Status'],
        rows
      })}
    </section>`;
}

function renderIntelligence(state) {
  const cards = intelligenceByRole(state, 'goodwe').map(
    (item) => `
      <article class="intel-card">
        <h3>${item.title}</h3>
        <p>${item.text}</p>
      </article>`
  );

  return `
    <section class="surface panel" data-testid="goodwe-intelligence-panel">
      ${sectionHeader({ title: 'Inteligencia comercial da rede', subtitle: 'Previsoes de demanda, ocupacao, risco de fila e oportunidades de expansao.' })}
      <div class="intel-grid">${cards.join('')}</div>
      <article class="assistant-card" data-testid="goodwe-assistant-panel">
        <h3>Assistente conversacional (simulado)</h3>
        <p>Pergunta sugerida: Quais clientes possuem maior potencial de expansao?</p>
        <form data-form="assistant-question" class="inline-form">
          <input name="question" placeholder="Digite sua pergunta de negocio" />
          <button type="submit">Analisar</button>
        </form>
        <p class="assistant-answer">Resposta baseada nos dados simulados da rede: Shopping FIAP, Shopping Paulista e Mercado X Savassi estao entre os maiores potenciais de expansao por combinacao de ocupacao, fila e receita projetada.</p>
      </article>
    </section>`;
}

function renderSimulator(state) {
  const input = getSimulatorInput(state);
  const output = computeSimulator(input);

  return `
    <section class="surface panel" data-testid="goodwe-simulator-panel">
      ${sectionHeader({ title: 'Simulador Comercial GoodWe', subtitle: 'Ferramenta para construcao de proposta comercial com calculo automatico.' })}
      <form class="simulator-grid" data-form="goodwe-simulator">
        <label>Nome do cliente<input name="clientName" value="${input.clientName}" /></label>
        <label>Quantidade de carregadores<input name="chargers" type="number" min="1" value="${input.chargers}" /></label>
        <label>Investimento estimado<input name="investment" type="number" min="0" value="${input.investment}" /></label>
        <label>Preco por kWh<input name="sellKwh" type="number" min="0" step="0.01" value="${input.sellKwh}" /></label>
        <label>Custo por kWh<input name="costKwh" type="number" min="0" step="0.01" value="${input.costKwh}" /></label>
        <label>Sessoes por dia<input name="sessionsDay" type="number" min="1" value="${input.sessionsDay}" /></label>
        <label>Consumo medio por sessao<input name="energyPerSession" type="number" min="1" step="0.1" value="${input.energyPerSession}" /></label>
        <label>Mensalidade ChargeGrid<input name="monthlyFee" type="number" min="0" value="${input.monthlyFee}" /></label>
        <label>Valor por carregador<input name="perCharger" type="number" min="0" value="${input.perCharger}" /></label>
        <label>Participacao GoodWe (%)<input name="goodweShare" type="number" min="0" max="100" value="${input.goodweShare}" /></label>
        <label>Outros custos<input name="otherCosts" type="number" min="0" value="${input.otherCosts}" /></label>
        <button type="submit">Recalcular proposta</button>
      </form>
      <div class="kpi-grid four-cols simulator-output" data-testid="goodwe-simulator-output">
        ${kpiCard({ label: 'Receita estimada mensal', value: formatMoney(output.gross), help: 'faturamento bruto' })}
        ${kpiCard({ label: 'Receita anual', value: formatMoney(output.annual), help: '12 meses' })}
        ${kpiCard({ label: 'Custo energetico', value: formatMoney(output.energyCost), help: 'base por kWh' })}
        ${kpiCard({ label: 'Margem estimada', value: formatMoney(output.margin), help: 'antes da divisao comercial', accent: 'danger' })}
        ${kpiCard({ label: 'Receita do estabelecimento', value: formatMoney(output.estRevenue), help: 'liquido estimado' })}
        ${kpiCard({ label: 'Receita GoodWe', value: formatMoney(output.goodweRevenue), help: 'plataforma + participacao' })}
        ${kpiCard({ label: 'Ticket medio', value: formatMoney(output.ticket), help: 'valor por sessao' })}
        ${kpiCard({ label: 'Payback aproximado', value: `${output.payback.toFixed(1).replace('.', ',')} meses`, help: 'estimativa simplificada' })}
      </div>
      <p class="sim-note">Resultado por carregador: <strong>${formatMoney(output.resultByCharger)}</strong> / mes (estimado).</p>
    </section>`;
}

function renderReports(state) {
  const rows = state.establishments.map((establishment) => {
    const metrics = establishmentMetrics(state, establishment.id);
    return [
      establishment.name,
      `${metrics.sessions.length}`,
      `${formatNumber(metrics.deliveredMonth)} kWh`,
      `${formatMoney(metrics.monthRevenue)}`,
      `${metrics.occupancyRate}%`,
      `${metrics.queue.filter((entry) => entry.status === 'waiting').length}`
    ];
  });

  return `
    <section class="surface panel" data-testid="goodwe-reports-panel">
      ${sectionHeader({ title: 'Relatorios consolidados', subtitle: 'Performance por cliente para avaliacao executiva.' })}
      ${simpleTable({
        columns: ['Estabelecimento', 'Sessoes mes', 'Energia entregue', 'Receita movimentada', 'Taxa ocupacao', 'Fila media'],
        rows
      })}
    </section>`;
}

function renderSettings(state) {
  return `
    <section class="surface panel" data-testid="goodwe-settings-panel">
      ${sectionHeader({ title: 'Configuracoes', subtitle: 'Ambiente de simulacao com integracoes futuras claramente sinalizadas.' })}
      <div class="settings-list">
        <div><h3>Autenticacao demo</h3><p>Centralizada para futura substituicao por autenticacao real.</p></div>
        <div><h3>Integracoes externas</h3><p>SEMS+, OCPP, gateway financeiro e comandos fisicos nao estao conectados nesta demo.</p></div>
        <div><h3>Ferramenta administrativa</h3><p><a href="#/admin/simulator">Abrir simulador interno da apresentacao</a>.</p></div>
      </div>
    </section>`;
}

export function renderGoodwePage(state, tab = 'overview') {
  const user = getCurrentUser(state);

  const viewMap = {
    overview: renderOverview,
    network: renderNetwork,
    establishments: renderEstablishments,
    chargers: renderChargers,
    contracts: renderContracts,
    finance: renderFinance,
    intelligence: renderIntelligence,
    simulator: renderSimulator,
    reports: renderReports,
    settings: renderSettings
  };

  const renderer = viewMap[tab] ?? renderOverview;
  const content = renderer(state);

  return {
    html: renderDesktopShell({
      activePath: tab,
      menu: goodweMenu,
      content,
      profile: 'GOODWE',
      title: 'ChargeGrid GoodWe',
      subtitle:
        'Central nacional comercial da rede de recarga. Dados demonstrativos para operacao estrategica e identificacao de oportunidades.',
      userName: user?.name ?? 'Usuario GoodWe'
    }),
    page: 'goodwe'
  };
}

