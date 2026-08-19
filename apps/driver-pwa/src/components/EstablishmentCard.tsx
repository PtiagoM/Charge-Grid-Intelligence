import type { EstablishmentSummary } from "@chargegrid/shared";
import { StatusChip } from "./StatusChip";

interface EstablishmentCardProps {
  establishment: EstablishmentSummary;
  nominalPowerKw: number;
}

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function EstablishmentCard({ establishment, nominalPowerKw }: EstablishmentCardProps) {
  return (
    <article className="establishment-card">
      <div className="card-visual" aria-hidden="true"><span>☀</span><span>⚡</span></div>
      <div className="card-title-row">
        <div><p>Recarga pública · dados sintéticos</p><h2>{establishment.name}</h2></div>
        <StatusChip label="Parcial" tone="warning" />
      </div>
      <p className="address">{establishment.address}</p>
      <div className="driver-metrics">
        <div><span>Disponíveis</span><strong>{establishment.availableChargerCount} de 6</strong></div>
        <div><span>Potência</span><strong>até {nominalPowerKw} kW</strong></div>
        <div><span>Tarifa atual</span><strong>{currency.format(establishment.tariffFrom?.amount ?? 0)}/kWh</strong></div>
        <div><span>Fila</span><strong>{establishment.queueSummary.activeCount === 0 ? "Sem fila" : establishment.queueSummary.activeCount}</strong></div>
      </div>
      <button type="button" className="primary-cta" disabled aria-describedby="bootstrap-note">Ver detalhes</button>
      <small id="bootstrap-note">Fluxo de recarga será implementado por spec futura.</small>
    </article>
  );
}
