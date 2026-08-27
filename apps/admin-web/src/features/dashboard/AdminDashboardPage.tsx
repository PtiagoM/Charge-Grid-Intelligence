import { useState, type CSSProperties, type FormEvent } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAdminState } from "../../app/AdminState";
import type { Charger, Client } from "../../domain/admin";
import { Badge, DataTable, KpiCard, SectionHeader, money, number } from "../../components/AdminUi";
import { WorldMap } from "../map/WorldMap";
import { assets } from "../../constants/assets";
import { PlantDetailPage, PlantOnboardingPage, PlantsPortfolioPage } from "../plants/PlantPages";
import { ChargerDetailPage, ChargersInventoryPage, SessionDetailPage, SessionsPage as OperationsSessionsPage } from "../operations/ChargerPages";
import { OperationsCenterPage, QueueOperationsPage } from "../operations/QueuePages";
import { EnergyOperationsPage } from "../energy/EnergyOperationsPage";
import { FinanceDashboardPage, FinancialSessionPage, TariffPoliciesPage } from "../finance/FinancialPages";
import { IncidentDetailPage, IncidentInboxPage, RecommendationsPage } from "../incidents/IncidentPages";
import { AccessDeniedPage, ReportsOperationsPage } from "../governance/GovernancePages";
import { OrganizationGovernancePage } from "../governance/OrganizationGovernancePage";
import { hasAdminCapability } from "../../domain/adminCapabilities";
import { getAdminRouteCapability } from "../../app/adminNavigation";
import { accessibleEstablishmentIds, commercialAccessibleEstablishmentIds, hasOwnChargeGridOperation, technicalAccessibleEstablishmentIds } from "../../domain/accessOperations";
import { SemsBatteryConsistencyPage, SemsComparisonPage, SemsIvDiagnosisPage } from "../analysis/SemsAnalysisPages";

const establishmentTabs = new Set(["overview", "plants", "plant", "locations", "location", "charger", "chargers", "sessions", "session", "operations", "queue", "incidents", "incident", "energy", "pricing", "finance", "financial-session", "invoices", "contract", "support", "ticket", "documents", "ai", "recommendations", "reports", "settings", "access", "plant-onboarding", "analysis-iv", "analysis-comparison", "analysis-battery"]);

function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return <nav className="enterprise-breadcrumb" aria-label="Navegacao estrutural">{items.map((item, index) => <span key={item.label}>{item.href ? <a href={item.href}>{item.label}</a> : <strong>{item.label}</strong>}{index < items.length - 1 ? <i>/</i> : null}</span>)}</nav>;
}

function StatusPill({ value }: { value: string }) {
  return <span className={`enterprise-status ${value.toLowerCase().replaceAll(" ", "-")}`}>{value}</span>;
}

type DashboardChartMode = "energy" | "revenue" | "demand" | "utilization";
type DashboardPeriod = "day" | "week" | "month";

type DashboardChartSeries = {
  label: string;
  color: string;
  unit: string;
  values: Array<number | null>;
  kind?: "currency" | "percent";
};

const dashboardPeriodLabels: Record<DashboardPeriod, string[]> = {
  day: ["00h", "04h", "08h", "12h", "16h", "20h", "Agora"],
  week: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
  month: ["01", "05", "10", "15", "20", "25", "Hoje"]
};

const dashboardTrendWeights = [0.46, 0.61, 0.55, 0.76, 0.68, 0.9, 0.83];

function optionalSum(values: Array<number | undefined>) {
  const present = values.filter((value): value is number => typeof value === "number");
  return present.length ? present.reduce((sum, value) => sum + value, 0) : null;
}

function chartValues(value: number | null) {
  return value === null ? dashboardTrendWeights.map(() => null) : dashboardTrendWeights.map((weight) => Number((value * weight).toFixed(2)));
}

function chartPath(values: Array<number | null>, max: number) {
  const valid = values.map((value, index) => value === null ? null : `${(index / Math.max(values.length - 1, 1)) * 100},${94 - (value / Math.max(max, 1)) * 78}`);
  return valid.reduce<string>((path, point, index) => point ? `${path}${path ? " " : "M"}${point}` : (index ? path : ""), "");
}

function formatChartValue(value: number | null | undefined, series: DashboardChartSeries) {
  if (value === null || value === undefined) return "Sem telemetria";
  if (series.kind === "currency") return money(value);
  if (series.kind === "percent") return `${number(value)}%`;
  return `${number(value)} ${series.unit}`.trim();
}

