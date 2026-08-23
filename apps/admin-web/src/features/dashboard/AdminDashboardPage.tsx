import { useState, type FormEvent } from "react";
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
import { AccessDeniedPage, AccessManagementPage, ReportsOperationsPage } from "../governance/GovernancePages";
import { hasAdminCapability } from "../../domain/adminCapabilities";
import { getAdminRouteCapability } from "../../app/adminNavigation";

const establishmentTabs = new Set(["overview", "locations", "location", "charger", "chargers", "sessions", "session", "operations", "queue", "incidents", "incident", "energy", "pricing", "finance", "financial-session", "invoices", "contract", "support", "ticket", "documents", "ai", "recommendations", "reports", "settings", "access"]);

function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return <nav className="enterprise-breadcrumb" aria-label="Navegacao estrutural">{items.map((item, index) => <span key={item.label}>{item.href ? <a href={item.href}>{item.label}</a> : <strong>{item.label}</strong>}{index < items.length - 1 ? <i>/</i> : null}</span>)}</nav>;
}

function StatusPill({ value }: { value: string }) {
  return <span className={`enterprise-status ${value.toLowerCase().replaceAll(" ", "-")}`}>{value}</span>;
}

function Overview({ establishmentId }: { establishmentId?: string }) {
  const { state, account } = useAdminState();
  const establishmentIds = account?.profile === "GOODWE"
    ? new Set(establishmentId ? [establishmentId] : state.establishments.map((item) => item.id))
    : new Set([account?.establishmentId ?? ""]);
  const chargers = state.chargers.filter((item) => establishmentIds.has(item.establishmentId));
  const sessions = state.sessions.filter((item) => establishmentIds.has(item.establishmentId));
  const locations = state.locations.filter((item) => establishmentIds.has(item.establishmentId));
  const queue = state.queue.filter((item) => establishmentIds.has(item.establishmentId) && item.status === "waiting");
  const available = chargers.filter((item) => item.status === "available").length;
  const inUse = chargers.filter((item) => item.status === "charging").length;
  const totalPower = chargers.reduce((sum, item) => sum + item.powerKw, 0);
  const delivered = sessions.reduce((sum, item) => sum + item.energyKwh, 0);
  const revenue = sessions.reduce((sum, item) => sum + (item.finalAmount ?? item.consumedAmount), 0);
  const offline = chargers.filter((item) => item.status === "offline").length;

  if (account?.profile !== "GOODWE") {
    const energy = state.energy.find((item) => item.establishmentId === account?.establishmentId) ?? state.energy[0]!;
    return <><section className="surface panel sems-panel" data-testid="mvp-overview-panel"><SectionHeader title={`Operacao de ${state.establishments.find((item) => item.id === account?.establishmentId)?.name ?? "estabelecimento"}`} subtitle="O estabelecimento recebe estrutura pronta e monitora sua operacao." /><div className="sems-status-tabs"><span className="sems-status-tab tone-info is-active"><i />Todos <b>({chargers.length})</b></span><span className="sems-status-tab tone-good"><i />Em operacao <b>({available + inUse})</b></span><span className="sems-status-tab tone-warn"><i />Aguardando <b>({queue.length})</b></span></div><div className="kpi-grid four-cols" data-testid="mvp-overview-kpis"><KpiCard testId="mvp-kpi-available" label="Carregadores disponiveis" value={available} help="nos seus locais" /><KpiCard testId="mvp-kpi-inuse" label="Carregadores em uso" value={inUse} help="tempo real" accent="danger" /><KpiCard testId="mvp-kpi-active-sessions" label="Sessoes acontecendo" value={sessions.filter((item) => item.status === "active").length} help="agora" /><KpiCard testId="mvp-kpi-demand-state" label="Estado da demanda" value={energy.demandState} help={`${energy.powerMarginPercent}% margem`} accent="warn" /><KpiCard label="Locais atribuidos" value={locations.length} help="cadastro GoodWe" /><KpiCard label="Energia entregue" value={`${number(delivered)} kWh`} help="acumulado" /><KpiCard label="Receita" value={money(revenue)} help="operacao" /><KpiCard label="Fila atual" value={queue.length} help="aguardando" /></div></section><section className="surface panel sems-list-page" data-testid="mvp-overview-recommendation"><SectionHeader title="Resumo por local" subtitle="Clique para acompanhar cada ponto separadamente." /><div className="intel-grid">{locations.map((location) => <article className="intel-card" key={location.id}><div className="network-card-title"><h3>{location.name}</h3><Badge value={location.status === "Ativo" ? "available" : "offline"} /></div><p>{location.address}, {location.number}</p><p>{chargers.filter((item) => item.locationId === location.id).length} carregadores vinculados</p><a className="ghost-button" href={`#/mvp/location?est=${location.establishmentId}&loc=${location.id}`}>Abrir monitoramento</a></article>)}</div><article className="assistant-card"><h3>Recomendacao principal</h3><p>Locais monitorados: {locations.map((item) => item.name).join(", ")}. Fila atual: {queue.length} aguardando. Priorizar monitoramento dos locais com maior ocupacao.</p></article></section></>;
  }

  return <>
    <section className="sems-dashboard-map" data-testid="mvp-overview-panel">
      <WorldMap state={{ ...state, locations, chargers }} />
      <article className="sems-station-summary world-station-summary" data-testid="mvp-overview-kpis">
        <div className="station-row station-row-main"><div className="station-map-illustration" aria-hidden="true"><span /><i /><b /><em /></div><div className="station-value"><p><strong>{locations.length}</strong><button type="button" aria-label="Expandir estacoes">⌄</button></p><span>Station Number <small>?</small></span></div></div>
        <div className="station-row"><div className="station-solar-illustration" aria-hidden="true"><span /><span /><span /></div><div className="station-value"><p><strong>{number(totalPower)}</strong><small>kWp</small></p><span>Capacity</span></div></div>
        <div className="station-row"><div className="station-storage-illustration" aria-hidden="true"><span /><span /><span /></div><div className="station-value"><p><strong>{number(34.84)}</strong><small>kWh</small></p><span>Capacity</span></div></div>
      </article>
      <div className="sems-dashboard-title"><h2>Visao geral da rede</h2><p>Cada marcador representa um ponto fisico de recarga.</p></div>
    </section>
    <section className="surface panel sems-panel"><SectionHeader title="Resumo executivo" subtitle="Os numeros essenciais da operacao comercial GoodWe." /><div className="kpi-grid four-cols"><KpiCard label="Estabelecimentos" value={state.establishments.length} help="clientes GoodWe" /><KpiCard label="Pontos de recarga" value={locations.length} help="locais fisicos" /><KpiCard label="Carregadores" value={chargers.length} help="equipamentos vinculados" /><KpiCard testId="mvp-kpi-available" label="Disponiveis" value={available} help="prontos para uso" accent="good" /><KpiCard testId="mvp-kpi-inuse" label="Em uso" value={inUse} help="carregadores ocupados" accent="danger" /><KpiCard testId="mvp-kpi-active-sessions" label="Sessoes acontecendo" value={sessions.filter((item) => item.status === "active").length} help="agora" /><KpiCard label="Offline" value={offline} help="requerem atencao" accent={offline ? "warn" : "good"} /><KpiCard label="Energia entregue" value={`${number(delivered)} kWh`} help="rede consolidada" /><KpiCard label="Receita movimentada" value={money(revenue)} help="sessoes e pagamentos" /><KpiCard testId="mvp-kpi-demand-state" label="Alarmes" value={offline + 1} help="energia e equipamentos" accent="warn" /></div></section>
    <section className="surface panel decision-center" data-testid="mvp-overview-recommendation"><SectionHeader title="Centro de decisao" subtitle="Prioridades explicadas com evidencia, impacto e proxima acao." /><div className="decision-list"><article><div className="decision-rank">01</div><div><span>Operacao · Alta</span><h3>CG-MX-01 sem comunicacao</h3><p><strong>Por que:</strong> Disponibilidade abaixo do esperado.</p><p><strong>Evidencia:</strong> Equipamento offline no periodo atual.</p><p><strong>Recomendacao:</strong> Associar chamado e executar diagnostico remoto.</p></div><a className="ghost-button" href="#/mvp/chargers">Agir agora</a></article></div><footer><span>{chargers.length} equipamentos monitorados · Fila atual: {queue.length}</span><a href="#/mvp/ai">Abrir inteligencia completa</a></footer></section>
  </>;
}

