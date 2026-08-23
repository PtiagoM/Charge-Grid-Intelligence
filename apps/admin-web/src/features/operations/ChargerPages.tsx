import { useMemo, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAdminState } from "../../app/AdminState";
import { Badge, DataTable, SectionHeader, money, number, statusLabel } from "../../components/AdminUi";
import type { ChargerCommandType } from "../../domain/admin";

function localDate(value?: string) {
  return value ? new Date(value).toLocaleString("pt-BR") : "Sem leitura";
}

function commandLabel(type: ChargerCommandType) {
  return type === "START_CHARGE" ? "Iniciar recarga" : "Encerrar recarga";
}

export function ChargersInventoryPage({ establishmentId }: { establishmentId?: string }) {
  const { state } = useAdminState();
  const [status, setStatus] = useState("all");
  const [locationId, setLocationId] = useState("all");
  const [search, setSearch] = useState("");
  const scoped = establishmentId ? state.chargers.filter((item) => item.establishmentId === establishmentId) : state.chargers;
  const locations = state.locations.filter((location) => scoped.some((charger) => charger.locationId === location.id));
  const items = scoped.filter((item) => {
    const term = search.trim().toLowerCase();
    const matchesSearch = !term || [item.id, item.internalId, item.serial, item.model].some((value) => value.toLowerCase().includes(term));
    return matchesSearch && (status === "all" || item.status === status) && (locationId === "all" || item.locationId === locationId);
  });

  return <>
    <section className="surface panel operations-page sems-reference-list" data-testid="mvp-chargers-panel">
      <nav className="sems-device-type-tabs" aria-label="Tipos de dispositivos"><span>Inversor</span><span>Dongle</span><button className="is-active" type="button">Carregador veicular</button><span>Inversor de terceiros</span></nav>
      <form className="operations-filter sems-reference-filter" onSubmit={(event) => event.preventDefault()}><button className="sems-filter-button" type="button">⌁ Filtro</button><label><span className="sr-only">Local</span><select value={locationId} onChange={(event) => setLocationId(event.target.value)}><option value="all">Nome da usina</option>{locations.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span className="sr-only">Buscar equipamento</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome do dispositivo, SN" /></label><button className="sems-icon-action" type="submit" aria-label="Pesquisar">⌕</button><button className="sems-icon-action" type="button" aria-label="Atualizar">↻</button></form>
      <nav className="sems-reference-status-tabs" aria-label="Status dos dispositivos"><button className={status === "all" ? "is-active" : ""} type="button" onClick={() => setStatus("all")}>Todos <b>({scoped.length})</b></button><button className={status === "available" ? "is-active" : ""} type="button" onClick={() => setStatus("available")}>Em operação <b>({scoped.filter((item) => item.status === "available" || item.status === "charging").length})</b></button><button className={status === "offline" ? "is-active" : ""} type="button" onClick={() => setStatus("offline")}>Offline <b>({scoped.filter((item) => item.status === "offline").length})</b></button></nav>
      <DataTable columns={["Nome do dispositivo", "SN do dispositivo", "Status do dispositivo", "Tipo de dispositivo", "Potência ativa", "Energia hoje", "Operação"]}>
        {items.map((charger) => {
          const telemetry = state.chargerTelemetry.find((item) => item.chargerId === charger.id);
          return <tr key={charger.id}><td><strong>{charger.identifier}</strong><span>{state.locations.find((item) => item.id === charger.locationId)?.name}</span></td><td>{charger.serial}</td><td><Badge value={charger.status} /></td><td>Carregador veicular · {charger.model}</td><td>{number(telemetry?.currentPowerKw ?? 0)} kW<span>Leitura {localDate(telemetry?.observedAt)}</span></td><td>{number(charger.todayEnergyKwh)} kWh<span>{money(charger.revenueToday)}</span></td><td><a className="sems-row-action" href={`#/mvp/charger?charger=${charger.id}`}>Abrir carregador ›</a></td></tr>;
        })}
      </DataTable>
      {!items.length ? <p className="operations-empty">Nenhum carregador corresponde aos filtros.</p> : null}
    </section>
  </>;
}

export function ChargerDetailPage({ chargerId, establishmentId }: { chargerId: string; establishmentId?: string }) {
  const { state, account, requestChargerCommand } = useAdminState();
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "good" | "danger"; message: string } | null>(null);
  const charger = state.chargers.find((item) => item.id === chargerId);
  if (!charger || (establishmentId && charger.establishmentId !== establishmentId)) return <Navigate to="/mvp/chargers" replace />;
  const selectedChargerId = charger.id;

  const location = state.locations.find((item) => item.id === charger.locationId);
  const telemetry = state.chargerTelemetry.find((item) => item.chargerId === charger.id);
  const sessions = state.sessions.filter((item) => item.chargerId === charger.id).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const commands = state.chargerCommands.filter((item) => item.chargerId === charger.id).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  const currentSession = sessions.find((item) => item.status === "active" || item.status === "authorized" || item.status === "starting");
  const commandType: ChargerCommandType | null = charger.status === "charging" && currentSession?.status === "active"
    ? "STOP_CHARGE"
    : currentSession?.status === "authorized" && charger.status !== "offline"
      ? "START_CHARGE"
      : null;
  const pending = commands.find((item) => item.status === "REQUESTED" || item.status === "ACCEPTED");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!commandType || !confirmed) return;
    setSubmitting(true);
    setFeedback(null);
    const result = await requestChargerCommand({
      chargerId: selectedChargerId,
      type: commandType,
      reason,
      idempotencyKey: `${commandType}-${selectedChargerId}-${Date.now()}`
    });
    setSubmitting(false);
    if (result.ok) {
      setReason("");
      setConfirmed(false);
      setFeedback({ tone: "good", message: "Comando confirmado pela telemetria do carregador." });
    } else {
      setFeedback({ tone: "danger", message: result.issues.join(" ") || "O comando nao foi confirmado." });
    }
  }

  return <div className="operations-detail" data-testid="mvp-charger-detail">
    <nav className="enterprise-breadcrumb" aria-label="Navegacao estrutural"><span><a href="#/mvp/chargers">Carregadores</a><i>/</i></span><span><strong>{charger.identifier}</strong></span></nav>
    <section className="operations-hero surface">
      <div><span className="eyebrow">{location?.name}</span><h2>{charger.identifier}</h2><p>{charger.model} · Serial {charger.serial}</p></div>
      <div className="operations-hero-status"><Badge value={charger.status} /><strong>{number(telemetry?.currentPowerKw ?? 0)} kW</strong><span>Ultima leitura {localDate(telemetry?.observedAt)}</span></div>
    </section>
    <nav className="entity-tabs operations-anchor-nav"><a className="is-active" href="#charger-live">Agora</a><a href="#charger-session">Sessao</a><a href="#charger-control">Controle</a><a href="#charger-history">Historico</a></nav>
    <section id="charger-live" className="surface panel"><SectionHeader title="Estado observado" subtitle="A tela reflete a ultima telemetria recebida, nao apenas o aceite de um comando." /><div className="detail-grid"><article><h3>Conector</h3><p>{telemetry?.connectorState ?? "Sem leitura"}</p><small>{telemetry?.vehicleConnected ? "Veiculo conectado" : "Sem veiculo conectado"}</small></article><article><h3>Potencia instantanea</h3><p>{number(telemetry?.currentPowerKw ?? 0)} kW</p><small>Nominal {charger.powerKw} kW</small></article><article><h3>Energia hoje</h3><p>{number(charger.todayEnergyKwh)} kWh</p><small>{money(charger.revenueToday)} movimentados</small></article><article><h3>Identificacao tecnica</h3><p>{charger.internalId}</p><small>Instalado em {new Date(`${charger.installationDate}T12:00:00`).toLocaleDateString("pt-BR")}</small></article></div></section>
    <section id="charger-session" className="surface panel"><SectionHeader title="Sessao vinculada" subtitle={currentSession ? "Contexto comercial e operacional da recarga atual." : "Nenhuma sessao autorizada ou ativa neste conector."} />{currentSession ? <div className="operations-session-summary"><div><Badge value={currentSession.status} /><h3>{currentSession.id}</h3><p>{currentSession.driverName} · {currentSession.vehicle}</p></div><div><strong>{number(currentSession.energyKwh)} kWh</strong><span>{currentSession.durationMinutes} min · {money(currentSession.consumedAmount)}</span></div><a className="ghost-button" href={`#/mvp/session?session=${currentSession.id}`}>Abrir linha do tempo</a></div> : <p className="operations-empty">O controle de inicio so e liberado quando existe pagamento autorizado e veiculo associado.</p>}</section>
    <section id="charger-control" className="surface panel command-panel"><SectionHeader eyebrow="Acao sensivel" title="Controle do carregador" subtitle="Todo comando registra autor, motivo, protocolo e resultado observado." />
      {commandType ? <form onSubmit={submit} className="command-form" data-testid="charger-command-form"><div className="command-intent"><span>{commandLabel(commandType)}</span><strong>{currentSession?.id}</strong><p>{commandType === "START_CHARGE" ? "A recarga so sera exibida como ativa apos a telemetria indicar fluxo de energia." : "O encerramento so sera concluido apos a telemetria indicar fim do fluxo."}</p></div><label><span>Motivo da acao</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={8} required placeholder="Descreva por que este comando esta sendo enviado" /></label><label className="command-confirm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> Confirmo que validei o carregador, o veiculo e a sessao.</label><button type="submit" disabled={!confirmed || reason.trim().length < 8 || submitting || Boolean(pending)}>{submitting ? "Aguardando telemetria..." : pending ? "Comando em processamento" : commandLabel(commandType)}</button></form> : <div className="operations-empty"><strong>Somente monitoramento neste momento.</strong><span>{charger.status === "offline" ? "O equipamento esta offline." : "Nao ha sessao elegivel para iniciar ou encerrar."}</span></div>}
      {feedback ? <p className={`command-feedback tone-${feedback.tone}`} role="status">{feedback.message}</p> : null}
      <p className="command-policy">Operador atual: {account?.displayName} · Escopo {account?.profile === "GOODWE" ? "rede GoodWe" : location?.name}</p>
    </section>
    <section id="charger-history" className="surface panel"><SectionHeader title="Historico de comandos" subtitle="Rastro auditavel das solicitacoes enviadas ao provedor." />{commands.length ? <DataTable columns={["Comando", "Status", "Autor e motivo", "Protocolo", "Data"]}>{commands.map((command) => <tr key={command.id}><td><strong>{commandLabel(command.type)}</strong><span>{command.correlationId}</span></td><td><Badge value={command.status} /></td><td>{command.requestedBy}<span>{command.reason}</span></td><td>{command.providerCommandId ?? "Aguardando"}</td><td>{localDate(command.completedAt ?? command.requestedAt)}</td></tr>)}</DataTable> : <p className="operations-empty">Nenhum comando registrado para este carregador.</p>}</section>
  </div>;
}

