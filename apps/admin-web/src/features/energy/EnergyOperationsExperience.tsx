import { useState } from "react";
import { useAdminState } from "../../app/AdminState";
import { EnergyFlowDiagram, EnergyGlyph } from "./EnergyFlowDiagram";
import { Badge, DataTable, SectionHeader, number } from "../../components/AdminUi";
import { accessibleEstablishmentIds } from "../../domain/accessOperations";
import { assessEstablishmentEnergy, assessEnergySnapshot, energyPolicyFor, recommendEnergyAction } from "../../domain/energyDemand";
import type { EnergyForecastPresentation, EnergySnapshot } from "../../domain/admin";
import { forecastPanelState } from "../../services/energyForecastMapper";

function localDate(value?: string | null) {
  if (!value) return "Sem leitura";
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toLocaleString("pt-BR") : "Horário indisponível";
}

function measurement(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `${number(value)} kW` : "—";
}

function energy(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `${number(value)} kWh` : "—";
}

function percent(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? `${number(value)}%` : "—";
}

function reasonLabel(reason: string) {
  const labels: Record<string, string> = {
    FORECAST_NOT_GENERATED: "Ainda não há uma previsão calculada para esta planta.",
    FORECAST_EXPIRED: "A previsão ultrapassou sua janela de validade.",
    FORECAST_POINT_MISSING: "A resposta não contém o ponto escalar previsto.",
    MODEL_UNAVAILABLE: "O artefato do modelo não está disponível no runtime.",
    INSUFFICIENT_HISTORY: "Ainda não há histórico suficiente para inferência.",
    INPUT_WINDOW_STALE: "As medições de entrada estão desatualizadas."
  };
  return labels[reason] ?? reason.replaceAll("_", " ").toLocaleLowerCase("pt-BR");
}

