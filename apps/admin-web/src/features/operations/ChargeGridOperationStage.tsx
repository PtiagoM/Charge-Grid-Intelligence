import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useAdminState } from "../../app/AdminState";
import { assets } from "../../constants/assets";
import type { Charger, ChargerCommand, ChargerTelemetry, Session } from "../../domain/admin";
import { hasAdminCapability } from "../../domain/adminCapabilities";
import { buildFullOccupancyScenario } from "../../fixtures/chargeGridOperationDemo";
import { ChargeGridOperationsDashboard } from "./ChargeGridOperationsDashboard";

type SpotState = "available" | "starting" | "charging" | "waiting" | "energy-finished" | "stopping" | "fault" | "offline" | "maintenance";

interface SpotView {
  charger: Charger;
  spotId: string;
  state: SpotState;
  telemetry?: ChargerTelemetry;
  session?: Session;
  command?: ChargerCommand;
  summary: string;
}

const stateLabels: Record<SpotState, string> = {
  available: "Disponível",
  starting: "Iniciando",
  charging: "Carregando",
  waiting: "Aguardando início",
  "energy-finished": "Recarga finalizada",
  stopping: "Encerrando",
  fault: "Falha",
  offline: "Offline",
  maintenance: "Em manutenção"
};

const stateColors: Record<SpotState, string> = {
  available: "#75d33f",
  starting: "#2b9cff",
  charging: "#2b9cff",
  waiting: "#f4b51f",
  "energy-finished": "#f4b51f",
  stopping: "#2b9cff",
  fault: "#ff4148",
  offline: "#7d8791",
  maintenance: "#9a8d72"
};

const preferredFiapOrder = ["CG-FIAP-02", "CG-FIAP-01", "CG-FIAP-03", "CG-FIAP-04", "CG-FIAP-05"];

function compactChargerName(charger: Charger) {
  const match = charger.id.match(/(\d+)$/);
  const suffix = match?.[1];
  return suffix ? `CG-${suffix.padStart(2, "0")}` : charger.id;
}

function formatNumber(value: number, digits = 1) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function latestByDate<T>(items: T[], readDate: (item: T) => string) {
  return items.slice().sort((a, b) => readDate(b).localeCompare(readDate(a)))[0];
}

function spotState(charger: Charger, telemetry: ChargerTelemetry | undefined, sessions: Session[], command: ChargerCommand | undefined): SpotState {
  if (command && ["REQUESTED", "ACCEPTED"].includes(command.status)) return command.type === "START_CHARGE" ? "starting" : "stopping";
  if (charger.publicationStatus === "SUSPENDED") return "maintenance";
  if (telemetry?.connectorState === "FAULT") return "fault";
  if (telemetry?.connectorState === "OFFLINE" || charger.status === "offline") return "offline";
  if (command?.status === "FAILED" || charger.status === "limited") return "fault";
  if (telemetry?.connectorState === "CHARGING" || charger.status === "charging" || sessions.some((item) => item.status === "active")) return "charging";
  if (telemetry?.vehicleConnected || telemetry?.connectorState === "CONNECTED") {
    return sessions.some((item) => item.status === "finished") ? "energy-finished" : "waiting";
  }
  return "available";
}