export function SessionsPage({ establishmentId }: { establishmentId?: string }) {
  const { state } = useAdminState();
  const [view, setView] = useState<"live" | "authorized" | "history">("live");
  const scoped = establishmentId ? state.sessions.filter((item) => item.establishmentId === establishmentId) : state.sessions;
  const items = useMemo(() => scoped.filter((item) => view === "live" ? ["starting", "active"].includes(item.status) : view === "authorized" ? ["authorized", "start_failed"].includes(item.status) : item.status === "finished"), [scoped, view]);
  return <>
    <nav className="enterprise-breadcrumb" aria-label="Navegacao estrutural"><span><a href="#/mvp/overview">Operacao</a><i>/</i></span><span><strong>Sessoes</strong></span></nav>
    <section className="surface panel operations-page" data-testid="mvp-sessions-active"><SectionHeader eyebrow="Operacao em tempo real" title="Sessoes de recarga" subtitle="Separe autorizacao de pagamento, inicio tecnico, energia ativa e encerramento." />
      <div className="operations-view-tabs" role="tablist"><button type="button" className={view === "live" ? "is-active" : ""} onClick={() => setView("live")}>Ao vivo <b>{scoped.filter((item) => ["starting", "active"].includes(item.status)).length}</b></button><button type="button" className={view === "authorized" ? "is-active" : ""} onClick={() => setView("authorized")}>Aguardando inicio <b>{scoped.filter((item) => ["authorized", "start_failed"].includes(item.status)).length}</b></button><button type="button" className={view === "history" ? "is-active" : ""} onClick={() => setView("history")}>Historico <b>{scoped.filter((item) => item.status === "finished").length}</b></button></div>
      <DataTable columns={["Sessao", "Motorista", "Carregador", "Estado", "Energia e tempo", "Pagamento", "Acao"]}>{items.map((session) => <tr key={session.id}><td><strong>{session.id}</strong><span>{state.locations.find((item) => item.id === session.locationId)?.name}</span></td><td><strong>{session.driverName}</strong><span>{session.vehicle}</span></td><td><a href={`#/mvp/charger?charger=${session.chargerId}`}>{session.chargerId}</a></td><td><Badge value={session.status} /></td><td>{number(session.energyKwh)} kWh<span>{session.durationMinutes} min · {money(session.consumedAmount)}</span></td><td><Badge value={session.payment.status} /><span>{session.payment.method}</span></td><td><a className="ghost-button" href={`#/mvp/session?session=${session.id}`}>Abrir sessao</a></td></tr>)}</DataTable>
      {!items.length ? <p className="operations-empty">Nenhuma sessao neste estado.</p> : null}
    </section>
    <section className="surface panel" data-testid="mvp-sessions-finished"><SectionHeader title="Como ler os estados" subtitle="Pagamento aprovado nao significa que o carregador iniciou a entrega de energia." /><div className="operations-state-guide"><article><Badge value="authorized" /><p>Pagamento e motorista validados; aguarda comando.</p></article><article><Badge value="starting" /><p>Comando enviado; ainda sem energia confirmada.</p></article><article><Badge value="active" /><p>Telemetria confirmou fluxo de energia.</p></article><article><Badge value="finished" /><p>Energia encerrada e valor final calculado.</p></article></div></section>
  </>;
}