function ClientsPage() {
  const { state } = useAdminState();
  return <><Breadcrumbs items={[{ label: "GoodWe" }, { label: "Clientes" }]} /><section className="surface panel enterprise-page" data-testid="clients-panel"><SectionHeader title="Clientes comerciais" subtitle="Relacionamento, contratos, operacao e oportunidades em uma unica pasta." action={<a className="sems-primary-action" href="#/mvp/new-client">Cadastrar cliente</a>} /><div className="kpi-grid four-cols"><KpiCard label="Clientes ativos" value={state.clients.filter((item) => item.status === "Ativo").length} help="carteira atual" /><KpiCard label="Em onboarding" value={state.clients.filter((item) => item.status === "Implantação").length} help="implantacao comercial" /><KpiCard label="Health medio" value="91/100" help="saude da carteira" accent="good" /><KpiCard label="Oportunidades" value={2} help="expansao identificada" accent="warn" /></div><form className="enterprise-search-row"><label><span>Buscar cliente</span><input placeholder="Nome, documento ou responsavel" /></label><label><span>Ciclo</span><select><option>Todos</option><option>Onboarding</option><option>Operacao</option><option>Expansao</option></select></label><button type="submit">Aplicar filtros</button></form><div className="enterprise-client-list">{state.clients.map((client) => {
    const establishments = state.establishments.filter((item) => item.clientId === client.id); const ids = new Set(establishments.map((item) => item.id)); const locations = state.locations.filter((item) => ids.has(item.establishmentId)); const chargers = state.chargers.filter((item) => ids.has(item.establishmentId));
    return <article className="enterprise-client-card" key={client.id}><img src={assets.plant} alt={client.name} /><div className="enterprise-client-main"><div className="enterprise-card-title"><div><span>Enterprise</span><h3>{client.name}</h3><p>{client.corporateName}</p></div><StatusPill value={client.status} /></div><div className="enterprise-client-metrics"><span><strong>{establishments.length}</strong> estabelecimentos</span><span><strong>{locations.length}</strong> pontos</span><span><strong>{chargers.length}</strong> carregadores</span><span><strong>{state.supportTickets.filter((item) => ids.has(item.establishmentId)).length}</strong> chamados</span></div><div className="enterprise-card-footer"><span>Responsavel GoodWe: {client.owner}</span><span>Health 91/100</span><a className="ghost-button" href={`#/mvp/client?client=${client.id}`}>Abrir cliente</a></div></div></article>;
  })}</div></section></>;
}

