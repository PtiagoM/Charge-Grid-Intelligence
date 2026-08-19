interface StatusChipProps {
  label: string;
  tone: "success" | "warning" | "danger" | "neutral";
}

export function StatusChip({ label, tone }: StatusChipProps) {
  return <span className={`status-chip chip-${tone}`}>{label}</span>;
}
