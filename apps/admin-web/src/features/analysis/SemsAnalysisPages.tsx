import { useState } from "react";
import { useAdminState } from "../../app/AdminState";
import { number } from "../../components/AdminUi";

const comparisonMetrics = ["Endereço da usina", "Potência nominal", "Capacidade de armazenamento", "Potência FV", "Potência de carga", "Energia entregue", "Receita ChargeGrid"];

export function SemsIvDiagnosisPage({ establishmentId: _establishmentId }: { establishmentId?: string }) {
  return <section className="surface panel sems-analysis-page"><div className="sems-analysis-empty"><strong>Diagnóstico IV indisponível</strong><span>O protótipo não possui provider de inversor nem medições IV. A operação de recarga continua disponível em ChargeGrid.</span></div></section>;
}

export function SemsComparisonPage({ establishmentId }: { establishmentId?: string }) {
  const { state } = useAdminState();
  const locations = state.locations.filter((item) => !establishmentId || item.establishmentId === establishmentId);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([]);
  const [generated, setGenerated] = useState(false);
  function toggle(current: string[], value: string, setter: (value: string[]) => void) { setter(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]); setGenerated(false); }
  return <section className="surface panel sems-comparison-page"><header><nav><button className="is-active" type="button">Comparação de usinas</button><span>Comparação de dispositivos</span></nav><button type="button" disabled={!selectedLocations.length || !selectedMetrics.length} onClick={() => setGenerated(true)}>Gerar resultados</button></header><div className="sems-comparison-grid"><aside><h2><b>1</b> Selecionar usina</h2><p>Usinas selecionadas: <strong>{selectedLocations.length}</strong></p>{locations.map((location) => <label key={location.id}><input type="checkbox" checked={selectedLocations.includes(location.id)} onChange={() => toggle(selectedLocations, location.id, setSelectedLocations)} />{location.name}</label>)}</aside><div><h2><b>2</b> Selecione indicadores</h2>{comparisonMetrics.map((metric) => <label key={metric}><input type="checkbox" checked={selectedMetrics.includes(metric)} onChange={() => toggle(selectedMetrics, metric, setSelectedMetrics)} />{metric}</label>)}</div><article><h2>Indicadores selecionados <strong>{selectedMetrics.length}</strong></h2>{generated ? <div className="sems-comparison-results">{selectedLocations.map((id) => { const location = locations.find((item) => item.id === id); const chargers = state.chargers.filter((item) => item.locationId === id); return <section key={id}><h3>{location?.name}</h3><p><span>Carregadores</span><strong>{chargers.length}</strong></p><p><span>Potência</span><strong>{number(chargers.reduce((sum, item) => sum + item.powerKw, 0))} kW</strong></p><p><span>Energia hoje</span><strong>{number(chargers.reduce((sum, item) => sum + item.todayEnergyKwh, 0))} kWh</strong></p></section>; })}</div> : <div className="sems-analysis-empty"><strong>Selecione usinas e métricas</strong><span>Os resultados comparativos aparecerão aqui.</span></div>}</article></div></section>;
}

export function SemsBatteryConsistencyPage({ establishmentId: _establishmentId }: { establishmentId?: string }) {
  return <section className="surface panel sems-battery-page"><div className="sems-analysis-empty"><strong>Diagnóstico de bateria indisponível</strong><span>Não há BMS ou telemetria de bateria conectados ao protótipo. Nenhuma conclusão técnica é exibida sem esse provider.</span></div></section>;
}