function Overview() {
  const { state, account } = useAdminState();
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [chartMode, setChartMode] = useState<DashboardChartMode>("energy");
  const [chartPeriod, setChartPeriod] = useState<DashboardPeriod>("week");
  const [economyPeriodOffset, setEconomyPeriodOffset] = useState(0);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const technicalScope = new Set(technicalAccessibleEstablishmentIds(account));
  const commercialScope = new Set(commercialAccessibleEstablishmentIds(state, account).filter((id) => technicalScope.has(id)));
  const canReadCommercial = Boolean(account && hasAdminCapability(account, "commercial:read") && commercialScope.size);
  const canReadFinance = Boolean(account && hasAdminCapability(account, "finance:manage"));
  const chargers = state.chargers.filter((item) => technicalScope.has(item.establishmentId));
  const commercialChargers = chargers.filter((item) => commercialScope.has(item.establishmentId) && item.publicationStatus === "PUBLISHED");
  const sessions = state.sessions.filter((item) => commercialScope.has(item.establishmentId));
  const locations = state.locations.filter((item) => technicalScope.has(item.establishmentId));
  const commercialPlants = state.commercialPlants.filter((item) => commercialScope.has(item.establishmentId) && item.status === "PUBLISHED");
  const totalPower = chargers.reduce((sum, item) => sum + item.powerKw, 0);
  const energySnapshots = state.energy.filter((item) => technicalScope.has(item.establishmentId));
  const generatedEnergy = optionalSum(energySnapshots.map((item) => item.periodSolarKwh));
  const chargedEnergy = optionalSum(energySnapshots.map((item) => item.periodBatteryKwh));
  const gridEnergy = optionalSum(energySnapshots.map((item) => item.periodGridKwh));
  const revenue = sessions.reduce((sum, item) => sum + (item.finalAmount ?? item.consumedAmount), 0);
  const offline = chargers.filter((item) => item.status === "offline").length;
  const solarPower = optionalSum(energySnapshots.map((item) => item.solarPowerKw));
  const gridPower = optionalSum(energySnapshots.map((item) => item.gridPowerKw));
  const currentPower = (solarPower ?? 0) + (gridPower ?? 0);
  const demandPower = optionalSum(energySnapshots.map((item) => item.demandKw));
  const contractedLimit = optionalSum(energySnapshots.map((item) => item.contractedLimitKw));
  const openIncidents = state.incidents.filter((item) => technicalScope.has(item.establishmentId) && item.status !== "RESOLVED").length;
  const alarmTotal = openIncidents + offline;
  const operatingPercent = commercialChargers.length ? Math.round((commercialChargers.filter((item) => item.status !== "offline").length / commercialChargers.length) * 100) : 0;
  const technicalValue = generatedEnergy === null ? null : generatedEnergy * 0.74;
  const stationStates = [
    ["Em operação", locations.filter((location) => chargers.some((charger) => charger.locationId === location.id && charger.status !== "offline")).length],
    ["Aguardando", 0],
    ["Offline", locations.filter((location) => chargers.some((charger) => charger.locationId === location.id && charger.status === "offline")).length],
    ["Falha", new Set(state.incidents.filter((item) => technicalScope.has(item.establishmentId) && item.status !== "RESOLVED").map((item) => item.locationId)).size],
    ["Em construção", 0]
  ] as const;
  const chartSeriesByMode: Record<DashboardChartMode, DashboardChartSeries[]> = {
    energy: [
      { label: "Geração", color: "#ff323a", unit: "kWh", values: chartValues(generatedEnergy) },
      { label: "Energia carregada", color: "#f3bd46", unit: "kWh", values: chartValues(chargedEnergy) },
      { label: "Energia da rede", color: "#7b858e", unit: "kWh", values: chartValues(gridEnergy) }
    ],
    revenue: [{ label: "Receita ChargeGrid", color: "#ff323a", unit: "", kind: "currency", values: chartValues(canReadFinance ? revenue : null) }],
    demand: [
      { label: "Demanda", color: "#ff323a", unit: "kW", values: chartValues(demandPower) },
      { label: "Limite contratado", color: "#7b858e", unit: "kW", values: chartValues(contractedLimit) }
    ],
    utilization: [
      { label: "Disponibilidade", color: "#ff323a", unit: "", kind: "percent", values: chartValues(canReadCommercial ? operatingPercent : null) },
      { label: "Carregadores em uso", color: "#7b858e", unit: "", values: chartValues(canReadCommercial ? commercialChargers.filter((item) => item.status === "charging").length : null) }
    ]
  };
  const chartSeries = chartSeriesByMode[chartMode];
  const chartMax = Math.max(1, ...chartSeries.flatMap((series) => series.values.filter((value): value is number => value !== null)));
  const activePoint = hoveredPoint ?? -1;
  const showCommercialChart = canReadCommercial;
  const activeChartLabel = dashboardPeriodLabels[chartPeriod][Math.max(activePoint, 0)];

  return <>
    <section className="sems-dashboard-map" data-testid="mvp-overview-panel">
      <WorldMap state={{ ...state, locations, chargers }} />
      <article className="sems-station-summary world-station-summary" data-testid="mvp-overview-kpis">
        <div className="station-row station-row-main"><div className="station-map-illustration" aria-hidden="true"><span /><i /><b /><em /></div><div className="station-value"><p><strong>{locations.length}</strong><button type="button" aria-label="Expandir resumo das usinas" aria-expanded={summaryExpanded} onClick={() => setSummaryExpanded((value) => !value)}>⌄</button></p><span>Usinas monitoradas <small>?</small></span></div></div>
        <div className="station-row"><div className="station-solar-illustration" aria-hidden="true"><span /><span /><span /></div><div className="station-value"><p><strong>{number(totalPower)}</strong><small>kWp</small></p><span>Capacity</span></div></div>
        <div className="station-row"><div className="station-storage-illustration" aria-hidden="true"><span /><span /><span /></div><div className="station-value"><p><strong>{number(chargedEnergy ?? 0)}</strong><small>kWh</small></p><span>Energia armazenada</span></div></div>
        {summaryExpanded ? <div className="station-state-list" data-testid="dashboard-station-state-list">{stationStates.map(([label, value]) => <p key={label}><span>{label}</span><strong>{value}</strong></p>)}</div> : null}
      </article>
    </section>
    <section className="sems-operator-dashboard" data-testid="mvp-overview-recommendation">
      <div className="sems-operator-column">
        <article className="sems-dashboard-card sems-power-card"><header><div className="sems-card-heading"><img src={assets.dashboard.power} alt="" /><div><h2>Potência</h2><span>Tempo real</span></div></div></header><div className="sems-power-gauge" style={{ "--gauge-value": `${Math.min(100, Math.round((currentPower / Math.max(totalPower, 1)) * 100)) * 1.8}deg` } as CSSProperties}><div><strong>{solarPower === null && gridPower === null ? "—" : number(currentPower)}</strong><span>kW</span></div></div><footer><span><i className="is-red" />Solar {solarPower === null ? "Sem telemetria" : `${number(solarPower)} kW`}</span><span><i />Rede {gridPower === null ? "Sem telemetria" : `${number(gridPower)} kW`}</span></footer></article>
        <article className="sems-dashboard-card sems-alarm-card"><header><div className="sems-card-heading"><img src={assets.dashboard.alarm} alt="" /><h2>Alarmes</h2></div><a href="#/mvp/incidents">Detalhes ›</a></header><div className="sems-alarm-body"><div className="sems-alarm-donut" style={{ "--alarm-share": `${Math.min(100, alarmTotal * 12)}%` } as CSSProperties}><strong>{alarmTotal}</strong><span>Total</span></div><ul><li><i className="is-critical" /><span>Falha</span><strong>{offline}</strong></li><li><i className="is-warning" /><span>Aviso</span><strong>{openIncidents}</strong></li></ul></div></article>
        <article className="sems-dashboard-card sems-environment-card"><header><h2>Contribuições ambientais</h2><span>Desde o início da operação</span></header><div><p><img src={assets.dashboard.co2} alt="" /><span>CO₂ evitado</span><strong>{generatedEnergy === null ? "—" : `${number(generatedEnergy * 0.081)} t`}</strong></p><p><img src={assets.dashboard.tree} alt="" /><span>Árvores equivalentes</span><strong>{generatedEnergy === null ? "—" : Math.round(generatedEnergy * 0.42)}</strong></p><p><img src={assets.dashboard.generatedEnergy} alt="" /><span>Carvão padrão evitado</span><strong>{generatedEnergy === null ? "—" : `${number(generatedEnergy * 0.033)} t`}</strong></p></div></article>
      </div>
      <div className="sems-operator-main">
        <article className="sems-dashboard-card sems-economy-card">
          <header>
            <div><h2>Economia</h2><span>Produção e benefícios energéticos acumulados</span></div>
            <div className="sems-economy-period">
              <div><button type="button" aria-label="Período anterior" onClick={() => setEconomyPeriodOffset((value) => value - 1)}>‹</button><strong>{35 + economyPeriodOffset}/2026</strong><button type="button" aria-label="Próximo período" onClick={() => setEconomyPeriodOffset((value) => value + 1)}>›</button></div>
              <select aria-label="Período da economia" value={chartPeriod} onChange={(event) => setChartPeriod(event.target.value as DashboardPeriod)}><option value="day">Dia</option><option value="week">Semana</option><option value="month">Mês</option></select>
            </div>
          </header>
          <div className="sems-economy-metrics">
            <p><img src={assets.dashboard.generatedEnergy} alt="" /><span>Geração de energia</span><strong>{generatedEnergy === null ? "—" : <>{number(generatedEnergy)} <small>kWh</small></>}</strong></p>
            <p><img src={assets.dashboard.gridFeedIn} alt="" /><span>Energia exportada</span><strong>—</strong></p>
            <p><img src={assets.dashboard.chargingEnergy} alt="" /><span>Energia carregada</span><strong>{chargedEnergy === null ? "—" : <>{number(chargedEnergy)} <small>kWh</small></>}</strong></p>
            <p><img src={assets.dashboard.generationIncome} alt="" /><span>Receita de geração</span><strong>{technicalValue === null ? "—" : money(technicalValue)}</strong></p>
            <p><img src={assets.dashboard.gridIncome} alt="" /><span>Receita da rede</span><strong>—</strong></p>
            <p><img src={assets.dashboard.dischargedEnergy} alt="" /><span>Energia descarregada</span><strong>—</strong></p>
          </div>
          {canReadCommercial ? <aside className="sems-chargegrid-summary" data-testid="dashboard-chargegrid-summary"><div><span>Camada ChargeGrid</span><strong>{commercialPlants.length} usina(s) comercial(is)</strong></div><dl><div><dt>{canReadFinance ? "Receita do período" : "Qualidade comercial"}</dt><dd>{canReadFinance ? money(revenue) : `${operatingPercent}%`}</dd></div><div><dt>Sessões</dt><dd>{sessions.length}</dd></div><div><dt>Disponibilidade</dt><dd>{operatingPercent}%</dd></div><div><dt>Carregadores publicados</dt><dd>{commercialChargers.length}</dd></div></dl></aside> : null}
        </article>
        <article className="sems-dashboard-card sems-monitor-card"><header><div className="sems-card-heading"><img src={assets.dashboard.curve} alt="" /><div><h2>Monitoramento</h2><span>{chartMode === "energy" ? "Energia das usinas no escopo técnico" : "Indicador agregado da camada ChargeGrid"}</span></div></div><div>{(["day", "week", "month"] as DashboardPeriod[]).map((period) => <button className={chartPeriod === period ? "is-active" : ""} type="button" key={period} onClick={() => setChartPeriod(period)}>{period === "day" ? "Dia" : period === "week" ? "Semana" : "Mês"}</button>)}</div></header>{showCommercialChart ? <nav className="sems-chart-mode-tabs" aria-label="Indicador do monitoramento">{(["energy", "revenue", "demand", "utilization"] as DashboardChartMode[]).map((mode) => <button className={chartMode === mode ? "is-active" : ""} key={mode} type="button" onClick={() => { setChartMode(mode); setHoveredPoint(null); }}>{mode === "energy" ? "Monitoramento de energia" : mode === "revenue" ? "Receita ChargeGrid" : mode === "demand" ? "Demanda ChargeGrid" : "Utilização ChargeGrid"}</button>)}</nav> : null}<div className="sems-monitor-legend">{chartSeries.map((series) => <span key={series.label}><i style={{ background: series.color }} />{series.label}</span>)}</div><div className="sems-monitor-chart" aria-label="Gráfico de monitoramento agregado"><span className="chart-grid" /><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`Gráfico ${chartMode}`}><defs><linearGradient id="energy-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff323a" stopOpacity=".3" /><stop offset="1" stopColor="#ff323a" stopOpacity="0" /></linearGradient></defs>{chartSeries.map((series, index) => { const path = chartPath(series.values, chartMax); return path ? <path className={index === 0 ? "chart-energy" : "chart-sessions"} key={series.label} style={{ stroke: series.color }} d={path} /> : null; })}</svg>{activePoint >= 0 && chartSeries.some((series) => series.values[activePoint] !== null) ? <aside className="sems-monitor-tooltip" style={{ "--tooltip-position": `${(activePoint / Math.max(dashboardPeriodLabels[chartPeriod].length - 1, 1)) * 100}%` } as CSSProperties}><strong>{activeChartLabel}</strong>{chartSeries.map((series) => <span key={series.label}><i style={{ background: series.color }} />{series.label}<b>{formatChartValue(series.values[activePoint], series)}</b></span>)}</aside> : <p className="sems-monitor-empty">Sem telemetria disponível para este indicador.</p>}<div className="sems-chart-hover-targets">{dashboardPeriodLabels[chartPeriod].map((label, index) => <button key={label} type="button" data-testid={`dashboard-chart-point-${index}`} aria-label={`Exibir dados de ${label}`} onFocus={() => setHoveredPoint(index)} onMouseEnter={() => setHoveredPoint(index)} onClick={() => setHoveredPoint(index)} />)}</div><div className="chart-axis">{dashboardPeriodLabels[chartPeriod].map((label) => <span key={label}>{label}</span>)}</div></div></article>
      </div>
    </section>
  </>;
}

