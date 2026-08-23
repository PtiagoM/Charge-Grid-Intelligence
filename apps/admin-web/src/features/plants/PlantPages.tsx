import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAdminState } from "../../app/AdminState";
import { KpiCard, SectionHeader, number } from "../../components/AdminUi";
import type { GoodWePlant, PlantOnboardingIssue } from "../../domain/admin";
import { validatePlantOnboarding } from "../../domain/plantOnboarding";
import { assets } from "../../constants/assets";
import { mockGoodWePlantCatalogRepository } from "../../services/goodwePlantCatalogRepository";

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
  const { state } = useAdminState();
  const { plants, loading } = usePlantCatalog();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("ALL");
  const linkedIds = useMemo(() => new Set(state.commercialPlants.map((link) => link.goodwePlantId)), [state.commercialPlants]);
  const visiblePlants = plants.filter((plant) => {
    const status = technicalState(plant, linkedIds.has(plant.id)).label;
    const matchesQuery = `${plant.name} ${plant.organization} ${plant.city}`.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === "ALL" || status === filter;
    return matchesQuery && matchesFilter;
  });
  const available = plants.filter((plant) => technicalState(plant, linkedIds.has(plant.id)).label === "Disponível").length;
  const blocked = plants.length - linkedIds.size - available;

  return <>
    <section className="surface panel plant-portfolio" data-testid="plants-portfolio">
      <SectionHeader eyebrow="Rede · Catálogo GoodWe" title="Plantas" subtitle="Dados técnicos sincronizados da GoodWe e seu vínculo comercial no ChargeGrid." action={<a className="sems-primary-action" href="#/mvp/plant-onboarding">Vincular planta</a>} />
      <div className="kpi-grid four-cols">
        <KpiCard label="Catálogo GoodWe" value={plants.length} help="plantas visíveis" />
        <KpiCard label="Publicadas" value={linkedIds.size} help="com perfil comercial" accent="good" />
        <KpiCard label="Disponíveis" value={available} help="aptas para vínculo" />
        <KpiCard label="Com bloqueio" value={blocked} help="pré-condição pendente" accent="warn" />
      </div>
      <div className="plant-toolbar">
        <label><span>Buscar planta</span><input aria-label="Buscar planta" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nome, organização ou cidade" /></label>
        <label><span>Situação</span><select aria-label="Filtrar situação da planta" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="ALL">Todas</option><option>Vinculada</option><option>Disponível</option><option>Dados incompletos</option><option>Sem EV</option><option>Sem autorização</option></select></label>
      </div>
      {loading ? <div className="plant-loading" role="status">Consultando catálogo GoodWe…</div> : null}
      {!loading && !visiblePlants.length ? <div className="empty-state">Nenhuma planta corresponde aos filtros.</div> : null}
      <div className="plant-portfolio-grid">{visiblePlants.map((plant) => {
        const link = state.commercialPlants.find((candidate) => candidate.goodwePlantId === plant.id);
        const establishment = state.establishments.find((item) => item.id === link?.establishmentId);
        return <article className="plant-portfolio-card" key={plant.id} data-testid={`plant-card-${plant.id}`}>
          <div className="plant-card-cover"><img src={assets.plant} alt="" /><PlantState plant={plant} linked={Boolean(link)} /></div>
          <div className="plant-card-body"><small>{plant.organization}</small><h3>{plant.name}</h3><p>{plant.city}/{plant.state} · ID {plant.id}</p>
            <dl><div><dt>Capacidade</dt><dd>{number(plant.capacityKwp)} kWp</dd></div><div><dt>Carregadores EV</dt><dd>{plant.evChargers.length}</dd></div><div><dt>Última sincronização</dt><dd>{plant.lastSyncAt ? new Date(plant.lastSyncAt).toLocaleString("pt-BR") : "Não disponível"}</dd></div></dl>
            {link ? <p className="plant-link-summary"><strong>{link.commercialName}</strong><span>{establishment?.name} · Publicada</span></p> : <p className="plant-link-summary"><strong>Sem perfil comercial</strong><span>Dados técnicos preservados no catálogo GoodWe.</span></p>}
            <a className="ghost-button" href={`#/mvp/plant?plant=${plant.id}`}>Abrir planta</a>
          </div>
        </article>;
      })}</div>
    </section>
  </>;
}

