import { useCallback, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { LAB_SCENARIO_IDS, type CommercialEnergyView, type CommercialSnapshot, type LabScenarioId } from "@chargegrid/shared";
import { useAdminState } from "../../app/AdminState";
import { number } from "../../components/AdminUi";
import { assets } from "../../constants/assets";
import { canUseHardwareLab } from "../../services/hardwareLabAccess";
import { applyPlantScenario, fetchCommercialSnapshot, fetchPlantEnergyView, resetCommercialTestData, sendHardwareEvent, type HardwareAction } from "../../services/commercialSnapshotRepository";

const scenarios: Record<LabScenarioId, { name: string; description: string }> = {
  SOLAR_SURPLUS: { name: "Excedente solar", description: "FV 30 kW e carga-base 8 kW." },
  DEMAND_RAMP: { name: "Rampa de demanda", description: "FV 2 kW; carga-base crescente de 8 a 28 kW." },
  LOW_SOLAR: { name: "Baixa geração solar", description: "FV 1 kW e carga-base 12 kW." },
  TELEMETRY_LOSS: { name: "Perda de telemetria", description: "Provider offline; amostra anterior fica stale." },
  RECOVERY: { name: "Recuperação", description: "FV crescente de 2 a 30 kW e carga-base 12 kW." }
};

const statusLabels: Record<string, string> = { AVAILABLE: "Disponível", CONNECTED: "Veículo conectado", CHARGING: "Carregando", OFFLINE: "Offline", FAULT: "Falha" };
const localTime = (date?: string) => date ? new Date(date).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "—";
const measurement = (value?: number | null) => value === null || value === undefined ? "—" : `${number(value)} kW`;

function HardwareLab() {
  const [snapshot, setSnapshot] = useState<CommercialSnapshot | null>(null);
  const [energyView, setEnergyView] = useState<CommercialEnergyView | null>(null);
  const [power, setPower] = useState<Record<string, number>>({});
  const [scenarioId, setScenarioId] = useState<LabScenarioId | "">("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [apiAvailable, setApiAvailable] = useState(true);
  const refresh = useCallback(async () => {
    try {
      const nextSnapshot = await fetchCommercialSnapshot();
      const plantId = nextSnapshot.establishments.find((item) => item.plantId)?.plantId;
      const nextEnergy = plantId ? await fetchPlantEnergyView(plantId) : null;
      setSnapshot(nextSnapshot);
      setEnergyView(nextEnergy);
      setApiAvailable(true);
    } catch (error) {
      setApiAvailable(false);
      setMessage(error instanceof Error ? error.message : "Não foi possível consultar a API.");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  async function emit(chargerCode: string, action: HardwareAction) {
    setBusy(chargerCode);
    setMessage("");
    try {
      setSnapshot(await sendHardwareEvent(chargerCode, action, action === "CONNECT" ? power[chargerCode] : undefined));
      setMessage(`${chargerCode}: evento ${action} confirmado pela API.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "O evento físico falhou.");
    } finally { setBusy(""); }
  }

  async function applyScenario() {
    const plantId = snapshot?.establishments.find((item) => item.plantId)?.plantId;
    if (!plantId || !scenarioId) return;
    setBusy("plant");
    setMessage("");
    try {
      const nextSnapshot = await applyPlantScenario(plantId, scenarioId);
      const nextEnergy = await fetchPlantEnergyView(plantId);
      setSnapshot(nextSnapshot);
      setEnergyView(nextEnergy);
      setMessage(`Cenário ${scenarios[scenarioId].name} aplicado pela API.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível aplicar o cenário.");
      void refresh();
    } finally { setBusy(""); }
  }

  async function resetTestData() {
    if (!window.confirm("Reiniciar os dados de teste? Sessões, pagamentos, fila e telemetria serão limpos.")) return;
    setBusy("reset");
    setMessage("");
    try {
      setSnapshot(await resetCommercialTestData());
      setEnergyView(null);
      setScenarioId("");
      setMessage("Dados de teste reiniciados pela API.");
      void refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível reiniciar os dados de teste.");
    } finally { setBusy(""); }
  }

  const plantId = snapshot?.establishments.find((item) => item.plantId)?.plantId;
  const plant = energyView?.snapshot;
  const chargers = snapshot?.establishments.flatMap((establishment) => establishment.chargers.map((charger) => ({ establishment, charger }))) ?? [];
  const connected = chargers.filter(({ charger }) => ["CONNECTED", "CHARGING"].includes(charger.physicalStatus)).length;
  const charging = chargers.filter(({ charger }) => charger.physicalStatus === "CHARGING").length;
  const activeScenario = energyView?.simulation;
  const selected = scenarioId ? scenarios[scenarioId] : null;
  const labState = !apiAvailable || !plant || plant.quality === "UNKNOWN" ? "Indisponível" : plant.quality === "FRESH" ? "Em operação" : "Telemetria desatualizada";

  useEffect(() => {
    if (activeScenario && !scenarioId) setScenarioId(activeScenario.scenarioId);
  }, [activeScenario, scenarioId]);

  return <section className="hardware-lab operations-detail" data-testid="hardware-lab">
    <header className="hardware-lab-heading">
      <div><span>Ferramenta técnica · GoodWe simulado</span><h1>Laboratório de hardware</h1><p>Simule cenários de operação para testes técnicos. Apenas eventos físicos são emitidos no backend.</p></div>
      <aside><b>♧</b><div><strong>Ambiente de simulação</strong><span>Dados simulados para testes técnicos.</span><span>Nenhum pagamento ou sessão comercial é criado.</span></div></aside>
    </header>

    <div className="hardware-lab-overview">
      <section className="surface panel hardware-lab-scenario">
        <header><h2>Cenário de simulação <span aria-hidden="true">ⓘ</span></h2><p>Selecione um perfil de operação e aplique na planta.</p></header>
        <div className="hardware-lab-selector">
          <label className="sr-only" htmlFor="lab-scenario">Cenário de simulação</label>
          <select id="lab-scenario" value={scenarioId} onChange={(event) => setScenarioId(event.target.value as LabScenarioId | "")}>
            <option value="">Selecione um cenário</option>
            {LAB_SCENARIO_IDS.map((id) => <option key={id} value={id}>{scenarios[id].name}</option>)}
          </select>
          <dl><div><dt>ID do cenário</dt><dd>{scenarioId || "—"}</dd></div><div><dt>Versão</dt><dd>{activeScenario?.scenarioId === scenarioId ? `v${activeScenario.version}.0` : "v1.0"}</dd></div><div><dt>Proveniência</dt><dd>Simulado GoodWe</dd></div><div><dt>Finalidade</dt><dd>{selected?.description ?? "Selecione um perfil para ver os sinais simulados."}</dd></div></dl>
        </div>
        <div className="hardware-lab-signals">
          <article><span>☀</span><small>Solar simulada</small><strong>{measurement(plant?.pvKw)}</strong></article>
          <article><span>⌂</span><small>Carga-base</small><strong>{measurement(plant?.buildingLoadKw)}</strong></article>
          <article><span>⌁</span><small>Carga EV</small><strong>{measurement(plant?.evLoadKw)}</strong></article>
          <article><span>ϟ</span><small>Importação da rede</small><strong>{measurement(plant?.gridImportKw)}</strong></article>
        </div>
        <footer className="hardware-lab-controls">
          <button type="button" className="hardware-lab-primary" disabled={Boolean(busy) || !plantId || !scenarioId} onClick={() => void applyScenario()}>▷ Aplicar cenário</button>
          <button type="button" className="hardware-lab-reset" disabled={Boolean(busy)} onClick={() => void resetTestData()}>↻ Reiniciar dados de teste</button>
          <span className="hardware-lab-provider"><i className={plant?.quality === "FRESH" ? "is-online" : ""} /> Provider energético <b>{plant?.quality ?? "UNAVAILABLE"}</b></span>
        </footer>
        {message ? <p role="status" className="command-feedback">{message}</p> : null}
      </section>

      <section className="surface panel hardware-lab-state">
        <header><h2>Estado do laboratório</h2><span className={plant?.quality === "FRESH" ? "is-online" : "is-offline"}><i />{labState}</span></header>
        <div className="hardware-lab-counts"><article><b>♧</b><strong>{chargers.length}</strong><span>Carregadores<br />total</span></article><article><b>♧</b><strong>{connected}</strong><span>Veículos<br />conectados</span></article><article><b>ϟ</b><strong>{charging}</strong><span>Em<br />carregamento</span></article></div>
        <div className="hardware-lab-metrics"><article><span>☀</span><div><small>Geração solar</small><strong>{measurement(plant?.pvKw)}</strong></div></article><article><span>⌂</span><div><small>Carga-base</small><strong>{measurement(plant?.buildingLoadKw)}</strong></div></article><article><span>⌁</span><div><small>Carga EV</small><strong>{measurement(plant?.evLoadKw)}</strong></div></article></div>
        <footer><span>ϟ <small>Importação da rede (simulada)</small><strong>{measurement(plant?.gridImportKw)}</strong></span><span><small>Última atualização</small><strong>{localTime(plant?.observedAt)}</strong></span></footer>
      </section>
    </div>

    <section className="hardware-lab-chargers">
      <header><div><h2>Carregadores</h2><p>Gerencie o estado de cada carregador e acompanhe a telemetria em tempo real.</p></div><span><i />Atualização automática</span><b>Tempo real (2s)⌄</b></header>
      <div className="hardware-lab-charger-grid">{chargers.map(({ establishment, charger }) => {
        const session = snapshot?.sessions.find((item) => item.chargerCode === charger.code && item.endedAt == null);
        const state = charger.physicalStatus.toLowerCase();
        const disabled = busy === charger.code;
        return <article className={`hardware-lab-charger state-${state}`} key={charger.id}>
          <header><div><h3>{charger.code}</h3><p>{establishment.name} · Vaga {charger.parkingSpot}</p></div><strong>{statusLabels[charger.physicalStatus] ?? charger.physicalStatus}</strong></header>
          <div className="hardware-lab-charger-data"><div className="hardware-lab-device"><img src={assets.charger} alt={`Carregador ${charger.code}`} /></div><dl><div><dt>Potência atual</dt><dd>{measurement(charger.currentPowerKw)}</dd></div>{session ? <div><dt>Energia da sessão</dt><dd>{number(session.energyWh / 1000)} kWh</dd></div> : null}<div><dt>Estado físico</dt><dd>{statusLabels[charger.physicalStatus] ?? charger.physicalStatus}</dd></div><div><dt>Última atualização</dt><dd>{localTime(charger.updatedAt)}</dd></div></dl></div>
          <footer>
            <label>Potência configurada<input aria-label={`Potência de ${charger.code}`} type="number" min="0.1" max={charger.nominalPowerKw} step="0.1" value={power[charger.code] ?? charger.nominalPowerKw} onChange={(event) => setPower((current) => ({ ...current, [charger.code]: event.target.valueAsNumber }))} /></label>
            {charger.physicalStatus === "AVAILABLE" ? <button type="button" className="hardware-lab-primary" disabled={disabled} onClick={() => void emit(charger.code, "CONNECT")}>Conectar veículo</button> : null}
            {charger.physicalStatus === "CONNECTED" ? <button type="button" className="hardware-lab-primary" disabled={disabled} onClick={() => void emit(charger.code, "DISCONNECT")}>Desconectar</button> : null}
            {charger.physicalStatus === "CHARGING" ? <button type="button" className="hardware-lab-primary" disabled={disabled} onClick={() => void emit(charger.code, "STOP")}>Interromper energia</button> : null}
            {["OFFLINE", "FAULT"].includes(charger.physicalStatus) ? <button type="button" className="hardware-lab-primary" disabled={disabled} onClick={() => void emit(charger.code, "RECOVER")}>Recuperar equipamento</button> : <><button type="button" disabled={disabled} onClick={() => void emit(charger.code, "OFFLINE")}>Offline</button><button type="button" disabled={disabled} onClick={() => void emit(charger.code, "FAULT")}>Simular falha</button></>}
          </footer>
        </article>;
      })}</div>
      {!snapshot ? <p>Carregando carregadores…</p> : null}
    </section>
  </section>;
}

export function AdminSimulatorPage() {
  const { account } = useAdminState();
  if (!account) return <Navigate to="/login" replace />;
  if (!canUseHardwareLab(account)) return <section className="surface panel"><h2>Acesso restrito ao laboratório</h2><p>Use uma conta GoodWe ou administradora do estabelecimento.</p></section>;
  return <HardwareLab />;
}