function ClientsPage() {
  const { state, account } = useAdminState();
  const scopeSet = new Set(accessibleEstablishmentIds(state, account));
  const visibleClients = state.clients.filter((client) => state.establishments.some((item) => item.clientId === client.id && scopeSet.has(item.id)));
  return <><Breadcrumbs items={[{ label: "GoodWe" }, { label: "Clientes" }]} /><section className="surface panel enterprise-page" data-testid="clients-panel"><SectionHeader title="Carteira comercial" subtitle="Estabelecimentos e ativações sincronizados do backoffice dentro da responsabilidade atribuída." /><div className="portfolio-inline-status"><strong>{visibleClients.length} cliente(s)</strong><span>{scopeSet.size} estabelecimento(s) no escopo</span><span>Cadastro contratual mantido fora do SEMS+</span></div><form className="enterprise-search-row" onSubmit={(event) => event.preventDefault()}><label><span>Buscar cliente</span><input placeholder="Nome, documento ou responsavel" /></label><label><span>Ciclo</span><select><option>Todos</option><option>Onboarding</option><option>Operacao</option><option>Expansao</option></select></label><button type="submit">Aplicar filtros</button></form><div className="enterprise-client-list">{visibleClients.map((client) => {
    const establishments = state.establishments.filter((item) => item.clientId === client.id); const ids = new Set(establishments.map((item) => item.id)); const locations = state.locations.filter((item) => ids.has(item.establishmentId)); const chargers = state.chargers.filter((item) => ids.has(item.establishmentId));
    return <article className="enterprise-client-card" key={client.id}><img src={assets.plant} alt={client.name} /><div className="enterprise-client-main"><div className="enterprise-card-title"><div><span>Enterprise</span><h3>{client.name}</h3><p>{client.corporateName}</p></div><StatusPill value={client.status} /></div><div className="enterprise-client-metrics"><span><strong>{establishments.length}</strong> estabelecimentos</span><span><strong>{locations.length}</strong> pontos</span><span><strong>{chargers.length}</strong> carregadores</span><span><strong>{state.supportTickets.filter((item) => ids.has(item.establishmentId)).length}</strong> chamados</span></div><div className="enterprise-card-footer"><span>Responsavel GoodWe: {client.owner}</span><span>Health 91/100</span><a className="ghost-button" href={`#/mvp/client?client=${client.id}`}>Abrir cliente</a></div></div></article>;
  })}</div></section></>;
}

