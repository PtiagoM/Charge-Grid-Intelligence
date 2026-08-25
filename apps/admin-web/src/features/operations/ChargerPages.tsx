import { Fragment, useMemo, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAdminState } from "../../app/AdminState";
import { Badge, DataTable, SectionHeader, money, number, statusLabel } from "../../components/AdminUi";
import type { ChargerCommand, ChargerCommandType, ChargerPublicationStatus, Session } from "../../domain/admin";
import { SEMS_TECHNICAL_DEVICES, type SemsDeviceKind, type SemsDeviceStatus } from "../../fixtures/semsDeviceCatalog";
import { accessibleEstablishmentIds } from "../../domain/accessOperations";
import { assets } from "../../constants/assets";
import { hasAdminCapability } from "../../domain/adminCapabilities";

function localDate(value?: string) {
  return value ? new Date(value).toLocaleString("pt-BR") : "Sem leitura";
}

function localDateOnly(value?: string) {
  return value ? new Date(`${value}T12:00:00`).toLocaleDateString("pt-BR") : "—";
}

function commandLabel(type: ChargerCommandType) {
  return type === "START_CHARGE" ? "Iniciar recarga" : "Encerrar recarga";
}

interface InventoryRow {
  id: string;
  establishmentId: string;
  locationId: string;
  kind: SemsDeviceKind;
  name: string;
  serial: string;
  status: SemsDeviceStatus;
  typeLabel: string;
  primaryMetric: string;
  secondaryMetric: string;
  email?: string;
  actionHref?: string;
  publicationStatus?: ChargerPublicationStatus;
}

const DEVICE_TABS: ReadonlyArray<{ value: SemsDeviceKind; label: string }> = [
  { value: "inverter", label: "Inversor" },
  { value: "dongle", label: "Dongle" },
  { value: "charger", label: "Carregador veicular" },
  { value: "third-party-inverter", label: "Inversor de terceiros" }
];

const STATUS_TABS: Record<SemsDeviceKind, ReadonlyArray<{ value: "all" | SemsDeviceStatus; label: string }>> = {
  inverter: [
    { value: "all", label: "Todos" },
    { value: "operating", label: "Em operação" },
    { value: "fault", label: "Falha" },
    { value: "standby", label: "Em espera" },
    { value: "offline", label: "Offline" }
  ],
  dongle: [
    { value: "all", label: "Todos" },
    { value: "online", label: "Online" },
    { value: "offline", label: "Offline" }
  ],
  charger: [
    { value: "all", label: "Todos" },
    { value: "charging", label: "Carregamento" },
    { value: "inactive", label: "Inativo" },
    { value: "maintenance", label: "Em manutenção" },
    { value: "fault", label: "Falha" },
    { value: "offline", label: "Offline" }
  ],
  "third-party-inverter": [
    { value: "all", label: "Todos" },
    { value: "online", label: "Online" },
    { value: "offline", label: "Offline" }
  ]
};

const DEVICE_COLUMNS: Record<SemsDeviceKind, string[]> = {
  inverter: ["Nome do dispositivo", "SN do dispositivo", "Status do dispositivo", "Tipo de dispositivo", "Potência ativa (kW)", "Carga", "Operação"],
  dongle: ["Nome do dispositivo", "SN do dispositivo", "Status do dispositivo", "Tipo de dispositivo", "Número do SIM", "Observação", "Operação"],
  charger: ["Nome do dispositivo", "SN do dispositivo", "Status do dispositivo", "Tipo de dispositivo", "Potência de carregamento (kW)", "Carga diária (kWh)", "Operação"],
  "third-party-inverter": ["Nome do dispositivo", "SN do dispositivo", "Status do dispositivo", "Tipo de dispositivo", "Potência ativa (kW)", "Geração diária (kWh)", "Operação"]
};

function chargerInventoryStatus(value: string): SemsDeviceStatus {
  if (value === "charging") return "charging";
  if (value === "offline") return "offline";
  if (value === "limited") return "maintenance";
  return "inactive";
}

function deviceStatusLabel(value: SemsDeviceStatus) {
  return ({ operating: "Em operação", online: "Online", offline: "Offline", charging: "Carregamento", inactive: "Inativo", maintenance: "Em manutenção", fault: "Falha", standby: "Em espera" } as Record<SemsDeviceStatus, string>)[value];
}

function deviceStatusTone(value: SemsDeviceStatus) {
  if (["operating", "online", "charging", "inactive"].includes(value)) return "good";
  if (["maintenance", "standby"].includes(value)) return "warn";
  if (value === "fault") return "danger";
  return "muted";
}

function durationLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} min`;
  return `${hours} h ${remainder} min`;
}

function sessionEnd(session: Session) {
  return new Date(new Date(session.startedAt).getTime() + session.durationMinutes * 60_000).toISOString();
}

function ChargerMonitoringChart({ powerKw, mode }: { powerKw: number; mode: "operations" | "charge" }) {
  const peak = Math.max(powerKw, 1);
  const points = mode === "operations"
    ? `0,104 80,98 160,100 240,74 320,82 400,${Math.max(22, 104 - peak * 3)} 480,72 560,78`
    : `0,112 80,112 160,106 240,88 320,58 400,${Math.max(18, 112 - peak * 4)} 480,42 560,36`;
  return <div className="sems-charger-chart" data-testid="charger-monitor-chart">
    <span className="sems-chart-unit">kW</span>
    <svg viewBox="0 0 560 150" role="img" aria-label={mode === "operations" ? "Monitoramento operacional" : "Monitoramento de carga"}>
      <g className="sems-chart-grid"><line x1="0" y1="30" x2="560" y2="30" /><line x1="0" y1="70" x2="560" y2="70" /><line x1="0" y1="110" x2="560" y2="110" /></g>
      <polyline className="sems-chart-line" points={points} />
      <circle className="sems-chart-point" cx="400" cy={mode === "operations" ? Math.max(22, 104 - peak * 3) : Math.max(18, 112 - peak * 4)} r="4" />
    </svg>
    <div className="sems-chart-axis"><span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span></div>
  </div>;
}

function ChargeRecordCard({ session }: { session: Session }) {
  return <article className="sems-charge-record-card">
    <header><img src={assets.chargerChargingLight} alt="" /><strong>{durationLabel(session.durationMinutes)}</strong><Badge value={session.status} /></header>
    <time>{localDate(session.startedAt)} — {localDate(sessionEnd(session))}</time>
    <div className="sems-charge-record-metrics"><div><strong>{number(session.energyKwh)} <small>kWh</small></strong><span>Energia carregada</span></div><div><strong>{number(session.energyKwh * 5)} <small>km</small></strong><span>Autonomia estimada</span></div></div>
    <dl><div><dt>Sessão ChargeGrid</dt><dd>{session.id}</dd></div><div><dt>Motorista</dt><dd>{session.driverName}</dd></div><div><dt>Conector</dt><dd>1</dd></div></dl>
  </article>;
}

function ChargeRecordsDrawer({ sessions, onClose }: { sessions: Session[]; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();
  const filtered = sessions.filter((item) => !term || `${item.id} ${item.driverName} ${item.vehicle}`.toLowerCase().includes(term));
  return <aside className="sems-charger-drawer" role="dialog" aria-modal="true" aria-labelledby="charge-record-title">
    <header><h2 id="charge-record-title">Registro de carregamento</h2><button type="button" onClick={onClose} aria-label="Fechar registro de carregamento">×</button></header>
    <form className="sems-drawer-filters" onSubmit={(event) => event.preventDefault()}><label><span className="sr-only">Data inicial</span><input type="date" defaultValue="2026-08-01" /></label><i>→</i><label><span className="sr-only">Data final</span><input type="date" defaultValue="2026-08-23" /></label><label className="is-search"><span className="sr-only">Buscar sessão ou motorista</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Sessão, motorista ou veículo" /></label><button type="submit" aria-label="Pesquisar registros">⌕</button><button type="button" onClick={() => setSearch("")} aria-label="Limpar pesquisa">↻</button></form>
    <div className="sems-charge-record-grid">{filtered.map((session) => <ChargeRecordCard key={session.id} session={session} />)}</div>
    {!filtered.length ? <p className="operations-empty">Nenhum carregamento corresponde aos filtros.</p> : null}
  </aside>;
}

function ControlRecordsDrawer({ chargerName, commands, onClose }: { chargerName: string; commands: ChargerCommand[]; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();
  const filtered = commands.filter((item) => !term || `${item.requestedBy} ${item.reason} ${item.type}`.toLowerCase().includes(term));
  return <aside className="sems-charger-drawer" role="dialog" aria-modal="true" aria-labelledby="control-record-title">
    <header><h2 id="control-record-title">Registro de controle</h2><button type="button" onClick={onClose} aria-label="Fechar registro de controle">×</button></header>
    <form className="sems-drawer-filters" onSubmit={(event) => event.preventDefault()}><label><span className="sr-only">Data inicial</span><input type="date" /></label><i>→</i><label><span className="sr-only">Data final</span><input type="date" /></label><label className="is-search"><span className="sr-only">Operador ou controle</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Operador ou controle" /></label><button type="submit" aria-label="Pesquisar controles">⌕</button><button type="button" onClick={() => setSearch("")} aria-label="Limpar pesquisa">↻</button></form>
    <div className="table-wrap sems-control-log-table"><table className="data-table"><thead><tr><th>Nome do dispositivo</th><th>Item de controle</th><th>Operador e motivo</th><th>Resultado do controle</th></tr></thead><tbody>{filtered.map((command) => <tr key={command.id}><td><strong>{chargerName}</strong><span>{command.correlationId}</span></td><td>{commandLabel(command.type)}</td><td>{command.requestedBy}<span>{command.reason}</span></td><td><Badge value={command.status} /></td></tr>)}</tbody></table></div>
    {!filtered.length ? <p className="operations-empty"><strong>Nenhum controle registrado.</strong><span>Somente comandos ChargeGrid validados — iniciar e encerrar recarga — aparecem aqui.</span></p> : null}
    <footer className="sems-control-log-footer"><span>Total: <b>{filtered.length}</b></span><button type="button" disabled>‹</button><strong>1</strong><button type="button" disabled>›</button></footer>
  </aside>;
}

function DeviceDetailsDrawer({ name, serial, model, installationDate, onClose }: { name: string; serial: string; model: string; installationDate: string; onClose: () => void }) {
  return <aside className="sems-charger-drawer sems-device-info-drawer" role="dialog" aria-modal="true" aria-labelledby="device-info-title">
    <header><h2 id="device-info-title">Detalhes do dispositivo</h2><button type="button" onClick={onClose} aria-label="Fechar detalhes do dispositivo">×</button></header>
    <div className="sems-device-info-identity"><img src={assets.charger} alt="" /><div><strong>{name}</strong><span><b>SN</b>{serial}</span></div></div>
    <dl className="sems-device-info-grid">
      <div><dt>Tipo</dt><dd>Carregador veicular</dd></div>
      <div><dt>Modelo</dt><dd>{model || "—"}</dd></div>
      <div><dt>Adicionado em</dt><dd>{localDateOnly(installationDate)}</dd></div>
      <div><dt>Versão do firmware</dt><dd>—</dd></div>
      <div><dt>Número de portas de carregamento</dt><dd>1</dd></div>
      <div><dt>Observação</dt><dd>—</dd></div>
    </dl>
  </aside>;
}

export function ChargersInventoryPage({ establishmentId }: { establishmentId?: string }) {
  const { state, account } = useAdminState();
  const accessibleScopeSet = new Set(accessibleEstablishmentIds(state, account));
  const telemetryByChargerId = new Map(state.chargerTelemetry.map((item) => [item.chargerId, item]));
  const locationById = new Map(state.locations.map((item) => [item.id, item]));
  const [kind, setKind] = useState<SemsDeviceKind>("charger");
  const [status, setStatus] = useState<"all" | SemsDeviceStatus>("all");
  const [scopeFilter, setScopeFilter] = useState(establishmentId ?? "all");
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const chargerRows: InventoryRow[] = state.chargers
    .filter((item) => accessibleScopeSet.has(item.establishmentId) && (!establishmentId || item.establishmentId === establishmentId) && (scopeFilter === "all" || item.establishmentId === scopeFilter))
    .map((charger) => {
      const telemetry = telemetryByChargerId.get(charger.id);
      return {
        id: charger.id,
        establishmentId: charger.establishmentId,
        locationId: charger.locationId,
        kind: "charger",
        name: charger.identifier,
        serial: charger.serial,
        status: chargerInventoryStatus(charger.status),
        typeLabel: `Carregador veicular · ${charger.model}`,
        primaryMetric: number(telemetry?.currentPowerKw ?? 0),
        secondaryMetric: number(charger.todayEnergyKwh),
        actionHref: `#/mvp/charger?est=${charger.establishmentId}&charger=${charger.id}`,
        publicationStatus: charger.publicationStatus
      };
    });
  const technicalRows: InventoryRow[] = SEMS_TECHNICAL_DEVICES
    .filter((item) => accessibleScopeSet.has(item.establishmentId) && (!establishmentId || item.establishmentId === establishmentId) && (scopeFilter === "all" || item.establishmentId === scopeFilter));
  const rows = kind === "charger" ? chargerRows : technicalRows.filter((item) => item.kind === kind);
  const scopeOptions = state.establishments.filter((item) => accessibleScopeSet.has(item.id));
  const items = rows.filter((item) => {
    const term = search.trim().toLowerCase();
    const emailTerm = email.trim().toLowerCase();
    const matchesSearch = !term || [item.id, item.name, item.serial, item.typeLabel].some((value) => value.toLowerCase().includes(term));
    const matchesEmail = !emailTerm || item.email?.toLowerCase().includes(emailTerm);
    return matchesSearch && matchesEmail && (status === "all" || item.status === status);
  });
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pagedItems = items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const groupedItems = [...pagedItems.reduce((groups, item) => {
    const group = groups.get(item.locationId) ?? [];
    group.push(item);
    groups.set(item.locationId, group);
    return groups;
  }, new Map<string, InventoryRow[]>()).entries()];
  const statusTabs = STATUS_TABS[kind];
  const columns = DEVICE_COLUMNS[kind];

  function selectKind(value: SemsDeviceKind) {
    setKind(value);
    setStatus("all");
    setScopeFilter(establishmentId ?? "all");
    setPage(1);
  }

  function resetFilters() {
    setStatus("all");
    setScopeFilter(establishmentId ?? "all");
    setSearch("");
    setEmail("");
    setPage(1);
  }

  return <>
    <nav className="sems-device-type-tabs" aria-label="Tipos de dispositivos" role="tablist">{DEVICE_TABS.map((tab) => <button key={tab.value} className={kind === tab.value ? "is-active" : ""} type="button" role="tab" aria-selected={kind === tab.value} onClick={() => selectKind(tab.value)}>{tab.label}</button>)}</nav>
    <section className="surface panel operations-page sems-reference-list sems-device-inventory" data-testid="mvp-chargers-panel">
      <form className="operations-filter sems-reference-filter" onSubmit={(event) => event.preventDefault()}>
        <label><span className="sr-only">Usina</span><select aria-label="Filtrar por usina" value={scopeFilter} onChange={(event) => { setScopeFilter(event.target.value); setPage(1); }} disabled={Boolean(establishmentId)}><option value="all">Todas as usinas autorizadas</option>{scopeOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label><span className="sr-only">Buscar equipamento</span><input aria-label="Buscar dispositivo" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Nome do dispositivo, SN" /></label>
        {kind !== "charger" ? <label><span className="sr-only">E-mail</span><input type="email" value={email} onChange={(event) => { setEmail(event.target.value); setPage(1); }} placeholder="Email" /></label> : null}
        <button className="sems-icon-action" type="submit" aria-label="Pesquisar">⌕</button>
        <button className="sems-icon-action" type="button" aria-label="Limpar filtros" onClick={resetFilters}>↻</button>
      </form>
      <nav className="sems-reference-status-tabs" aria-label="Status dos dispositivos">{statusTabs.map((tab) => <button key={tab.value} className={status === tab.value ? "is-active" : ""} type="button" onClick={() => { setStatus(tab.value); setPage(1); }}>{tab.label} <b>({tab.value === "all" ? rows.length : rows.filter((item) => item.status === tab.value).length})</b></button>)}</nav>
      <DataTable columns={columns}>
        {groupedItems.map(([groupLocationId, group]) => <Fragment key={groupLocationId}>
          <tr className="sems-device-group-row"><td colSpan={columns.length}><span aria-hidden="true">⌄</span><strong>{locationById.get(groupLocationId)?.name ?? "Usina não identificada"}</strong><b>Dispositivos {group.length}</b></td></tr>
          {group.map((item) => <tr key={item.id}>
            <td><strong>{item.name}</strong></td>
            <td>{item.serial}</td>
            <td><span className={`sems-device-status tone-${deviceStatusTone(item.status)}`}><i />{deviceStatusLabel(item.status)}</span></td>
            <td>{item.typeLabel}{item.kind === "charger" && account?.role ? <span className="chargegrid-device-tag">{item.publicationStatus === "PUBLISHED" ? "ChargeGrid publicado" : item.publicationStatus === "SUSPENDED" ? "ChargeGrid suspenso" : item.publicationStatus === "CONFIGURED" ? "ChargeGrid configurado" : "Elegível ao ChargeGrid"}</span> : null}</td>
            <td>{item.primaryMetric}</td>
            <td>{item.secondaryMetric}</td>
            <td>{item.actionHref ? <a className="sems-device-menu" href={item.actionHref} aria-label={`Abrir ${item.name}`}>•••</a> : <button className="sems-device-menu" type="button" aria-label={`Mais opções para ${item.name}`}>•••</button>}</td>
          </tr>)}
        </Fragment>)}
      </DataTable>
      {!items.length ? <p className="operations-empty">Nenhum dispositivo corresponde aos filtros.</p> : null}
      <footer className="sems-device-pagination"><span>Total: <b>{items.length}</b></span><button type="button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>‹</button><strong>{currentPage}</strong><button type="button" disabled={currentPage === pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>›</button><label><span className="sr-only">Itens por página</span><select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }}><option value="5">5 / página</option><option value="10">10 / página</option><option value="20">20 / página</option></select></label></footer>
    </section>
  </>;
}

