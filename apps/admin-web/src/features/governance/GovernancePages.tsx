import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAdminState } from "../../app/AdminState";
import { Badge, DataTable, KpiCard, SectionHeader } from "../../components/AdminUi";
import type { AdminRole, ReportJob, ReportType } from "../../domain/admin";
import { accessibleEstablishmentIds } from "../../domain/accessOperations";
import { hasAdminCapability } from "../../domain/adminCapabilities";

const ROLE_LABELS: Record<AdminRole, string> = {
  GOODWE_ADMIN: "Administrador GoodWe",
  ESTABLISHMENT_ADMIN: "Administrador do estabelecimento",
  ESTABLISHMENT_OPERATOR: "Operador do estabelecimento",
  REPORT_VIEWER: "Analista de relatorios"
};

const REPORT_LABELS: Record<ReportType, string> = {
  SESSIONS: "Sessoes",
  ENERGY: "Energia e demanda",
  FINANCIAL: "Financeiro",
  INCIDENTS: "Incidentes"
};

function localDate(value?: string) {
  return value ? new Date(value).toLocaleString("pt-BR") : "—";
}

export function AccessDeniedPage() {
  return <section className="surface panel access-state" data-testid="access-denied" role="alert"><span className="access-state-icon" aria-hidden="true">!</span><div><p className="eyebrow">Acesso protegido</p><h2>Seu papel nao permite abrir esta area</h2><p>A rota foi bloqueada no controle de capacidade, mesmo quando acessada diretamente. Solicite revisao ao administrador do seu escopo.</p><a className="ghost-button" href="#/mvp/overview">Voltar para a visao geral</a></div></section>;
}

export function AccessManagementPage() {
  const { state, account, grantAccess, revokeAccess } = useAdminState();
  const [feedback, setFeedback] = useState("");
  const [reasons, setReasons] = useState<Record<string, string>>({});
  if (!account || !hasAdminCapability(account, "access:manage")) return <AccessDeniedPage />;
  const actorScopes = accessibleEstablishmentIds(state, account);
  const actorScopeSet = new Set(actorScopes);
  const visibleGrants = state.accessGrants.filter((item) => account.role === "GOODWE_ADMIN" || item.establishmentIds.some((scope) => actorScopeSet.has(scope)));
  const targetAccounts = state.accounts.filter((item) => item.id !== account.id && (account.role === "GOODWE_ADMIN" || item.profile === "ESTABELECIMENTO"));
  const roles: AdminRole[] = account.role === "GOODWE_ADMIN" ? ["GOODWE_ADMIN", "ESTABLISHMENT_ADMIN", "ESTABLISHMENT_OPERATOR", "REPORT_VIEWER"] : ["ESTABLISHMENT_OPERATOR", "REPORT_VIEWER"];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = grantAccess({ accountId: String(data.get("accountId")), role: String(data.get("role")) as AdminRole, establishmentIds: data.getAll("establishmentIds").map(String) });
    setFeedback(result.ok ? "Concessao registrada e auditada." : result.issues.join(" "));
  }

  function revoke(grantId: string) {
    const result = revokeAccess(grantId, reasons[grantId] ?? "");
    setFeedback(result.ok ? "Acesso revogado imediatamente." : result.issues.join(" "));
  }

  return <div className="operations-detail" data-testid="access-management-page">
    <section className="surface panel"><SectionHeader eyebrow="Governanca por capacidade" title="Usuarios e acessos" subtitle="Cada conta recebe papel, escopo explicito e trilha de concessao ou revogacao." /><div className="kpi-grid four-cols"><KpiCard label="Contas visiveis" value={new Set(visibleGrants.map((item) => item.accountId)).size} help="no seu escopo" /><KpiCard label="Acessos ativos" value={visibleGrants.filter((item) => item.status === "ACTIVE").length} help="avaliados no dominio" accent="good" /><KpiCard label="Revogados" value={visibleGrants.filter((item) => item.status === "REVOKED").length} help="historico preservado" /><KpiCard label="Escopos administrados" value={actorScopes.length} help={account.role === "GOODWE_ADMIN" ? "rede completa" : "estabelecimentos"} /></div></section>
    <section className="surface panel governance-grid"><div><SectionHeader title="Conceder ou alterar acesso" subtitle="Uma nova concessao aposenta a anterior sem apagar seu historico." /><form className="access-editor" onSubmit={submit}><label>Conta<select name="accountId" required defaultValue=""><option value="" disabled>Selecione uma conta</option>{targetAccounts.map((item) => <option key={item.id} value={item.id}>{item.displayName} · {item.email}</option>)}</select></label><label>Papel<select name="role" required defaultValue={roles[0]}>{roles.map((role) => <option key={role} value={role}>{ROLE_LABELS[role]}</option>)}</select></label><fieldset><legend>Estabelecimentos permitidos</legend>{state.establishments.filter((item) => account.role === "GOODWE_ADMIN" || actorScopeSet.has(item.id)).map((item) => <label className="access-scope-option" key={item.id}><input type="checkbox" name="establishmentIds" value={item.id} defaultChecked={account.role !== "GOODWE_ADMIN"} />{item.name}</label>)}</fieldset><button type="submit">Registrar concessao</button></form></div><aside className="access-policy-note"><span>Politica efetiva</span><h3>Ocultar controles nao substitui autorizacao</h3><p>As mesmas capacidades usadas na navegacao bloqueiam as operacoes de dominio e as rotas diretas. Operadores nao recebem tarifa, financeiro, acessos ou relatorios.</p><ul><li>GoodWe administra a rede inteira.</li><li>Administrador local delega apenas seu escopo.</li><li>Revogacao impede o proximo login.</li></ul></aside></section>
    <section className="surface panel"><SectionHeader title="Matriz de concessoes" subtitle="Concessoes revogadas permanecem como evidencia de auditoria." /><DataTable columns={["Usuario", "Papel", "Escopo", "Estado", "Concedido", "Gestao"]}>{visibleGrants.map((grant) => { const user = state.accounts.find((item) => item.id === grant.accountId); return <tr key={grant.id}><td><strong>{user?.displayName ?? grant.accountId}</strong><span>{user?.email}</span></td><td>{ROLE_LABELS[grant.role]}</td><td>{grant.establishmentIds.length ? grant.establishmentIds.map((id) => state.establishments.find((item) => item.id === id)?.name ?? id).join(", ") : "Toda a rede"}</td><td><Badge value={grant.status} /></td><td>{localDate(grant.grantedAt)}<span>por {grant.grantedBy}</span></td><td>{grant.status === "ACTIVE" && grant.accountId !== account.id ? <div className="access-revoke"><label><span className="sr-only">Motivo para revogar {user?.displayName}</span><input aria-label={`Motivo para revogar ${user?.displayName}`} value={reasons[grant.id] ?? ""} onChange={(event) => setReasons((current) => ({ ...current, [grant.id]: event.target.value }))} placeholder="Motivo da revogacao" /></label><button type="button" className="ghost-button" onClick={() => revoke(grant.id)}>Revogar</button></div> : <span>{grant.revocationReason ?? "Conta atual"}</span>}</td></tr>; })}</DataTable>{!visibleGrants.length ? <p className="operations-empty">Nenhuma concessao encontrada no escopo atual.</p> : null}{feedback ? <p className="command-feedback" role="status">{feedback}</p> : null}</section>
  </div>;
}