function ClientDetail({ client }: { client: Client | undefined }) {
  const { state } = useAdminState();
  if (!client) return <p>Cliente nao encontrado.</p>;
  const establishments = state.establishments.filter((item) => item.clientId === client.id);
  const establishmentIds = new Set(establishments.map((item) => item.id));
  const locations = state.locations.filter((item) => establishmentIds.has(item.establishmentId));
  const chargers = state.chargers.filter((item) => establishmentIds.has(item.establishmentId));
  return <><Breadcrumbs items={[{ label: "Clientes", href: "#/mvp/clients" }, { label: client.name }]} /><section className="enterprise-hero surface"><img src={assets.plant} alt={client.name} /><div><span className="eyebrow">Enterprise · Operacao</span><h2>{client.name}</h2><p>{client.corporateName} · {client.document}</p><div className="enterprise-hero-meta"><StatusPill value={client.status} /><span>Responsavel {client.owner}</span><span>Health 91/100</span></div></div></section><nav className="enterprise-anchor-tabs"><a href="#client-summary">Resumo</a><a href="#client-establishments">Estabelecimentos</a><a href="#client-contacts">Contatos</a></nav><section id="client-summary" className="surface panel"><SectionHeader title="Resumo executivo" subtitle="Leitura consolidada do relacionamento e da operacao." /><div className="kpi-grid four-cols"><KpiCard label="Estabelecimentos" value={establishments.length} help="unidades de negocio" /><KpiCard label="Pontos" value={locations.length} help="locais fisicos" /><KpiCard label="Carregadores" value={chargers.length} help="infraestrutura" /><KpiCard label="Health" value="91/100" help="relacionamento" accent="good" /></div></section><section id="client-establishments" className="surface panel"><SectionHeader title="Estabelecimentos vinculados" subtitle="Acesse a unidade para continuar pela hierarquia operacional." /><div className="intel-grid">{establishments.map((item) => <article className="intel-card" key={item.id}><h3>{item.name}</h3><p>{item.city}/{item.state}</p><a className="ghost-button" href={`#/mvp/establishment?est=${item.id}`}>Abrir estabelecimento</a></article>)}</div></section><section id="client-contacts" className="surface panel"><SectionHeader title="Contato principal" /><div className="detail-grid"><article><h3>{client.contactName}</h3><p>{client.contactEmail}</p></article><article><h3>Responsavel GoodWe</h3><p>{client.owner}</p></article></div></section></>;
}

