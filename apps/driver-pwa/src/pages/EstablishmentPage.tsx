import { ChargerCommercialStatus, CommercialAvailability } from "@chargegrid/shared";
import { Navigate, Link, useNavigate, useParams } from "react-router-dom";
import { useDriverApp } from "../app/DriverAppContext";
import { AppIcon } from "../components/AppIcon";
import { StatusChip } from "../components/StatusChip";
import { InfoRow, PageIntro, PrimaryButton, SecondaryButton } from "../components/Ui";
import { getPlantById } from "../data/commercialPlants";

const statusPresentation: Record<ChargerCommercialStatus, { label: string; tone: "success" | "info" | "warning" | "danger" | "neutral" }> = {
  AVAILABLE_TO_START: { label: "Disponível", tone: "success" },
  OCCUPIED: { label: "Ocupado", tone: "info" },
  RESTRICTED_BY_ENERGY: { label: "Restrito por energia", tone: "warning" },
  MAINTENANCE: { label: "Manutenção", tone: "neutral" },
  FAULTED: { label: "Falha", tone: "danger" },
  CLOSED: { label: "Fechado", tone: "neutral" },
  UNKNOWN: { label: "Sem confirmação", tone: "neutral" }
};

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function EstablishmentPage() {
  const { establishmentId } = useParams();
  const navigate = useNavigate();
  const plant = getPlantById(establishmentId);
  const { isAuthenticated, joinQueue, selectChargingPoint } = useDriverApp();
  if (!plant) return <Navigate to={isAuthenticated ? "/explore" : "/"} replace />;

  const available = plant.chargers.find((charger) => charger.commercialStatus === ChargerCommercialStatus.AVAILABLE_TO_START);
  const isFull = plant.commercialAvailability === CommercialAvailability.FULL_QUEUE || !available;
  const tariff = plant.tariffFrom?.amount ?? 0;

  function continueRegistered() {
    if (!plant) return;
    if (isFull) {
      joinQueue(plant.id);
      navigate("/queue");
      return;
    }
    if (available) selectChargingPoint(plant.id, available.id);
    navigate("/checkout?mode=driver");
  }

  return <>
    <PageIntro eyebrow={plant.category} title={plant.name}><p>{plant.address}</p></PageIntro>
    <section className="place-hero">
      <img src={plant.imageUrl} alt={`Área de recarga do ${plant.name}`} />
      <div className="place-hero-overlay"><StatusChip label={isFull ? "Lotado · fila ativa" : "Disponível agora"} tone={isFull ? "warning" : "success"} /><strong>{isFull ? `${plant.queueSummary.activeCount} aguardando` : `${plant.availableChargerCount} vagas disponíveis`}</strong></div>
    </section>

    <section className="quick-info-grid">
      <InfoRow icon="route" label="Distância" value={`${plant.distanceKm?.toFixed(1).replace(".", ",")} km`} detail="pela sua região" />
      <InfoRow icon="clock" label="Horário" value={plant.openingHours ?? "Consulte o local"} detail="horário de recarga" />
      <InfoRow icon="plug" label="Potência" value={`até ${plant.nominalPowerKw} kW`} detail="nominal por carregador" />
      <InfoRow icon="card" label="Tarifa agora" value={`${currency.format(tariff)}/kWh`} detail="confirme antes de pagar" />
    </section>

    <a className="route-link" href={`https://www.google.com/maps/dir/?api=1&destination=${plant.position.lat},${plant.position.lng}&destination_place_id=${encodeURIComponent(plant.name)}`} target="_blank" rel="noreferrer"><AppIcon name="route" size={20} /> Abrir rota no Google Maps</a>

    <section className="mobile-card section-card">
      <div className="section-heading"><div><p className="eyebrow">Oferta pública</p><h2>Carregadores</h2></div><span>{plant.chargerCount} no total</span></div>
      <div className="charger-list">
        {plant.chargers.map((charger) => {
          const presentation = statusPresentation[charger.commercialStatus];
          return <article className="charger-row" key={charger.id}>
            <span className="charger-icon"><AppIcon name="plug" /></span>
            <div><strong>{charger.commercialName}</strong><small>Vaga {charger.parkingSpot} · até {charger.nominalPowerKw} kW</small></div>
            <StatusChip label={presentation.label} tone={presentation.tone} />
          </article>;
        })}
      </div>
      <p className="privacy-note">O mapa indica o estabelecimento. A vaga é confirmada no início do atendimento.</p>
    </section>

    <section className="mobile-card tariff-card">
      <div className="section-heading"><div><p className="eyebrow">Antes de autorizar</p><h2>Preço e regras</h2></div>{plant.favorableEnergyCondition ? <StatusChip label="Energia favorável" tone="success" /> : null}</div>
      <div className="price-line"><strong>{currency.format(tariff)}</strong><span>por kWh neste momento</span></div>
      <ul className="rule-list"><li>A tarifa exibida é confirmada novamente antes da autorização.</li><li>15 minutos gratuitos após o fim energético; depois, R$ 0,50/min.</li><li>Fila e lotação não alteram a tarifa.</li><li>A atribuição de vaga acontece no atendimento.</li></ul>
    </section>

    <div className="sticky-action-space">
      {isAuthenticated ? <PrimaryButton onClick={continueRegistered}>{isFull ? "Entrar na fila" : `Recarregar no ${available?.commercialName}`}</PrimaryButton> : <Link className="primary-link" to={`/qr/${plant.qrSlug}`}><AppIcon name="qr" size={20} /> Acessar pelo QR Code</Link>}
      {!isAuthenticated ? <Link className="text-link" to="/login">Entrar para usar fila e histórico</Link> : null}
      <SecondaryButton onClick={() => navigate(isAuthenticated ? "/explore" : "/")}><AppIcon name="map" size={20} /> Voltar</SecondaryButton>
    </div>
  </>;
}