function stateSummary(state: SpotState, telemetry: ChargerTelemetry | undefined, session: Session | undefined, referenceTime: number) {
  if (state === "charging") return `${formatNumber(telemetry?.currentPowerKw ?? 0)} kW · ${session?.durationMinutes ?? 0} min`;
  if (state === "starting") return "Aguardando confirmação";
  if (state === "stopping") return "Confirmando encerramento";
  if (state === "waiting") return "Veículo conectado";
  if (state === "energy-finished") return "Aguardando retirada";
  if (state === "fault") {
    const minutes = telemetry ? Math.max(1, Math.round((referenceTime - new Date(telemetry.observedAt).getTime()) / 60000)) : 1;
    return `Indisponível há ${minutes} min`;
  }
  if (state === "offline") return telemetry ? `Última telemetria às ${new Date(telemetry.observedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Sem telemetria";
  if (state === "maintenance") return "Operação suspensa";
  return "Pronto para iniciar";
}

function FloorStateIcon({ state }: { state: SpotState }) {
  if (state === "fault") return <svg viewBox="0 0 48 44" aria-hidden="true"><path d="M24 4 44 38H4L24 4Z" /><path d="M24 16v10M24 32v1" /></svg>;
  return <svg viewBox="0 0 48 44" aria-hidden="true"><path d="M18 16v8M30 16v8M14 23h20v4a10 10 0 0 1-10 10 10 10 0 0 1-10-10v-4ZM24 37v4" /></svg>;
}

export function ChargeGridOperationStage({ establishmentId }: { establishmentId: string }) {
  const { state, account, requestChargerCommand } = useAdminState();
  const [scenario, setScenario] = useState<"full" | "live">("full");
  const [selectedChargerId, setSelectedChargerId] = useState("");
  const [windowStart, setWindowStart] = useState(0);
  const [commandBusy, setCommandBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [confirmStop, setConfirmStop] = useState(false);
  const establishment = state.establishments.find((item) => item.id === establishmentId);
  const commercialPlant = state.commercialPlants.find((item) => item.establishmentId === establishmentId);
  const location = state.locations.find((item) => item.id === commercialPlant?.locationId) ?? state.locations.find((item) => item.establishmentId === establishmentId);
  const operationData = useMemo(() => {
    const publishedChargers = state.chargers.filter((item) => item.establishmentId === establishmentId && item.publicationStatus === "PUBLISHED");
    const publishedIds = new Set(publishedChargers.map((item) => item.id));
    const source = {
      chargers: publishedChargers,
      telemetry: state.chargerTelemetry.filter((item) => publishedIds.has(item.chargerId)),
      sessions: state.sessions.filter((item) => publishedIds.has(item.chargerId))
    };
    return scenario === "full" ? buildFullOccupancyScenario(source, establishmentId) : source;
  }, [establishmentId, scenario, state.chargerTelemetry, state.chargers, state.sessions]);
  const chargers = useMemo(() => {
    if (establishmentId !== "est-fiap") return operationData.chargers.slice().sort((a, b) => a.id.localeCompare(b.id));
    return operationData.chargers.slice().sort((a, b) => {
      const aIndex = preferredFiapOrder.indexOf(a.id);
      const bIndex = preferredFiapOrder.indexOf(b.id);
      const aOrder = aIndex === -1 ? Number.MAX_SAFE_INTEGER : aIndex;
      const bOrder = bIndex === -1 ? Number.MAX_SAFE_INTEGER : bIndex;
      return aOrder - bOrder || a.id.localeCompare(b.id);
    });
  }, [establishmentId, operationData.chargers]);
  const maxWindowStart = Math.max(0, chargers.length - 5);
  const telemetryTimes = operationData.telemetry.map((item) => new Date(item.observedAt).getTime());
  const referenceTime = telemetryTimes.length ? Math.max(...telemetryTimes) : Date.now();

  const allSpots = useMemo<SpotView[]>(() => chargers.map((charger, index) => {
    const telemetry = operationData.telemetry.find((item) => item.chargerId === charger.id);
    const chargerSessions = operationData.sessions.filter((item) => item.chargerId === charger.id);
    const command = latestByDate(state.chargerCommands.filter((item) => item.chargerId === charger.id), (item) => item.requestedAt);
    const session = latestByDate(chargerSessions, (item) => item.startedAt);
    const visualState = spotState(charger, telemetry, chargerSessions, command);
    return {
      charger,
      spotId: `A${String(index + 1).padStart(2, "0")}`,
      state: visualState,
      telemetry,
      session,
      command,
      summary: stateSummary(visualState, telemetry, session, referenceTime)
    };
  }), [chargers, operationData.sessions, operationData.telemetry, referenceTime, state.chargerCommands]);
  const spots = allSpots.slice(windowStart, windowStart + 5);

  useEffect(() => {
    if (spots.some((item) => item.charger.id === selectedChargerId)) return;
    setSelectedChargerId(spots.find((item) => item.state === "charging")?.charger.id ?? spots[0]?.charger.id ?? "");
  }, [selectedChargerId, spots]);

  useEffect(() => {
    setConfirmStop(false);
    setFeedback("");
  }, [selectedChargerId]);

  useEffect(() => {
    setWindowStart(0);
    setSelectedChargerId("");
  }, [scenario]);

  const selected = spots.find((item) => item.charger.id === selectedChargerId) ?? spots[0];
  const selectedSessions = selected ? operationData.sessions.filter((item) => item.chargerId === selected.charger.id) : [];
  const authorizedSession = selectedSessions.find((item) => item.status === "authorized");
  const activeSession = selectedSessions.find((item) => ["active", "starting"].includes(item.status));
  const contextualSession = selected && ["starting", "waiting", "energy-finished", "stopping"].includes(selected.state)
    ? authorizedSession ?? selected.session
    : undefined;
  const currentSession = activeSession ?? contextualSession;
  const incident = selected ? state.incidents.find((item) => item.chargerId === selected.charger.id && item.status !== "RESOLVED") : undefined;
  const canCommand = scenario === "live" && Boolean(account && hasAdminCapability(account, "chargers:command"));

  async function runCommand(type: "START_CHARGE" | "STOP_CHARGE") {
    if (!selected) return;
    setCommandBusy(true);
    setConfirmStop(false);
    setFeedback(type === "START_CHARGE" ? "Liberando recarga... Aguardando confirmação do carregador." : "Parando recarga... Aguardando confirmação do carregador.");
    const result = await requestChargerCommand({
      chargerId: selected.charger.id,
      type,
      reason: type === "START_CHARGE" ? "Início solicitado pela operação local." : "Encerramento solicitado pela operação local.",
      idempotencyKey: `operation-${type}-${selected.charger.id}-${Date.now()}`
    });
    setCommandBusy(false);
    setFeedback(result.ok ? (type === "START_CHARGE" ? "Recarga liberada e confirmada pela telemetria." : "Recarga parada e confirmada pela telemetria.") : result.issues.join(" "));
  }

  function moveCarousel(delta: number) {
    setWindowStart((value) => Math.min(maxWindowStart, Math.max(0, value + delta)));
  }

  if (!chargers.length || !establishment) return <section className="surface panel cg-operation-empty"><h2>Nenhum carregador publicado</h2><p>A visualização operacional aparece quando uma planta ChargeGrid possui carregadores publicados individualmente.</p></section>;

  const counts = {
    available: allSpots.filter((item) => item.state === "available").length,
    charging: allSpots.filter((item) => ["charging", "starting", "stopping"].includes(item.state)).length,
    waiting: allSpots.filter((item) => ["waiting", "energy-finished"].includes(item.state)).length,
    fault: allSpots.filter((item) => ["fault", "offline"].includes(item.state)).length
  };

  return <div className="cg-operation" data-testid="chargegrid-operation-stage">
    <section className="cg-operation-context" aria-label="Resumo da planta selecionada">
      <div><span>Planta ChargeGrid</span><strong>{commercialPlant?.commercialName ?? location?.name ?? establishment.name}</strong><small>{location ? `${location.address}, ${location.number} · ${location.city}/${location.state}` : establishment.address}</small></div>
      <label className="cg-operation-scenario"><span>Cenário</span><select value={scenario} data-testid="chargegrid-operation-scenario" onChange={(event) => setScenario(event.target.value as "full" | "live")}><option value="full">Ocupação completa</option><option value="live">Telemetria normal</option></select></label>
      <dl><div><dt>Carregadores</dt><dd>{chargers.length}</dd></div><div className="is-available"><dt>Disponíveis</dt><dd>{counts.available}</dd></div><div className="is-charging"><dt>Carregando</dt><dd>{counts.charging}</dd></div><div className="is-waiting"><dt>Aguardando</dt><dd>{counts.waiting}</dd></div><div className="is-fault"><dt>Falhas</dt><dd>{counts.fault}</dd></div></dl>
    </section>

    <section
      className="cg-stage-shell"
      aria-label="Vagas e carregadores da planta"
      aria-roledescription="carrossel"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") moveCarousel(-1);
        if (event.key === "ArrowRight") moveCarousel(1);
      }}
      onWheel={(event) => {
        if (Math.abs(event.deltaX) <= Math.abs(event.deltaY) || event.deltaX === 0) return;
        event.preventDefault();
        moveCarousel(event.deltaX > 0 ? 1 : -1);
      }}
    >
      <button className="cg-stage-arrow is-left" type="button" aria-label="Mostrar vagas anteriores" disabled={windowStart === 0} onClick={() => moveCarousel(-1)}>‹</button>
      <div className="cg-stage-scroll">
        <div className="cg-stage" style={{ backgroundImage: `url(${assets.chargerOperationStage})` }}>
          {spots.map((spot, index) => {
            const connectorConfirmsVehicle = ["CONNECTED", "CHARGING"].includes(spot.telemetry?.connectorState ?? "");
            const vehiclePresent = Boolean(spot.telemetry?.vehicleConnected || connectorConfirmsVehicle);
            const showFloorIcon = !vehiclePresent && ["available", "fault", "offline", "maintenance"].includes(spot.state);
            return <div className={`cg-stage-layer slot-${index} state-${spot.state}`} key={`layer-${spot.charger.id}`} style={{ left: `${index * 20}%`, "--spot-color": stateColors[spot.state] } as CSSProperties}>
              {vehiclePresent ? <img className="cg-stage-vehicle" src={assets.chargerOperationVehicles[index] ?? assets.chargerNoConnectedCar} alt="" data-testid="chargegrid-connected-vehicle" /> : null}
              {showFloorIcon ? <span className="cg-floor-state"><FloorStateIcon state={spot.state} /></span> : null}
            </div>;
          })}

          {spots.map((spot, index) => <button
            className={`cg-spot-hitbox ${selected?.charger.id === spot.charger.id ? "is-selected" : ""}`}
            key={spot.charger.id}
            type="button"
            style={{ left: `${index * 20}%`, "--spot-color": stateColors[spot.state] } as CSSProperties}
            aria-pressed={selected?.charger.id === spot.charger.id}
            aria-label={`${spot.spotId}, ${compactChargerName(spot.charger)}, ${stateLabels[spot.state]}`}
            onClick={() => setSelectedChargerId(spot.charger.id)}
          ><span className="cg-spot-card"><span className="cg-spot-card-top"><strong>{spot.spotId}</strong><i>{stateLabels[spot.state]}</i></span><span><b>{compactChargerName(spot.charger)}</b><small>{spot.summary}</small></span></span></button>)}
        </div>
      </div>
      <button className="cg-stage-arrow is-right" type="button" aria-label="Mostrar próximas vagas" disabled={windowStart >= maxWindowStart} onClick={() => moveCarousel(1)}>›</button>
    </section>

    {selected ? <section className={`cg-selected-panel state-${selected.state}`} style={{ "--spot-color": stateColors[selected.state] } as CSSProperties} data-testid="chargegrid-selected-charger">
      <div className="cg-selected-device" aria-hidden="true"><img src={assets.charger} alt="" /><i /></div>
      <div className="cg-selected-content">
        <header><div><h2>{compactChargerName(selected.charger)} <span>· Vaga {selected.spotId}</span></h2><p>{selected.state === "fault" && selected.telemetry?.faultCode ? "Falha de comunicação com o veículo" : selected.summary}</p></div><strong>{stateLabels[selected.state]}</strong></header>
        <dl>
          <div><dt>Potência atual</dt><dd>{formatNumber(selected.telemetry?.currentPowerKw ?? 0)} <small>kW</small></dd></div>
          <div><dt>Energia entregue</dt><dd>{formatNumber(currentSession?.energyKwh ?? selected.charger.todayEnergyKwh, 2)} <small>kWh</small></dd></div>
          <div><dt>Sessão</dt><dd>{currentSession ? `#${currentSession.id.replace("CG-2026-", "")}` : "—"}</dd></div>
          <div><dt>Duração</dt><dd>{currentSession ? `${currentSession.durationMinutes} min` : "—"}</dd></div>
        </dl>
        {feedback ? <p className="cg-command-feedback" role="status">{feedback}</p> : null}
        {confirmStop ? <aside className="cg-stop-confirmation" role="alertdialog" aria-label="Confirmar parada da recarga"><p><strong>Parar esta recarga?</strong><span>O comando de contingência será enviado ao carregador e aguardará confirmação por telemetria.</span></p><div><button type="button" className="ghost-button" onClick={() => setConfirmStop(false)}>Cancelar</button><button type="button" className="cg-danger-action" disabled={commandBusy} onClick={() => void runCommand("STOP_CHARGE")}>Confirmar parada</button></div></aside> : null}
      </div>
      <div className="cg-selected-actions">
        {scenario === "full" ? <span className="cg-demo-readonly">Cenário demonstrativo<br /><small>Comandos desativados</small></span> : <>
          {currentSession ? <a className="ghost-button" href={`#/mvp/session?est=${establishmentId}&session=${currentSession.id}`}>Ver sessão</a> : null}
          {selected.state === "fault" && incident ? <a className="ghost-button" href={`#/mvp/incident?est=${establishmentId}&incident=${incident.id}`}>Ver ocorrência</a> : null}
          {["available", "waiting"].includes(selected.state) && canCommand && authorizedSession ? <button type="button" className="cg-primary-action" disabled={commandBusy} onClick={() => void runCommand("START_CHARGE")}>Liberar recarga</button> : null}
          {selected.state === "charging" && canCommand && activeSession ? <button type="button" className="cg-danger-action" disabled={commandBusy} onClick={() => setConfirmStop(true)}>Parar recarga</button> : null}
          {["available", "fault", "offline", "maintenance"].includes(selected.state) ? <a className="ghost-button" href={`#/mvp/charger?est=${establishmentId}&charger=${selected.charger.id}`}>Ver dispositivo</a> : null}
        </>}
      </div>
    </section> : null}

    <ChargeGridOperationsDashboard
      establishmentId={establishmentId}
      scenario={scenario}
      chargers={chargers}
      telemetry={operationData.telemetry}
      sessions={operationData.sessions}
    />
  </div>;
}
