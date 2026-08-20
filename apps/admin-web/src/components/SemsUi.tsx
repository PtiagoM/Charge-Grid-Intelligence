import type { ReactNode } from "react";

export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <header className="section-header"><div><h2>{title}</h2>{subtitle ? <p>{subtitle}</p> : null}</div>{action}</header>;
}

export function KpiCard({ label, value, help, accent }: { label: string; value: ReactNode; help: string; accent?: "good" | "warn" | "danger" | "info" }) {
  return <article className="kpi-card"><span>{label}</span><strong>{value}</strong><small>{help}</small>{accent ? <i className={`kpi-accent tone-${accent}`} /> : null}</article>;
}

interface StatusTabItem { label: string; count: number; tone: "good" | "warn" | "danger" | "info" | "muted"; }

export function StatusTabs({ items }: { items: readonly StatusTabItem[] }) {
  return <div className="sems-status-tabs">{items.map((item, index) => <span key={item.label} className={`sems-status-tab tone-${item.tone}${index === 0 ? " is-active" : ""}`}><i /><b>{item.label}</b> ({item.count})</span>)}</div>;
}

export function UtilizationChart() {
  const values = [42, 55, 62, 71, 79, 86];
  const max = Math.max(...values);
  return <div className="histogram">{values.map((value, index) => <div className="histogram-item" key={value}><span>{["09h", "11h", "13h", "15h", "17h", "19h"][index]}</span><i><b style={{ width: `${Math.max(6, (value / max) * 100)}%` }} /></i><strong>{value}%</strong></div>)}</div>;
}
