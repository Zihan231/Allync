type IconComponent = (props: { className?: string; style?: React.CSSProperties }) => React.ReactElement;

export function StatTile({
  label,
  value,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string;
  icon?: IconComponent;
  trend?: { value: string; direction: "up" | "down" };
}) {
  return (
    <div className="rounded-xl border border-surface-line bg-surface/50 p-5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs uppercase tracking-wide text-ink-faint">
          {label}
        </span>
        {Icon ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-soft text-blue-ink">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
      </div>
      <div className="font-display mt-3 text-2xl font-bold text-ink">{value}</div>
      {trend ? (
        <div
          className={`mt-1.5 font-mono text-xs ${
            trend.direction === "up" ? "text-success-ink" : "text-danger-ink"
          }`}
        >
          {trend.direction === "up" ? "▲" : "▼"} {trend.value}
        </div>
      ) : null}
    </div>
  );
}
