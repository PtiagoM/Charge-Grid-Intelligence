import { useCallback, useState } from "react";
import { GoogleNetworkMap } from "../components/GoogleNetworkMap";
import { KpiCard, SectionHeader, StatusTabs } from "../components/SemsUi";
import { StatusBadge } from "../components/StatusBadge";
import { adminMapPlantsD0, shortDate } from "../services/adminDemo";

export function NetworkMapPage() {
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(adminMapPlantsD0[0]?.id ?? null);
  const selected = adminMapPlantsD0.find((plant) => plant.id === selectedPlantId) ?? adminMapPlantsD0[0];
  const selectPlant = useCallback((plantId: string) => setSelectedPlantId(plantId), []);
  return <>
    <section className="sems-dashboard-map">
      <GoogleNetworkMap plants={adminMapPlantsD0} selectedPlantId={selectedPlantId} onSelectPlant={selectPlant} />
      <div className="sems-dashboard-title"><h2>Mapa de plantas</h2><p>Plantas energéticas SEMS+ habilitadas para operação comercial nesta conta.</p></div>
    </section>
    {selected ? <section className="surface panel sems-panel">
      <SectionHeader title={selected.name} subtitle={selected.address} action={<StatusBadge label="Google Maps ao vivo" tone="info" />} />
      <StatusTabs items={[{ label: "Todos", count: selected.chargerCount, tone: "info" }, { label: "Disponíveis", count: selected.availableChargers, tone: "good" }, { label: "Em uso", count: 3, tone: "danger" }, { label: "Manutenção", count: 1, tone: "warn" }, { label: "Falha", count: 1, tone: "danger" }]} />
      <div className="kpi-grid four-cols"><KpiCard label="Carregadores" value={selected.chargerCount} help="HCA G2 vinculados" /><KpiCard label="Disponíveis" value={selected.availableChargers} help="elegíveis comercialmente" accent="good" /><KpiCard label="Estado energético" value={selected.energyStatus} help="telemetria normalizada" /><KpiCard label="Última leitura" value={shortDate(selected.observedAt)} help="fotografia D0" /></div>
      <article className="assistant-card"><p>A coordenada exibida no cenário D0 é sintética. Em produção, cada ponto virá das plantas autorizadas no SEMS+ e uma conta poderá visualizar uma ou várias plantas sem mudar de perfil.</p></article>
    </section> : null}
  </>;
}
