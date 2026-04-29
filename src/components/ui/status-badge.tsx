type Variant = 'success' | 'danger' | 'warning' | 'info';

export default function StatusBadge({
  label,
  variant,
}: {
  label: string;
  variant: Variant;
}) {
  return <span className={`status-badge status-${variant}`}>{label}</span>;
}