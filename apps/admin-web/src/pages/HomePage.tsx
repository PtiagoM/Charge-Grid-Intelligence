import { ChargerCommercialStatus, PlantEnergyStatus } from "@chargegrid/shared";
import { StatusBadge } from "../components/StatusBadge";
import { getInitialDemoSnapshot } from "../services/demo";

const number = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });

const commercialLabels: Record<ChargerCommercialStatus, string> = {
  AVAILABLE_TO_START: "Disponível",
  OCCUPIED: "Ocupado",
  RESTRICTED_BY_ENERGY: "Restrito por energia",
  MAINTENANCE: "Em manutenção",
  FAULTED: "Falha",
  CLOSED: "Fechado",
  UNKNOWN: "Desconhecido"
};

function chargerTone(status: ChargerCommercialStatus) {
  if (status === ChargerCommercialStatus.AVAILABLE_TO_START) return "success" as const;
  if (status === ChargerCommercialStatus.FAULTED) return "danger" as const;
  if (status === ChargerCommercialStatus.OCCUPIED || status === ChargerCommercialStatus.RESTRICTED_BY_ENERGY) return "warning" as const;
  return "neutral" as const;
}

export function HomePage() {
  const demo = getInitialDemoSnapshot();
  const supply = demo.plant.pvKw + demo.plant.gridImportKw + (demo.plant.batteryDischargeKw ?? 0);
  const demand = demo.plant.buildingLoadKw + demo.plant.evLoadKw + (demo.plant.batteryChargeKw ?? 0) + (demo.plant.gridExportKw ?? 0);

  return (
    <>
      <header className="page-heading">
        <div>
          <p className="eyebrow">ChargeGrid Intelligence</p>
          <h1>Fundação administrativa</h1>
          <p>Leitura compartilhada da fotografia oficial D0, sem regras de produto no navegador.</p>
        </div>
        <StatusBadge label={demo.plant.energyStatus === PlantEnergyStatus.NORMAL ? "Energia normal" : demo.plant.energyStatus} tone="success" />
      </header>

      <section className="kpi-grid" aria-label="Resumo de demonstração">
        <article className="kpi-card"><span>Sessões ativas</span><strong>{demo.dashboardKpis.activeSessions}</strong><small>2 carregando, 1 em tolerância</small></article>
        <article className="kpi-card"><span>Vagas disponíveis</span><strong>{demo.establishment.availableChargerCount}</strong><small>de {demo.chargers.length} carregadores</small></article>
        <article className="kpi-card"><span>Carga EV</span><strong>{number.format(demo.plant.evLoadKw)} kW</strong><small>limite operacional {number.format(demo.plant.operationalEvLimitKw)} kW</small></article>
        <article className="kpi-card"><span>Tarifa atual</span><strong>R$ {number.format(demo.tariff.currentPricePerKwh)}</strong><small>por kWh · muda às 18:00</small></article>
      </section>

      <section className="content-grid">
        <article className="content-card">
          <div className="card-heading">
            <div><p className="eyebrow">Cenário D0</p><h2>{demo.establishment.name}</h2></div>
            <StatusBadge label="Parcialmente disponível" tone="warning" />
          </div>
          <p>{demo.establishment.address}</p>
          <div className="energy-balance">
            <div><span>Oferta</span><strong>{number.format(supply)} kW</strong><small>PV 36 + rede 18</small></div>
            <span aria-hidden="true">=</span>
            <div><span>Demanda</span><strong>{number.format(demand)} kW</strong><small>prédio 42 + EV 12</small></div>
          </div>
        </article>

        <article className="content-card chargers-card">
          <div className="card-heading"><div><p className="eyebrow">GoodWe mock</p><h2>Carregadores</h2></div><small>6 × HCA G2 · 7 kW</small></div>
          <div className="charger-list">
            {demo.chargers.map((charger) => (
              <div className="charger-row" key={charger.id}>
                <div><strong>{charger.commercialName}</strong><small>Vaga {charger.parkingSpot} · {charger.technicalStatus}</small></div>
                <StatusBadge label={commercialLabels[charger.commercialStatus]} tone={chargerTone(charger.commercialStatus)} />
              </div>
            ))}
          </div>
        </article>
      </section>
    </>
  );
}