function EstablishmentsPage() {
  const { state, account } = useAdminState();
  const scopeSet = new Set(accessibleEstablishmentIds(state, account));
  const establishments = state.establishments.filter((item) => scopeSet.has(item.id));
  return <section className="surface panel sems-list-page"><SectionHeader title="Estabelecimentos" subtitle="Unidades sincronizadas do backoffice dentro da carteira atribuída." /><div className="establishment-folder-grid">{establishments.map((item) => { const locations = state.locations.filter((location) => location.establishmentId === item.id); const chargers = state.chargers.filter((charger) => charger.establishmentId === item.id); return <article className="establishment-folder-card" key={item.id}><div className="folder-thumb"><img src={assets.plant} alt={item.name} /></div><div className="folder-body"><h3>{item.name}</h3><p>{item.city}/{item.state} · Cliente comercial</p><div className="network-card-stats"><span><strong>{locations.length}</strong> pontos</span><span><strong>{chargers.length}</strong> carregadores</span><span><strong>{chargers.filter((charger) => charger.status === "charging").length}</strong> em uso</span><span><strong>{chargers.filter((charger) => charger.status === "available").length}</strong> disponíveis</span></div><p>{state.queue.filter((entry) => entry.establishmentId === item.id).length} motorista(s) em fila</p><a className="ghost-button" href={`#/mvp/establishment?est=${item.id}`}>Abrir pasta</a></div></article>; })}</div></section>;
}

function EstablishmentDetail({ establishmentId }: { establishmentId: string }) {
  const { state } = useAdminState();
  const item = state.establishments.find((candidate) => candidate.id === establishmentId);
  if (!item) return <p>Estabelecimento nao encontrado.</p>;
  const locations = state.locations.filter((location) => location.establishmentId === item.id);
  const chargers = state.chargers.filter((charger) => charger.establishmentId === item.id);
  return <><section className="entity-hero"><img src={assets.plant} alt={item.name} /><div><span>ESTABELECIMENTO</span><h2>{item.name}</h2><p>{item.address} · {item.city}/{item.state}</p><div className="entity-hero-stats"><strong>{locations.length} pontos</strong><strong>{chargers.length} carregadores</strong><strong>Ativo</strong><strong>{item.contractCode}</strong></div></div></section><nav className="entity-tabs"><a href="#est-summary">Resumo</a><a className="is-active" href="#est-points">Pontos</a><a href="#est-operation">Operacao</a></nav><section id="est-points" className="surface panel sems-list-page"><SectionHeader title="Pontos do estabelecimento" subtitle="Locais físicos sincronizados com a planta e o contrato; cadastros comerciais são mantidos no backoffice." /><div className="network-location-grid">{locations.map((location) => <article className="network-location-card" key={location.id}><img className="network-card-cover" src={assets.plant} alt={location.name} /><div className="network-card-body"><div className="network-card-title"><div><h3>{location.name}</h3><p>{location.city}/{location.state}</p></div><Badge value={location.status === "Ativo" ? "available" : "offline"} /></div><p className="network-card-address">{location.address}, {location.number}</p><div className="network-card-stats"><span><strong>{chargers.filter((charger) => charger.locationId === location.id).length}</strong> carregadores</span></div><a className="ghost-button" href={`#/mvp/location?est=${item.id}&loc=${location.id}`}>Abrir ponto</a></div></article>)}</div></section></>;
}

function LocationsPage({ establishmentId }: { establishmentId?: string }) {
  const { state, account } = useAdminState();
  const scopeSet = new Set(accessibleEstablishmentIds(state, account));
  const locations = state.locations.filter((item) => scopeSet.has(item.establishmentId) && (!establishmentId || item.establishmentId === establishmentId));
  return <section className="surface panel sems-list-page" data-testid="establishment-locations-panel">
    <SectionHeader title={establishmentId ? "Meus locais" : "Pontos de Recarga"} subtitle={establishmentId ? "Locais atribuidos pela GoodWe para monitoramento operacional." : "Mapa e blocos de todos os locais fisicos da rede."} />
    <div className="network-view-tabs"><span className="is-active">Blocos</span><a href="#/mvp/overview">Mapa</a></div>
    <div className="network-location-grid">{locations.map((item) => {
      const chargers = state.chargers.filter((charger) => charger.locationId === item.id);
      return <article className="network-location-card" key={item.id}><img className="network-card-cover" src={assets.plant} alt={item.name} /><div className="network-card-body"><div className="network-card-title"><div><h3>{item.name}</h3><p>{item.city}/{item.state}</p></div><Badge value={item.status === "Ativo" ? "available" : "offline"} /></div><p className="network-card-address">{item.address}, {item.number}</p><div className="network-card-stats"><span><strong>{chargers.length}</strong> carregadores</span><span><strong>{chargers.filter((charger) => charger.status === "available").length}</strong> disponiveis</span><span><strong>{chargers.filter((charger) => charger.status === "charging").length}</strong> em uso</span><span><strong>{chargers.filter((charger) => charger.status === "offline").length}</strong> offline</span></div><a className="ghost-button" href={`#/mvp/location?est=${item.establishmentId}&loc=${item.id}`}>{establishmentId ? "Abrir monitoramento" : "Abrir ponto"}</a></div></article>;
    })}</div>
  </section>;
}

function ChargerCards({ items }: { items: Charger[] }) {
  return <div className="charger-visual-grid">{items.map((charger) => <article key={charger.id} className="charger-visual-card"><img src={assets.charger} alt={charger.model} /><div><div className="network-card-title"><h3>{charger.internalId || charger.id}</h3><Badge value={charger.status} /></div><p>{charger.model} · {charger.powerKw} kW</p><p>{charger.status === "charging" ? "Sessao ativa" : "Sem sessao ativa"}</p><div className="network-card-meta"><span>Health 92/100</span><span>{number(charger.todayEnergyKwh)} kWh hoje</span></div><a className="ghost-button" href={`#/mvp/charger?est=${charger.establishmentId}&loc=${charger.locationId}&charger=${charger.id}`}>Ver equipamento</a></div></article>)}</div>;
}

