import type { ReactNode } from "react";

// Primitive presentation components shared by the administrative features.

export function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function number(value: number) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function statusLabel(value: string) {
  return ({ available: "Disponivel", charging: "Em recarga", limited: "Limitado", offline: "Offline", authorized: "Autorizada", starting: "Iniciando", active: "Ativa", finished: "Finalizada", start_failed: "Falha no inicio", REQUESTED: "Solicitado", ACCEPTED: "Aceito", CONFIRMED: "Confirmado", FAILED: "Falhou", EXPIRED: "Expirado", NORMAL: "Normal", ALERT: "Alerta", CRITICAL: "Critico", STALE: "Desatualizado", UNAVAILABLE: "Indisponivel", waiting: "Aguardando", called: "Em chamada", assigned: "Admitido", no_show: "Nao compareceu", expired: "Expirado", released: "Concluido" } as Record<string, string>)[value] ?? value;
}

export function tone(value: string) {
  if (["CONFIRMED", "NORMAL", "assigned", "released"].includes(value)) return "good";
  if (["start_failed", "FAILED", "CRITICAL", "no_show"].includes(value)) return "danger";
  if (["authorized", "starting", "REQUESTED", "ACCEPTED", "EXPIRED", "ALERT", "STALE", "UNAVAILABLE", "called"].includes(value)) return "warn";
  if (["available", "finished", "Aprovado", "Ativo", "Favorável", "released"].includes(value)) return "good";
  if (["charging", "Recusado", "Crítico", "Alta"].includes(value)) return "danger";
  if (["limited", "Pendente", "Alerta", "waiting", "Implantação"].includes(value)) return "warn";
  return "muted";
}

export function Badge({ children, value }: { children?: ReactNode; value: string }) {
  return <span className={`badge tone-${tone(value)}`}>{children ?? statusLabel(value)}</span>;
}

export function KpiCard({ testId, label, value, help, accent = "default" }: { testId?: string; label: string; value: ReactNode; help?: string; accent?: string }) {
  return <article className={`kpi-card accent-${accent}`} data-testid={testId}><span>{label}</span><strong>{value}</strong><small>{help}</small></article>;
}

export function SectionHeader({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return <header className="section-header"><div>{eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}<h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>{action ? <div className="section-action">{action}</div> : null}</header>;
}

export function DataTable({ columns, children, testId }: { columns: string[]; children: ReactNode; testId?: string }) {
  return <div className="table-wrap sems-table-wrap"><table className="data-table" data-testid={testId}><thead><tr>{columns.map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{children}</tbody></table></div>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="empty-state">{children}</div>;
}