export function ChargerDetailPage({ chargerId, establishmentId }: { chargerId: string; establishmentId?: string }) {
  const { state, account, requestChargerCommand, updateChargerCommercialStatus } = useAdminState();
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "good" | "danger"; message: string } | null>(null);
  const [drawer, setDrawer] = useState<"details" | "charges" | "controls" | null>(null);
  const [monitorMode, setMonitorMode] = useState<"operations" | "charge">("operations");
  const charger = state.chargers.find((item) => item.id === chargerId);
  if (!charger || (establishmentId && charger.establishmentId !== establishmentId)) return <Navigate to="/mvp/chargers" replace />;
  const resolvedChargerId = charger.id;
  const selectedChargerId = charger.id;
  const canViewCommercial = Boolean(account && (hasAdminCapability(account, "operations:monitor") || hasAdminCapability(account, "commercial:read") || hasAdminCapability(account, "commercial:manage")));
  const canViewSessions = Boolean(account && hasAdminCapability(account, "operations:monitor"));
  const canManagePublication = account?.role === "ESTABLISHMENT_ADMIN";

  const location = state.locations.find((item) => item.id === charger.locationId);
  const telemetry = state.chargerTelemetry.find((item) => item.chargerId === charger.id);
  const sessions = state.sessions.filter((item) => item.chargerId === charger.id).sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const commands = state.chargerCommands.filter((item) => item.chargerId === charger.id).sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  const currentSession = sessions.find((item) => item.status === "active" || item.status === "authorized" || item.status === "starting");
  const latestCharge = sessions.find((item) => item.status === "finished") ?? currentSession ?? sessions[0];
  const commandType: ChargerCommandType | null = charger.status === "charging" && currentSession?.status === "active"
    ? "STOP_CHARGE"
    : currentSession?.status === "authorized" && charger.status !== "offline"
      ? "START_CHARGE"
      : null;
  const pending = commands.find((item) => item.status === "REQUESTED" || item.status === "ACCEPTED");
  const nextCommercialStatus: ChargerPublicationStatus | null = charger.publicationStatus === "ELIGIBLE"
    ? "CONFIGURED"
    : charger.publicationStatus === "CONFIGURED"
      ? "PUBLISHED"
      : charger.publicationStatus === "PUBLISHED"
        ? "SUSPENDED"
        : charger.publicationStatus === "SUSPENDED"
          ? "PUBLISHED"
          : null;

  function changeCommercialStatus() {
    if (!nextCommercialStatus) return;
    const result = updateChargerCommercialStatus(resolvedChargerId, nextCommercialStatus);
    setFeedback(result.ok
      ? { tone: "good", message: `Estado comercial atualizado para ${nextCommercialStatus}.` }
      : { tone: "danger", message: result.issues.join(" ") });
  }

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

  return <div className="sems-charger-detail" data-testid="mvp-charger-detail">
    <nav className="enterprise-breadcrumb" aria-label="Navegação estrutural"><span><a href="#/mvp/chargers">Lista de dispositivos</a><i>/</i></span><span><strong>Detalhes do dispositivo</strong></span></nav>
    <header className="sems-charger-detail-header">
      <div><a href="#/mvp/chargers" aria-label="Voltar para a lista de dispositivos">↩</a><h2>{charger.identifier}</h2><span>⌄</span></div>
      <dl><div><dt>Usina</dt><dd>{location?.name ?? "—"}</dd></div><div><dt>SN</dt><dd>{charger.serial}</dd></div></dl>
      <nav aria-label="Ações do carregador"><button type="button" onClick={() => setDrawer("details")} aria-label="Abrir detalhes do dispositivo" title="Detalhes do dispositivo"><img src={assets.chargerDeviceInformation} alt="" /></button>{canViewSessions ? <button type="button" onClick={() => setDrawer("charges")} aria-label="Abrir registro de carregamento" title="Registro de carregamento"><img src={assets.chargerChargingLight} alt="" /></button> : null}{canViewSessions ? <button type="button" onClick={() => setDrawer("controls")} aria-label="Abrir registro de controle" title="Registro de controle">▤</button> : null}</nav>
    </header>

    <section className="sems-charger-overview" id="charger-live">
      <article className="sems-charger-stage">
        <div className={`sems-charger-live-state tone-${deviceStatusTone(chargerInventoryStatus(charger.status))}`}><img src={assets.chargerStatusIdle} alt="" /><strong>{deviceStatusLabel(chargerInventoryStatus(charger.status))}</strong></div>
        <img className="sems-charger-product" src={assets.charger} alt={`Carregador ${charger.model}`} />
        <dl><div><dt>Modelo</dt><dd>{charger.model}</dd></div><div><dt>Potência nominal</dt><dd>{number(charger.powerKw)} kW</dd></div><div><dt>Última leitura</dt><dd>{localDate(telemetry?.observedAt)}</dd></div></dl>
      </article>

      <div className="sems-charger-panels">
        <article className="surface sems-latest-charge">
          {canViewSessions ? <button type="button" onClick={() => setDrawer("charges")}>Registro de carregamento <span>›</span></button> : <span className="sems-technical-kicker">Monitoramento técnico SEMS+</span>}
          <h3>{latestCharge?.status === "finished" ? "Último carregamento" : "Carregamento atual"}</h3>
          {latestCharge ? <div className="sems-latest-charge-content"><div className="sems-vehicle-state"><img src={assets.chargerNoConnectedCar} alt="" /><span>{telemetry?.vehicleConnected ? "Conectado" : "Não conectado"}</span></div><div className="sems-latest-charge-data"><strong><img src={assets.chargerChargingLight} alt="" />{durationLabel(latestCharge.durationMinutes)}</strong><time>{localDate(latestCharge.startedAt)} — {localDate(sessionEnd(latestCharge))}</time><div><article><b>{number(latestCharge.energyKwh)} <small>kWh</small></b><span>Energia carregada</span></article><article><b>{number(latestCharge.energyKwh * 5)} <small>km</small></b><span>Autonomia estimada</span></article></div>{canViewSessions ? <dl><div><dt>Sessão ChargeGrid</dt><dd>{latestCharge.id}</dd></div><div><dt>Motorista</dt><dd>{latestCharge.driverName}</dd></div><div><dt>Porta de carregamento</dt><dd>1</dd></div></dl> : null}</div></div> : <p className="operations-empty">Nenhum carregamento registrado neste dispositivo.</p>}
        </article>

        <article className="surface sems-charger-monitoring">
          <header><div role="tablist" aria-label="Monitoramento do carregador"><button type="button" role="tab" aria-selected={monitorMode === "operations"} className={monitorMode === "operations" ? "is-active" : ""} onClick={() => setMonitorMode("operations")}>Monitoramento operacional</button><button type="button" role="tab" aria-selected={monitorMode === "charge"} className={monitorMode === "charge" ? "is-active" : ""} onClick={() => setMonitorMode("charge")}>Monitoramento de carga</button></div><time>23/08/2026</time></header>
          <div className="sems-monitor-current"><span>{monitorMode === "operations" ? "Potência instantânea" : "Energia carregada hoje"}</span><strong>{monitorMode === "operations" ? `${number(telemetry?.currentPowerKw ?? 0)} kW` : `${number(charger.todayEnergyKwh)} kWh`}</strong></div>
          <ChargerMonitoringChart powerKw={telemetry?.currentPowerKw ?? 0} mode={monitorMode} />
        </article>
      </div>
    </section>

    {canViewCommercial ? <section className="surface panel sems-chargegrid-device-context" id="charger-commercial"><SectionHeader eyebrow="Camada ChargeGrid" title="Publicação comercial" subtitle="O estado técnico do equipamento permanece separado da disponibilidade comercial." /><div className="charger-commercial-lifecycle"><div><span>Estado atual</span><Badge value={charger.publicationStatus} /><small>Elegível → configurado → publicado → suspenso</small></div>{canManagePublication && nextCommercialStatus ? <button type="button" className="ghost-button" onClick={changeCommercialStatus}>{nextCommercialStatus === "CONFIGURED" ? "Confirmar configuração" : nextCommercialStatus === "PUBLISHED" ? "Publicar no ChargeGrid" : "Suspender publicação"}</button> : <span>Somente o administrador comercial altera este estado.</span>}</div>{canViewSessions ? currentSession ? <div className="operations-session-summary"><div><Badge value={currentSession.status} /><h3>{currentSession.id}</h3><p>{currentSession.driverName} · {currentSession.vehicle}</p></div><div><strong>{number(currentSession.energyKwh)} kWh</strong><span>{currentSession.durationMinutes} min · {money(currentSession.consumedAmount)}</span></div><a className="ghost-button" href={`#/mvp/session?est=${charger.establishmentId}&session=${currentSession.id}`}>Abrir linha do tempo</a></div> : <p className="operations-empty">Nenhuma sessão ChargeGrid autorizada ou ativa neste conector.</p> : null}</section> : null}

    {canViewSessions ? <section id="charger-control" className="surface panel command-panel"><div className="sems-command-heading"><SectionHeader eyebrow="Ação sensível" title="Controle do carregador" subtitle="Todo comando registra autor, motivo, protocolo e resultado observado." /><button type="button" className="ghost-button" onClick={() => setDrawer("controls")}>Abrir registro de controle</button></div>
      {commandType ? <form onSubmit={submit} className="command-form" data-testid="charger-command-form"><div className="command-intent"><span>{commandLabel(commandType)}</span><strong>{currentSession?.id}</strong><p>{commandType === "START_CHARGE" ? "A recarga só será exibida como ativa após a telemetria indicar fluxo de energia." : "O encerramento só será concluído após a telemetria indicar fim do fluxo."}</p></div><label><span>Motivo da ação</span><textarea value={reason} onChange={(event) => setReason(event.target.value)} minLength={8} required placeholder="Descreva por que este comando esta sendo enviado" /></label><label className="command-confirm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /> Confirmo que validei o carregador, o veículo e a sessão.</label><button type="submit" disabled={!confirmed || reason.trim().length < 8 || submitting || Boolean(pending)}>{submitting ? "Aguardando telemetria..." : pending ? "Comando em processamento" : commandLabel(commandType)}</button></form> : <div className="operations-empty"><strong>Somente monitoramento neste momento.</strong><span>{charger.status === "offline" ? "O equipamento está offline." : "Não há sessão elegível para iniciar ou encerrar."}</span></div>}
      {commands[0] ? <div className="sems-recent-control"><span>Último controle</span><strong>{commandLabel(commands[0].type)}</strong><Badge value={commands[0].status} /><small>{localDate(commands[0].completedAt ?? commands[0].requestedAt)} · {commands[0].requestedBy}</small></div> : null}
      {feedback ? <p className={`command-feedback tone-${feedback.tone}`} role="status">{feedback.message}</p> : null}
      <p className="command-policy">Operador atual: {account?.displayName} · Escopo {account?.profile === "GOODWE" ? "GoodWe autorizado" : location?.name}</p>
    </section> : null}

    {drawer === "details" ? <DeviceDetailsDrawer name={charger.identifier} serial={charger.serial} model={charger.model} installationDate={charger.installationDate} onClose={() => setDrawer(null)} /> : null}
    {drawer === "charges" && canViewSessions ? <ChargeRecordsDrawer sessions={sessions} onClose={() => setDrawer(null)} /> : null}
    {drawer === "controls" && canViewSessions ? <ControlRecordsDrawer chargerName={charger.identifier} commands={commands} onClose={() => setDrawer(null)} /> : null}
  </div>;
}

