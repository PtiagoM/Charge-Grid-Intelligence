import type { ReactNode } from "react";

export function money(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function number(value: number) {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function statusLabel(value: string) {
  return ({ available: "Disponivel", charging: "Carregando", limited: "Limitado", offline: "Offline", active: "Ativa", finished: "Finalizada", waiting: "Aguardando", released: "Liberado" } as Record<string, string>)[value] ?? value;
}

export function tone(value: string) {
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