function NewClientPage() {
  const { createClient } = useAdminState();
  const navigate = useNavigate();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = createClient({ name: String(data.get("name")), corporateName: String(data.get("corporateName")), document: String(data.get("document")), owner: String(data.get("owner")), contactName: String(data.get("contactName")), contactEmail: String(data.get("contactEmail")) });
    navigate(`/mvp/client?client=${id}`);
  }
  return <><Breadcrumbs items={[{ label: "Clientes", href: "#/mvp/clients" }, { label: "Novo cliente" }]} /><section className="surface panel enterprise-page enterprise-form-page"><SectionHeader title="Cadastrar cliente comercial" subtitle="O cliente e a organizacao que pode reunir varios estabelecimentos, contratos e pontos." /><form className="entity-form enterprise-step-form" data-form="create-client" onSubmit={submit}><fieldset><legend><b>01</b> Identidade empresarial</legend><div className="form-section-grid"><label>Nome comercial<input name="name" required /></label><label>Razao social<input name="corporateName" required /></label><label>Documento / CNPJ<input name="document" required /></label><label>Segmento<select><option>Shopping e varejo</option><option>Corporativo</option></select></label><label>Categoria<select><option>Enterprise</option><option>Strategic</option></select></label></div></fieldset><fieldset><legend><b>02</b> Relacionamento GoodWe</legend><div className="form-section-grid"><label>Responsavel GoodWe<input name="owner" required /></label><label>Status<select><option>Ativo</option><option>Prospect</option></select></label></div></fieldset><fieldset><legend><b>03</b> Contato principal</legend><div className="form-section-grid"><label>Nome<input name="contactName" required /></label><label>Email<input name="contactEmail" type="email" required /></label></div></fieldset><div className="form-actions"><a className="ghost-button" href="#/mvp/clients">Cancelar</a><button type="submit">Criar cliente e abrir pasta</button></div></form></section></>;
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
  const { state } = useAdminState();
  return <section className="surface panel sems-list-page"><SectionHeader title="Estabelecimentos" subtitle="Clientes administrados pela GoodWe e sua estrutura vinculada." action={<a className="sems-primary-action" href="#/mvp/new-establishment">Cadastrar novo estabelecimento</a>} /><div className="establishment-folder-grid">{state.establishments.map((item) => { const locations = state.locations.filter((location) => location.establishmentId === item.id); const chargers = state.chargers.filter((charger) => charger.establishmentId === item.id); return <article className="establishment-folder-card" key={item.id}><div className="folder-thumb"><img src={assets.plant} alt={item.name} /></div><div className="folder-body"><h3>{item.name}</h3><p>{item.city}/{item.state} · Cliente comercial</p><div className="network-card-stats"><span><strong>{locations.length}</strong> pontos</span><span><strong>{chargers.length}</strong> carregadores</span><span><strong>{chargers.filter((charger) => charger.status === "charging").length}</strong> em uso</span><span><strong>{chargers.filter((charger) => charger.status === "available").length}</strong> disponiveis</span></div><p>Operacao estavel · {state.queue.filter((entry) => entry.establishmentId === item.id).length} em fila</p><a className="ghost-button" href={`#/mvp/establishment?est=${item.id}`}>Abrir pasta</a></div></article>; })}</div></section>;
}