function LocationDetail({ establishmentId, locationId }: { establishmentId: string; locationId: string }) {
  const { state } = useAdminState();
  const location = state.locations.find((item) => item.id === locationId && item.establishmentId === establishmentId);
  if (!location) return <Navigate to="/mvp/overview" replace />;
  const chargers = state.chargers.filter((item) => item.locationId === location.id);
  return <><section className="entity-hero location-hero"><img src={assets.plant} alt={location.name} /><div><span>PONTO DE RECARGA</span><h2>{location.name}</h2><p>{location.address}, {location.number} · {location.city}/{location.state}</p><div className="entity-hero-stats"><strong>{chargers.length} carregadores</strong><strong>{chargers.filter((item) => item.status === "charging").length} sessoes ativas</strong><strong>Energia Alerta</strong><strong>Health 92/100</strong></div></div></section><nav className="entity-tabs"><a className="is-active" href="#point-summary">Resumo</a><a href="#point-chargers">Carregadores</a><a href="#point-operation">Operacao</a><a href="#point-energy">Energia</a></nav><section id="point-summary" className="surface panel"><div className="kpi-grid four-cols"><KpiCard label="Carregadores" value={chargers.length} help="instalados" /><KpiCard label="Disponiveis" value={chargers.filter((item) => item.status === "available").length} help="prontos para uso" accent="good" /><KpiCard label="Em uso" value={chargers.filter((item) => item.status === "charging").length} help="agora" accent="danger" /><KpiCard label="Offline" value={chargers.filter((item) => item.status === "offline").length} help="indisponiveis" /></div></section><section id="point-chargers" className="surface panel sems-list-page"><SectionHeader title="Carregadores instalados" subtitle="Equipamentos GoodWe descobertos pelo SEMS+; publicação comercial é configurada individualmente no detalhe." /><ChargerCards items={chargers} /></section><section id="point-operation" className="surface panel"><div className="detail-grid"><article><h3>Operacao</h3><p>{chargers.filter((item) => item.status === "charging").length} sessoes em andamento</p></article><article><h3>Energia entregue</h3><p>{number(chargers.reduce((sum, item) => sum + item.todayEnergyKwh, 0))} kWh</p></article></div></section></>;
}

function ContractPage({ establishmentId }: { establishmentId: string }) {
  const { state } = useAdminState();
  const establishment = state.establishments.find((item) => item.id === establishmentId);
  const shareBps = state.tariffPolicies.find((item) => item.establishmentId === establishmentId && item.status === "ACTIVE")?.platformShareBps;
  return <><Breadcrumbs items={[{ label: "Business" }, { label: "Contratos" }]} /><section className="surface panel enterprise-page"><SectionHeader title="Meu contrato" subtitle="Condicoes comerciais vigentes para sua operacao." /><div className="contract-grid"><article className="contract-card"><header><div><span>{establishment?.contractCode}</span><h3>ChargeGrid Performance</h3><p>{establishment?.name}</p></div><StatusPill value="Ativo" /></header><dl><div><dt>Modelo</dt><dd>Revenue share</dd></div><div><dt>Renovacao</dt><dd>15/01/2027</dd></div><div><dt>SLA</dt><dd>8 horas</dd></div><div><dt>Participacao</dt><dd>{shareBps === undefined ? "Nao parametrizada" : `${shareBps / 100}%`}</dd></div></dl><a className="ghost-button" href={`#/mvp/pricing?est=${establishmentId}`}>Ver politica vigente</a></article></div></section></>;
}

function SupportPage({ establishmentId }: { establishmentId?: string }) {
  const { state, account, createTicket } = useAdminState();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const accessibleIds = new Set(accessibleEstablishmentIds(state, account));
  const canUseChargeGridSupport = hasOwnChargeGridOperation(state, account);
  const tickets = state.supportTickets.filter((item) => accessibleIds.has(item.establishmentId) && (!establishmentId || item.establishmentId === establishmentId));
  const chargers = state.chargers.filter((item) => accessibleIds.has(item.establishmentId) && (!establishmentId || item.establishmentId === establishmentId));
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = createTicket(establishmentId ?? "est-fiap", String(data.get("title")), String(data.get("description")));
    navigate(`/mvp/ticket?ticket=${id}`);
  }
  return <div className="sems-service-page"><section className="surface sems-service-banner"><div className="sems-service-highlight"><span>GoodWe Service</span><h2>Energia inteligente com suporte conectado</h2><p>Conteúdo técnico, comunicados e atendimento em um único centro.</p></div><aside><h3>Comunicados</h3><p><strong>Next-Gen SEMS+: sua energia sob uma nova perspectiva</strong><span>15/07/2026 08:48:13</span></p>{canUseChargeGridSupport ? <p><strong>Operação ChargeGrid integrada ao portal</strong><span>23/08/2026 10:30:00</span></p> : null}</aside></section><section className="sems-service-grid"><article className="surface sems-service-news"><header><h2>Notícias GoodWe</h2><span>Mais</span></header><div><img src={assets.plant} alt="Soluções GoodWe" /><p><strong>GoodWe entre as marcas globais de energia inteligente</strong><span>04/12/2024</span></p></div><footer><button type="button" onClick={() => setOpen(true)}>◉ Suporte técnico</button><button type="button" onClick={() => setOpen(true)}>⌁ Fale conosco</button></footer></article><article className="surface sems-service-warranty"><header><h2>Garantia e equipamentos</h2><span>Mais</span></header>{chargers.slice(0, 2).map((charger) => <a key={charger.id} href={`#/mvp/charger?est=${charger.establishmentId}&charger=${charger.id}`}><span>{charger.model}</span><strong>{charger.serial}</strong></a>)}</article><aside className="sems-service-links">{account && hasAdminCapability(account, "intelligence:read") ? <a href="#/mvp/ai">◉ Agente de IA GoodWe</a> : null}<button type="button" onClick={() => setOpen(true)}>▱ Feedback</button><a href="#/mvp/overview">▦ Sobre o SEMS+</a></aside></section>{canUseChargeGridSupport ? <section className="surface panel enterprise-page"><SectionHeader title="Chamados ChargeGrid" subtitle={establishmentId ? "Atendimento comercial e técnico da operação de recarga." : "Selecione um estabelecimento para abrir um novo chamado."} action={establishmentId ? <button className="sems-primary-action" type="button" onClick={() => setOpen((value) => !value)}>Abrir chamado</button> : undefined} />{open && establishmentId ? <form className="simulator-grid" data-form="create-support-ticket" onSubmit={submit}><label>Título<input name="title" required /></label><label>Descrição<textarea name="description" required /></label><button type="submit">Criar chamado</button></form> : null}<div className="support-grid">{tickets.map((ticket) => <article key={ticket.id} className="support-card"><header><div><span>{ticket.code}</span><h3>{ticket.title}</h3></div><StatusPill value={ticket.status} /></header><p>{ticket.description}</p><a className="ghost-button" href={`#/mvp/ticket?est=${ticket.establishmentId}&ticket=${ticket.id}`}>Abrir chamado</a></article>)}</div></section> : null}</div>;
}

