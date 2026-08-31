export function StaffRow({ staff }: { staff: { name: string; role: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {staff.map((s) => (
        <div
          key={`${s.name}-${s.role}`}
          className="flex items-center gap-2 rounded-full border border-surface-line-strong bg-bg-raised px-3 py-1.5 text-xs"
        >
          <span className="font-medium text-ink">{s.name}</span>
          <span className="text-ink-faint">· {s.role}</span>
        </div>
      ))}
    </div>
  );
}
