import { useCallback, useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import type { DemoRuntimeScenario, DemoRuntimeState } from "@chargegrid/shared";
import { useAdminState } from "../../app/AdminState";
import { DataTable, KpiCard, SectionHeader, money, number } from "../../components/AdminUi";
import { canUseDemoRuntime, demoRuntimeEnabled, requestDemoRuntime } from "../../services/demoRuntimeRepository";

const scenarios: Record<DemoRuntimeScenario, string> = {
  solar: "Solar", peak: "Pico", critical: "Crítico", offline: "Offline"
};
const measured = (value: number) => value.toLocaleString("pt-BR", { minimumFractionDigits: 3, maximumFractionDigits: 3 });
const demandLabels = { normal: "Normal", alert: "Alerta", critical: "Crítica", offline: "Indisponível" };
const stopLabels = { user: "Comando de parada", financial_limit: "Limite financeiro", offline: "Provider offline" };

function RuntimeConsole() {
  const [snapshot, setSnapshot] = useState<DemoRuntimeState | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [minutes, setMinutes] = useState(5);
  const requestId = useRef(0);
  const mutationPending = useRef(false);
  const refreshPending = useRef(false);

  const refresh = useCallback(async () => {
    if (mutationPending.current || refreshPending.current) return;
    refreshPending.current = true;
    const id = ++requestId.current;
    try {
      const state = await requestDemoRuntime();
      if (id !== requestId.current) return;
      setSnapshot(state);
      setError("");
    } catch (cause) {
      if (id === requestId.current) setError(cause instanceof Error ? cause.message : "Não foi possível consultar a API.");
    } finally {
      refreshPending.current = false;
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = window.setInterval(() => { void refresh(); }, 2000);
    return () => { window.clearInterval(interval); requestId.current += 1; };
  }, [refresh]);

  async function mutate(path: string, body?: object) {
    if (mutationPending.current) return;
    mutationPending.current = true;
    requestId.current += 1;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const state = await requestDemoRuntime(path, body);
      setSnapshot(state);
      setNotice(`Estado confirmado pela API · revisão ${state.revision}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "A ação não foi confirmada. Atualize o estado antes de tentar novamente.");
    } finally {
      mutationPending.current = false;
      setBusy(false);
    }
  }

  const totalEnergy = snapshot?.sessions.reduce((sum, session) => sum + session.energyKwh, 0) ?? 0;
  const totalSolar = snapshot?.sessions.reduce((sum, session) => sum + session.solarEnergyKwh, 0) ?? 0;
  const totalAmount = snapshot?.sessions.reduce((sum, session) => sum + session.amount, 0) ?? 0;
  const plant = snapshot?.plant;
  const pwaUrl = `http://${window.location.hostname || "localhost"}:5174/demo`;

  return <section className="admin-simulator operations-detail" data-testid="demo-console">
    <SectionHeader eyebrow="Sprint 3 · simulação integrada" title="Console de demonstração" subtitle="Admin e PWA consultam o mesmo estado persistido pela API local. Comandos, pagamentos e medições são simulados; nenhum equipamento físico é acionado." />
    <article className="surface panel">
      <p>Inicie a recarga no <a href={pwaUrl} target="_blank" rel="noreferrer">PWA demonstrativo</a> e acompanhe o resultado aqui. O relógio avança somente pelo botão abaixo; a consulta a cada 2 segundos não gera consumo.</p>
      <p>Este console usa um cenário isolado. As demais telas SEMS+/ChargeGrid mantêm suas fixtures locais e não recebem estes dados.</p>
      <div className="simulator-grid">
        <button type="button" onClick={() => { void refresh(); }} disabled={busy}>Atualizar estado</button>
        <button type="button" disabled={busy || !snapshot} onClick={() => {
          if (window.confirm("Reiniciar o cenário compartilhado? As sessões e os eventos desta demonstração serão removidos também do PWA.")) void mutate("/reset");
        }}>Reiniciar demonstração</button>
      </div>
      {error ? <div role="alert"><p>Falha na comunicação: {error}</p><p>Confira se a API local foi iniciada com a demonstração habilitada. O último estado exibido pode estar desatualizado.</p><button type="button" onClick={() => { void refresh(); }} disabled={busy}>Tentar novamente</button></div> : null}
      <p role="status">{busy ? "Aguardando confirmação da API…" : notice}</p>
      {!snapshot && !error ? <p role="status">Carregando cenário da API…</p> : null}
    </article>
    {snapshot && plant ? <>
      <section className="surface panel">
        <SectionHeader title={plant.name} subtitle={`Cenário: ${scenarios[snapshot.scenario]} · relógio simulado: ${new Date(snapshot.now).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })} (São Paulo) · revisão ${snapshot.revision}`} />
        <p data-testid="demo-revision">Revisão da API: {snapshot.revision}</p>
        <div className="simulator-grid">{(Object.keys(scenarios) as DemoRuntimeScenario[]).map((scenario) => <button key={scenario} type="button" aria-pressed={snapshot.scenario === scenario} disabled={busy} onClick={() => { void mutate("/scenario", { scenario }); }}>{scenarios[scenario]}</button>)}</div>
        <form className="simulator-grid" onSubmit={(event) => { event.preventDefault(); void mutate("/advance", { minutes }); }}>
          <label>Minutos simulados <input aria-label="Minutos simulados" type="number" min={1} max={60} step={1} required value={Number.isNaN(minutes) ? "" : minutes} onChange={(event) => setMinutes(event.target.valueAsNumber)} /></label>
          <button type="submit" disabled={busy || !Number.isInteger(minutes) || minutes < 1 || minutes > 60}>Avançar medição</button>
          <button type="button" disabled={busy} onClick={() => { void mutate("/advance", { minutes: 10 }); }}>Avançar 10 minutos</button>
        </form>
        <div className="kpi-grid four-cols">
          <KpiCard label="Geração solar" value={`${number(plant.solarKw)} kW`} help="potência simulada" />
          <KpiCard label="Carga do prédio" value={`${number(plant.buildingKw)} kW`} help="demanda sem veículos" />
          <KpiCard label="Recarga EV" value={`${number(plant.evKw)} kW`} help="potência das sessões" />
          <KpiCard label={plant.gridKw < 0 ? "Exportação para a rede" : "Importação da rede"} value={`${number(Math.abs(plant.gridKw))} kW`} help={`Limite de carga total: ${number(plant.capacityKw)} kW · ${demandLabels[plant.demandState]}`} />
        </div>
        <p>Balanço: solar + rede = prédio + recarga. Rede negativa representa exportação. Excedente solar: {number(Math.max(0, plant.solarKw - plant.buildingKw - plant.evKw))} kW. No cenário offline, os números representam o cenário sintético conhecido, não uma leitura recebida de hardware.</p>
        <p>Demanda crítica bloqueia novos inícios; offline encerra a entrega simulada. O limite financeiro encerra a sessão automaticamente. Cada efeito fica registrado abaixo.</p>
      </section>
      <section className="surface panel">
        <SectionHeader title="Energia e operação comercial" subtitle="Energia = potência × tempo. Valores acumulados da demonstração; cobrança e autorização são simuladas." />
        <div className="kpi-grid four-cols">
          <KpiCard label="Energia entregue" value={`${measured(totalEnergy)} kWh`} help="todas as sessões" />
          <KpiCard label="Solar atribuída à recarga" value={`${measured(totalSolar)} kWh`} help="excedente após suprir o prédio" />
          <KpiCard label="Participação solar" value={`${totalEnergy ? number(totalSolar / totalEnergy * 100) : "0"}%`} help="energia solar / energia entregue" />
          <KpiCard label="Valor medido" value={money(totalAmount)} help="consumo tarifado, sem transação real" />
        </div>
        <DataTable columns={["Carregador", "Estado", "Potência nominal"]}>{snapshot.chargers.map((charger) => <tr key={charger.id}><td>{charger.name}<span>{charger.id}</span></td><td>{charger.status}</td><td>{number(charger.powerKw)} kW</td></tr>)}</DataTable>
      </section>
      <section className="surface panel" data-testid="demo-sessions">
        <SectionHeader title="Sessões compartilhadas com o PWA" subtitle="Recarregar a página preserva o estado confirmado pela API. Inicie uma sessão pelo PWA para medir energia." />
        {!snapshot.sessions.length ? <p>Nenhuma sessão neste cenário. Abra o PWA demonstrativo para iniciar.</p> : <DataTable columns={["Sessão / motorista", "Estado", "Energia / origem", "Financeiro", "Ação"]}>{snapshot.sessions.map((session) => <tr key={session.id}>
          <td><strong>{session.id}</strong><span>{session.driverName} · {session.chargerId}</span></td>
          <td>{session.status === "charging" ? "Carregando" : "Finalizada"}{session.stopReason ? <span>{stopLabels[session.stopReason]}</span> : null}</td>
          <td>{measured(session.energyKwh)} kWh<span>Solar {measured(session.solarEnergyKwh)} · rede {measured(session.gridEnergyKwh)} kWh</span></td>
          <td>{money(session.amount)}<span>Autorização: {money(session.authorizedAmount)} · tarifa {money(session.ratePerKwh)}/kWh</span></td>
          <td>{session.status === "charging" ? <button type="button" disabled={busy} onClick={() => { void mutate(`/sessions/${encodeURIComponent(session.id)}/stop`); }} aria-label={`Encerrar sessão ${session.id}`}>Encerrar recarga</button> : "Concluída"}</td>
        </tr>)}</DataTable>}
      </section>
      <section className="surface panel" data-testid="demo-events">
        <SectionHeader title="Eventos, comandos e automações" subtitle="Evidências persistidas pela API, em ordem do evento mais recente. Não são logs de equipamentos reais." />
        <DataTable columns={["Instante simulado", "Evento", "Efeito"]}>{snapshot.events.slice().reverse().map((event) => <tr key={event.id}><td>{new Date(event.at).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</td><td>{event.type}</td><td>{event.message}{event.sessionId ? <span>{event.sessionId}</span> : null}</td></tr>)}</DataTable>
      </section>
    </> : null}
  </section>;
}

export function AdminSimulatorPage() {
  const { account, state } = useAdminState();
  if (!account) return <Navigate to="/login" replace />;
  if (!demoRuntimeEnabled) return <section className="surface panel"><SectionHeader title="Demonstração integrada desativada" subtitle="Inicie o ambiente demonstrativo documentado para habilitar este console. O simulador visual antigo foi substituído pelo cenário executável da API." /></section>;
  if (!canUseDemoRuntime(state, account)) return <section className="surface panel"><h2>Acesso restrito à demonstração</h2><p>Use uma conta GoodWe com acesso à FIAP ou a proprietária comercial do estabelecimento.</p></section>;
  return <RuntimeConsole />;
}
