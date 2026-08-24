import { useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { useAdminState } from "../../app/AdminState";
import { Badge, DataTable, KpiCard, SectionHeader } from "../../components/AdminUi";
import type { ReportJob, ReportType } from "../../domain/admin";
import { accessibleEstablishmentIds } from "../../domain/accessOperations";
import { hasAdminCapability } from "../../domain/adminCapabilities";

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

  return <div className="operations-detail" data-testid="reports-operations-page"><section className="surface sems-reports-hub"><a className="sems-my-reports" href="#report-tasks">Meus relatórios</a><div className="sems-report-options"><a href="#report-builder"><i>▤</i><h2>Relatório da usina</h2><ul><li>Relatório de geração, energia e receita</li><li>Comparação entre várias usinas</li></ul></a><a href="#report-builder"><i>▥</i><h2>Relatório do dispositivo</h2><ul><li>Dados operacionais do carregador</li><li>Comparação entre múltiplos dispositivos</li></ul></a></div></section><section className="surface panel" data-testid="mvp-reports-panel"><SectionHeader eyebrow="Camada ChargeGrid" title="Relatorios e exportacoes" subtitle="Gere tarefas por tipo, periodo e escopo; cada arquivo preserva sua origem e evita exportacao excessiva." /><div className="kpi-grid four-cols"><KpiCard label="Tarefas" value={jobs.length} help="historico do escopo" /><KpiCard label="Prontos" value={jobs.filter((item) => item.status === "READY").length} help={`${readyRows} linhas exportaveis`} accent="good" /><KpiCard label="Em processamento" value={jobs.filter((item) => item.status === "QUEUED" || item.status === "PROCESSING").length} help="fila assincrona" /><KpiCard label="Falhas" value={jobs.filter((item) => item.status === "FAILED").length} help="retentativa preserva historico" accent={jobs.some((item) => item.status === "FAILED") ? "warn" : "good"} /></div></section><section id="report-builder" className="reports-layout"><article className="surface panel"><SectionHeader title="Nova exportacao" subtitle="Datas inclusivas; CSV em centavos para valores financeiros." /><form className="report-builder" data-testid="report-builder" onSubmit={submit}><label>Tipo<select name="type" defaultValue="SESSIONS">{Object.entries(REPORT_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><div className="report-period"><label>Data inicial<input name="periodFrom" type="date" defaultValue="2026-08-01" required /></label><label>Data final<input name="periodTo" type="date" defaultValue="2026-08-22" required /></label></div><fieldset><legend>Escopo do arquivo</legend>{effectiveScopes.map((id) => <label className="access-scope-option" key={id}><input name="establishmentIds" type="checkbox" value={id} defaultChecked />{state.establishments.find((item) => item.id === id)?.name}</label>)}</fieldset><button type="submit" disabled={busy}>{busy ? "Gerando..." : "Gerar relatorio"}</button></form></article>{hasAdminCapability(account, "reports:subscribe") ? <article className="surface panel"><SectionHeader title="Assinatura recorrente" subtitle="O agendamento e uma preferencia auditada; envio externo permanece fora do sandbox." /><form className="report-builder" data-testid="report-subscription-form" onSubmit={subscribe}><label>Relatorio<select name="subscriptionType" defaultValue="SESSIONS">{Object.entries(REPORT_LABELS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><label>Frequencia<select name="cadence" defaultValue="WEEKLY"><option value="DAILY">Diaria</option><option value="WEEKLY">Semanal</option><option value="MONTHLY">Mensal</option></select></label><label>Estado<select name="subscriptionStatus" defaultValue="ACTIVE"><option value="ACTIVE">Ativa</option><option value="PAUSED">Pausada</option></select></label><fieldset><legend>Escopo da assinatura</legend>{effectiveScopes.map((id) => <label className="access-scope-option" key={id}><input name="subscriptionScopes" type="checkbox" value={id} defaultChecked />{state.establishments.find((item) => item.id === id)?.name}</label>)}</fieldset><button type="submit">Salvar assinatura</button></form><div className="subscription-summary">{subscriptions.length ? subscriptions.map((item) => <p key={item.id}><Badge value={item.status} /> <strong>{REPORT_LABELS[item.type]}</strong> · {item.cadence} · proxima {localDate(item.nextRunAt)}</p>) : <p>Nenhuma assinatura configurada.</p>}</div></article> : null}</section><section id="report-tasks" className="surface panel"><SectionHeader title="Central de tarefas" subtitle="Fila, processamento, arquivo pronto e falha sao estados separados." /><DataTable columns={["Relatorio", "Periodo", "Escopo", "Estado", "Resultado", "Acao"]}>{jobs.map((job) => <tr key={job.id}><td><strong>{REPORT_LABELS[job.type]}</strong><span>{job.id}</span></td><td>{job.periodFrom} a {job.periodTo}</td><td>{job.establishmentIds.map((id) => state.establishments.find((item) => item.id === id)?.name ?? id).join(", ")}</td><td><Badge value={job.status} /></td><td>{job.status === "READY" ? `${job.rowCount} linha(s)` : job.failureReason ?? localDate(job.completedAt)}</td><td>{job.status === "READY" ? <button type="button" className="ghost-button" onClick={() => downloadReport(job)}>Baixar CSV</button> : job.status === "FAILED" ? <button type="button" className="ghost-button" disabled={busy} onClick={() => retry(job.id)}>Tentar novamente</button> : <span>Aguardando</span>}</td></tr>)}</DataTable>{!jobs.length ? <p className="operations-empty"><strong>Nenhum relatorio gerado.</strong><span>Defina tipo, periodo e escopo para criar a primeira tarefa.</span></p> : null}{feedback ? <p className="command-feedback" role="status">{feedback}</p> : null}</section></div>;
}