export function SessionDetailPage({ sessionId, establishmentId }: { sessionId: string; establishmentId?: string }) {
  const { state } = useAdminState();
  const session = state.sessions.find((item) => item.id === sessionId);
  if (!session || (establishmentId && session.establishmentId !== establishmentId)) return <Navigate to="/mvp/sessions" replace />;
  const charger = state.chargers.find((item) => item.id === session.chargerId);
  const events = state.sessionEvents.filter((item) => item.sessionId === session.id).sort((a, b) => a.at.localeCompare(b.at));
  const commands = state.chargerCommands.filter((item) => item.sessionId === session.id);
  return <div className="operations-detail" data-testid="mvp-session-detail">
    <nav className="enterprise-breadcrumb" aria-label="Navegacao estrutural"><span><a href="#/mvp/sessions">Sessoes</a><i>/</i></span><span><strong>{session.id}</strong></span></nav>
    <section className="operations-hero surface"><div><span className="eyebrow">Sessao de recarga</span><h2>{session.id}</h2><p>{session.driverName} · {session.vehicle}</p></div><div className="operations-hero-status"><Badge value={session.status} /><strong>{number(session.energyKwh)} kWh</strong><span>{money(session.finalAmount ?? session.consumedAmount)}</span></div></section>
    <nav className="entity-tabs operations-anchor-nav"><a className="is-active" href="#session-summary">Resumo</a><a href="#session-timeline">Linha do tempo</a><a href="#session-payment">Pagamento</a></nav>
    <section id="session-summary" className="surface panel"><SectionHeader title="Contexto da sessao" subtitle="Identidade, equipamento e metricas no mesmo fluxo." /><div className="detail-grid"><article><h3>Carregador</h3><p><a href={`#/mvp/charger?charger=${session.chargerId}`}>{charger?.identifier ?? session.chargerId}</a></p><small>{charger?.model}</small></article><article><h3>Inicio registrado</h3><p>{localDate(session.startedAt)}</p><small>{session.durationMinutes} minutos</small></article><article><h3>Energia</h3><p>{number(session.energyKwh)} kWh</p><small>{money(session.tariffPerKwh)}/kWh</small></article><article><h3>Valor</h3><p>{money(session.finalAmount ?? session.consumedAmount)}</p><small>{session.payment.status}</small></article></div></section>
    <section id="session-timeline" className="surface panel"><SectionHeader title="Linha do tempo operacional" subtitle="Eventos de pagamento, ChargeGrid e GoodWe em ordem cronologica." /><ol className="session-timeline">{events.map((event) => <li key={event.id}><i /><div><span>{event.source} · {localDate(event.at)}</span><h3>{event.label}</h3>{event.detail ? <p>{event.detail}</p> : null}{event.commandId ? <small>Comando {event.commandId}</small> : null}</div></li>)}</ol>{!events.length ? <p className="operations-empty">Nenhum evento registrado para esta sessao.</p> : null}</section>
    <section id="session-payment" className="surface panel"><SectionHeader title="Pagamento e comandos" subtitle="O financeiro autoriza a sessao; a telemetria confirma a energia." /><div className="detail-grid"><article><h3>Pagamento</h3><p>{session.payment.status}</p><small>{session.payment.method} · limite {money(session.payment.limitAmount)}</small></article><article><h3>Comandos vinculados</h3><p>{commands.length}</p><small>{commands.at(-1)?.status ? statusLabel(commands.at(-1)!.status) : "Nenhum comando"}</small></article></div></section>
  </div>;
}
