import { useState } from "react";
import { useAdminState } from "../../app/AdminState";
import { Badge, DataTable, KpiCard, SectionHeader } from "../../components/AdminUi";
import { queuePosition } from "../../domain/queueOperations";
import { accessibleEstablishmentIds } from "../../domain/accessOperations";

function localTime(value?: string) {
  return value ? new Date(value).toLocaleString("pt-BR") : "—";
}

export function OperationsCenterPage({ establishmentId }: { establishmentId?: string }) {
  const { state, account } = useAdminState();
  const scope = establishmentId ? state.establishments.find((item) => item.id === establishmentId) : undefined;
  const scopedIds = new Set(scope ? [scope.id] : accessibleEstablishmentIds(state, account));
  const visibleEstablishments = state.establishments.filter((item) => scopedIds.has(item.id));
  const sessions = state.sessions.filter((item) => scopedIds.has(item.establishmentId));
  const queue = state.queue.filter((item) => scopedIds.has(item.establishmentId));
  const chargers = state.chargers.filter((item) => scopedIds.has(item.establishmentId) && item.commercialStatus === "PUBLISHED");
  return <>
    <section className="surface panel operations-page"><SectionHeader eyebrow="Operacao cotidiana" title={scope ? `Central · ${scope.name}` : "Central operacional"} subtitle="Um ponto de entrada para sessoes, fila e disponibilidade; os detalhes avancam verticalmente." /><div className="kpi-grid four-cols"><KpiCard label="Sessoes ao vivo" value={sessions.filter((item) => ["starting", "active"].includes(item.status)).length} help="energia e inicio" accent="danger" /><KpiCard label="Aguardando" value={queue.filter((item) => item.status === "waiting").length} help="fila atual" accent="warn" /><KpiCard label="Em chamada" value={queue.filter((item) => item.status === "called").length} help="janela ativa" /><KpiCard label="Disponiveis" value={chargers.filter((item) => item.status === "available").length} help="publicados e sem reserva" accent="good" /></div><div className="operations-launch-grid"><a href={scope ? `#/mvp/sessions?est=${scope.id}` : "#/mvp/sessions"}><span>Ao vivo</span><h3>Acompanhar sessoes</h3><p>Energia, comandos, pagamentos e timeline.</p></a><a href={scope ? `#/mvp/queue?est=${scope.id}` : "#/mvp/queue"}><span>Admissao</span><h3>Gerenciar fila</h3><p>FIFO, compatibilidade, chamada e no-show.</p></a><a href={scope ? `#/mvp/support?est=${scope.id}` : "#/mvp/support"}><span>Ocorrencias</span><h3>Abrir chamados</h3><p>Contexto tecnico ligado a equipamento e sessao.</p></a></div></section>
    {!scope && account?.profile === "GOODWE" ? <section className="surface panel"><SectionHeader title="Fila por estabelecimento" subtitle="Selecione a unidade antes de executar uma acao operacional." /><div className="operations-state-guide">{visibleEstablishments.map((item) => <article key={item.id}><h3>{item.name}</h3><p>{state.queue.filter((entry) => entry.establishmentId === item.id && entry.status === "waiting").length} aguardando</p><a className="ghost-button" href={`#/mvp/operations?est=${item.id}`}>Abrir unidade</a></article>)}</div></section> : null}
  </>;
}

