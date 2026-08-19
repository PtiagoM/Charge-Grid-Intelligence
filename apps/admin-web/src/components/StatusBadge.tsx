type StatusTone = "success" | "info" | "warning" | "danger" | "neutral";

interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  return <span className={`status-badge status-${tone}`}>{label}</span>;
}
