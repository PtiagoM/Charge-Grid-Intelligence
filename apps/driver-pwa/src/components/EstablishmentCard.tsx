import { CommercialAvailability } from "@chargegrid/shared";
import { Link } from "react-router-dom";
import type { CommercialPlant } from "../data/commercialPlants";
import { AppIcon } from "./AppIcon";
import { StatusChip } from "./StatusChip";

interface EstablishmentCardProps {
  plant: CommercialPlant;
  distanceKm?: number;
  selected?: boolean;
  recommendationLabel?: string;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const availability = {
  [CommercialAvailability.OPEN_AVAILABLE]: { label: "Disponível", tone: "success" as const },
  [CommercialAvailability.OPEN_PARTIAL]: { label: "Parcial", tone: "warning" as const },
  [CommercialAvailability.FULL_QUEUE]: { label: "Com fila", tone: "info" as const },
  [CommercialAvailability.CLOSED]: { label: "Fechado", tone: "neutral" as const },
  [CommercialAvailability.MAINTENANCE]: { label: "Manutenção", tone: "neutral" as const },
  [CommercialAvailability.FAULT]: { label: "Indisponível", tone: "danger" as const }
};

export function EstablishmentCard({ plant, distanceKm, selected, recommendationLabel }: EstablishmentCardProps) {
  const status = availability[plant.commercialAvailability];
  return (
    <article className={`establishment-card ${selected ? "is-selected" : ""}`}>
      {recommendationLabel ? <p className="recommendation-label"><AppIcon name="check" size={15} /> {recommendationLabel}</p> : null}
      <div className="card-visual"><img src={plant.imageUrl} alt={`Área de recarga do ${plant.name}`} /><span>{plant.category} · {plant.openingHours}</span></div>
      <div className="card-title-row">
        <div><p>{distanceKm?.toFixed(1).replace(".", ",") ?? plant.distanceKm?.toFixed(1).replace(".", ",")} km de distância</p><h2>{plant.name}</h2></div>
        <StatusChip label={status.label} tone={status.tone} />
      </div>
      <p className="address">{plant.address}</p>
      <div className="driver-metrics">
        <div><span>Disponíveis</span><strong>{plant.availableChargerCount} de {plant.chargerCount}</strong></div>
        <div><span>Potência</span><strong>até {plant.nominalPowerKw} kW</strong></div>
        <div><span>Tarifa atual</span><strong>{currency.format(plant.tariffFrom?.amount ?? 0)}/kWh</strong></div>
        <div><span>Fila</span><strong>{plant.queueSummary.activeCount === 0 ? "Sem fila" : `${plant.queueSummary.activeCount} aguardando`}</strong></div>
      </div>
      <Link className="primary-link" to={`/place/${plant.id}`}>Ver detalhes</Link>
    </article>
  );
}
