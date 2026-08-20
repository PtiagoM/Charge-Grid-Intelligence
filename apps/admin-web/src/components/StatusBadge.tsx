type StatusTone = "success" | "info" | "warning" | "danger" | "neutral";

interface StatusBadgeProps {
  label: string;
  tone: StatusTone;
}

export function StatusBadge({ label, tone }: StatusBadgeProps) {
  const semsTone = { success: "good", info: "info", warning: "warn", danger: "danger", neutral: "muted" }[tone];
  return <span className={`badge tone-${semsTone}`}>{label}</span>;
}