function EstablishmentDetail({ establishmentId }: { establishmentId: string }) {
  const { state } = useAdminState();
  const item = state.establishments.find((candidate) => candidate.id === establishmentId);
  if (!item) return <p>Estabelecimento nao encontrado.</p>;
  const locations = state.locations.filter((location) => location.establishmentId === item.id);
  const chargers = state.chargers.filter((charger) => charger.establishmentId === item.id);
  return <><section className="entity-hero"><img src={assets.plant} alt={item.name} /><div><span>ESTABELECIMENTO</span><h2>{item.name}</h2><p>{item.address} · {item.city}/{item.state}</p><div className="entity-hero-stats"><strong>{locations.length} pontos</strong><strong>{chargers.length} carregadores</strong><strong>Ativo</strong><strong>{item.contractCode}</strong></div></div></section><nav className="entity-tabs"><a href="#est-summary">Resumo</a><a className="is-active" href="#est-points">Pontos</a><a href="#est-operation">Operacao</a></nav><section id="est-points" className="surface panel sems-list-page"><SectionHeader title="Pontos do estabelecimento" subtitle="Locais fisicos entregues e administrados pela GoodWe." action={<a className="sems-primary-action" href={`#/mvp/new-location?est=${item.id}`}>Cadastrar novo ponto</a>} /><div className="network-location-grid">{locations.map((location) => <article className="network-location-card" key={location.id}><img className="network-card-cover" src={assets.plant} alt={location.name} /><div className="network-card-body"><div className="network-card-title"><div><h3>{location.name}</h3><p>{location.city}/{location.state}</p></div><Badge value={location.status === "Ativo" ? "available" : "offline"} /></div><p className="network-card-address">{location.address}, {location.number}</p><div className="network-card-stats"><span><strong>{chargers.filter((charger) => charger.locationId === location.id).length}</strong> carregadores</span></div><a className="ghost-button" href={`#/mvp/location?est=${item.id}&loc=${location.id}`}>Abrir ponto</a></div></article>)}</div></section></>;
}