function EnergyGauge({ snapshot, utilization, alertPercent, criticalPercent }: {
  snapshot?: EnergySnapshot;
  utilization: number | null;
  alertPercent: number | null;
  criticalPercent: number | null;
}) {
  const hasMeasurement = snapshot && Number.isFinite(snapshot.demandKw) && snapshot.contractedLimitKw > 0;
  const ratio = hasMeasurement && utilization !== null ? Math.max(0, Math.min(100, utilization)) : null;
  const arcLength = 100;
  const marker = (threshold: number) => {
    const angle = Math.PI - Math.PI * Math.max(0, Math.min(100, threshold)) / 100;
    const x1 = 180 + 139 * Math.cos(angle);
    const y1 = 205 - 139 * Math.sin(angle);
    const x2 = 180 + 174 * Math.cos(angle);
    const y2 = 205 - 174 * Math.sin(angle);
    return { x1, y1, x2, y2 };
  };
  const alert = alertPercent === null ? null : marker(alertPercent);
  const critical = criticalPercent === null ? null : marker(criticalPercent);

  const needle = ratio === null ? null : marker(ratio);
  return <svg className="energy-gauge" viewBox="0 0 420 260" role="img" aria-labelledby="energy-gauge-title energy-gauge-description">
    <title id="energy-gauge-title">Utilização da importação da rede</title>
    <desc id="energy-gauge-description">{hasMeasurement && ratio !== null ? `${percent(utilization)} da importação limite, ${measurement(snapshot?.demandKw)} importados de ${measurement(snapshot?.contractedLimitKw)} contratados.` : "Importação da rede indisponível porque não há uma medição válida."} {alertPercent === null || criticalPercent === null ? "Política sem limiares sincronizados." : `Limiares persistidos: alerta ${alertPercent}% e crítico ${criticalPercent}%.`}</desc>
    <defs><linearGradient id="energy-demand-gradient"><stop offset="0%" stopColor="#25bf6c" /><stop offset={`${alertPercent ?? 100}%`} stopColor="#daeb5d" /><stop offset={`${criticalPercent ?? 100}%`} stopColor="#ffb83e" /><stop offset="100%" stopColor="#ff414d" /></linearGradient></defs>
    <path className="energy-gauge-track" d="M25 205 A155 155 0 0 1 335 205" pathLength={arcLength} />
    {ratio !== null ? <path className="energy-gauge-value" d="M25 205 A155 155 0 0 1 335 205" pathLength={arcLength} strokeDasharray={`${ratio} ${arcLength}`} /> : null}
    {alert ? <line className="energy-gauge-tick energy-gauge-tick-alert" x1={alert.x1} y1={alert.y1} x2={alert.x2} y2={alert.y2} /> : null}
    {critical ? <line className="energy-gauge-tick energy-gauge-tick-critical" x1={critical.x1} y1={critical.y1} x2={critical.x2} y2={critical.y2} /> : null}
    {needle ? <line className="energy-gauge-needle" x1={needle.x1} y1={needle.y1} x2={needle.x2} y2={needle.y2} /> : null}
    {alert ? <g className="energy-gauge-threshold gauge-alert"><circle cx={alert.x2} cy={alert.y2} r="4" /><text x={alert.x2 + 12} y={alert.y2 - 4}>{alertPercent}%</text><text className="gauge-threshold-power" x={alert.x2 + 12} y={alert.y2 + 13}>{measurement(snapshot ? snapshot.contractedLimitKw * alertPercent! / 100 : null)}</text></g> : null}
    {critical ? <g className="energy-gauge-threshold gauge-critical"><circle cx={critical.x2} cy={critical.y2} r="4" /><text x={critical.x2 + 12} y={critical.y2 - 4}>{criticalPercent}%</text><text className="gauge-threshold-power" x={critical.x2 + 12} y={critical.y2 + 13}>{measurement(snapshot ? snapshot.contractedLimitKw * criticalPercent! / 100 : null)}</text></g> : null}
    <text className="energy-gauge-caption" x="180" y="132" textAnchor="middle">Importação da rede</text>
    <text className="energy-gauge-value-label" x="180" y="168" textAnchor="middle">{hasMeasurement ? measurement(snapshot.demandKw) : "—"}</text>
    <text className="energy-gauge-utilization" x="180" y="197" textAnchor="middle">{ratio === null ? "Sem leitura" : `${percent(utilization)} do limite`}</text>
    <text className="energy-gauge-endpoint" x="9" y="233">0 kW</text><text className="energy-gauge-endpoint" x="335" y="233" textAnchor="end">{hasMeasurement ? measurement(snapshot.contractedLimitKw) : "—"}</text>
    <text className="energy-gauge-caption" x="335" y="251" textAnchor="end">Limite contratado</text>
  </svg>;
}