export function QueueOperationsPage({ establishmentId }: { establishmentId?: string }) {
  const { state, account, callNextQueueDriver, confirmQueueArrival, markQueueNoShow, releaseQueueEntry } = useAdminState();
  const [feedback, setFeedback] = useState("");
  const establishment = establishmentId ? state.establishments.find((item) => item.id === establishmentId) : undefined;
  const authorizedIds = new Set(accessibleEstablishmentIds(state, account));
  const visibleEstablishments = state.establishments.filter((item) => authorizedIds.has(item.id));

  if (!establishment && account?.profile === "GOODWE") {
    return <section className="surface panel operations-page" data-testid="queue-portfolio"><SectionHeader eyebrow="Admissao" title="Filas da rede" subtitle="Abra um estabelecimento para chamar motoristas sem misturar unidades." /><div className="operations-state-guide">{visibleEstablishments.map((item) => { const waiting = state.queue.filter((entry) => entry.establishmentId === item.id && entry.status === "waiting"); return <article key={item.id}><Badge value={waiting.length ? "waiting" : "available"} /><h3>{item.name}</h3><p>{waiting.length} aguardando</p><a className="ghost-button" href={`#/mvp/queue?est=${item.id}`}>Gerenciar fila</a></article>; })}</div></section>;
  }

  const scopeId = establishment?.id ?? account?.establishmentId ?? "";
  const entries = state.queue.filter((item) => item.establishmentId === scopeId);
  const waiting = entries.filter((item) => item.status === "waiting").sort((a, b) => a.joinedAt.localeCompare(b.joinedAt));
  const called = entries.find((item) => item.status === "called");
  const assigned = entries.filter((item) => item.status === "assigned");
  const history = entries.filter((item) => ["no_show", "expired", "released"].includes(item.status));

  function run(action: () => { ok: boolean; issues: string[] }, success: string) {
    const result = action();
    setFeedback(result.ok ? success : result.issues.join(" "));
  }

  return <div className="operations-detail" data-testid="queue-operations-page">
    <nav className="enterprise-breadcrumb" aria-label="Navegacao estrutural"><span><a href="#/mvp/operations">Operacao</a><i>/</i></span><span><strong>Fila · {establishment?.name}</strong></span></nav>
    <section className="operations-hero surface"><div><span className="eyebrow">Admissao por estabelecimento</span><h2>Fila de recarga</h2><p>{establishment?.name} · chamada comercial sem reserva de conector</p></div><div className="operations-hero-status"><Badge value={called ? "called" : "available"} /><strong>{waiting.length}</strong><span>motoristas aguardando</span></div></section>
    <nav className="entity-tabs operations-anchor-nav"><a className="is-active" href="#queue-call">Chamada</a><a href="#queue-waiting">Aguardando</a><a href="#queue-assigned">Admitidos</a><a href="#queue-history">Historico</a></nav>
    <section id="queue-call" className="surface panel queue-call-panel"><SectionHeader eyebrow="Proxima acao" title={called ? `${called.driverName} foi chamado` : "Chamar proximo motorista"} subtitle={called ? `Janela ate ${localTime(called.callExpiresAt)}; carregador sugerido nao esta reservado.` : "A ordem FIFO e a compatibilidade sao calculadas antes da chamada."} action={!called ? <button type="button" className="sems-primary-action" disabled={!waiting.length} onClick={() => run(() => callNextQueueDriver(scopeId), "Proximo motorista chamado com sucesso.")}>Chamar proximo</button> : undefined} />{called ? <div className="queue-call-card"><div><Badge value={called.status} /><h3>{called.driverName}</h3><p>{called.vehicle} · {called.requiredConnector}</p></div><div><span>Carregador sugerido</span><strong>{called.suggestedChargerId}</strong><small>Indicacao operacional, sem reserva tecnica</small></div><div className="queue-call-actions"><button type="button" onClick={() => run(() => confirmQueueArrival(called.id), "Comparecimento confirmado.")}>Confirmar chegada</button><button type="button" className="ghost-button" onClick={() => run(() => markQueueNoShow(called.id), "No-show registrado.")}>Registrar no-show</button></div></div> : <p className="operations-empty">Nenhuma janela de chamada ativa. O primeiro motorista compativel sera selecionado pela ordem de entrada.</p>}{feedback ? <p className="command-feedback" role="status">{feedback}</p> : null}</section>
    <section id="queue-waiting" className="surface panel"><SectionHeader title="Aguardando" subtitle="Posicao e estimativa sao informativas e nao representam reserva." /><DataTable columns={["Posicao", "Motorista", "Veiculo", "Compatibilidade", "Entrada", "Estimativa"]}>{waiting.map((entry) => { const position = queuePosition(state, entry.id); return <tr key={entry.id}><td><strong>#{position?.position}</strong></td><td>{entry.driverName}</td><td>{entry.vehicle}</td><td><Badge value={entry.requiredConnector} /></td><td>{localTime(entry.joinedAt)}</td><td>{position?.estimatedWaitMinutes} min<span>estimativa operacional</span></td></tr>; })}</DataTable>{!waiting.length ? <p className="operations-empty">Fila sem motoristas aguardando.</p> : null}</section>
    <section id="queue-assigned" className="surface panel"><SectionHeader title="Comparecimento confirmado" subtitle="O operador conclui a fila quando o motorista segue para o fluxo de sessao." />{assigned.map((entry) => <div className="queue-assigned-card" key={entry.id}><div><Badge value={entry.status} /><h3>{entry.driverName}</h3><p>{entry.vehicle} · {entry.suggestedChargerId}</p></div><button type="button" onClick={() => run(() => releaseQueueEntry(entry.id), "Entrada concluida e removida da fila ativa.")}>Concluir admissao</button></div>)}{!assigned.length ? <p className="operations-empty">Nenhum motorista admitido aguardando conclusao.</p> : null}</section>
    <section id="queue-history" className="surface panel"><SectionHeader title="Historico e eventos" subtitle="Chamadas e resultados permanecem auditaveis por motorista." />{history.length ? <DataTable columns={["Motorista", "Resultado", "Carregador sugerido", "Conclusao"]}>{history.map((entry) => <tr key={entry.id}><td><strong>{entry.driverName}</strong><span>{entry.vehicle}</span></td><td><Badge value={entry.status} /></td><td>{entry.suggestedChargerId ?? "—"}</td><td>{localTime(entry.completedAt)}</td></tr>)}</DataTable> : <p className="operations-empty">Nenhuma chamada concluida neste recorte.</p>}</section>
  </div>;
}
