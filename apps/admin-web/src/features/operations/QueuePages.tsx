import { useState } from "react";
import { useAdminState } from "../../app/AdminState";
import { Badge, DataTable, SectionHeader } from "../../components/AdminUi";
import { accessibleEstablishmentIds } from "../../domain/accessOperations";
import { queuePosition } from "../../domain/queueOperations";
import { ChargeGridOperationStage } from "./ChargeGridOperationStage";

function localTime(value?: string) {
  return value ? new Date(value).toLocaleString("pt-BR") : "—";
}

export function OperationsCenterPage({ establishmentId }: { establishmentId?: string }) {
  const { state, account } = useAdminState();
  const scope = establishmentId ? state.establishments.find((item) => item.id === establishmentId) : undefined;
  if (!scope) {
    return <section className="surface panel operations-page"><SectionHeader
      title="Selecione uma planta ChargeGrid"
      subtitle={account?.profile === "GOODWE"
        ? "A operação local pertence ao estabelecimento e não está disponível para responsabilidades de carteira."
        : "A visualização individual exige uma planta comercial selecionada."}
    /></section>;
  }
  return <ChargeGridOperationStage establishmentId={scope.id} />;
}

export function QueueOperationsPage({ establishmentId }: { establishmentId?: string }) {
  const { state, account } = useAdminState();
  const [view, setView] = useState<"all" | "active" | "history">("all");
  const [search, setSearch] = useState("");
  const establishment = establishmentId ? state.establishments.find((item) => item.id === establishmentId) : undefined;
  const authorizedIds = new Set(accessibleEstablishmentIds(state, account));
  const visibleEstablishments = state.establishments.filter((item) => authorizedIds.has(item.id));

  if (!establishment && account?.profile === "GOODWE") {
    return <section className="surface panel operations-page" data-testid="queue-portfolio">
      <SectionHeader eyebrow="Admissão" title="Filas da rede" subtitle="Abra um estabelecimento para chamar motoristas sem misturar unidades." />
      <div className="operations-state-guide">{visibleEstablishments.map((item) => {
        const waiting = state.queue.filter((entry) => entry.establishmentId === item.id && entry.status === "waiting");
        return <article key={item.id}>
          <Badge value={waiting.length ? "waiting" : "available"} />
          <h3>{item.name}</h3>
          <p>{waiting.length} aguardando</p>
          <a className="ghost-button" href={`#/mvp/queue?est=${item.id}`}>Gerenciar fila</a>
        </article>;
      })}</div>
    </section>;
  }

  const scopeId = establishment?.id ?? account?.establishmentId ?? "";
  const resolvedEstablishment = establishment ?? state.establishments.find((item) => item.id === scopeId);
  const entries = state.queue.filter((item) => item.establishmentId === scopeId);
  const waiting = entries.filter((item) => item.status === "waiting").sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  const called = entries.find((item) => item.status === "called");
  const activeStatuses = new Set(["waiting", "called", "assigned"]);
  const historyStatuses = new Set(["no_show", "expired", "released"]);
  const normalizedSearch = search.trim().toLowerCase();
  const visibleEntries = entries
    .filter((item) => view === "all" || (view === "active" ? activeStatuses.has(item.status) : historyStatuses.has(item.status)))
    .filter((item) => !normalizedSearch || `${item.driverName} ${item.vehicle} ${item.requiredConnector} ${item.suggestedChargerId ?? ""}`.toLowerCase().includes(normalizedSearch))
    .sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));

  return <section className="surface panel operations-page sems-reference-list sems-chargegrid-table-page" data-testid="queue-operations-page">
    <header className="sems-chargegrid-table-heading">
      <div><h2>Fila automática de recarga</h2><p>{resolvedEstablishment?.name} · ordenação, chamada e admissão são coordenadas automaticamente pela plataforma.</p></div>
      <div className="sems-chargegrid-compact-summary"><span><b>{waiting.length}</b> aguardando</span><span><b>{called ? 1 : 0}</b> em chamada</span></div>
    </header>
    <form className="sems-device-toolbar sems-chargegrid-table-toolbar sems-queue-readonly-toolbar" onSubmit={(event) => event.preventDefault()}>
      <label className="sems-chargegrid-search"><span className="sr-only">Buscar na fila</span><input aria-label="Buscar na fila" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="⌕  Motorista, veículo ou conector" /></label>
      <span className="sems-queue-call-state"><i />{called ? `${called.driverName} em admissão automática até ${localTime(called.callExpiresAt)}` : "Automação ativa · aguardando o próximo conector elegível"}</span>
      <button className="sems-icon-action" type="button" aria-label="Limpar busca" onClick={() => setSearch("")}>↻</button>
    </form>
    <nav className="sems-reference-status-tabs" aria-label="Estado da fila">
      <button className={view === "all" ? "is-active" : ""} type="button" onClick={() => setView("all")}>Todos <b>({entries.length})</b></button>
      <button className={view === "active" ? "is-active" : ""} type="button" onClick={() => setView("active")}>Fila ativa <b>({entries.filter((item) => activeStatuses.has(item.status)).length})</b></button>
      <button className={view === "history" ? "is-active" : ""} type="button" onClick={() => setView("history")}>Histórico <b>({entries.filter((item) => historyStatuses.has(item.status)).length})</b></button>
    </nav>
    <DataTable columns={["Posição", "Motorista", "Veículo", "Estado", "Entrada / conclusão", "Carregador sugerido"]}>
      {visibleEntries.map((entry) => {
        const position = entry.status === "waiting" ? queuePosition(state, entry.id) : undefined;
        return <tr key={entry.id}>
          <td><strong>{position ? `#${position.position}` : "—"}</strong>{position ? <span>{position.estimatedWaitMinutes} min estimados</span> : null}</td>
          <td><strong>{entry.driverName}</strong><span>{entry.requiredConnector}</span></td>
          <td>{entry.vehicle}</td>
          <td><Badge value={entry.status} /></td>
          <td>{localTime(entry.completedAt ?? entry.joinedAt)}</td>
          <td>{entry.suggestedChargerId ?? "Aguardando alocação"}{entry.status === "called" ? <span>Alocação automática em andamento</span> : null}</td>
        </tr>;
      })}
    </DataTable>
    {!visibleEntries.length ? <p className="operations-empty">Nenhuma entrada corresponde a este recorte.</p> : null}
  </section>;
}
