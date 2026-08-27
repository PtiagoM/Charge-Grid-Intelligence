import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAdminState } from "../../app/AdminState";
import { KpiCard, SectionHeader, number } from "../../components/AdminUi";
import type { GoodWePlant, PlantOnboardingIssue } from "../../domain/admin";
import { validatePlantOnboarding } from "../../domain/plantOnboarding";
import { assets } from "../../constants/assets";
import { mockGoodWePlantCatalogRepository } from "../../services/goodwePlantCatalogRepository";
import { accessibleEstablishmentIds } from "../../domain/accessOperations";
import { COMMERCIAL_PLANT_CONTRACTS } from "../../fixtures/commercialGovernance";
import { hasAdminCapability } from "../../domain/adminCapabilities";

function usePlantCatalog() {
  const [plants, setPlants] = useState<GoodWePlant[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    mockGoodWePlantCatalogRepository.list().then((result) => {
      if (active) setPlants(result);
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);
  return { plants, loading };
}

function technicalState(plant: GoodWePlant, linked: boolean) {
  if (linked) return { label: "Vinculada", tone: "good" };
  if (plant.authorization === "DENIED") return { label: "Sem autorização", tone: "danger" };
  if (plant.catalogState !== "READY") return { label: "Dados incompletos", tone: "warn" };
  if (!plant.evChargers.length) return { label: "Sem EV", tone: "warn" };
  return { label: "Disponível", tone: "info" };
}

function PlantState({ plant, linked }: { plant: GoodWePlant; linked: boolean }) {
  const status = technicalState(plant, linked);
  return <span className={`plant-state tone-${status.tone}`}>{status.label}</span>;
}

function PlantBreadcrumbs({ current }: { current: string }) {
  return <nav className="enterprise-breadcrumb" aria-label="Navegação estrutural"><span><a href="#/mvp/plants">Plantas</a><i>/</i></span><span><strong>{current}</strong></span></nav>;
}

export function PlantsPortfolioPage() {
  const { state, account } = useAdminState();
  const { plants, loading } = usePlantCatalog();
  const [filterOpen, setFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchDraft, setSearchDraft] = useState({ identity: "", address: "", email: "" });
  const [search, setSearch] = useState(searchDraft);
  const [plantType, setPlantType] = useState("ALL");
  const [organization, setOrganization] = useState("ALL");
  const [minimumPower, setMinimumPower] = useState("");
  const [maximumPower, setMaximumPower] = useState("");
  const [source, setSource] = useState("ALL");
  const [commercialLayer, setCommercialLayer] = useState("ALL");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [favorites, setFavorites] = useState(() => new Set<string>());
  const canViewCommercial = Boolean(account && hasAdminCapability(account, "commercial:read"));
  const linkedIds = useMemo(() => new Set(canViewCommercial ? state.commercialPlants.map((link) => link.goodwePlantId) : []), [canViewCommercial, state.commercialPlants]);
  const actorScopeSet = new Set(accessibleEstablishmentIds(state, account));
  const mustApplyCommercialScope = account?.role === "GOODWE_PORTFOLIO_MANAGER" || (account?.profile === "ESTABELECIMENTO" && Boolean(account.role));
  const scopedPlants = plants.filter((plant) => {
    if (plant.authorization !== "AUTHORIZED") return false;
    if (!mustApplyCommercialScope) return true;
    const linkedScope = state.commercialPlants.find((item) => item.goodwePlantId === plant.id)?.establishmentId;
    const contractScopes = COMMERCIAL_PLANT_CONTRACTS.filter((item) => item.goodwePlantId === plant.id).map((item) => item.establishmentId);
    const plantScopes = [...contractScopes, ...(linkedScope ? [linkedScope] : [])];
    return plantScopes.some((scopeId) => actorScopeSet.has(scopeId));
  });

  const plantStatus = (plant: GoodWePlant) => {
    if (plant.catalogState === "OFFLINE") return { key: "OFFLINE", label: "Offline", tone: "muted", icon: "N" };
    if (plant.catalogState === "EMPTY") return { key: "CONSTRUCTION", label: "Em construção", tone: "info", icon: "•••" };
    if (!plant.lastSyncAt) return { key: "WAITING", label: "Aguardando", tone: "warn", icon: "◷" };
    return { key: "OPERATING", label: "Em operação", tone: "good", icon: "✓" };
  };

  const organizations = [...new Set(scopedPlants.map((plant) => plant.organization))];
  const visiblePlants = scopedPlants.filter((plant) => {
    const status = plantStatus(plant).key;
    const identity = `${plant.name} ${plant.id} ${plant.evChargers.map((charger) => charger.serial).join(" ")}`.toLowerCase();
    const address = `${plant.address} ${plant.number} ${plant.city} ${plant.state}`.toLowerCase();
    const type = plant.batteryCapacityKwh > 0 ? (plant.capacityKwp >= 100 ? "COMMERCIAL_BATTERY" : "RESIDENTIAL_BATTERY") : (plant.capacityKwp >= 100 ? "COMMERCIAL" : "RESIDENTIAL");
    const electricalSource = plant.organization === "GoodWe Brasil" ? "MANAGED" : "SHARED";
    const matchesStatus = statusFilter === "ALL" || statusFilter === status || (statusFilter === "CREATED_MONTH" && plant.catalogState === "EMPTY");
    return matchesStatus
      && identity.includes(search.identity.trim().toLowerCase())
      && address.includes(search.address.trim().toLowerCase())
      && plant.organization.toLowerCase().includes(search.email.trim().toLowerCase())
      && (plantType === "ALL" || plantType === type)
      && (organization === "ALL" || organization === plant.organization)
      && (!minimumPower || plant.capacityKwp >= Number(minimumPower))
      && (!maximumPower || plant.capacityKwp <= Number(maximumPower))
      && (source === "ALL" || source === electricalSource)
      && (commercialLayer === "ALL" || (commercialLayer === "CHARGEGRID") === linkedIds.has(plant.id))
      && (!favoriteOnly || favorites.has(plant.id));
  });
  const statusCount = (key: string) => scopedPlants.filter((plant) => plantStatus(plant).key === key).length;

  const resetAllFilters = () => {
    const emptySearch = { identity: "", address: "", email: "" };
    setSearchDraft(emptySearch);
    setSearch(emptySearch);
    setStatusFilter("ALL");
    setPlantType("ALL");
    setOrganization("ALL");
    setMinimumPower("");
    setMaximumPower("");
    setSource("ALL");
    setCommercialLayer("ALL");
    setFavoriteOnly(false);
  };

  const toggleFavorite = (plantId: string) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(plantId)) next.delete(plantId);
      else next.add(plantId);
      return next;
    });
  };

  return <section className="surface panel plant-portfolio sems-reference-list sems-plants-list" data-testid="plants-portfolio">
    <form className="sems-plants-toolbar" onSubmit={(event) => { event.preventDefault(); setSearch(searchDraft); }}>
      <button className={filterOpen ? "sems-filter-button is-active" : "sems-filter-button"} type="button" onClick={() => setFilterOpen((open) => !open)}><span aria-hidden="true">▽</span> Filtro</button>
      <label><span className="sr-only">Nome da planta, dispositivo ou número de série</span><input aria-label="Buscar planta ou dispositivo" value={searchDraft.identity} onChange={(event) => setSearchDraft({ ...searchDraft, identity: event.target.value })} placeholder="Nome da planta, nome ou SN do dispositivo" /></label>
      <label><span className="sr-only">Endereço da usina</span><input aria-label="Buscar endereço da usina" value={searchDraft.address} onChange={(event) => setSearchDraft({ ...searchDraft, address: event.target.value })} placeholder="⌖  Endereço da usina" /></label>
      <label><span className="sr-only">Email</span><input aria-label="Buscar email" value={searchDraft.email} onChange={(event) => setSearchDraft({ ...searchDraft, email: event.target.value })} placeholder="✉  Email" /></label>
      <button className="sems-plants-search" type="submit" aria-label="Pesquisar">⌕</button>
      <button className="sems-icon-action" type="button" aria-label="Redefinir busca e filtros" onClick={resetAllFilters}>↻</button>
      <button className="sems-plants-create" type="button"><span>＋</span> Nova usina</button>
    </form>

    {filterOpen ? <aside className="sems-plants-filter-panel" aria-label="Filtros avançados">
      <header><strong>Filtro</strong><div><button type="button" onClick={resetAllFilters}>Redefinir</button><button type="button" onClick={() => setFilterOpen(false)}>Confirmar</button></div></header>
      <div className="sems-plants-filter-body">
        <fieldset><legend>Tipo de usina</legend><div className="sems-filter-chips">{([
          ["RESIDENTIAL", "Usina residencial"], ["RESIDENTIAL_BATTERY", "Usina residencial com baterias"], ["COMMERCIAL", "Usina C&I"], ["COMMERCIAL_BATTERY", "Usina C&I com Baterias"]
        ] as const).map(([value, label]) => <button key={value} className={plantType === value ? "is-active" : ""} type="button" onClick={() => setPlantType(plantType === value ? "ALL" : value)}>{label}</button>)}</div></fieldset>
        <label><span>Organização</span><select value={organization} onChange={(event) => setOrganization(event.target.value)}><option value="ALL">Todas as organizações</option>{organizations.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <fieldset><legend>Potência nominal</legend><div className="sems-power-range"><label><span className="sr-only">Potência mínima</span><input inputMode="decimal" value={minimumPower} onChange={(event) => setMinimumPower(event.target.value)} placeholder="Min." /><b>kW</b></label><i>–</i><label><span className="sr-only">Potência máxima</span><input inputMode="decimal" value={maximumPower} onChange={(event) => setMaximumPower(event.target.value)} placeholder="Máx." /><b>kW</b></label></div></fieldset>
        <fieldset><legend>Fonte da usina elétrica</legend><div className="sems-filter-chips"><button className={source === "MANAGED" ? "is-active" : ""} type="button" onClick={() => setSource(source === "MANAGED" ? "ALL" : "MANAGED")}>Gerenciar usina elétrica</button><button className={source === "SHARED" ? "is-active" : ""} type="button" onClick={() => setSource(source === "SHARED" ? "ALL" : "SHARED")}>Compartilhar usina</button></div></fieldset>
        <fieldset><legend>Camada comercial</legend><div className="sems-filter-chips"><button className={commercialLayer === "CHARGEGRID" ? "is-active" : ""} type="button" onClick={() => setCommercialLayer(commercialLayer === "CHARGEGRID" ? "ALL" : "CHARGEGRID")}>Planta ChargeGrid</button><button className={commercialLayer === "SEMS" ? "is-active" : ""} type="button" onClick={() => setCommercialLayer(commercialLayer === "SEMS" ? "ALL" : "SEMS")}>Planta SEMS+</button></div></fieldset>
        <fieldset><legend>Status de favorito</legend><div className="sems-filter-chips"><button className={favoriteOnly ? "is-active" : ""} type="button" onClick={() => setFavoriteOnly((active) => !active)}>Favoritado</button></div></fieldset>
      </div>
    </aside> : null}

    <nav className="sems-reference-status-tabs sems-plants-status-tabs" aria-label="Status das usinas">{[
      ["ALL", "Todos", scopedPlants.length, ""],
      ["CREATED_MONTH", "Criados este mês", scopedPlants.filter((plant) => plant.catalogState === "EMPTY").length, ""],
      ["OPERATING", "Em operação", statusCount("OPERATING"), "✓"],
      ["WAITING", "Aguardando", statusCount("WAITING"), "◷"],
      ["OFFLINE", "Offline", statusCount("OFFLINE"), "N"],
      ["FAILURE", "Falha", statusCount("FAILURE"), "!"],
      ["CONSTRUCTION", "Em construção", statusCount("CONSTRUCTION"), "•••"]
    ].map(([value, label, count, icon]) => <button key={String(value)} className={statusFilter === value ? "is-active" : ""} type="button" onClick={() => setStatusFilter(String(value))}>{icon ? <i className={`status-icon status-${String(value).toLowerCase()}`}>{icon}</i> : null}{label} <b>({count})</b></button>)}</nav>

    {loading ? <div className="plant-loading" role="status">Consultando catálogo GoodWe…</div> : null}
    {!loading && !visiblePlants.length ? <div className="empty-state">Nenhuma planta corresponde aos filtros.</div> : null}
    <div className="table-wrap sems-table-wrap sems-plants-table-wrap"><table className="data-table sems-reference-table sems-plants-table"><thead><tr><th>Informações da usina</th><th>Status da usina</th><th>Geração de hoje<br />(kWh)</th><th>Geração total<br />(kWh)</th><th>Rendimento Específico<br />(kWh/kWp)</th><th>Potência FV (kW)</th><th>Observação</th><th>Operação</th><th aria-label="Configuração">⬡</th></tr></thead><tbody>{visiblePlants.map((plant) => {
      const link = canViewCommercial ? state.commercialPlants.find((candidate) => candidate.goodwePlantId === plant.id) : undefined;
      const status = plantStatus(plant);
      const todayGeneration = plant.catalogState === "READY" ? plant.capacityKwp * 0.02065 : 0;
      const totalGeneration = plant.catalogState === "READY" ? plant.capacityKwp * 39.4945 : 0;
      const specificYield = plant.capacityKwp ? todayGeneration / plant.capacityKwp * 15 : 0;
      return <tr key={plant.id} data-testid={`plant-card-${plant.id}`}><td><div className="sems-plant-cell"><img src={assets.plant} alt="" /><div><strong>{plant.name}{link ? <em>ChargeGrid</em> : null}</strong><span>{plant.address}, {plant.number}</span><small>▣&nbsp; {number(plant.capacityKwp)} kW</small></div></div></td><td><span className={`sems-plant-operating-state tone-${status.tone}`}><i>{status.icon}</i>{status.label}</span></td><td>{number(todayGeneration)}</td><td>{number(totalGeneration)}</td><td>{number(specificYield)}</td><td>{plant.catalogState === "READY" ? number(plant.capacityKwp) : "--"}</td><td>{link ? "Planta comercial" : "--"}</td><td><button className={favorites.has(plant.id) ? "sems-plant-favorite is-active" : "sems-plant-favorite"} type="button" aria-label={favorites.has(plant.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"} onClick={() => toggleFavorite(plant.id)}>☆</button><a className="sems-device-menu" href={`#/mvp/plant?plant=${plant.id}`} aria-label={`Abrir ${plant.name}`}>•••</a></td><td /></tr>;
    })}</tbody></table></div>
    <footer className="sems-device-pagination"><button type="button" disabled aria-label="Página anterior">‹</button><strong>1</strong><button type="button" disabled aria-label="Próxima página">›</button><select aria-label="Itens por página" defaultValue="15"><option value="15">15 / página</option><option value="30">30 / página</option></select></footer>
  </section>;
}

export function PlantDetailPage({ plantId }: { plantId: string }) {
  const { state, account } = useAdminState();
  const { plants, loading } = usePlantCatalog();
  const plant = plants.find((candidate) => candidate.id === plantId);
  if (loading) return <div className="plant-loading" role="status">Consultando detalhes técnicos…</div>;
  if (!plant) return <section className="surface panel"><SectionHeader title="Planta não encontrada" subtitle="O identificador não existe no catálogo autorizado." /><a className="ghost-button" href="#/mvp/plants">Voltar ao portfólio</a></section>;

  const link = account?.role ? state.commercialPlants.find((candidate) => candidate.goodwePlantId === plant.id) : undefined;
  const establishment = state.establishments.find((item) => item.id === link?.establishmentId);
  const location = state.locations.find((item) => item.id === link?.locationId);
  const status = technicalState(plant, Boolean(link));
  const actorScopeSet = new Set(accessibleEstablishmentIds(state, account));
  const activationContract = COMMERCIAL_PLANT_CONTRACTS.find((item) => item.goodwePlantId === plant.id && actorScopeSet.has(item.establishmentId));
  const authorizedContract = activationContract?.status === "AUTHORIZED" ? activationContract : undefined;
  const plantScopeIds = [link?.establishmentId, ...COMMERCIAL_PLANT_CONTRACTS.filter((item) => item.goodwePlantId === plant.id).map((item) => item.establishmentId)].filter(Boolean) as string[];
  if (!plantScopeIds.some((scope) => actorScopeSet.has(scope))) return <section className="surface panel"><SectionHeader title="Planta fora do escopo" subtitle="A usina não pertence às plantas técnicas ou comerciais autorizadas para esta sessão." /><a className="ghost-button" href="#/mvp/plants">Voltar à lista de usinas</a></section>;
  const canStartActivation = Boolean(account && (hasAdminCapability(account, "network:onboard") || hasAdminCapability(account, "commercial:self-service")));
  const canViewCommercial = Boolean(account?.role && link);

  return <>
    <PlantBreadcrumbs current={plant.name} />
    <section className="surface plant-detail-hero" data-testid="plant-detail">
      <img src={assets.plant} alt="" />
      <div><span className="eyebrow">Planta técnica GoodWe</span><h2>{plant.name}</h2><p>{plant.address}, {plant.number} · {plant.city}/{plant.state}</p><div className="plant-detail-meta"><span className={`plant-state tone-${status.tone}`}>{status.label}</span><span>{plant.organization}</span><span>{plant.timezone}</span></div></div>
      {!link && authorizedContract && canStartActivation && plant.authorization === "AUTHORIZED" && plant.catalogState === "READY" && plant.evChargers.length ? <a className="sems-primary-action" href={`#/mvp/plant-onboarding?contract=${authorizedContract.id}`}>Iniciar vínculo</a> : null}
    </section>
    <nav className="entity-tabs"><a className="is-active" href="#plant-summary">Resumo</a><a href="#plant-equipment">Equipamentos detectados</a>{account?.role ? <a href="#plant-commercial">Perfil comercial</a> : null}</nav>
    <section id="plant-summary" className="surface panel"><SectionHeader title="Dados técnicos sincronizados" subtitle="Campos somente leitura, mantidos pela integração GoodWe." /><div className="kpi-grid four-cols"><KpiCard label="Capacidade fotovoltaica" value={`${number(plant.capacityKwp)} kWp`} /><KpiCard label="Bateria" value={`${number(plant.batteryCapacityKwh)} kWh`} /><KpiCard label="Carregadores EV" value={plant.evChargers.length} /><KpiCard label="Estado do catálogo" value={plant.catalogState} accent={plant.catalogState === "READY" ? "good" : "warn"} /></div><div className="technical-readonly-grid"><article><span>ID GoodWe</span><strong>{plant.id}</strong></article><article><span>Organização</span><strong>{plant.organization}</strong></article><article><span>Última sincronização</span><strong>{plant.lastSyncAt ? new Date(plant.lastSyncAt).toLocaleString("pt-BR") : "Sem dados"}</strong></article><article><span>Autorização</span><strong>{plant.authorization === "AUTHORIZED" ? "Autorizada" : "Negada"}</strong></article></div></section>
    <section id="plant-equipment" className="surface panel"><SectionHeader title="Carregadores detectados" subtitle="Inventário técnico importado; nenhum número de série é digitado no ChargeGrid." />{plant.evChargers.length ? <div className="detected-charger-list">{plant.evChargers.map((charger) => <article key={charger.id}><div><span>{charger.id}</span><h3>{charger.model}</h3><p>Série {charger.serial}</p></div><strong>{charger.powerKw} kW</strong><span className={`plant-state tone-${charger.technicalStatus === "ONLINE" ? "good" : "danger"}`}>{charger.technicalStatus === "ONLINE" ? "Online" : "Offline"}</span></article>)}</div> : <div className="empty-state">Nenhum carregador EV detectado. A publicação comercial permanece bloqueada.</div>}</section>
    {account?.role ? <section id="plant-commercial" className="surface panel"><SectionHeader title="Perfil comercial" subtitle={canViewCommercial ? "Vínculo publicado no ChargeGrid." : "Nenhum vínculo comercial foi publicado."} />{canViewCommercial ? <div className="commercial-profile-grid"><article><span>Nome no ChargeGrid</span><strong>{link?.commercialName}</strong></article><article><span>Estabelecimento</span><strong>{establishment?.name}</strong></article><article><span>Ponto projetado</span><strong>{location?.name}</strong></article><article><span>Acesso</span><strong>{link?.accessPolicy}</strong></article><article><span>Funcionamento</span><strong>{link?.alwaysOpen ? "24 horas" : `${link?.opensAt}–${link?.closesAt}`}</strong></article><article><span>Publicado em</span><strong>{link?.publishedAt ? new Date(link.publishedAt).toLocaleString("pt-BR") : "—"}</strong></article></div> : <PlantPublicationBlocker plant={plant} contractId={authorizedContract?.id} />}</section> : null}
  </>;
}

function PlantPublicationBlocker({ plant, contractId }: { plant: GoodWePlant; contractId?: string }) {
  const messages = [
    !contractId ? "Nenhum contrato ChargeGrid autorizado foi encontrado para esta planta." : "",
    plant.authorization !== "AUTHORIZED" ? "A organização atual não está autorizada." : "",
    plant.catalogState !== "READY" ? "Os dados técnicos ainda não estão prontos." : "",
    !plant.evChargers.length ? "Nenhum carregador EV foi detectado." : ""
  ].filter(Boolean);
  if (!messages.length) return <div className="plant-ready-callout"><strong>Planta apta para vínculo</strong><p>O contrato está autorizado; configure somente o perfil comercial.</p><a className="sems-primary-action" href={`#/mvp/plant-onboarding?contract=${contractId}`}>Configurar vínculo</a></div>;
  return <div className="plant-blocker"><strong>Publicação bloqueada</strong><ul>{messages.map((message) => <li key={message}>{message}</li>)}</ul></div>;
}

export function PlantOnboardingPage() {
  const { state, account, updatePlantOnboardingDraft, resetPlantOnboardingDraft, publishPlantOnboarding } = useAdminState();
  const { plants, loading } = usePlantCatalog();
  const [query] = useSearchParams();
  const navigate = useNavigate();
  const draft = state.plantOnboardingDraft;
  const queryPlantId = query.get("plant") ?? "";
  const queryContractId = query.get("contract") ?? "";
  const actorScopeSet = new Set(accessibleEstablishmentIds(state, account));
  const activationContract = COMMERCIAL_PLANT_CONTRACTS.find((item) => item.id === queryContractId && actorScopeSet.has(item.establishmentId));
  const isEstablishmentActivation = account?.profile === "ESTABELECIMENTO";
  const requestedPlantId = activationContract?.goodwePlantId ?? queryPlantId;
  const [resumedDraft] = useState(Boolean(draft.updatedAt && draft.plantId && !requestedPlantId));
  const [step, setStep] = useState(requestedPlantId || draft.plantId ? 2 : 1);
  const [checkingPlantId, setCheckingPlantId] = useState("");
  const [inspectionIssues, setInspectionIssues] = useState<PlantOnboardingIssue[]>([]);
  const [publishIssues, setPublishIssues] = useState<PlantOnboardingIssue[]>([]);
  const linkedIds = useMemo(() => new Set(state.commercialPlants.map((link) => link.goodwePlantId)), [state.commercialPlants]);
  const selectedPlant = plants.find((plant) => plant.id === draft.plantId);
  const onboardingContract = activationContract ?? COMMERCIAL_PLANT_CONTRACTS.find((item) =>
    item.goodwePlantId === draft.plantId && item.status === "AUTHORIZED" && actorScopeSet.has(item.establishmentId)
  );

  useEffect(() => {
    if (!requestedPlantId || !plants.length || draft.plantId === requestedPlantId) return;
    const plant = plants.find((candidate) => candidate.id === requestedPlantId);
    if (!plant) return;
    updatePlantOnboardingDraft({
      plantId: plant.id,
      establishmentId: activationContract?.establishmentId ?? draft.establishmentId,
      commercialName: draft.commercialName || plant.name
    });
    setStep(2);
  }, [activationContract?.establishmentId, requestedPlantId, plants, draft.plantId, draft.establishmentId, draft.commercialName, updatePlantOnboardingDraft]);

  useEffect(() => {
    if (!onboardingContract || draft.establishmentId === onboardingContract.establishmentId) return;
    updatePlantOnboardingDraft({ establishmentId: onboardingContract.establishmentId });
  }, [draft.establishmentId, onboardingContract, updatePlantOnboardingDraft]);

  async function inspectPlant(plantId: string) {
    setCheckingPlantId(plantId);
    setInspectionIssues([]);
    const plant = await mockGoodWePlantCatalogRepository.inspect(plantId);
    const issues: PlantOnboardingIssue[] = [];
    if (!plant) issues.push({ code: "PLANT_NOT_FOUND", message: "A planta não foi encontrada no catálogo." });
    else {
      const contract = COMMERCIAL_PLANT_CONTRACTS.find((item) => item.goodwePlantId === plant.id && actorScopeSet.has(item.establishmentId));
      if (!contract) issues.push({ code: "CONTRACT_REQUIRED", message: "Nenhum contrato ChargeGrid autorizado para esta planta foi encontrado no seu escopo." });
      else if (contract.status !== "AUTHORIZED" && !linkedIds.has(plant.id)) issues.push({ code: "CONTRACT_NOT_AUTHORIZED", message: "O contrato existe, mas o código de ativação ainda não foi autorizado pelo consultor GoodWe." });
      if (plant.authorization !== "AUTHORIZED") issues.push({ code: "PLANT_NOT_AUTHORIZED", message: "Sua organização não possui autorização para esta planta." });
      if (plant.catalogState !== "READY") issues.push({ code: "PLANT_NOT_READY", message: "A planta ainda não possui dados técnicos prontos." });
      if (!plant.evChargers.length) issues.push({ code: "PLANT_WITHOUT_EV", message: "Nenhum carregador EV foi detectado." });
      if (linkedIds.has(plant.id)) issues.push({ code: "PLANT_ALREADY_LINKED", message: "Esta planta já possui perfil comercial publicado." });
    }
    setCheckingPlantId("");
    setInspectionIssues(issues);
    if (plant && !issues.length) {
      const contract = COMMERCIAL_PLANT_CONTRACTS.find((item) => item.goodwePlantId === plant.id && item.status === "AUTHORIZED" && actorScopeSet.has(item.establishmentId));
      updatePlantOnboardingDraft({ plantId: plant.id, establishmentId: contract?.establishmentId ?? "", commercialName: plant.name });
      setStep(2);
    }
  }

  function continueToReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPublishIssues([]);
    setStep(3);
  }

  function publish() {
    const plantId = draft.plantId;
    const result = publishPlantOnboarding();
    if (!result.ok) {
      setPublishIssues(result.issues);
      return;
    }
    navigate(account?.profile === "ESTABELECIMENTO" ? "/mvp/access?section=contracts" : `/mvp/plant?plant=${plantId}`);
  }

  const validationIssues = plants.length ? validatePlantOnboarding(state, plants, draft) : [];
  if (isEstablishmentActivation && (!activationContract || activationContract.status !== "AUTHORIZED" || activationContract.establishmentId !== account?.establishmentId)) {
    return <section className="surface panel contract-required-state" data-testid="contract-required-state"><SectionHeader eyebrow="Ativação comercial protegida" title="Valide o código do contrato antes de continuar" subtitle="A conta mantém suas plantas SEMS+ normais; somente a planta coberta pelo contrato pode receber a camada ChargeGrid." /><p>Abra Contratos e ativações na Gestão da organização e informe o código autorizado pelo consultor GoodWe.</p><a className="sems-primary-action" href="#/mvp/access">Voltar para contratos e ativações</a></section>;
  }
  return <>
    <PlantBreadcrumbs current="Vincular planta" />
    <section className="surface panel plant-onboarding" data-testid="plant-onboarding">
      <SectionHeader eyebrow="Onboarding comercial" title="Vincular planta GoodWe" subtitle={onboardingContract ? `Contrato ${onboardingContract.contractCode} validado; dados técnicos permanecem somente leitura.` : "Selecione uma planta técnica com contrato autorizado e publique apenas sua configuração comercial."} />
      {resumedDraft && draft.updatedAt && draft.plantId ? <div className="draft-resume"><strong>Rascunho retomado</strong><span>Última alteração em {new Date(draft.updatedAt).toLocaleString("pt-BR")}</span></div> : null}
      <ol className="onboarding-steps"><li className={step >= 1 ? "is-active" : ""}><b>1</b><span>{onboardingContract ? "Contrato validado" : "Planta e contrato"}</span></li><li className={step >= 2 ? "is-active" : ""}><b>2</b><span>Perfil comercial</span></li><li className={step >= 3 ? "is-active" : ""}><b>3</b><span>Revisão e publicação</span></li></ol>

      {step === 1 ? <div className="onboarding-step-panel"><header><h3>Escolha no catálogo autorizado</h3><p>A inspeção confirma autorização, sincronização e carregadores EV antes de avançar.</p></header>{loading ? <div className="plant-loading" role="status">Consultando catálogo GoodWe…</div> : <div className="plant-picker-grid">{plants.map((plant) => <article key={plant.id} className={linkedIds.has(plant.id) ? "is-linked" : ""}><div><PlantState plant={plant} linked={linkedIds.has(plant.id)} /><small>{plant.organization}</small><h4>{plant.name}</h4><p>{plant.city}/{plant.state} · {plant.evChargers.length} EV</p></div><button type="button" className="ghost-button" disabled={checkingPlantId === plant.id} onClick={() => inspectPlant(plant.id)}>{checkingPlantId === plant.id ? "Verificando…" : "Verificar planta"}</button></article>)}</div>}{inspectionIssues.length ? <IssueList issues={inspectionIssues} /> : null}</div> : null}

      {step === 2 && selectedPlant ? <form className="onboarding-step-panel" onSubmit={continueToReview}><header><h3>Configure o perfil comercial</h3><p>Os dados técnicos e contratuais são herdados da GoodWe e não podem ser editados.</p></header><div className="selected-technical-plant"><div><small>PLANTA SELECIONADA</small><strong>{selectedPlant.name}</strong><span>{selectedPlant.id}</span></div><div><small>EV DETECTADOS</small><strong>{selectedPlant.evChargers.length}</strong><span>{selectedPlant.evChargers.map((charger) => charger.serial).join(", ")}</span></div>{onboardingContract ? <div><small>CONTRATO</small><strong>{onboardingContract.contractCode}</strong><span>{onboardingContract.goodweConsultant}</span></div> : <button type="button" className="ghost-button" onClick={() => setStep(1)}>Trocar planta</button>}</div><div className="onboarding-form-grid"><label><span>Estabelecimento responsável</span><select data-testid="onboarding-establishment" required disabled value={draft.establishmentId}><option value="">Vinculado pelo contrato</option>{state.establishments.filter((item) => item.id === onboardingContract?.establishmentId).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>Nome comercial no ChargeGrid</span><input data-testid="onboarding-commercial-name" required value={draft.commercialName} onChange={(event) => updatePlantOnboardingDraft({ commercialName: event.target.value })} /></label><label><span>Política de acesso</span><select value={draft.accessPolicy} onChange={(event) => updatePlantOnboardingDraft({ accessPolicy: event.target.value as typeof draft.accessPolicy })}><option value="PUBLIC">Público</option><option value="PRIVATE">Privado</option><option value="MIXED">Misto</option></select></label><label className="onboarding-check"><input type="checkbox" checked={draft.alwaysOpen} onChange={(event) => updatePlantOnboardingDraft({ alwaysOpen: event.target.checked })} /><span>Funcionamento 24 horas</span></label>{!draft.alwaysOpen ? <><label><span>Abre às</span><input type="time" value={draft.opensAt} onChange={(event) => updatePlantOnboardingDraft({ opensAt: event.target.value })} /></label><label><span>Fecha às</span><input type="time" value={draft.closesAt} onChange={(event) => updatePlantOnboardingDraft({ closesAt: event.target.value })} /></label></> : null}</div><div className="onboarding-actions">{activationContract ? <a className="ghost-button" href="#/mvp/access">Voltar aos contratos</a> : <button type="button" className="ghost-button" onClick={() => setStep(1)}>Voltar</button>}<button type="submit" className="sems-primary-action">Revisar publicação</button></div></form> : null}

      {step === 3 && selectedPlant ? <div className="onboarding-step-panel" data-testid="onboarding-review"><header><h3>Revise antes de publicar</h3><p>A publicação cria o vínculo da planta e projeta os carregadores detectados como elegíveis, sem publicá-los automaticamente.</p></header><div className="onboarding-review-grid"><article><span>Planta técnica</span><strong>{selectedPlant.name}</strong><small>{selectedPlant.id}</small></article><article><span>Estabelecimento</span><strong>{state.establishments.find((item) => item.id === draft.establishmentId)?.name ?? "Não selecionado"}</strong></article><article><span>Perfil comercial</span><strong>{draft.commercialName || "Não informado"}</strong><small>{draft.accessPolicy} · {draft.alwaysOpen ? "24 horas" : `${draft.opensAt}–${draft.closesAt}`}</small></article><article><span>Importação técnica</span><strong>{selectedPlant.evChargers.length} carregadores elegíveis</strong><small>Séries e potências serão preservadas; cada publicação será individual.</small></article></div>{validationIssues.length ? <IssueList issues={validationIssues} /> : <div className="publication-ready"><strong>Pré-condições atendidas</strong><span>O vínculo da planta está pronto para publicação.</span></div>}{publishIssues.length ? <IssueList issues={publishIssues} /> : null}<div className="onboarding-actions"><button type="button" className="ghost-button" onClick={() => setStep(2)}>Editar configuração</button><button type="button" className="sems-primary-action" disabled={validationIssues.length > 0} onClick={publish} data-testid="publish-plant">Publicar vínculo</button></div></div> : null}

      <footer className="onboarding-footer"><span>O rascunho é salvo automaticamente neste ambiente.</span><button type="button" onClick={() => { resetPlantOnboardingDraft(); setStep(activationContract ? 2 : 1); setInspectionIssues([]); }}>Descartar rascunho</button></footer>
    </section>
  </>;
}

function IssueList({ issues }: { issues: PlantOnboardingIssue[] }) {
  return <div className="onboarding-issues" role="alert"><strong>Não é possível publicar ainda</strong><ul>{issues.map((issue) => <li key={issue.code}>{issue.message}</li>)}</ul></div>;
}