function LocationsPage({ establishmentId }: { establishmentId?: string }) {
  const { state } = useAdminState();
  const locations = establishmentId ? state.locations.filter((item) => item.establishmentId === establishmentId) : state.locations;
  return <section className="surface panel sems-list-page" data-testid="establishment-locations-panel">
    <SectionHeader title={establishmentId ? "Meus locais" : "Pontos de Recarga"} subtitle={establishmentId ? "Locais atribuidos pela GoodWe para monitoramento operacional." : "Mapa e blocos de todos os locais fisicos da rede."} />
    <div className="network-view-tabs"><span className="is-active">Blocos</span><a href="#/mvp/overview">Mapa</a></div>
    <div className="network-location-grid">{locations.map((item) => {
      const chargers = state.chargers.filter((charger) => charger.locationId === item.id);
      return <article className="network-location-card" key={item.id}><img className="network-card-cover" src={assets.plant} alt={item.name} /><div className="network-card-body"><div className="network-card-title"><div><h3>{item.name}</h3><p>{item.city}/{item.state}</p></div><Badge value={item.status === "Ativo" ? "available" : "offline"} /></div><p className="network-card-address">{item.address}, {item.number}</p><div className="network-card-stats"><span><strong>{chargers.length}</strong> carregadores</span><span><strong>{chargers.filter((charger) => charger.status === "available").length}</strong> disponiveis</span><span><strong>{chargers.filter((charger) => charger.status === "charging").length}</strong> em uso</span><span><strong>{chargers.filter((charger) => charger.status === "offline").length}</strong> offline</span></div><a className="ghost-button" href={`#/mvp/location?est=${item.establishmentId}&loc=${item.id}`}>{establishmentId ? "Abrir monitoramento" : "Abrir ponto"}</a></div></article>;
    })}</div>
  </section>;
}

function NewLocationPage({ establishmentId }: { establishmentId: string }) {
  const { createLocation } = useAdminState();
  const navigate = useNavigate();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = createLocation({ establishmentId, name: String(data.get("name")), address: String(data.get("address")), number: String(data.get("number")), city: String(data.get("city")), state: String(data.get("state")), zipCode: String(data.get("zipCode")) });
    navigate(`/mvp/location?est=${establishmentId}&loc=${id}`);
  }
  return <section className="surface panel entity-form-page"><SectionHeader title="Cadastrar novo ponto" subtitle="O endereco sera usado na visao mundial da rede." /><form className="entity-form" data-form="create-location" onSubmit={submit}><fieldset><legend>1. Identificacao</legend><div className="form-section-grid"><label>Nome do ponto<input name="name" required /></label></div></fieldset><fieldset><legend>2. Localizacao</legend><div className="form-section-grid"><label>Endereco<input name="address" required /></label><label>Numero<input name="number" required /></label><label>CEP<input name="zipCode" required /></label><label>Cidade<input name="city" required /></label><label>Estado<input name="state" defaultValue="SP" required /></label></div></fieldset><fieldset><legend>3. Operacao</legend><div className="form-section-grid"><label>Horario de funcionamento<input defaultValue="24 horas" /></label><label>Status<select><option>Ativo</option><option>Inativo</option></select></label></div></fieldset><div className="form-actions"><a className="ghost-button" href={`#/mvp/establishment?est=${establishmentId}`}>Cancelar</a><button type="submit">Salvar ponto</button></div></form></section>;
}

function ChargerCards({ items }: { items: Charger[] }) {
  return <div className="charger-visual-grid">{items.map((charger) => <article key={charger.id} className="charger-visual-card"><img src={assets.charger} alt={charger.model} /><div><div className="network-card-title"><h3>{charger.internalId || charger.id}</h3><Badge value={charger.status} /></div><p>{charger.model} · {charger.powerKw} kW</p><p>{charger.status === "charging" ? "Sessao ativa" : "Sem sessao ativa"}</p><div className="network-card-meta"><span>Health 92/100</span><span>{number(charger.todayEnergyKwh)} kWh hoje</span></div><a className="ghost-button" href={`#/mvp/charger?est=${charger.establishmentId}&loc=${charger.locationId}&charger=${charger.id}`}>Ver equipamento</a></div></article>)}</div>;
}

