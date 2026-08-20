import {
  ChargerCommercialStatus,
  ChargerTechnicalStatus,
  CommercialSessionStatus,
  PaymentStatus
} from "@chargegrid/shared";
import { PageHeading } from "../components/PageHeading";
import { StatusBadge } from "../components/StatusBadge";
import {
  commercialStatusLabel,
  demoScenarioD0,
  money,
  paymentStatusLabel,
  sessionStatusLabel,
  shortDate,
  technicalStatusLabel
} from "../services/adminDemo";

export type OperationalSection = "chargers" | "sessions" | "energy" | "financial";

const sectionCopy: Record<OperationalSection, { eyebrow: string; title: string; description: string }> = {
  chargers: { eyebrow: "Operação", title: "Carregadores", description: "Estado técnico GoodWe e disponibilidade comercial ChargeGrid." },
  sessions: { eyebrow: "Operação", title: "Sessões comerciais", description: "Acompanhamento auditável de energia, estado e garantia financeira." },
  energy: { eyebrow: "Energia", title: "Energia e demanda", description: "Telemetria da planta SEMS+ usada para decisões comerciais." },
  financial: { eyebrow: "Financeiro", title: "Tarifas e resultados", description: "Dados comerciais sintéticos do D0, separados da fonte energética." }
};

function toneForCharger(status: ChargerCommercialStatus) {
  if (status === ChargerCommercialStatus.AVAILABLE_TO_START) return "success" as const;
  if (status === ChargerCommercialStatus.FAULTED) return "danger" as const;
  if (status === ChargerCommercialStatus.OCCUPIED || status === ChargerCommercialStatus.RESTRICTED_BY_ENERGY) return "warning" as const;
  return "neutral" as const;
}

function toneForTechnical(status: ChargerTechnicalStatus) {
  if (status === ChargerTechnicalStatus.FAULT || status === ChargerTechnicalStatus.OFFLINE) return "danger" as const;
  if (status === ChargerTechnicalStatus.CHARGING || status === ChargerTechnicalStatus.STARTING) return "info" as const;
  return "success" as const;
}

function toneForSession(status: CommercialSessionStatus) {
  if (status === CommercialSessionStatus.FAULTED || status === CommercialSessionStatus.START_FAILED) return "danger" as const;
  if (status === CommercialSessionStatus.IDLE_GRACE_PERIOD || status === CommercialSessionStatus.SUSPENDED_BY_DEMAND) return "warning" as const;
  if (status === CommercialSessionStatus.CHARGING) return "info" as const;
  return "success" as const;
}

function toneForPayment(status: PaymentStatus) {
  if (status === PaymentStatus.FAILED || status === PaymentStatus.DISPUTED) return "danger" as const;
  if (status === PaymentStatus.AUTHORIZED || status === PaymentStatus.PENDING) return "warning" as const;
  return "success" as const;
}

function ChargersSection() {
  return (
    <section className="admin-panel table-panel">
      <div className="panel-heading"><div><h2>Estado por equipamento</h2><p>Não confundir telemetria técnica com elegibilidade comercial.</p></div><span>{demoScenarioD0.chargers.length} HCA G2</span></div>
      <div className="table-wrap"><table><thead><tr><th>Carregador</th><th>Vaga</th><th>Técnico</th><th>Comercial</th><th>Potência</th><th>Atualizado</th></tr></thead><tbody>
        {demoScenarioD0.chargers.map((charger) => <tr key={charger.id}><td><strong>{charger.commercialName}</strong><small>{charger.id}</small></td><td>{charger.parkingSpot}</td><td><StatusBadge label={technicalStatusLabel[charger.technicalStatus]} tone={toneForTechnical(charger.technicalStatus)} /></td><td><StatusBadge label={commercialStatusLabel[charger.commercialStatus]} tone={toneForCharger(charger.commercialStatus)} /></td><td>{charger.currentPowerKw ?? 0} / {charger.nominalPowerKw} kW</td><td>{shortDate(charger.lastTechnicalUpdateAt)}</td></tr>)}
      </tbody></table></div>
    </section>
  );
}