export function PlantDetailPage({ plantId }: { plantId: string }) {
  const { state } = useAdminState();
  const { plants, loading } = usePlantCatalog();
  const plant = plants.find((candidate) => candidate.id === plantId);
  if (loading) return <div className="plant-loading" role="status">Consultando detalhes técnicos…</div>;
  if (!plant) return <section className="surface panel"><SectionHeader title="Planta não encontrada" subtitle="O identificador não existe no catálogo autorizado." /><a className="ghost-button" href="#/mvp/plants">Voltar ao portfólio</a></section>;

  const link = state.commercialPlants.find((candidate) => candidate.goodwePlantId === plant.id);
  const establishment = state.establishments.find((item) => item.id === link?.establishmentId);
  const location = state.locations.find((item) => item.id === link?.locationId);
  const status = technicalState(plant, Boolean(link));

  return <>
    <PlantBreadcrumbs current={plant.name} />
    <section className="surface plant-detail-hero" data-testid="plant-detail">
      <img src={assets.plant} alt="" />
      <div><span className="eyebrow">Planta técnica GoodWe</span><h2>{plant.name}</h2><p>{plant.address}, {plant.number} · {plant.city}/{plant.state}</p><div className="plant-detail-meta"><span className={`plant-state tone-${status.tone}`}>{status.label}</span><span>{plant.organization}</span><span>{plant.timezone}</span></div></div>
      {!link && plant.authorization === "AUTHORIZED" && plant.catalogState === "READY" && plant.evChargers.length ? <a className="sems-primary-action" href={`#/mvp/plant-onboarding?plant=${plant.id}`}>Iniciar vínculo</a> : null}
    </section>
    <nav className="entity-tabs"><a className="is-active" href="#plant-summary">Resumo</a><a href="#plant-equipment">Equipamentos detectados</a><a href="#plant-commercial">Perfil comercial</a></nav>
    <section id="plant-summary" className="surface panel"><SectionHeader title="Dados técnicos sincronizados" subtitle="Campos somente leitura, mantidos pela integração GoodWe." /><div className="kpi-grid four-cols"><KpiCard label="Capacidade fotovoltaica" value={`${number(plant.capacityKwp)} kWp`} /><KpiCard label="Bateria" value={`${number(plant.batteryCapacityKwh)} kWh`} /><KpiCard label="Carregadores EV" value={plant.evChargers.length} /><KpiCard label="Estado do catálogo" value={plant.catalogState} accent={plant.catalogState === "READY" ? "good" : "warn"} /></div><div className="technical-readonly-grid"><article><span>ID GoodWe</span><strong>{plant.id}</strong></article><article><span>Organização</span><strong>{plant.organization}</strong></article><article><span>Última sincronização</span><strong>{plant.lastSyncAt ? new Date(plant.lastSyncAt).toLocaleString("pt-BR") : "Sem dados"}</strong></article><article><span>Autorização</span><strong>{plant.authorization === "AUTHORIZED" ? "Autorizada" : "Negada"}</strong></article></div></section>
    <section id="plant-equipment" className="surface panel"><SectionHeader title="Carregadores detectados" subtitle="Inventário técnico importado; nenhum número de série é digitado no ChargeGrid." />{plant.evChargers.length ? <div className="detected-charger-list">{plant.evChargers.map((charger) => <article key={charger.id}><div><span>{charger.id}</span><h3>{charger.model}</h3><p>Série {charger.serial}</p></div><strong>{charger.powerKw} kW</strong><span className={`plant-state tone-${charger.technicalStatus === "ONLINE" ? "good" : "danger"}`}>{charger.technicalStatus === "ONLINE" ? "Online" : "Offline"}</span></article>)}</div> : <div className="empty-state">Nenhum carregador EV detectado. A publicação comercial permanece bloqueada.</div>}</section>
    <section id="plant-commercial" className="surface panel"><SectionHeader title="Perfil comercial" subtitle={link ? "Vínculo publicado no ChargeGrid." : "Nenhum vínculo comercial foi publicado."} />{link ? <div className="commercial-profile-grid"><article><span>Nome no ChargeGrid</span><strong>{link.commercialName}</strong></article><article><span>Estabelecimento</span><strong>{establishment?.name}</strong></article><article><span>Ponto projetado</span><strong>{location?.name}</strong></article><article><span>Acesso</span><strong>{link.accessPolicy}</strong></article><article><span>Funcionamento</span><strong>{link.alwaysOpen ? "24 horas" : `${link.opensAt}–${link.closesAt}`}</strong></article><article><span>Publicado em</span><strong>{new Date(link.publishedAt).toLocaleString("pt-BR")}</strong></article></div> : <PlantPublicationBlocker plant={plant} />}</section>
  </>;
}

function PlantPublicationBlocker({ plant }: { plant: GoodWePlant }) {
  const messages = [
    plant.authorization !== "AUTHORIZED" ? "A organização atual não está autorizada." : "",
    plant.catalogState !== "READY" ? "Os dados técnicos ainda não estão prontos." : "",
    !plant.evChargers.length ? "Nenhum carregador EV foi detectado." : ""
  ].filter(Boolean);
  if (!messages.length) return <div className="plant-ready-callout"><strong>Planta apta para vínculo</strong><p>Escolha o estabelecimento e configure somente o perfil comercial.</p><a className="sems-primary-action" href={`#/mvp/plant-onboarding?plant=${plant.id}`}>Configurar vínculo</a></div>;
  return <div className="plant-blocker"><strong>Publicação bloqueada</strong><ul>{messages.map((message) => <li key={message}>{message}</li>)}</ul></div>;
}