function LocationDetail({ establishmentId, locationId, canManage }: { establishmentId: string; locationId: string; canManage: boolean }) {
  const { state, createCharger } = useAdminState();
  const [formOpen, setFormOpen] = useState(false);
  const location = state.locations.find((item) => item.id === locationId && item.establishmentId === establishmentId);
  if (!location) return <Navigate to="/mvp/overview" replace />;
  const chargers = state.chargers.filter((item) => item.locationId === location.id);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    createCharger({ establishmentId, locationId, identifier: String(data.get("identifier")), internalId: String(data.get("internalId")), serial: String(data.get("serial")), model: String(data.get("model")), powerKw: Number(data.get("powerKw")), installationDate: String(data.get("installationDate")) });
    event.currentTarget.reset();
    setFormOpen(false);
  }
  return <><section className="entity-hero location-hero"><img src={assets.plant} alt={location.name} /><div><span>PONTO DE RECARGA</span><h2>{location.name}</h2><p>{location.address}, {location.number} · {location.city}/{location.state}</p><div className="entity-hero-stats"><strong>{chargers.length} carregadores</strong><strong>{chargers.filter((item) => item.status === "charging").length} sessoes ativas</strong><strong>Energia Alerta</strong><strong>Health 92/100</strong></div></div></section><nav className="entity-tabs"><a className="is-active" href="#point-summary">Resumo</a><a href="#point-chargers">Carregadores</a><a href="#point-operation">Operacao</a><a href="#point-energy">Energia</a></nav><section id="point-summary" className="surface panel"><div className="kpi-grid four-cols"><KpiCard label="Carregadores" value={chargers.length} help="instalados" /><KpiCard label="Disponiveis" value={chargers.filter((item) => item.status === "available").length} help="prontos para uso" accent="good" /><KpiCard label="Em uso" value={chargers.filter((item) => item.status === "charging").length} help="agora" accent="danger" /><KpiCard label="Offline" value={chargers.filter((item) => item.status === "offline").length} help="indisponiveis" /></div></section><section id="point-chargers" className="surface panel sems-list-page"><SectionHeader title="Carregadores instalados" subtitle="Equipamentos que pertencem atualmente a este ponto." action={canManage ? <button className="sems-primary-action" type="button" onClick={() => setFormOpen((value) => !value)}>Cadastro de carregador</button> : undefined} /><ChargerCards items={chargers} />{formOpen && canManage ? <form className="entity-form" data-form="create-charger" onSubmit={submit}><fieldset><legend>Identificacao</legend><div className="form-section-grid"><label>Nome do equipamento<input name="identifier" required /></label><label>ID interno<input name="internalId" required /></label><label>Numero de serie<input name="serial" required /></label><label>Modelo<input name="model" required /></label></div></fieldset><fieldset><legend>Caracteristicas tecnicas</legend><div className="form-section-grid"><label>Potencia nominal (kW)<input name="powerKw" type="number" min="1" required /></label><label>Data de instalacao<input name="installationDate" type="date" required /></label></div></fieldset><div className="form-actions"><button type="submit">Cadastrar carregador</button></div></form> : null}</section><section id="point-operation" className="surface panel"><div className="detail-grid"><article><h3>Operacao</h3><p>{chargers.filter((item) => item.status === "charging").length} sessoes em andamento</p></article><article><h3>Energia entregue</h3><p>{number(chargers.reduce((sum, item) => sum + item.todayEnergyKwh, 0))} kWh</p></article></div></section></>;
}

function ContractPage({ establishmentId }: { establishmentId: string }) {
  const { state } = useAdminState();
  const establishment = state.establishments.find((item) => item.id === establishmentId);
  const shareBps = state.tariffPolicies.find((item) => item.establishmentId === establishmentId && item.status === "ACTIVE")?.platformShareBps;
  return <><Breadcrumbs items={[{ label: "Business" }, { label: "Contratos" }]} /><section className="surface panel enterprise-page"><SectionHeader title="Meu contrato" subtitle="Condicoes comerciais vigentes para sua operacao." /><div className="contract-grid"><article className="contract-card"><header><div><span>{establishment?.contractCode}</span><h3>ChargeGrid Performance</h3><p>{establishment?.name}</p></div><StatusPill value="Ativo" /></header><dl><div><dt>Modelo</dt><dd>Revenue share</dd></div><div><dt>Renovacao</dt><dd>15/01/2027</dd></div><div><dt>SLA</dt><dd>8 horas</dd></div><div><dt>Participacao</dt><dd>{shareBps === undefined ? "Nao parametrizada" : `${shareBps / 100}%`}</dd></div></dl><a className="ghost-button" href={`#/mvp/pricing?est=${establishmentId}`}>Ver politica vigente</a></article></div></section></>;
}

