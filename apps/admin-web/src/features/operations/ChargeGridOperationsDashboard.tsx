import { useMemo } from "react";
import { useAdminState } from "../../app/AdminState";
import type { Charger, ChargerTelemetry, Session } from "../../domain/admin";

interface ChargeGridOperationsDashboardProps {
  establishmentId: string;
  chargers: Charger[];
  telemetry: ChargerTelemetry[];
  sessions: Session[];
}

interface AttentionRow {
  id: string;
  tone: "danger" | "warn" | "notice";
  message: string;
  age: string;
  subject: string;
  href: string;
}


function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function number(value: number, digits = 1) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function chargerName(chargerId: string, chargers: Charger[]) {
  const charger = chargers.find((item) => item.id === chargerId);
  return charger ? `${charger.identifier}${charger.parkingSpot ? ` (${charger.parkingSpot})` : ""}` : chargerId;
}

function shortSessionId(id: string) {
  return id.match(/(\d+)$/)?.[1] ?? id;
}

export function ChargeGridOperationsDashboard({ establishmentId, chargers, telemetry, sessions }: ChargeGridOperationsDashboardProps) {
  const { state } = useAdminState();
  const energy = state.energy.find((item) => item.establishmentId === establishmentId);
  const establishment = state.establishments.find((item) => item.id === establishmentId);
  const incidents = state.incidents.filter((item) => item.establishmentId === establishmentId && item.status !== "RESOLVED" && item.conditionActive !== false);
  const transactions = state.paymentTransactions.filter((item) => item.establishmentId === establishmentId);

  const livePerformance = useMemo(() => {
    const completed = sessions.filter((item) => item.status === "finished");
    const recognizedRevenue = sessions.reduce((sum, item) => sum + (item.finalAmount ?? item.consumedAmount), 0);
    const deliveredEnergy = sessions.reduce((sum, item) => sum + item.energyKwh, 0);
    const occupied = telemetry.filter((item) => item.vehicleConnected || ["CONNECTED", "CHARGING"].includes(item.connectorState)).length;
    return {
      revenue: recognizedRevenue,
      energy: deliveredEnergy,
      completed: completed.length,
      utilization: chargers.length ? Math.round((occupied / chargers.length) * 100) : 0,
      averageTicket: completed.length ? completed.reduce((sum, item) => sum + (item.finalAmount ?? item.consumedAmount), 0) / completed.length : 0,
      averageDuration: completed.length ? Math.round(completed.reduce((sum, item) => sum + item.durationMinutes, 0) / completed.length) : 0
    };
  }, [chargers.length, sessions, telemetry]);

  const performance = livePerformance;

  const attentionRows = useMemo<AttentionRow[]>(() => {
    const rows: AttentionRow[] = [];
    const pending = transactions.find((item) => item.settlementStatus === "PENDING");
    if (pending) rows.push({ id: pending.id, tone: "danger", message: `Sessão #${shortSessionId(pending.sessionId)} com liquidação pendente`, age: "agora", subject: chargerName(sessions.find((item) => item.id === pending.sessionId)?.chargerId ?? "—", chargers), href: "#/mvp/finance" });
    incidents.slice(0, 2).forEach((incident) => rows.push({ id: incident.id, tone: incident.severity === "HIGH" || incident.severity === "CRITICAL" ? "danger" : "warn", message: incident.title, age: new Date(incident.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), subject: incident.chargerId ? chargerName(incident.chargerId, chargers) : establishment?.name ?? "Planta", href: `#/mvp/incident?est=${establishmentId}&incident=${incident.id}` }));
    if (energy && energy.powerMarginPercent < 25) rows.push({ id: "energy-margin", tone: "notice", message: `Margem energética baixa (${number(energy.powerMarginPercent, 0)}%). Novos inícios podem ser temporariamente bloqueados`, age: "agora", subject: establishment?.name ?? "Planta", href: `#/mvp/energy?est=${establishmentId}` });
    const connectedFinished = sessions.find((item) => ["energy_finished", "settling"].includes(item.status) && chargers.find((charger) => charger.id === item.chargerId)?.currentSessionId === item.id && telemetry.some((telemetryItem) => telemetryItem.chargerId === item.chargerId && telemetryItem.vehicleConnected));
    if (connectedFinished) rows.push({ id: "connected-finished", tone: "warn", message: "Veículo ainda conectado após carga finalizada", age: "agora", subject: chargerName(connectedFinished.chargerId, chargers), href: `#/mvp/session?est=${establishmentId}&session=${connectedFinished.id}` });
    return rows.slice(0, 4);
  }, [chargers, energy, establishment?.name, establishmentId, incidents, sessions, telemetry, transactions]);

  const demand = energy ? { current: energy.demandKw, limit: energy.contractedLimitKw, margin: Math.max(0, energy.contractedLimitKw - energy.demandKw), marginPercent: energy.powerMarginPercent, state: energy.demandState, canStart: energy.decision?.canAdmit ?? false } : null;

  return <section className="cg-insights" data-testid="chargegrid-operations-dashboard" aria-label="Indicadores da operação ChargeGrid">
    <section className="cg-insight-card cg-attention">
      <header><h2>Atenção</h2></header>
      {attentionRows.length ? <div>{attentionRows.map((item) => <a href={item.href} className={`is-${item.tone}`} key={item.id}><span className="cg-attention-icon">△</span><strong>{item.message}</strong><time>{item.age}</time><span>{item.subject}</span><i>›</i></a>)}</div> : <p>Nenhuma atenção operacional aberta neste momento.</p>}
    </section>

    <section className="cg-insight-card cg-commercial-performance">
      <header><h2>Performance comercial</h2></header>
      <dl>
        <div><dt>Receita</dt><dd>{money(performance.revenue)}</dd><small>sessões persistidas</small></div>
        <div><dt>Energia entregue</dt><dd>{number(performance.energy)} <em>kWh</em></dd><small>sessões persistidas</small></div>
        <div><dt>Sessões concluídas</dt><dd>{performance.completed}</dd><small>registros liquidados</small></div>
        <div><dt>Utilização</dt><dd>{performance.utilization}%</dd><small>telemetria atual</small></div>
        <div><dt>Ticket médio</dt><dd>{money(performance.averageTicket)}</dd><small>sessões concluídas</small></div>
        <div><dt>Duração média</dt><dd>{performance.averageDuration} <em>min</em></dd><small>sessões concluídas</small></div>
      </dl>
    </section>

    <section className="cg-insight-card cg-monitoring">
      <header><h2>Monitoramento</h2></header>
      <div className="operations-empty"><strong>Série temporal não exposta nesta superfície.</strong><span>Os indicadores acima usam sessões e telemetria persistidas; o histórico acumulado está disponível nos relatórios de energia.</span></div>
    </section>

    <section className="cg-insight-card cg-energy-condition">
      <header><h2>Demanda e condição energética</h2></header>
      <dl>
        <div><dt>Carga EV atual</dt><dd>{demand ? `${number(demand.current)} kW` : "—"}</dd></div>
        <div><dt>Limite operacional</dt><dd>{demand ? `${number(demand.limit)} kW` : "—"}</dd></div>
        <div className={demand ? "is-positive" : ""}><dt>Margem disponível</dt><dd>{demand ? `${number(demand.margin)} kW (${number(demand.marginPercent, 0)}%)` : "—"}</dd></div>
        <div><dt>Condição energética</dt><dd><span className={`cg-condition-pill ${demand?.state === "Crítico" ? "is-critical" : demand?.state === "Alerta" ? "is-alert" : ""}`}>{demand?.state ?? "Sem leitura"}</span></dd></div>
        <div className={demand?.canStart ? "is-positive" : ""}><dt>Novos inícios permitidos</dt><dd>{demand ? demand.canStart ? "Sim" : "Não" : "Indisponível"}</dd></div>
      </dl>
    </section>

  </section>;
}