function ForecastPanel({ forecast, sync }: {
  forecast?: EnergyForecastPresentation;
  sync: ReturnType<typeof useAdminState>["commercialSync"];
}) {
  const view = forecastPanelState(forecast, sync);
  const currentForecast = view.status === "AVAILABLE" || view.status === "STALE" ? view.forecast : null;

  return <section className="energy-v2-section energy-forecast-section" aria-label="Previsão de demanda" data-testid="energy-forecast">
    <SectionHeader title="Previsão de demanda" subtitle="Pico escalar previsto pelo modelo, separado da medição e da projeção de admissão." />
    <article className={`energy-forecast-card forecast-${view.status.toLowerCase()}`} aria-live="polite" aria-busy={view.status === "LOADING"}>
      {view.status === "LOADING" ? <div className="energy-forecast-state"><div className="energy-forecast-state-icon"><EnergyGlyph name="clock" /></div><div><span>Status da previsão</span><strong>Carregando previsão</strong><p>Consultando o último resultado persistido.</p></div></div> : null}
      {view.status === "ERROR" ? <div className="energy-forecast-state" role="alert"><div className="energy-forecast-state-icon"><EnergyGlyph name="forecast" /></div><div><span>Status da previsão</span><strong>Erro na consulta</strong><p>{view.message}</p></div></div> : null}
      {view.status === "UNAVAILABLE" ? <div className="energy-forecast-state"><div className="energy-forecast-state-icon"><EnergyGlyph name="forecast" /></div><div><span>Status da previsão</span><strong>Previsão indisponível</strong><p>Sem valor previsto para exibir.</p></div><div className="energy-forecast-state-reason"><span>Motivo</span><strong>{view.reason}</strong><p>{reasonLabel(view.reason)}</p></div></div> : null}
      {view.status === "STALE" ? <div className="energy-forecast-state" role="status"><div className="energy-forecast-state-icon"><EnergyGlyph name="clock" /></div><div><span>Status da previsão</span><strong>Último resultado desatualizado</strong><p>{reasonLabel(view.reason)} Ele não representa uma previsão vigente.</p></div></div> : null}
      {currentForecast ? <div className="energy-forecast-content">
        <div className="energy-forecast-peak">
          <span>{view.status === "AVAILABLE" ? "Pico estimado" : "Último pico estimado · desatualizado"}</span>
          <strong>{currentForecast.predictedGridImportKw === null ? "—" : measurement(currentForecast.predictedGridImportKw)}</strong>
          <small>{currentForecast.predictedAt ? `Horizonte de ${currentForecast.horizonMinutes ?? "—"} min · ${localDate(currentForecast.predictedAt)}` : "Sem ponto escalar vigente"}</small>
        </div>
        <div className="energy-forecast-facts">
          <div><span>Estado do sinal</span><strong><Badge value={currentForecast.riskState ?? currentForecast.status}>{currentForecast.riskState === "PREDICTED_PEAK" ? "Pico previsto" : currentForecast.status === "AVAILABLE" ? "Dentro do limiar" : "Desatualizado"}</Badge></strong></div>
          <div><span>Limiar do forecast</span><strong>{measurement(currentForecast.riskThresholdKw)}</strong></div>
          <div><span>Modelo</span><strong>{currentForecast.modelVersion ?? "—"}</strong></div>
          <div><span>Origem dos dados</span><strong className="energy-provenance">{currentForecast.provenance === "SIMULATED" ? "SIMULATED_COMPOSITE · benchmark" : currentForecast.provenance ?? "Indisponível"}</strong></div>
        </div>
        {currentForecast.testMetrics ? <div className="energy-forecast-metrics">
          <div className="energy-history-label"><strong>Avaliação histórica offline</strong><span>Não é confiança da previsão atual</span></div>
          <div><span>MAE de teste</span><strong>{measurement(currentForecast.testMetrics.maeKw)}</strong></div>
          <div><span>RMSE de teste</span><strong>{measurement(currentForecast.testMetrics.rmseKw)}</strong></div>
          <p>Janela de teste: {localDate(currentForecast.testMetrics.testFrom)} — {localDate(currentForecast.testMetrics.testTo)}. Dados de avaliação classificados como simulados.</p>
        </div> : null}
        <footer>Gerada {localDate(currentForecast.generatedAt)} · válida até {localDate(currentForecast.expiresAt)}</footer>
      </div> : null}
    </article>
  </section>;
}

function EnergyPortfolio({ establishmentIds, state }: { establishmentIds: Set<string>; state: ReturnType<typeof useAdminState>["state"] }) {
  const visible = state.establishments.filter((item) => establishmentIds.has(item.id));
  return <section className="surface panel operations-page" data-testid="energy-portfolio">
    <SectionHeader eyebrow="ChargeGrid" title="Energia por estabelecimento" subtitle="A operação integrada e os dados energéticos são apresentados somente quando sincronizados pela API ChargeGrid." />
    <div className="energy-portfolio-grid">{visible.map((establishment) => {
      const snapshot = state.energy.find((item) => item.establishmentId === establishment.id);
      const integrated = snapshot?.source === "SIMULATED" && Boolean(snapshot.sampleId);
      const assessment = assessEstablishmentEnergy(state, establishment.id);
      return <article key={establishment.id}>
        <div><Badge value={integrated ? assessment.state : "UNAVAILABLE"} /><h3>{establishment.name}</h3><p>{integrated ? assessment.reason : "Sem telemetria operacional compartilhada; dados locais não são apresentados como medição."}</p></div>
        <strong>{integrated && snapshot ? `${measurement(snapshot.demandKw)} / ${measurement(snapshot.contractedLimitKw)}` : "Sem dados integrados"}</strong>
        <span>{integrated ? `Atualizado ${localDate(snapshot?.observedAt)}` : "Aguardando integração da planta"}</span>
        <a className="ghost-button" href={`#/mvp/energy?est=${establishment.id}`}>Abrir energia</a>
      </article>;
    })}</div>
  </section>;
}

