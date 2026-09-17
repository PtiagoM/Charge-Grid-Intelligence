import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import type { DemoRuntimeState } from "@chargegrid/shared";
import { InfoNotice, PageIntro, PrimaryButton, SecondaryButton } from "../components/Ui";
import { loadDemo, startDemoSession, stopDemoSession } from "../services/demoApi";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const scenarios = { solar: "geração solar", peak: "pico de demanda", critical: "demanda crítica", offline: "carregadores offline" };
const demandStates = { normal: "normal", alert: "alerta", critical: "crítica", offline: "offline" };

export function DemoPage() {
  const [snapshot, setSnapshot] = useState<DemoRuntimeState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busy, setBusy] = useState(false);
  const [chargerId, setChargerId] = useState("");
  const [driverName, setDriverName] = useState("Motorista Sprint 3");
  const [authorizedAmount, setAuthorizedAmount] = useState(25);
  const [paymentScenario, setPaymentScenario] = useState<"approved" | "declined">("approved");
  const requestSequence = useRef(0);
  const readInFlight = useRef(false);
  const mounted = useRef(false);

  const refresh = useCallback(async () => {
    if (readInFlight.current) return;
    readInFlight.current = true;
    const sequence = ++requestSequence.current;
    try {
      const result = await loadDemo();
      if (mounted.current && sequence === requestSequence.current) {
        setSnapshot(result);
        setError("");
      }
    } catch (caught) {
      if (mounted.current && sequence === requestSequence.current) setError(caught instanceof Error ? caught.message : "Não foi possível carregar a demonstração.");
    } finally {
      readInFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    void refresh();
    return () => { mounted.current = false; };
  }, [refresh]);

  useEffect(() => {
    const timer = window.setInterval(() => { if (!busy) void refresh(); }, 2000);
    return () => window.clearInterval(timer);
  }, [busy, refresh]);

  const available = snapshot?.chargers.filter((charger) => charger.status === "available") ?? [];
  const selectedCharger = available.find((charger) => charger.id === chargerId)?.id ?? available[0]?.id ?? "";

  async function act(action: () => Promise<DemoRuntimeState>) {
    setBusy(true);
    setActionError("");
    const sequence = ++requestSequence.current;
    try {
      const result = await action();
      if (mounted.current && sequence === requestSequence.current) {
        setSnapshot(result);
        setError("");
      }
    } catch (caught) {
      if (mounted.current) setActionError(caught instanceof Error ? caught.message : "Não foi possível concluir a ação.");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }

  function start(event: FormEvent) {
    event.preventDefault();
    void act(() => startDemoSession({ chargerId: selectedCharger, driverName: driverName.trim(), authorizedAmount, paymentScenario }));
  }

  return <>
    <PageIntro eyebrow="Sprint 3 · integração executável" title="Demonstração integrada"><p>Inicie aqui e acompanhe a mesma sessão no painel administrativo.</p></PageIntro>
    <InfoNotice>Ambiente simulado, sem cobrança e sem Stripe. A API mantém o estado compartilhado; os passos de energia são acionados no Admin. Recarregar esta página consulta o mesmo estado.</InfoNotice>
    {loading && !snapshot ? <p role="status">Carregando demonstração…</p> : null}
    {error ? <section role="alert"><p className="form-error">{error}</p><SecondaryButton onClick={() => void refresh()}>Tentar novamente</SecondaryButton></section> : null}
    {actionError ? <p className="form-error" role="alert">{actionError}</p> : null}
    {snapshot ? <>
      <section className="mobile-card"><h2>{snapshot.plant.name}</h2><p>Condição energética: {demandStates[snapshot.plant.demandState]} · cenário {scenarios[snapshot.scenario]}</p><div className="session-metrics"><div><span>Solar</span><strong>{snapshot.plant.solarKw.toFixed(1)} kW</strong></div><div><span>{snapshot.plant.gridKw < 0 ? "Exportação para rede" : "Importação da rede"}</span><strong>{Math.abs(snapshot.plant.gridKw).toFixed(1)} kW</strong></div><div><span>Recarga</span><strong>{snapshot.plant.evKw.toFixed(1)} kW</strong></div><div><span>Relógio simulado</span><strong>{new Date(snapshot.now).toLocaleTimeString("pt-BR", { timeZone: "UTC" })} UTC</strong></div></div></section>
      <form className="auth-form mobile-card" onSubmit={start}>
        <h2>Nova recarga simulada</h2>
        <label htmlFor="demo-driver">Nome do motorista</label><input id="demo-driver" value={driverName} onChange={(event) => setDriverName(event.target.value)} required maxLength={80} disabled={busy} />
        <label htmlFor="demo-charger">Carregador disponível</label><select id="demo-charger" value={selectedCharger} onChange={(event) => setChargerId(event.target.value)} disabled={busy || !available.length}>{available.length ? available.map((charger) => <option key={charger.id} value={charger.id}>{charger.name} · {charger.powerKw} kW</option>) : <option value="">Nenhum carregador disponível</option>}</select>
        <label htmlFor="demo-limit">Limite simulado (R$)</label><input id="demo-limit" type="number" min={1} max={500} step="0.01" value={authorizedAmount} onChange={(event) => setAuthorizedAmount(Number(event.target.value))} required disabled={busy} />
        <label htmlFor="demo-payment">Resultado do pagamento simulado</label><select id="demo-payment" value={paymentScenario} onChange={(event) => setPaymentScenario(event.target.value as "approved" | "declined")} disabled={busy}><option value="approved">Aprovado</option><option value="declined">Recusado</option></select>
        <PrimaryButton type="submit" disabled={busy || !selectedCharger || Boolean(error)}>{busy ? "Processando…" : "Iniciar recarga simulada"}</PrimaryButton>
      </form>
      <section aria-label="Sessões integradas"><h2>Sessões compartilhadas com o Admin</h2>{snapshot.sessions.length ? [...snapshot.sessions].reverse().map((session) => <article className="mobile-card" key={session.id} data-testid={`demo-session-${session.id}`}>
        <h3>{session.driverName} · {snapshot.chargers.find((charger) => charger.id === session.chargerId)?.name ?? session.chargerId}</h3>
        <p>{session.status === "charging" ? "Recarga em andamento" : "Recarga concluída"} · {session.id}</p>
        <div className="session-metrics"><div><span>Energia medida no simulador</span><strong>{session.energyKwh.toFixed(3)} kWh</strong></div><div><span>Custo</span><strong>{currency.format(session.amount)}</strong></div><div><span>Limite autorizado</span><strong>{currency.format(session.authorizedAmount)}</strong></div><div><span>Energia solar</span><strong>{session.solarEnergyKwh.toFixed(3)} kWh</strong></div></div>
        {session.status === "charging" ? <SecondaryButton disabled={busy || Boolean(error)} onClick={() => void act(() => stopDemoSession(session.id))}>Encerrar recarga de {session.driverName}</SecondaryButton> : <p role="status">Comprovante simulado: {currency.format(session.amount)} · {session.energyKwh.toFixed(3)} kWh · motivo: {session.stopReason === "financial_limit" ? "limite financeiro atingido" : session.stopReason === "offline" ? "carregador offline" : "encerrada pelo usuário"}. Sem transação financeira real.</p>}
      </article>) : <p>Nenhuma sessão. Inicie uma recarga para demonstrar a integração.</p>}</section>
    </> : null}
  </>;
}
