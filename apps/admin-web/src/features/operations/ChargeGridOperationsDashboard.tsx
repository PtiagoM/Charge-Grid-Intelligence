import { useMemo, useState } from "react";
import { useAdminState } from "../../app/AdminState";
import type { Charger, ChargerTelemetry, Session } from "../../domain/admin";

type MonitorMetric = "sessions" | "energy" | "revenue";
type MonitorRange = "day" | "week" | "month";

interface ChargeGridOperationsDashboardProps {
  establishmentId: string;
  scenario: "full" | "live";
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

const metricLabels: Record<MonitorMetric, string> = {
  sessions: "Sessões",
  energy: "Energia",
  revenue: "Receita"
};

const chartProfiles: Record<MonitorMetric, number[]> = {
  sessions: [4, 4, 2, 3, 4, 7, 10, 14, 19, 27, 36, 43, 45, 57, 48, 55, 64, 73, 81, 83, 84, 88, 93, 86, 95, 90, 86, 83, 78, 81, 75, 67, 66, 61, 52, 50, 49, 38, 32, 26, 18, 15, 12, 10, 6],
  energy: [3, 2, 2, 3, 4, 7, 11, 15, 21, 29, 38, 48, 53, 59, 55, 61, 69, 76, 84, 86, 87, 90, 94, 89, 96, 91, 88, 84, 82, 86, 80, 73, 71, 66, 57, 54, 52, 42, 35, 29, 22, 18, 14, 11, 7],
  revenue: [2, 2, 1, 2, 3, 5, 8, 13, 18, 24, 31, 39, 44, 52, 47, 54, 63, 70, 79, 82, 83, 87, 91, 85, 94, 89, 86, 82, 79, 84, 78, 71, 68, 62, 54, 51, 49, 39, 33, 27, 20, 16, 12, 9, 5]
};

const comparisonProfile = [3, 2, 2, 2, 3, 4, 6, 9, 13, 18, 23, 29, 31, 39, 34, 38, 43, 48, 52, 53, 54, 56, 58, 53, 58, 55, 53, 50, 48, 51, 47, 43, 41, 38, 31, 30, 29, 22, 18, 15, 10, 8, 6, 4, 2];
const hourLabels = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00", "24:00"];

const demoAttention: AttentionRow[] = [
  { id: "settlement", tone: "danger", message: "Sessão #0993 com liquidação pendente", age: "8 min atrás", subject: "CG-02 (A02)", href: "#/mvp/finance" },
  { id: "charger", tone: "warn", message: "Carregador CG-04 (A04) indisponível", age: "15 min atrás", subject: "CG-04 (A04)", href: "#/mvp/chargers" },
  { id: "energy", tone: "notice", message: "Margem energética baixa (18%). Novos inícios podem ser temporariamente bloqueados", age: "22 min atrás", subject: "Hub FIAP Aclimação", href: "#/mvp/energy" },
  { id: "vehicle", tone: "warn", message: "Veículo ainda conectado após carga finalizada", age: "25 min atrás", subject: "CG-05 (A05)", href: "#/mvp/sessions" }
];

function money(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function number(value: number, digits = 1) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function chargerName(chargerId: string, chargers: Charger[]) {
  const index = chargers.findIndex((item) => item.id === chargerId);
  const suffix = chargerId.match(/(\d+)$/)?.[1] ?? chargerId;
  return `CG-${suffix.padStart(2, "0")} (A${String(Math.max(0, index) + 1).padStart(2, "0")})`;
}

function shortSessionId(id: string) {
  return id.match(/(\d+)$/)?.[1] ?? id;
}

function chartPath(values: number[], max = 100) {
  return values.map((value, index) => {
    const x = (index / (values.length - 1)) * 1200;
    const y = 154 - (value / max) * 132;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }).join(" ");
}

function areaPath(values: number[], max = 100) {
  return `${chartPath(values, max)} L1200 154 L0 154 Z`;
}

export function ChargeGridOperationsDashboard({ establishmentId, scenario, chargers, telemetry, sessions }: ChargeGridOperationsDashboardProps) {
  const { state } = useAdminState();
  const [metric, setMetric] = useState<MonitorMetric>("sessions");
  const [range, setRange] = useState<MonitorRange>("day");
  const energy = state.energy.find((item) => item.establishmentId === establishmentId);
  const establishment = state.establishments.find((item) => item.id === establishmentId);
  const incidents = state.incidents.filter((item) => item.establishmentId === establishmentId && item.status !== "RESOLVED");
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

  const performance = scenario === "full"
    ? { revenue: 12458.9, energy: 1248.6, completed: 42, utilization: 78, averageTicket: 296.64, averageDuration: 37 }
    : livePerformance;

  const attentionRows = useMemo<AttentionRow[]>(() => {
    if (scenario === "full") return demoAttention;
    const rows: AttentionRow[] = [];
    const pending = transactions.find((item) => item.settlementStatus === "PENDING");
    if (pending) rows.push({ id: pending.id, tone: "danger", message: `Sessão #${shortSessionId(pending.sessionId)} com liquidação pendente`, age: "agora", subject: chargerName(sessions.find((item) => item.id === pending.sessionId)?.chargerId ?? "—", chargers), href: "#/mvp/finance" });
    incidents.slice(0, 2).forEach((incident) => rows.push({ id: incident.id, tone: incident.severity === "HIGH" || incident.severity === "CRITICAL" ? "danger" : "warn", message: incident.title, age: new Date(incident.updatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), subject: incident.chargerId ? chargerName(incident.chargerId, chargers) : establishment?.name ?? "Planta", href: `#/mvp/incident?est=${establishmentId}&incident=${incident.id}` }));
    if (energy && energy.powerMarginPercent < 25) rows.push({ id: "energy-margin", tone: "notice", message: `Margem energética baixa (${number(energy.powerMarginPercent, 0)}%). Novos inícios podem ser temporariamente bloqueados`, age: "agora", subject: establishment?.name ?? "Planta", href: `#/mvp/energy?est=${establishmentId}` });
    const connectedFinished = sessions.find((item) => item.status === "finished" && telemetry.some((telemetryItem) => telemetryItem.chargerId === item.chargerId && telemetryItem.vehicleConnected));
    if (connectedFinished) rows.push({ id: "connected-finished", tone: "warn", message: "Veículo ainda conectado após carga finalizada", age: "agora", subject: chargerName(connectedFinished.chargerId, chargers), href: `#/mvp/session?est=${establishmentId}&session=${connectedFinished.id}` });
    return rows.slice(0, 4);
  }, [chargers, energy, establishment?.name, establishmentId, incidents, scenario, sessions, telemetry, transactions]);

  const demand = scenario === "full"
    ? { current: 62.4, limit: 150, margin: 87.6, marginPercent: 58, state: "Normal", canStart: true }
    : { current: energy?.demandKw ?? 0, limit: energy?.contractedLimitKw ?? 0, margin: Math.max(0, (energy?.contractedLimitKw ?? 0) - (energy?.demandKw ?? 0)), marginPercent: energy?.powerMarginPercent ?? 0, state: energy?.demandState ?? "Sem leitura", canStart: energy?.demandState !== "Crítico" };

  const primaryValues = chartProfiles[metric].map((value) => range === "day" ? value : range === "week" ? Math.min(100, value * .9 + 5) : Math.min(100, value * .82 + 9));
  const primaryLabel = metricLabels[metric];
  const secondaryLabel = metric === "sessions" ? "Energia (kWh)" : "Sessões";

  return <section className="cg-insights" data-testid="chargegrid-operations-dashboard" aria-label="Indicadores da operação ChargeGrid">
    <section className="cg-insight-card cg-attention">
      <header><h2>Atenção</h2></header>
      {attentionRows.length ? <div>{attentionRows.map((item) => <a href={item.href} className={`is-${item.tone}`} key={item.id}><span className="cg-attention-icon">△</span><strong>{item.message}</strong><time>{item.age}</time><span>{item.subject}</span><i>›</i></a>)}</div> : <p>Nenhuma atenção operacional aberta neste momento.</p>}
    </section>

    <section className="cg-insight-card cg-commercial-performance">
      <header><h2>Performance comercial</h2></header>
      <dl>
        <div><dt>Receita</dt><dd>{money(performance.revenue)}</dd><small>↗ 8,6% <span>vs ontem</span></small></div>
        <div><dt>Energia entregue</dt><dd>{number(performance.energy)} <em>kWh</em></dd><small>↗ 6,3% <span>vs ontem</span></small></div>
        <div><dt>Sessões concluídas</dt><dd>{performance.completed}</dd><small>↗ 5,0% <span>vs ontem</span></small></div>
        <div><dt>Utilização</dt><dd>{performance.utilization}%</dd><small>↗ 3 p.p. <span>vs ontem</span></small></div>
        <div><dt>Ticket médio</dt><dd>{money(performance.averageTicket)}</dd><small>↗ 3,2% <span>vs ontem</span></small></div>
        <div><dt>Duração média</dt><dd>{performance.averageDuration} <em>min</em></dd><small>↗ 2 min <span>vs ontem</span></small></div>
      </dl>
    </section>

    <section className="cg-insight-card cg-monitoring">
      <header>
        <div><h2>Monitoramento</h2><nav aria-label="Métrica do monitoramento">{(Object.keys(metricLabels) as MonitorMetric[]).map((item) => <button type="button" className={metric === item ? "is-active" : ""} aria-pressed={metric === item} onClick={() => setMetric(item)} key={item}>{metricLabels[item]}</button>)}</nav></div>
        <nav aria-label="Período do monitoramento"><button type="button" className={range === "day" ? "is-active" : ""} aria-pressed={range === "day"} onClick={() => setRange("day")}>Dia</button><button type="button" className={range === "week" ? "is-active" : ""} aria-pressed={range === "week"} onClick={() => setRange("week")}>Semana</button><button type="button" className={range === "month" ? "is-active" : ""} aria-pressed={range === "month"} onClick={() => setRange("month")}>Mês</button><span aria-hidden="true">▣</span></nav>
      </header>
      <div className="cg-chart-wrap" aria-label={`Gráfico de ${primaryLabel.toLowerCase()} por hora`}>
        <span className="cg-chart-axis-title">{primaryLabel}</span><span className="cg-chart-axis-title is-right">kWh</span>
        <div className="cg-chart-left-scale" aria-hidden="true"><span>100</span><span>80</span><span>60</span><span>40</span><span>20</span><span>0</span></div>
        <div className="cg-chart-right-scale" aria-hidden="true"><span>250</span><span>200</span><span>150</span><span>100</span><span>50</span><span>0</span></div>
        <svg className="cg-monitor-chart" viewBox="0 0 1200 170" preserveAspectRatio="none" role="img" aria-label={`${primaryLabel} e ${secondaryLabel} ao longo do período`}>
          <defs><linearGradient id="cg-monitor-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ff272f" stopOpacity=".32" /><stop offset="1" stopColor="#ff272f" stopOpacity=".015" /></linearGradient></defs>
          <g className="cg-chart-grid"><path d="M0 22H1200M0 48H1200M0 74H1200M0 101H1200M0 127H1200M0 154H1200" /></g>
          <path className="cg-chart-area" d={areaPath(primaryValues)} />
          <path className="cg-chart-primary" d={chartPath(primaryValues)} />
          <path className="cg-chart-secondary" d={chartPath(comparisonProfile)} />
        </svg>
        <div className="cg-chart-hours" aria-hidden="true">{hourLabels.map((hour) => <span key={hour}>{hour}</span>)}</div>
        <div className="cg-chart-legend"><span className="is-primary">{primaryLabel}</span><span>{secondaryLabel}</span></div>
      </div>
    </section>

    <section className="cg-insight-card cg-energy-condition">
      <header><h2>Demanda e condição energética</h2></header>
      <dl>
        <div><dt>Carga EV atual</dt><dd>{number(demand.current)} <em>kW</em></dd></div>
        <div><dt>Limite operacional</dt><dd>{number(demand.limit)} <em>kW</em></dd></div>
        <div className="is-positive"><dt>Margem disponível</dt><dd>{number(demand.margin)} <em>kW ({number(demand.marginPercent, 0)}%)</em></dd></div>
        <div><dt>Condição energética</dt><dd><span className={`cg-condition-pill ${demand.state === "Crítico" ? "is-critical" : demand.state === "Alerta" ? "is-alert" : ""}`}>{demand.state}</span></dd></div>
        <div className="is-positive"><dt>Novos inícios permitidos</dt><dd>{demand.canStart ? "Sim" : "Não"}</dd></div>
      </dl>
    </section>

  </section>;
}