function SessionsSection() {
  return (
    <section className="admin-panel table-panel">
      <div className="panel-heading"><div><h2>Ciclo comercial</h2><p>StartCharge e StopCharge permanecem comandos assíncronos da API.</p></div><span>{demoScenarioD0.dashboardKpis.activeSessions} ativas</span></div>
      <div className="table-wrap"><table><thead><tr><th>Sessão</th><th>Carregador</th><th>Estado</th><th>Energia</th><th>Estimativa</th><th>Pagamento</th></tr></thead><tbody>
        {demoScenarioD0.sessions.map((session) => {
          const payment = demoScenarioD0.payments[session.sessionId];
          return <tr key={session.sessionId}><td><strong>{session.driverRef}</strong><small>{shortDate(session.startedAt)}</small></td><td>{session.chargerId.replace("charger_demo_", "Aurora ")}</td><td><StatusBadge label={sessionStatusLabel[session.status]} tone={toneForSession(session.status)} /></td><td>{session.energyDeliveredKwh} kWh</td><td>{money(session.costEstimate.amount)}</td><td>{payment ? <StatusBadge label={paymentStatusLabel[payment.paymentStatus]} tone={toneForPayment(payment.paymentStatus)} /> : "—"}</td></tr>;
        })}
      </tbody></table></div>
    </section>
  );
}

function EnergySection() {
  const plant = demoScenarioD0.plant;
  const supply = plant.pvKw + plant.gridImportKw + (plant.batteryDischargeKw ?? 0);
  const demand = plant.buildingLoadKw + plant.evLoadKw + (plant.batteryChargeKw ?? 0) + (plant.gridExportKw ?? 0);
  return <>
    <section className="energy-hero"><div><p className="eyebrow">Estado energético</p><h2>{plant.energyStatus}</h2><p>Envelope comercial disponível para novas sessões.</p></div><strong>{plant.operationalEvLimitKw - plant.evLoadKw} <small>kW de margem EV</small></strong></section>
    <section className="metric-cards"><article><span>Oferta</span><strong>{supply} kW</strong><small>Solar + rede + bateria</small></article><article><span>Demanda</span><strong>{demand} kW</strong><small>Edificação + EV</small></article><article><span>Solar</span><strong>{plant.pvKw} kW</strong><small>Telemetria SEMS+</small></article><article><span>Carga EV</span><strong>{plant.evLoadKw} kW</strong><small>de {plant.operationalEvLimitKw} kW</small></article></section>
    <section className="admin-panel"><div className="panel-heading"><div><h2>Leitura confirmada</h2><p>O ChargeGrid não inventa consumo além da última telemetria.</p></div><span>{shortDate(plant.observedAt)}</span></div><div className="energy-track"><i style={{ width: `${(plant.evLoadKw / plant.operationalEvLimitKw) * 100}%` }} /></div></section>
  </>;
}

function FinancialSection() {
  const settled = demoScenarioD0.financials.filter((item) => item.settlementState === "SETTLED");
  const gross = settled.reduce((sum, item) => sum + (item.grossSettledRevenue ?? 0), 0);
  const commission = settled.reduce((sum, item) => sum + (item.chargegridCommission ?? 0), 0);
  const net = settled.reduce((sum, item) => sum + (item.netFinancialAmount ?? 0), 0);
  return <>
    <section className="metric-cards"><article><span>Tarifa atual</span><strong>{money(demoScenarioD0.tariff.currentPricePerKwh)}</strong><small>por kWh</small></article><article><span>Receita liquidada</span><strong>{money(gross)}</strong><small>sessões confirmadas</small></article><article><span>Comissão ChargeGrid</span><strong>{money(commission)}</strong><small>{demoScenarioD0.chargegridCommissionRate * 100}% oficial</small></article><article><span>Líquido previsto</span><strong>{money(net)}</strong><small>após taxas demonstrativas</small></article></section>
    <section className="admin-panel table-panel"><div className="panel-heading"><div><h2>Política tarifária</h2><p>Fila e lotação não são mecanismos de surge pricing.</p></div><span>{demoScenarioD0.tariff.nextChangeAt.slice(11, 16)} próxima mudança</span></div><div className="table-wrap"><table><thead><tr><th>Faixa</th><th>Horário</th><th>Preço</th><th>Origem</th></tr></thead><tbody>{demoScenarioD0.tariff.segments.map((segment) => <tr key={segment.id}><td>{segment.id.replaceAll("_", " ")}</td><td>{segment.start} — {segment.end}</td><td>{money(segment.pricePerKwh)}/kWh</td><td>ChargeGrid comercial</td></tr>)}</tbody></table></div></section>
  </>;
}

export function OperationalPage({ section }: { section: OperationalSection }) {
  const copy = sectionCopy[section];
  const content = section === "chargers" ? <ChargersSection /> : section === "sessions" ? <SessionsSection /> : section === "energy" ? <EnergySection /> : <FinancialSection />;
  return <><PageHeading {...copy} />{content}</>;
}