function TicketPage({ ticketId }: { ticketId: string }) {
  const { state } = useAdminState();
  const ticket = state.supportTickets.find((item) => item.id === ticketId);
  if (!ticket) return <p>Chamado nao encontrado.</p>;
  return <section className="surface panel enterprise-page"><SectionHeader eyebrow={ticket.code} title={ticket.title} subtitle={ticket.description} /><div className="detail-grid"><article><h3>Status</h3><p><Badge value={ticket.status} /></p></article><article><h3>Criado em</h3><p>{new Date(ticket.createdAt).toLocaleString("pt-BR")}</p></article></div></section>;
}

function GenericPage({ tab }: { tab: string }) {
  const { state } = useAdminState();
  const titles: Record<string, string> = { installations: "Implantacoes", contracts: "Contratos", expansion: "Expansao", documents: "Documentos" };
  if (tab === "contracts") return <section className="surface panel enterprise-page"><SectionHeader title="Contratos comerciais" subtitle="Modelos, vigencias, tarifas e obrigacoes da carteira." /><div className="contract-grid">{state.establishments.map((item) => { const shareBps = state.tariffPolicies.find((policy) => policy.establishmentId === item.id && policy.status === "ACTIVE")?.platformShareBps; return <article className="contract-card" key={item.id}><header><div><span>{item.contractCode}</span><h3>Contrato ChargeGrid</h3><p>{item.name}</p></div><StatusPill value="Ativo" /></header><dl><div><dt>Modelo</dt><dd>Revenue share</dd></div><div><dt>SLA</dt><dd>8 horas</dd></div><div><dt>Participacao</dt><dd>{shareBps === undefined ? "Nao parametrizada" : `${shareBps / 100}%`}</dd></div></dl><a className="ghost-button" href={`#/mvp/contract?est=${item.id}`}>Ver condicoes</a></article>; })}</div></section>;
  if (tab === "installations") return <section className="surface panel enterprise-page"><SectionHeader title="Implantacoes" subtitle="Da vistoria ao aceite: acompanhe responsabilidade, prazo e bloqueios." action={<button className="sems-primary-action">Nova implantacao</button>} /><div className="enterprise-progress-list">{state.establishments.map((item, index) => <a href={`#/mvp/establishment?est=${item.id}`} key={item.id}><div><strong>IMP-2026-00{index + 1}</strong><span>{item.name}</span></div><div className="progress-track"><i style={{ width: `${78 - index * 9}%` }} /></div><b>{78 - index * 9}%</b><StatusPill value={index ? "Em andamento" : "Concluida"} /></a>)}</div></section>;
  if (tab === "expansion") return <section className="surface panel enterprise-page"><SectionHeader title="Expansao" subtitle="Oportunidades priorizadas por utilizacao, fila e demanda." /><div className="opportunity-grid">{state.clients.slice(0, 3).map((item, index) => <article key={item.id}><span>Score {88 - index * 7}</span><h3>Expandir infraestrutura de {item.name}</h3><p>Uso recorrente e fila indicam potencial comercial.</p><a className="ghost-button" href={`#/mvp/client?client=${item.id}`}>Abrir oportunidade</a></article>)}</div></section>;
  if (tab === "documents") return <section className="surface panel enterprise-page"><SectionHeader title="Documentos" subtitle="Arquivos comerciais e operacionais disponiveis." /><DataTable columns={["Documento", "Tipo", "Versao", "Status"]}><tr><td>Manual de operacao ChargeGrid</td><td>Operacional</td><td>v2.1</td><td><StatusPill value="Publicado" /></td></tr><tr><td>Politica de tarifacao</td><td>Comercial</td><td>v1.4</td><td><StatusPill value="Publicado" /></td></tr></DataTable></section>;
  return <section className="surface panel enterprise-page"><SectionHeader eyebrow="ChargeGrid Intelligence" title={titles[tab] ?? "Area indisponivel"} subtitle="Esta rota nao faz parte da release administrativa validada." /><a className="ghost-button" href="#/mvp/overview">Voltar para a visao geral</a></section>;
}