export function SessionsPage({ establishmentId }: { establishmentId?: string }) {
  const { state, account } = useAdminState();
  const [view, setView] = useState<"live" | "authorized" | "history">("live");
  const scopeSet = new Set(accessibleEstablishmentIds(state, account));
  const scoped = state.sessions.filter((item) => scopeSet.has(item.establishmentId) && (!establishmentId || item.establishmentId === establishmentId));
  const items = useMemo(() => scoped.filter((item) => view === "live" ? ["starting", "active"].includes(item.status) : view === "authorized" ? ["authorized", "start_failed"].includes(item.status) : item.status === "finished"), [scoped, view]);
  return <>
    <nav className="enterprise-breadcrumb" aria-label="Navegacao estrutural"><span><a href="#/mvp/overview">Operacao</a><i>/</i></span><span><strong>Sessoes</strong></span></nav>
    <section className="surface panel operations-page" data-testid="mvp-sessions-active"><SectionHeader eyebrow="Operacao em tempo real" title="Sessoes de recarga" subtitle="Separe autorizacao de pagamento, inicio tecnico, energia ativa e encerramento." />
      <div className="operations-view-tabs" role="tablist"><button type="button" className={view === "live" ? "is-active" : ""} onClick={() => setView("live")}>Ao vivo <b>{scoped.filter((item) => ["starting", "active"].includes(item.status)).length}</b></button><button type="button" className={view === "authorized" ? "is-active" : ""} onClick={() => setView("authorized")}>Aguardando inicio <b>{scoped.filter((item) => ["authorized", "start_failed"].includes(item.status)).length}</b></button><button type="button" className={view === "history" ? "is-active" : ""} onClick={() => setView("history")}>Historico <b>{scoped.filter((item) => item.status === "finished").length}</b></button></div>
      <DataTable columns={["Sessao", "Motorista", "Carregador", "Estado", "Energia e tempo", "Pagamento", "Acao"]}>{items.map((session) => <tr key={session.id}><td><strong>{session.id}</strong><span>{state.locations.find((item) => item.id === session.locationId)?.name}</span></td><td><strong>{session.driverName}</strong><span>{session.vehicle}</span></td><td><a href={`#/mvp/charger?est=${session.establishmentId}&charger=${session.chargerId}`}>{session.chargerId}</a></td><td><Badge value={session.status} /></td><td>{number(session.energyKwh)} kWh<span>{session.durationMinutes} min · {money(session.consumedAmount)}</span></td><td><Badge value={session.payment.status} /><span>{session.payment.method}</span></td><td><a className="ghost-button" href={`#/mvp/session?est=${session.establishmentId}&session=${session.id}`}>Abrir sessao</a></td></tr>)}</DataTable>
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
    <nav className="enterprise-breadcrumb" aria-label="Navegacao estrutural"><span><a href={`#/mvp/sessions?est=${session.establishmentId}`}>Sessoes</a><i>/</i></span><span><strong>{session.id}</strong></span></nav>
    <section className="operations-hero surface"><div><span className="eyebrow">Sessao de recarga</span><h2>{session.id}</h2><p>{session.driverName} · {session.vehicle}</p></div><div className="operations-hero-status"><Badge value={session.status} /><strong>{number(session.energyKwh)} kWh</strong><span>{money(session.finalAmount ?? session.consumedAmount)}</span></div></section>
    <nav className="entity-tabs operations-anchor-nav"><a className="is-active" href="#session-summary">Resumo</a><a href="#session-timeline">Linha do tempo</a><a href="#session-payment">Pagamento</a></nav>
    <section id="session-summary" className="surface panel"><SectionHeader title="Contexto da sessao" subtitle="Identidade, equipamento e metricas no mesmo fluxo." /><div className="detail-grid"><article><h3>Carregador</h3><p><a href={`#/mvp/charger?est=${session.establishmentId}&charger=${session.chargerId}`}>{charger?.identifier ?? session.chargerId}</a></p><small>{charger?.model}</small></article><article><h3>Inicio registrado</h3><p>{localDate(session.startedAt)}</p><small>{session.durationMinutes} minutos</small></article><article><h3>Energia</h3><p>{number(session.energyKwh)} kWh</p><small>{money(session.tariffPerKwh)}/kWh</small></article><article><h3>Valor</h3><p>{money(session.finalAmount ?? session.consumedAmount)}</p><small>{session.payment.status}</small></article></div></section>
    <section id="session-timeline" className="surface panel"><SectionHeader title="Linha do tempo operacional" subtitle="Eventos de pagamento, ChargeGrid e GoodWe em ordem cronologica." /><ol className="session-timeline">{events.map((event) => <li key={event.id}><i /><div><span>{event.source} · {localDate(event.at)}</span><h3>{event.label}</h3>{event.detail ? <p>{event.detail}</p> : null}{event.commandId ? <small>Comando {event.commandId}</small> : null}</div></li>)}</ol>{!events.length ? <p className="operations-empty">Nenhum evento registrado para esta sessao.</p> : null}</section>
    <section id="session-payment" className="surface panel"><SectionHeader title="Pagamento e comandos" subtitle="O financeiro autoriza a sessao; a telemetria confirma a energia." /><div className="detail-grid"><article><h3>Pagamento</h3><p>{session.payment.status}</p><small>{session.payment.method} · limite {money(session.payment.limitAmount)}</small></article><article><h3>Comandos vinculados</h3><p>{commands.length}</p><small>{commands.at(-1)?.status ? statusLabel(commands.at(-1)!.status) : "Nenhum comando"}</small></article></div></section>
  </div>;
}