function downloadReport(job: ReportJob) {
  if (!job.csvContent || !job.fileName) return;
  const blob = new Blob([job.csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = job.fileName;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function ReportsOperationsPage({ establishmentId }: { establishmentId?: string }) {
  const { state, account, requestReport, retryReport, saveReportSubscription } = useAdminState();
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  if (!account || !hasAdminCapability(account, "reports:generate")) return <AccessDeniedPage />;
  const allowedScopes = accessibleEstablishmentIds(state, account);
  const effectiveScopes = establishmentId ? allowedScopes.filter((item) => item === establishmentId) : allowedScopes;
  if (establishmentId && !effectiveScopes.length) return <Navigate to="/mvp/reports" replace />;
  const scopeSet = new Set(effectiveScopes);
  const jobs = state.reportJobs.filter((item) => item.requestedBy === account.id || item.establishmentIds.some((scope) => scopeSet.has(scope)));
  const subscriptions = state.reportSubscriptions.filter((item) => item.accountId === account.id);
  const readyRows = jobs.filter((item) => item.status === "READY").reduce((sum, item) => sum + (item.rowCount ?? 0), 0);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const result = await requestReport({ type: String(data.get("type")) as ReportType, establishmentIds: data.getAll("establishmentIds").map(String), periodFrom: String(data.get("periodFrom")), periodTo: String(data.get("periodTo")) });
    setBusy(false);
    setFeedback(result.ok ? `Relatorio pronto com ${result.job?.rowCount ?? 0} registro(s).` : result.issues.join(" "));
  }

  async function retry(jobId: string) {
    setBusy(true);
    const result = await retryReport(jobId);
    setBusy(false);
    setFeedback(result.ok ? "Nova tarefa concluida; a falha anterior foi preservada." : result.issues.join(" "));
  }

  function subscribe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const result = saveReportSubscription({ type: String(data.get("subscriptionType")) as ReportType, establishmentIds: data.getAll("subscriptionScopes").map(String), cadence: String(data.get("cadence")) as "DAILY" | "WEEKLY" | "MONTHLY", status: String(data.get("subscriptionStatus")) as "ACTIVE" | "PAUSED" });
    setFeedback(result.ok ? "Assinatura atualizada e auditada." : result.issues.join(" "));
  }

  return <div className="operations-detail" data-testid="reports-operations-page"><section className="surface panel" data-testid="mvp-reports-panel"><SectionHeader eyebrow="Projecoes autorizadas" title="Relatorios e exportacoes" subtitle="Gere tarefas por tipo, periodo e escopo; cada arquivo preserva sua origem e evita exportacao excessiva." /><div className="kpi-grid four-cols"><KpiCard label="Tarefas" value={jobs.length} help="historico do escopo" /><KpiCard label="Prontos" value={jobs.filter((item) => item.status === "READY").length} help={`${readyRows} linhas exportaveis`} accent="good" /><KpiCard label="Em processamento" value={jobs.filter((item) => item.status === "QUEUED" || item.status === "PROCESSING").length} help="fila assincrona" /><KpiCard label="Falhas" value={jobs.filter((item) => item.status === "FAILED").length} help="retentativa preserva historico" accent={jobs.some((item) => item.status === "FAILED") ? "warn" : "good"} /></div></section><section className="reports-layout"><article className="surface panel"><SectionHeader title="Nova exportacao" subtitle="Datas inclusivas; CSV em centavos para valores financeiros." /><form className="report-builder" data-testid="report-builder" onSubmit={submit}><label>Tipo<select name="type" defaultValue="SESSIONS">{Object.entries(REPORT_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><div className="report-period"><label>Data inicial<input name="periodFrom" type="date" defaultValue="2026-08-01" required /></label><label>Data final<input name="periodTo" type="date" defaultValue="2026-08-22" required /></label></div><fieldset><legend>Escopo do arquivo</legend>{effectiveScopes.map((id) => <label className="access-scope-option" key={id}><input name="establishmentIds" type="checkbox" value={id} defaultChecked />{state.establishments.find((item) => item.id === id)?.name}</label>)}</fieldset><button type="submit" disabled={busy}>{busy ? "Gerando..." : "Gerar relatorio"}</button></form></article>{hasAdminCapability(account, "reports:subscribe") ? <article className="surface panel"><SectionHeader title="Assinatura recorrente" subtitle="O agendamento e uma preferencia auditada; envio externo permanece fora do sandbox." /><form className="report-builder" data-testid="report-subscription-form" onSubmit={subscribe}><label>Relatorio<select name="subscriptionType" defaultValue="SESSIONS">{Object.entries(REPORT_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Frequencia<select name="cadence" defaultValue="WEEKLY"><option value="DAILY">Diaria</option><option value="WEEKLY">Semanal</option><option value="MONTHLY">Mensal</option></select></label><label>Estado<select name="subscriptionStatus" defaultValue="ACTIVE"><option value="ACTIVE">Ativa</option><option value="PAUSED">Pausada</option></select></label><fieldset><legend>Escopo da assinatura</legend>{effectiveScopes.map((id) => <label className="access-scope-option" key={id}><input name="subscriptionScopes" type="checkbox" value={id} defaultChecked />{state.establishments.find((item) => item.id === id)?.name}</label>)}</fieldset><button type="submit">Salvar assinatura</button></form><div className="subscription-summary">{subscriptions.length ? subscriptions.map((item) => <p key={item.id}><Badge value={item.status} /> <strong>{REPORT_LABELS[item.type]}</strong> · {item.cadence} · proxima {localDate(item.nextRunAt)}</p>) : <p>Nenhuma assinatura configurada.</p>}</div></article> : null}</section><section className="surface panel"><SectionHeader title="Central de tarefas" subtitle="Fila, processamento, arquivo pronto e falha sao estados separados." /><DataTable columns={["Relatorio", "Periodo", "Escopo", "Estado", "Resultado", "Acao"]}>{jobs.map((job) => <tr key={job.id}><td><strong>{REPORT_LABELS[job.type]}</strong><span>{job.id}</span></td><td>{job.periodFrom} a {job.periodTo}</td><td>{job.establishmentIds.map((id) => state.establishments.find((item) => item.id === id)?.name ?? id).join(", ")}</td><td><Badge value={job.status} /></td><td>{job.status === "READY" ? `${job.rowCount} linha(s)` : job.failureReason ?? localDate(job.completedAt)}</td><td>{job.status === "READY" ? <button type="button" className="ghost-button" onClick={() => downloadReport(job)}>Baixar CSV</button> : job.status === "FAILED" ? <button type="button" className="ghost-button" disabled={busy} onClick={() => retry(job.id)}>Tentar novamente</button> : <span>Aguardando</span>}</td></tr>)}</DataTable>{!jobs.length ? <p className="operations-empty"><strong>Nenhum relatorio gerado.</strong><span>Defina tipo, periodo e escopo para criar a primeira tarefa.</span></p> : null}{feedback ? <p className="command-feedback" role="status">{feedback}</p> : null}</section></div>;
}
