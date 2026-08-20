import { useCallback, useState } from "react";
import { GoogleNetworkMap } from "../components/GoogleNetworkMap";
import { PageHeading } from "../components/PageHeading";
import { StatusBadge } from "../components/StatusBadge";
import { adminMapPlantsD0, shortDate } from "../services/adminDemo";

export function NetworkMapPage() {
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(adminMapPlantsD0[0]?.id ?? null);
  const selectedPlant = adminMapPlantsD0.find((plant) => plant.id === selectedPlantId) ?? adminMapPlantsD0[0];
  const selectPlant = useCallback((plantId: string) => setSelectedPlantId(plantId), []);

  return (
    <>
      <PageHeading
        eyebrow="Rede comercial"
        title="Mapa de plantas"
        description="Plantas SEMS+ vinculadas à conta e habilitadas pela operação ChargeGrid."
        action={<StatusBadge label="Google Maps ao vivo" tone="info" />}
      />

      <section className="map-layout">
        <GoogleNetworkMap plants={adminMapPlantsD0} selectedPlantId={selectedPlantId} onSelectPlant={selectPlant} />
        {selectedPlant ? (
          <aside className="map-details">
            <p className="eyebrow">Planta selecionada</p>
            <h2>{selectedPlant.name}</h2>
            <p>{selectedPlant.address}</p>
            <div className="map-detail-status">
              <StatusBadge label={selectedPlant.energyStatus} tone="success" />
              <StatusBadge label={selectedPlant.commercialStatus} tone="warning" />
            </div>
            <dl>
              <div><dt>Carregadores</dt><dd>{selectedPlant.chargerCount}</dd></div>
              <div><dt>Disponíveis</dt><dd>{selectedPlant.availableChargers}</dd></div>
              <div><dt>Última leitura</dt><dd>{shortDate(selectedPlant.observedAt)}</dd></div>
            </dl>
            <p className="map-disclaimer">Posição do D0 é uma referência visual sintética. A integração SEMS+ fornecerá coordenadas autorizadas por planta.</p>
          </aside>
        ) : null}
      </section>
    </>
  );
}