export function EnergyOperationsExperience({ establishmentId }: { establishmentId?: string }) {
  const [activeSection, setActiveSection] = useState("energy-now");
  const { state, account, commercialSync } = useAdminState();
  const scopeId = establishmentId ?? (account?.profile === "ESTABELECIMENTO" ? account.establishmentId : undefined);
  const accessibleIds = new Set(accessibleEstablishmentIds(state, account));
  if (!scopeId) return <EnergyPortfolio establishmentIds={accessibleIds} state={state} />;

  const establishment = state.establishments.find((item) => item.id === scopeId);
  const integratedSnapshot = state.energy.find((item) => item.establishmentId === scopeId);
  const isIntegrated = integratedSnapshot?.source === "SIMULATED" && Boolean(integratedSnapshot.sampleId);
  const snapshot = isIntegrated ? integratedSnapshot : undefined;
  const policy = energyPolicyFor(state, scopeId);
  const hasPersistedPolicy = Boolean(state.energyPolicies.find((item) => item.establishmentId === scopeId)?.version);
  const assessment = assessEnergySnapshot(snapshot, policy);
  const recommendation = snapshot ? recommendEnergyAction(state, scopeId) : null;
  const sessions = snapshot ? state.sessions.filter((item) => item.establishmentId === scopeId && ["starting", "active", "suspended"].includes(item.status)) : [];
  const waiting = snapshot ? state.queue.filter((item) => item.establishmentId === scopeId && item.status === "waiting") : [];
  const chargerCode = (id: string) => state.chargers.find((item) => item.id === id)?.identifier ?? id;
  const demandWidth = Math.min(100, Math.max(0, assessment.utilizationPercent ?? 0));
  const hasDemand = Boolean(snapshot && snapshot.contractedLimitKw > 0 && Number.isFinite(snapshot.demandKw));
  const backendDecision = snapshot?.decision;
  const projectedImportKw = backendDecision?.projectedImportKw ?? null;
  const additionalImportKw = hasDemand && projectedImportKw !== null ? projectedImportKw - snapshot!.demandKw : null;
  const alertKw = hasDemand && hasPersistedPolicy ? snapshot!.contractedLimitKw * policy.alertUtilizationPercent / 100 : null;
  const criticalKw = hasDemand && hasPersistedPolicy ? snapshot!.contractedLimitKw * policy.criticalUtilizationPercent / 100 : null;
  const decisionCanAdmit = backendDecision?.canAdmit;
  const blocked = decisionCanAdmit === undefined ? null : !decisionCanAdmit;
  const activeDecisionLabel = blocked === null ? "Sem decisão da API" : blocked ? "Novos inícios bloqueados" : "Novos inícios permitidos";
  const policyLabel = snapshot?.decision?.policyVersion ?? policy.version ?? "Política não sincronizada";

  return <div className="energy-experience" data-testid="mvp-energy-panel">
    <nav className="enterprise-breadcrumb" aria-label="Navegação estrutural"><span><a href="#/mvp/energy">ChargeGrid · Energia e demanda</a><i>/</i></span><span><strong>{establishment?.name ?? "Energia e demanda"}</strong></span></nav>
    <header className="energy-page-heading">
      <div><h1>Energia e demanda</h1><p>{establishment?.name ?? "Estabelecimento"} · operação energética</p></div>
      <div className="energy-page-meta">
        {snapshot ? <><Badge value={assessment.state} /><span>Leitura {localDate(snapshot.observedAt)}</span><Badge value="SIMULATED">Ambiente simulado · GoodWe</Badge></> : <><Badge value="UNAVAILABLE">Sem telemetria</Badge><span>Esta planta ainda não está conectada à operação compartilhada.</span></>}
      </div>
    </header>
    {commercialSync.error && commercialSync.status !== "SYNCED" ? <div className="energy-sync-message" role="status"><strong>{commercialSync.status === "STALE" ? "Exibindo o último estado sincronizado" : "API ChargeGrid indisponível"}</strong><span>{commercialSync.error}</span></div> : null}
    <nav className="energy-section-nav" aria-label="Seções de Energia e demanda">
      {([["energy-now", "Agora"], ["energy-flow", "Fluxo"], ["energy-decision", "Decisão"], ["energy-impact", "Impacto"], ["energy-policy", "Política"]] as const).map(([id, label]) => <a key={id} href={`#${id}`} aria-current={activeSection === id ? "location" : undefined} onClick={(event) => { event.preventDefault(); setActiveSection(id); document.getElementById(id)?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" }); }}>{label}</a>)}
    </nav>

    <section id="energy-now" className="energy-v2-section energy-now-section" aria-label="Importação da rede da planta">
      <SectionHeader title="Importação da rede" subtitle="Potência importada instantânea comparada ao limite contratado da planta." />
      <div className="energy-now-grid">
        <article className={`energy-demand-card demand-${assessment.state.toLowerCase()}`}>
          <EnergyGauge snapshot={snapshot} utilization={hasDemand ? assessment.utilizationPercent : null} alertPercent={hasPersistedPolicy ? policy.alertUtilizationPercent : null} criticalPercent={hasPersistedPolicy ? policy.criticalUtilizationPercent : null} />
          <div className="energy-demand-metrics">
            <article><EnergyGlyph name="pulse" /><div><span>Importação medida da rede</span><strong>{hasDemand ? measurement(snapshot?.demandKw) : "—"}</strong><small>potência instantânea</small></div></article>
            <article><EnergyGlyph name="limit" /><div><span>Limite contratado</span><strong>{hasDemand ? measurement(snapshot?.contractedLimitKw) : "—"}</strong><small>referência operacional</small></div></article>
            <article><EnergyGlyph name="margin" /><div><span>Margem disponível</span><strong>{hasDemand && assessment.marginKw !== null ? measurement(assessment.marginKw) : "—"}</strong><small>até o limite contratado</small></div></article>
          </div>
          <div className="energy-threshold-legend">{hasPersistedPolicy ? <><span><i className="threshold-alert" />Alerta {policy.alertUtilizationPercent}%{alertKw === null ? "" : ` · ${measurement(alertKw)}`}</span><span><i className="threshold-critical" />Crítico {policy.criticalUtilizationPercent}%{criticalKw === null ? "" : ` · ${measurement(criticalKw)}`}</span></> : <span>Limiares aguardando política persistida pela API.</span>}</div>
        </article>
      </div>
      <div className={`energy-now-admission ${blocked ? "admission-blocked" : ""}`}><EnergyGlyph name={blocked ? "blocked" : "shield"} /><span>{activeDecisionLabel}</span><span>Próxima admissão projetada <strong>{measurement(projectedImportKw)}</strong></span><a href="#energy-decision" onClick={(event) => { event.preventDefault(); setActiveSection("energy-decision"); document.getElementById("energy-decision")?.scrollIntoView({ block: "start" }); }}>Ver evidências da decisão</a></div>
    </section>

    <section id="energy-flow" className="energy-v2-section" aria-label="Fluxo energético">
      <SectionHeader title="Fluxo energético agora" subtitle="Potências instantâneas medidas nos pontos da planta (kW). As conexões representam o barramento, sem atribuição instantânea de origem por equipamento." />
      <EnergyFlowDiagram snapshot={snapshot} />
      <div className="energy-register-row">
        <div><span>Solar → EV no registro</span><strong>{energy(snapshot?.periodSolarKwh)}</strong></div>
        <div><span>Importação da rede no registro</span><strong>{energy(snapshot?.periodGridKwh)}</strong></div>
        <p>Valores em kWh vêm dos campos de energia do snapshot. Nenhum total diário ou acumulado é estimado pela interface.</p>
      </div>
    </section>

    <section id="energy-decision" className="energy-v2-section" aria-label="Decisão operacional" data-testid="energy-recommendation">
      <SectionHeader title="Decisão operacional" subtitle="Resultado da política de controle aplicada à solicitação de novos inícios." action={<Badge value={blocked === null ? "UNAVAILABLE" : blocked ? "CRITICAL" : "NORMAL"}>Decisão determinística · {policyLabel}</Badge>} />
      <div className="energy-decision-sequence">
        <article><span className="energy-sequence-index">1</span><EnergyGlyph name="pulse" /><span className="energy-card-kicker">Importação medida da rede</span><strong>{hasDemand ? measurement(snapshot?.demandKw) : "—"}</strong><small>{hasDemand ? `${percent(assessment.utilizationPercent)} do limite` : "Sem snapshot integrado"}</small></article>
        <div className="energy-sequence-arrow" aria-hidden="true">→</div>
        <article><span className="energy-sequence-index">2</span><EnergyGlyph name="charger" /><span className="energy-card-kicker">Nova admissão</span><strong>{additionalImportKw === null ? "—" : `${additionalImportKw >= 0 ? "+" : ""}${measurement(additionalImportKw)}`}</strong><small>diferença da projeção da API</small></article>
        <div className="energy-sequence-arrow" aria-hidden="true">→</div>
        <article><span className="energy-sequence-index">3</span><EnergyGlyph name="margin" /><span className="energy-card-kicker">Próxima admissão projetada</span><strong>{measurement(projectedImportKw)}</strong><small>{hasDemand && projectedImportKw !== null ? `${percent(projectedImportKw / snapshot!.contractedLimitKw * 100)} do limite` : "Projeção indisponível"}</small></article>
        <div className="energy-sequence-arrow" aria-hidden="true">→</div>
        <article className={blocked === null ? "sequence-neutral" : blocked ? "sequence-blocked" : "sequence-allowed"}><span className="energy-sequence-index">4</span><EnergyGlyph name={blocked ? "blocked" : "shield"} /><span className="energy-card-kicker">Decisão da política</span><strong>{blocked === null ? "Sem decisão da API" : blocked ? "Inícios bloqueados" : "Inícios permitidos"}</strong><small>{backendDecision?.reasonCode ?? "Sem decisão persistida"}</small></article>
      </div>
      <div className="energy-decision-evidence">
        <div><h3>Motivo e evidências da decisão</h3>{backendDecision ? <><p>{recommendation?.reason ?? backendDecision.reasonCode}</p><ul>{recommendation?.evidence.map((item) => <li key={item}>{item}</li>) ?? <li>{backendDecision.reasonCode}</li>}</ul><small>Decisão {backendDecision.policyVersion} · observada {localDate(backendDecision.observedAt)}</small></> : <p className="energy-unintegrated-note">A planta não possui uma decisão operacional recebida da API. Valores de fixture não são apresentados como decisão compartilhada.</p>}</div>
        <div><h3>Ação sugerida</h3>{recommendation && backendDecision ? <><p>{recommendation.action === "REVIEW_STOP" ? "Revisar a sessão candidata; qualquer parada exige confirmação operacional." : recommendation.action === "RESTORE_TELEMETRY" ? "Restaurar telemetria antes de comandar." : recommendation.action === "PAUSE_NEW_STARTS" ? "Manter novos inícios bloqueados até a condição de recuperação." : recommendation.action === "MONITOR" ? "Acompanhar o próximo snapshot antes de ampliar a carga." : "Nenhuma ação sugerida."}</p>{recommendation.candidateSession ? <a className="sems-primary-action" href={`#/mvp/charger?charger=${recommendation.candidateSession.chargerId}`}>Revisar {chargerCode(recommendation.candidateSession.chargerId)}</a> : null}</> : <p className="energy-unintegrated-note">Disponível quando a API retornar uma decisão persistida.</p>}</div>
      </div>
    </section>

    <ForecastPanel forecast={snapshot?.forecast} sync={commercialSync} />

    <section id="energy-impact" className="energy-v2-section" aria-label="Impacto operacional">
      <SectionHeader title="Impacto operacional" subtitle="Sessões de recarga e motoristas aguardando admissão na mesma planta." />
      {!snapshot ? <div className="energy-empty-state"><strong>Operação compartilhada indisponível</strong><p>Não há sessão, fila ou medição desta planta sincronizada pela API.</p></div> : <>
        <div className="energy-impact-summary"><article><EnergyGlyph name="charger" /><span>Sessões ativas</span><strong>{sessions.length}</strong><small>iniciando, carregando ou suspensas</small></article><article><EnergyGlyph name="people" /><span>Motoristas na fila</span><strong>{waiting.length}</strong><small>aguardando admissão</small></article><article className={blocked ? "impact-blocked" : "impact-status"}><EnergyGlyph name={blocked ? "blocked" : "shield"} /><span>Novos inícios</span><strong>{blocked === null ? "Sem decisão" : blocked ? "Bloqueados" : "Permitidos"}</strong><small>{backendDecision?.reasonCode ?? "Estado não informado"}</small></article></div>
        <div className="energy-impact-panel"><h3>Sessões ativas</h3>{sessions.length ? <DataTable columns={["Sessão", "Motorista", "Carregador", "Estado", "Energia", "Custo"]}>{sessions.map((session) => <tr key={session.id}><td><a href={`#/mvp/session?est=${session.establishmentId}&session=${session.id}`}>{session.publicCode ?? session.id}</a></td><td>{session.driverName}</td><td>{chargerCode(session.chargerId)}</td><td><Badge value={session.status} /></td><td>{energy(session.energyKwh)}</td><td>R$ {number(session.consumedAmount)}</td></tr>)}</DataTable> : <div className="energy-empty-state"><EnergyGlyph name="charger" /><strong>Nenhuma sessão ativa</strong><p>As recargas desta planta aparecerão aqui quando iniciarem.</p></div>}</div>
        <div className="energy-impact-panel"><header><div><h3>Fila de motoristas</h3><p>Ordem e estado de espera por admissão.</p></div><a className="ghost-button" href={`#/mvp/queue?est=${scopeId}`}>Abrir fila</a></header>{waiting.length ? <DataTable columns={["Posição", "Motorista", "Veículo", "Estado", "Espera", "Carregador atribuído"]}>{waiting.map((entry) => <tr key={entry.id}><td>{entry.position ?? "—"}</td><td>{entry.driverName}</td><td>{entry.vehicle}</td><td><Badge value={entry.status} /></td><td>{entry.estimatedWaitMinutes == null ? "—" : `${number(entry.estimatedWaitMinutes)} min`}</td><td>{entry.suggestedChargerId ? chargerCode(entry.suggestedChargerId) : "Aguardando atribuição"}</td></tr>)}</DataTable> : <div className="energy-empty-state"><EnergyGlyph name="people" /><strong>Nenhum motorista na fila</strong><p>Ninguém aguarda uma vaga nesta planta neste momento.</p></div>}</div>
      </>}
    </section>

    <section id="energy-policy" className="energy-v2-section" aria-label="Política aplicada">
      <SectionHeader title="Política aplicada" subtitle={hasPersistedPolicy ? "Versão persistida usada pela mesma decisão de admissão do backend." : "Aguardando política sincronizada da API."} />
      <article className="energy-policy-card">
        <div className="energy-policy-scale-heading"><div><span>Importação atual da rede</span><strong>{hasDemand ? percent(assessment.utilizationPercent) : "—"}</strong><small>{hasDemand ? `${measurement(snapshot?.demandKw)} importados de ${measurement(snapshot?.contractedLimitKw)} contratados` : "Sem leitura válida"}</small></div>
          <div className="energy-policy-thresholds">{hasPersistedPolicy && policy.recoveryUtilizationPercent != null ? <span><small>Recuperação</small><strong>{percent(policy.recoveryUtilizationPercent)}</strong><small>{hasDemand ? measurement(snapshot!.contractedLimitKw * policy.recoveryUtilizationPercent / 100) : "—"}</small></span> : null}{hasPersistedPolicy ? <><span><small>Alerta</small><strong>{percent(policy.alertUtilizationPercent)}</strong><small>{hasDemand ? measurement(snapshot!.contractedLimitKw * policy.alertUtilizationPercent / 100) : "—"}</small></span><span><small>Crítico</small><strong>{percent(policy.criticalUtilizationPercent)}</strong><small>{hasDemand ? measurement(snapshot!.contractedLimitKw * policy.criticalUtilizationPercent / 100) : "—"}</small></span></> : <span>Política não sincronizada</span>}</div>
        </div>
        <div className={`energy-policy-scale ${hasDemand ? "has-reading" : "no-reading"}`} role="img" aria-label={hasDemand ? `Importação da rede ${percent(assessment.utilizationPercent)}${hasPersistedPolicy ? `; alerta ${policy.alertUtilizationPercent} por cento; crítico ${policy.criticalUtilizationPercent} por cento` : ""}` : "Escala de importação da rede sem leitura"}>
          <div className="energy-policy-track"><span className="energy-policy-safe" />{hasPersistedPolicy ? <><span className="energy-policy-alert-zone" style={{ left: `${policy.alertUtilizationPercent}%`, width: `${Math.max(0, policy.criticalUtilizationPercent - policy.alertUtilizationPercent)}%` }} /><span className="energy-policy-critical-zone" style={{ left: `${policy.criticalUtilizationPercent}%`, width: `${Math.max(0, 100 - policy.criticalUtilizationPercent)}%` }} />{policy.recoveryUtilizationPercent == null ? null : <i className="energy-policy-marker recovery-marker" style={{ left: `${policy.recoveryUtilizationPercent}%` }} />}<i className="energy-policy-marker alert-marker" style={{ left: `${policy.alertUtilizationPercent}%` }} /><i className="energy-policy-marker critical-marker" style={{ left: `${policy.criticalUtilizationPercent}%` }} /></> : null}{hasDemand ? <i className="energy-policy-current" style={{ left: `${demandWidth}%` }}><span>{percent(assessment.utilizationPercent)}</span></i> : null}</div>
          <div className="energy-policy-scale-labels"><span>0 kW</span><span>{hasDemand ? measurement(snapshot?.contractedLimitKw) : "Limite indisponível"}</span></div>
        </div>
        <div className="energy-policy-facts">
          <article><EnergyGlyph name="policy" /><span>Controle</span><strong>{policyLabel}</strong><small>{!hasPersistedPolicy ? "Não sincronizado" : policy.demandControlEnabled === false ? "Desativado" : policy.demandControlEnabled === true ? "Ativo" : "Não informado"}</small></article>
          <article><EnergyGlyph name="clock" /><span>Freshness</span><strong>{hasPersistedPolicy ? `${number(policy.freshnessMinutes)} min` : "Não sincronizada"}</strong><small>{snapshot?.quality === "FRESH" ? "Telemetria atualizada" : snapshot?.quality === "STALE" ? "Telemetria desatualizada" : "Telemetria indisponível"}{assessment.ageMinutes === null ? "" : ` · idade ${number(assessment.ageMinutes)} min`}</small></article>
          <article><EnergyGlyph name="shield" /><span>Falha segura</span><strong>{!hasPersistedPolicy ? "Não sincronizada" : policy.blockStartWithoutFreshTelemetry ? "Ativa" : "Não configurada"}</strong><small>{hasPersistedPolicy && policy.blockStartWithoutFreshTelemetry ? "Bloqueia sem telemetria fresca" : "Regra de admissão do backend"}</small></article>
          <article><EnergyGlyph name="cloud" /><span>Provider</span><strong>{snapshot?.source === "SIMULATED" ? "GoodWe simulado" : "Não integrado"}</strong><small>{snapshot?.providerStatus ?? "Sem estado compartilhado"}</small></article>
        </div>
        {hasPersistedPolicy && policy.recoveryUtilizationPercent != null && policy.recoveryStableSeconds != null ? <p className="energy-policy-recovery"><EnergyGlyph name="clock" /><span>Recuperação configurada: <strong>{percent(policy.recoveryUtilizationPercent)}</strong> por <strong>{policy.recoveryStableSeconds} s estáveis</strong>.</span></p> : null}
        <p className="energy-policy-note">{hasPersistedPolicy ? "A escala representa os limiares persistidos da política. Os comandos permanecem sob responsabilidade do backend." : "Sem configuração integrada, a escala permanece sem limiares ou decisão operacional."}</p>
      </article>
    </section>
  </div>;
}