function SupportPage({ establishmentId }: { establishmentId?: string }) {
  const { state, createTicket } = useAdminState();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const tickets = establishmentId ? state.supportTickets.filter((item) => item.establishmentId === establishmentId) : state.supportTickets;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const id = createTicket(establishmentId ?? "est-fiap", String(data.get("title")), String(data.get("description")));
    navigate(`/mvp/ticket?ticket=${id}`);
  }
  return <section className="surface panel enterprise-page"><SectionHeader title="Central de suporte" subtitle="Chamados comerciais e tecnicos da rede." action={<button className="sems-primary-action" type="button" onClick={() => setOpen((value) => !value)}>Abrir chamado</button>} />{open ? <form className="simulator-grid" data-form="create-support-ticket" onSubmit={submit}><label>Titulo<input name="title" required /></label><label>Descricao<textarea name="description" required /></label><button type="submit">Criar chamado</button></form> : null}<div className="support-grid">{tickets.map((ticket) => <article key={ticket.id} className="support-card"><header><div><span>{ticket.code}</span><h3>{ticket.title}</h3></div><StatusPill value={ticket.status} /></header><p>{ticket.description}</p><a className="ghost-button" href={`#/mvp/ticket?ticket=${ticket.id}`}>Abrir chamado</a></article>)}</div></section>;
}

function TicketPage({ ticketId }: { ticketId: string }) {
  const { state } = useAdminState();
  const ticket = state.supportTickets.find((item) => item.id === ticketId);
  if (!ticket) return <p>Chamado nao encontrado.</p>;
  return <section className="surface panel enterprise-page"><SectionHeader eyebrow={ticket.code} title={ticket.title} subtitle={ticket.description} /><div className="detail-grid"><article><h3>Status</h3><p><Badge value={ticket.status} /></p></article><article><h3>Criado em</h3><p>{new Date(ticket.createdAt).toLocaleString("pt-BR")}</p></article></div></section>;
}

function AuditPage() {
  const { state } = useAdminState();
  return <section className="surface panel enterprise-page"><SectionHeader eyebrow="Governanca" title="Auditoria" subtitle="Rastro das operacoes administrativas." /><div className="audit-list">{state.audit.slice().reverse().map((item) => <article key={item.id}><span>{new Date(item.at).toLocaleString("pt-BR")}</span><strong>{item.summary}</strong><p>Operacao registrada no escopo GoodWe.</p></article>)}</div></section>;
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
  const requiredCapability = getAdminRouteCapability(tab);
  if (requiredCapability && !hasAdminCapability(account, requiredCapability)) return <AccessDeniedPage />;

  const establishmentId = account.profile === "ESTABELECIMENTO" ? account.establishmentId! : query.get("est") ?? "";
  if (account.profile === "ESTABELECIMENTO" && query.get("est") && query.get("est") !== account.establishmentId) return <Navigate to="/mvp/overview" replace />;
  const locationId = query.get("loc") ?? "";
  if (account.profile === "ESTABELECIMENTO" && locationId) {
    const location = state.locations.find((item) => item.id === locationId);
    if (!location || location.establishmentId !== account.establishmentId) return <Navigate to="/mvp/overview" replace />;
  }

  const content = (() => {
    switch (tab) {
      case "overview": return <Overview establishmentId={establishmentId || undefined} />;
      case "clients": return <ClientsPage />;
      case "new-client": return <NewClientPage />;
      case "client": return <ClientDetail client={state.clients.find((item) => item.id === query.get("client"))} />;
      case "establishments": return <EstablishmentsPage />;
      case "establishment": return <EstablishmentDetail establishmentId={establishmentId} />;
      case "plants": return <PlantsPortfolioPage />;
      case "plant": return <PlantDetailPage plantId={query.get("plant") ?? ""} />;
      case "plant-onboarding": return <PlantOnboardingPage />;
      case "locations": return <LocationsPage establishmentId={establishmentId || undefined} />;
      case "new-location": return <NewLocationPage establishmentId={establishmentId} />;
      case "location": return <LocationDetail establishmentId={establishmentId} locationId={locationId} canManage={account.profile === "GOODWE"} />;
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
      case "recommendations": return <RecommendationsPage establishmentId={establishmentId || undefined} />;
      case "reports": return <ReportsOperationsPage establishmentId={establishmentId || undefined} />;
      case "access": return <AccessManagementPage />;
      case "settings": return <AccessManagementPage />;
      case "contract": return <ContractPage establishmentId={establishmentId} />;
      case "support": return <SupportPage establishmentId={account.profile === "ESTABELECIMENTO" ? establishmentId : undefined} />;
      case "ticket": return <TicketPage ticketId={query.get("ticket") ?? ""} />;
      case "audit": return <AuditPage />;
      default: return <GenericPage tab={tab} />;
    }
  })();

  return content;
}
