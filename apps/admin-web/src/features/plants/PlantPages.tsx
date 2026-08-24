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
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const linkedIds = useMemo(() => new Set(state.commercialPlants.map((link) => link.goodwePlantId)), [state.commercialPlants]);
  const actorScopeSet = new Set(accessibleEstablishmentIds(state, account));
  const scopedPlants = plants.filter((plant) => {
    const linkedScope = state.commercialPlants.find((item) => item.goodwePlantId === plant.id)?.establishmentId;
    const contractScopes = COMMERCIAL_PLANT_CONTRACTS.filter((item) => item.goodwePlantId === plant.id).map((item) => item.establishmentId);
    return Boolean(linkedScope && actorScopeSet.has(linkedScope)) || contractScopes.some((scope) => actorScopeSet.has(scope));
  });
  const visiblePlants = scopedPlants.filter((plant) => {
    const status = technicalState(plant, linkedIds.has(plant.id)).label;
    const matchesQuery = `${plant.name} ${plant.organization} ${plant.city}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === "ALL" || status === filter;
    return matchesQuery && matchesFilter;
  });
  const available = scopedPlants.filter((plant) => technicalState(plant, linkedIds.has(plant.id)).label === "Disponível").length;
  const linkedVisible = scopedPlants.filter((plant) => linkedIds.has(plant.id)).length;
  const blocked = scopedPlants.length - linkedVisible - available;

  return <>
    <section className="surface panel plant-portfolio sems-reference-list" data-testid="plants-portfolio">
      <div className="sems-reference-actions"><div className="plant-toolbar"><button className="sems-filter-button" type="button">⌁ Filtro</button><label><span className="sr-only">Buscar usina</span><input aria-label="Buscar planta" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome da usina, organização ou cidade" /></label><label><span className="sr-only">Situação</span><select aria-label="Filtrar situação da planta" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">Todos os status</option><option>Vinculada</option><option>Disponível</option><option>Dados incompletos</option><option>Sem EV</option><option>Sem autorização</option></select></label><button className="sems-icon-action" type="button" aria-label="Pesquisar">⌕</button><button className="sems-icon-action" type="button" aria-label="Atualizar">↻</button></div>{account && (hasAdminCapability(account, "network:onboard") || hasAdminCapability(account, "commercial:self-service")) ? <a className="sems-primary-action" href="#/mvp/access?section=contracts">Ativar planta comercial</a> : null}</div>
      <nav className="sems-reference-status-tabs" aria-label="Status das usinas"><button className="is-active" type="button" onClick={() => setFilter("ALL")}>Todos <b>({scopedPlants.length})</b></button><button type="button" onClick={() => setFilter("Vinculada")}>Em operação <b>({linkedVisible})</b></button><button type="button" onClick={() => setFilter("Disponível")}>Aguardando <b>({available})</b></button><button type="button" onClick={() => setFilter("Dados incompletos")}>Em construção <b>({blocked})</b></button></nav>
      {loading ? <div className="plant-loading" role="status">Consultando catálogo GoodWe…</div> : null}
      {!loading && !visiblePlants.length ? <div className="empty-state">Nenhuma planta corresponde aos filtros.</div> : null}
      <div className="table-wrap sems-table-wrap"><table className="data-table sems-reference-table"><thead><tr><th>Informações da usina</th><th>Status da usina</th><th>Geração de hoje</th><th>Geração total</th><th>Potência FV</th><th>Carregadores EV</th><th>Operação</th></tr></thead><tbody>{visiblePlants.map((plant) => {
        const link = state.commercialPlants.find((candidate) => candidate.goodwePlantId === plant.id);
        const establishment = state.establishments.find((item) => item.id === link?.establishmentId);
        return <tr key={plant.id} data-testid={`plant-card-${plant.id}`}><td><div className="sems-plant-cell"><img src={assets.plant} alt="" /><div><strong>{link?.commercialName ?? plant.name}</strong><span>{plant.organization}</span><small>{plant.city}/{plant.state} · {establishment?.name ?? plant.id}</small></div></div></td><td><PlantState plant={plant} linked={Boolean(link)} /></td><td>{number(plant.capacityKwp * 0.48)} kWh</td><td>{number(plant.capacityKwp * 483.5)} kWh</td><td>{number(plant.capacityKwp)} kW</td><td>{plant.evChargers.length}</td><td><a className="sems-row-action" href={`#/mvp/plant?plant=${plant.id}`}>Abrir ›</a></td></tr>;
      })}</tbody></table></div>
    </section>
  </>;
}

export function PlantDetailPage({ plantId }: { plantId: string }) {
  const { state, account } = useAdminState();
  const { plants, loading } = usePlantCatalog();
  const plant = plants.find((candidate) => candidate.id === plantId);
  if (loading) return <div className="plant-loading" role="status">Consultando detalhes técnicos…</div>;
  if (!plant) return <section className="surface panel"><SectionHeader title="Planta não encontrada" subtitle="O identificador não existe no catálogo autorizado." /><a className="ghost-button" href="#/mvp/plants">Voltar ao portfólio</a></section>;

  const link = state.commercialPlants.find((candidate) => candidate.goodwePlantId === plant.id);
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