export function PlantOnboardingPage() {
  const { state, updatePlantOnboardingDraft, resetPlantOnboardingDraft, publishPlantOnboarding } = useAdminState();
  const { plants, loading } = usePlantCatalog();
  const [query] = useSearchParams();
  const navigate = useNavigate();
  const draft = state.plantOnboardingDraft;
  const queryPlantId = query.get("plant") ?? "";
  const [resumedDraft] = useState(Boolean(draft.updatedAt && draft.plantId && !queryPlantId));
  const [step, setStep] = useState(draft.plantId ? 2 : 1);
  const [checkingPlantId, setCheckingPlantId] = useState("");
  const [inspectionIssues, setInspectionIssues] = useState<PlantOnboardingIssue[]>([]);
  const [publishIssues, setPublishIssues] = useState<PlantOnboardingIssue[]>([]);
  const linkedIds = useMemo(() => new Set(state.commercialPlants.map((link) => link.goodwePlantId)), [state.commercialPlants]);
  const selectedPlant = plants.find((plant) => plant.id === draft.plantId);

  useEffect(() => {
    if (!queryPlantId || !plants.length || draft.plantId === queryPlantId) return;
    const plant = plants.find((candidate) => candidate.id === queryPlantId);
    if (!plant) return;
    updatePlantOnboardingDraft({ plantId: plant.id, commercialName: draft.commercialName || plant.name });
    setStep(2);
  }, [queryPlantId, plants, draft.plantId, draft.commercialName, updatePlantOnboardingDraft]);

  async function inspectPlant(plantId: string) {
    setCheckingPlantId(plantId);
    setInspectionIssues([]);
    const plant = await mockGoodWePlantCatalogRepository.inspect(plantId);
    const issues: PlantOnboardingIssue[] = [];
    if (!plant) issues.push({ code: "PLANT_NOT_FOUND", message: "A planta não foi encontrada no catálogo." });
    else {
      if (plant.authorization !== "AUTHORIZED") issues.push({ code: "PLANT_NOT_AUTHORIZED", message: "Sua organização não possui autorização para esta planta." });
      if (plant.catalogState !== "READY") issues.push({ code: "PLANT_NOT_READY", message: "A planta ainda não possui dados técnicos prontos." });
      if (!plant.evChargers.length) issues.push({ code: "PLANT_WITHOUT_EV", message: "Nenhum carregador EV foi detectado." });
      if (linkedIds.has(plant.id)) issues.push({ code: "PLANT_ALREADY_LINKED", message: "Esta planta já possui perfil comercial publicado." });
    }
    setCheckingPlantId("");
    setInspectionIssues(issues);
    if (plant && !issues.length) {
      updatePlantOnboardingDraft({ plantId: plant.id, commercialName: plant.name });
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
    navigate(`/mvp/plant?plant=${plantId}`);
  }

  const validationIssues = plants.length ? validatePlantOnboarding(state, plants, draft) : [];
  return <>
    <PlantBreadcrumbs current="Vincular planta" />
    <section className="surface panel plant-onboarding" data-testid="plant-onboarding">
      <SectionHeader eyebrow="Onboarding comercial" title="Vincular planta GoodWe" subtitle="Selecione uma planta técnica existente e publique apenas sua configuração comercial." />
      {resumedDraft && draft.updatedAt && draft.plantId ? <div className="draft-resume"><strong>Rascunho retomado</strong><span>Última alteração em {new Date(draft.updatedAt).toLocaleString("pt-BR")}</span></div> : null}
      <ol className="onboarding-steps"><li className={step >= 1 ? "is-active" : ""}><b>1</b><span>Planta GoodWe</span></li><li className={step >= 2 ? "is-active" : ""}><b>2</b><span>Perfil comercial</span></li><li className={step >= 3 ? "is-active" : ""}><b>3</b><span>Revisão e publicação</span></li></ol>

      {step === 1 ? <div className="onboarding-step-panel"><header><h3>Escolha no catálogo autorizado</h3><p>A inspeção confirma autorização, sincronização e carregadores EV antes de avançar.</p></header>{loading ? <div className="plant-loading" role="status">Consultando catálogo GoodWe…</div> : <div className="plant-picker-grid">{plants.map((plant) => <article key={plant.id} className={linkedIds.has(plant.id) ? "is-linked" : ""}><div><PlantState plant={plant} linked={linkedIds.has(plant.id)} /><small>{plant.organization}</small><h4>{plant.name}</h4><p>{plant.city}/{plant.state} · {plant.evChargers.length} EV</p></div><button type="button" className="ghost-button" disabled={checkingPlantId === plant.id} onClick={() => inspectPlant(plant.id)}>{checkingPlantId === plant.id ? "Verificando…" : "Verificar planta"}</button></article>)}</div>}{inspectionIssues.length ? <IssueList issues={inspectionIssues} /> : null}</div> : null}

      {step === 2 && selectedPlant ? <form className="onboarding-step-panel" onSubmit={continueToReview}><header><h3>Configure o perfil comercial</h3><p>Os campos técnicos abaixo são herdados da GoodWe e não podem ser editados.</p></header><div className="selected-technical-plant"><div><small>PLANTA SELECIONADA</small><strong>{selectedPlant.name}</strong><span>{selectedPlant.id}</span></div><div><small>EV DETECTADOS</small><strong>{selectedPlant.evChargers.length}</strong><span>{selectedPlant.evChargers.map((charger) => charger.serial).join(", ")}</span></div><button type="button" className="ghost-button" onClick={() => setStep(1)}>Trocar planta</button></div><div className="onboarding-form-grid"><label><span>Estabelecimento responsável</span><select data-testid="onboarding-establishment" required value={draft.establishmentId} onChange={(event) => updatePlantOnboardingDraft({ establishmentId: event.target.value })}><option value="">Selecione</option>{state.establishments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>Nome comercial no ChargeGrid</span><input data-testid="onboarding-commercial-name" required value={draft.commercialName} onChange={(event) => updatePlantOnboardingDraft({ commercialName: event.target.value })} /></label><label><span>Política de acesso</span><select value={draft.accessPolicy} onChange={(event) => updatePlantOnboardingDraft({ accessPolicy: event.target.value as typeof draft.accessPolicy })}><option value="PUBLIC">Público</option><option value="PRIVATE">Privado</option><option value="MIXED">Misto</option></select></label><label className="onboarding-check"><input type="checkbox" checked={draft.alwaysOpen} onChange={(event) => updatePlantOnboardingDraft({ alwaysOpen: event.target.checked })} /><span>Funcionamento 24 horas</span></label>{!draft.alwaysOpen ? <><label><span>Abre às</span><input type="time" value={draft.opensAt} onChange={(event) => updatePlantOnboardingDraft({ opensAt: event.target.value })} /></label><label><span>Fecha às</span><input type="time" value={draft.closesAt} onChange={(event) => updatePlantOnboardingDraft({ closesAt: event.target.value })} /></label></> : null}</div><div className="onboarding-actions"><button type="button" className="ghost-button" onClick={() => setStep(1)}>Voltar</button><button type="submit" className="sems-primary-action">Revisar publicação</button></div></form> : null}

      {step === 3 && selectedPlant ? <div className="onboarding-step-panel" data-testid="onboarding-review"><header><h3>Revise antes de publicar</h3><p>A publicação cria o vínculo e projeta o ponto e os carregadores detectados.</p></header><div className="onboarding-review-grid"><article><span>Planta técnica</span><strong>{selectedPlant.name}</strong><small>{selectedPlant.id}</small></article><article><span>Estabelecimento</span><strong>{state.establishments.find((item) => item.id === draft.establishmentId)?.name ?? "Não selecionado"}</strong></article><article><span>Perfil comercial</span><strong>{draft.commercialName || "Não informado"}</strong><small>{draft.accessPolicy} · {draft.alwaysOpen ? "24 horas" : `${draft.opensAt}–${draft.closesAt}`}</small></article><article><span>Importação técnica</span><strong>{selectedPlant.evChargers.length} carregadores</strong><small>Séries e potências serão preservadas.</small></article></div>{validationIssues.length ? <IssueList issues={validationIssues} /> : <div className="publication-ready"><strong>Pré-condições atendidas</strong><span>O vínculo está pronto para publicação.</span></div>}{publishIssues.length ? <IssueList issues={publishIssues} /> : null}<div className="onboarding-actions"><button type="button" className="ghost-button" onClick={() => setStep(2)}>Editar configuração</button><button type="button" className="sems-primary-action" disabled={validationIssues.length > 0} onClick={publish} data-testid="publish-plant">Publicar vínculo</button></div></div> : null}

      <footer className="onboarding-footer"><span>O rascunho é salvo automaticamente neste ambiente.</span><button type="button" onClick={() => { resetPlantOnboardingDraft(); setStep(1); setInspectionIssues([]); }}>Descartar rascunho</button></footer>
    </section>
  </>;
}

function IssueList({ issues }: { issues: PlantOnboardingIssue[] }) {
  return <div className="onboarding-issues" role="alert"><strong>Não é possível publicar ainda</strong><ul>{issues.map((issue) => <li key={issue.code}>{issue.message}</li>)}</ul></div>;
}
