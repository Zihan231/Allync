import Link from "next/link";

type IconComponent = (props: { className?: string; style?: React.CSSProperties }) => React.ReactElement;

export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon?: IconComponent;
  title: string;
  body: string;
  action?: { label: string; href: string };
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-surface-line-strong px-6 py-12 text-center">
      {Icon ? (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink-faint">
          <Icon className="h-6 w-6" />
        </div>
      ) : null}
      <h3 className="font-display mt-4 text-base font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-soft">{body}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-5 rounded-full bg-accent px-5 py-2.5 font-display text-sm font-semibold text-bg transition-transform hover:-translate-y-0.5"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  );
}