export function AdminDashboardPage() {
  const { tab = "overview" } = useParams();
  const [query] = useSearchParams();
  const { state, account } = useAdminState();
  if (!account) return <Navigate to="/login" replace />;
  if (account.profile === "ESTABELECIMENTO" && !establishmentTabs.has(tab)) return <Navigate to="/mvp/overview" replace />;
  const requiredCapability = tab === "plant-onboarding" && account.profile === "ESTABELECIMENTO"
    ? "commercial:self-service"
    : getAdminRouteCapability(tab);
  if (requiredCapability && !hasAdminCapability(account, requiredCapability)) return <AccessDeniedPage />;

  const establishmentId = account.profile === "ESTABELECIMENTO" ? account.establishmentId! : query.get("est") ?? "";
  if (account.profile === "ESTABELECIMENTO" && query.get("est") && query.get("est") !== account.establishmentId) return <Navigate to="/mvp/overview" replace />;
  if (account.profile === "GOODWE" && establishmentId && !accessibleEstablishmentIds(state, account).includes(establishmentId)) return <Navigate to="/mvp/overview" replace />;
  const accessibleScopeSet = new Set(accessibleEstablishmentIds(state, account));
  const locationId = query.get("loc") ?? "";
  if (account.profile === "ESTABELECIMENTO" && locationId) {
    const location = state.locations.find((item) => item.id === locationId);
    if (!location || location.establishmentId !== account.establishmentId) return <Navigate to="/mvp/overview" replace />;
  }
  const requestedCharger = state.chargers.find((item) => item.id === query.get("charger"));
  const requestedSession = state.sessions.find((item) => item.id === query.get("session"));
  const requestedIncident = state.incidents.find((item) => item.id === query.get("incident"));
  const requestedTransaction = state.paymentTransactions.find((item) => item.id === query.get("transaction"));
  const requestedTicket = state.supportTickets.find((item) => item.id === query.get("ticket"));
  const requestedClientId = query.get("client");
  const requestedClientScopes = requestedClientId ? state.establishments.filter((item) => item.clientId === requestedClientId).map((item) => item.id) : [];
  const requestedResourceScope = requestedCharger?.establishmentId ?? requestedSession?.establishmentId ?? requestedIncident?.establishmentId ?? requestedTransaction?.establishmentId ?? requestedTicket?.establishmentId;
  if (requestedResourceScope && !accessibleScopeSet.has(requestedResourceScope)) return <AccessDeniedPage />;
  if (requestedClientId && !requestedClientScopes.some((scope) => accessibleScopeSet.has(scope))) return <AccessDeniedPage />;

  const content = (() => {
    switch (tab) {
      case "overview": return <Overview />;
      case "clients": return <ClientsPage />;
      case "new-client": return <Navigate to="/mvp/clients" replace />;
      case "client": return <ClientDetail client={state.clients.find((item) => item.id === query.get("client"))} />;
      case "establishments": return <EstablishmentsPage />;
      case "establishment": return <EstablishmentDetail establishmentId={establishmentId} />;
      case "plants": return <PlantsPortfolioPage />;
      case "plant": return <PlantDetailPage plantId={query.get("plant") ?? ""} />;
      case "plant-onboarding": return <PlantOnboardingPage />;
      case "locations": return <LocationsPage establishmentId={establishmentId || undefined} />;
      case "new-location": return <Navigate to="/mvp/plants" replace />;
      case "location": return <LocationDetail establishmentId={establishmentId} locationId={locationId} />;
      case "chargers": return <ChargersInventoryPage establishmentId={establishmentId || undefined} />;
      case "charger": return <ChargerDetailPage chargerId={query.get("charger") ?? ""} establishmentId={establishmentId || undefined} />;
      case "sessions": return <OperationsSessionsPage establishmentId={establishmentId || undefined} />;
      case "session": return <SessionDetailPage sessionId={query.get("session") ?? ""} establishmentId={establishmentId || undefined} />;
      case "operations": return <OperationsCenterPage establishmentId={establishmentId || undefined} />;
      case "queue": return <QueueOperationsPage establishmentId={establishmentId || undefined} />;
      case "incidents": return <IncidentInboxPage establishmentId={establishmentId || undefined} />;
      case "incident": return <IncidentDetailPage incidentId={query.get("incident") ?? ""} establishmentId={establishmentId || undefined} />;
      case "pricing": return <TariffPoliciesPage establishmentId={establishmentId || undefined} />;
      case "finance": return <FinanceDashboardPage establishmentId={establishmentId || undefined} />;
      case "invoices": return <FinanceDashboardPage establishmentId={establishmentId || undefined} />;
      case "financial-session": return <FinancialSessionPage transactionId={query.get("transaction") ?? ""} establishmentId={establishmentId || undefined} />;
      case "energy": return <EnergyOperationsPage establishmentId={establishmentId || undefined} />;
      case "ai": return <RecommendationsPage establishmentId={establishmentId || undefined} />;
      case "analysis-iv": return <SemsIvDiagnosisPage establishmentId={establishmentId || undefined} />;
      case "analysis-comparison": return <SemsComparisonPage establishmentId={establishmentId || undefined} />;
      case "analysis-battery": return <SemsBatteryConsistencyPage establishmentId={establishmentId || undefined} />;
      case "recommendations": return <RecommendationsPage establishmentId={establishmentId || undefined} />;
      case "reports": return <ReportsOperationsPage establishmentId={establishmentId || undefined} />;
      case "access": return <OrganizationGovernancePage />;
      case "settings": return <OrganizationGovernancePage />;
      case "contract": return <ContractPage establishmentId={establishmentId} />;
      case "support": return <SupportPage establishmentId={establishmentId || undefined} />;
      case "ticket": return account.role ? <TicketPage ticketId={query.get("ticket") ?? ""} /> : <Navigate to="/mvp/support" replace />;
      case "audit": return <Navigate to="/mvp/access?section=audit" replace />;
      case "contracts": return <Navigate to="/mvp/access?section=contracts" replace />;
      case "expansion": return <GenericPage tab={tab} />;
      default: return <Navigate to="/mvp/overview" replace />;
    }
  })();

  return content;
}
