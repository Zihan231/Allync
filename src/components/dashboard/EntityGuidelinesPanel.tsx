type IconComponent = (props: { className?: string; style?: React.CSSProperties }) => React.ReactElement;

export type GuidelineItem = {
  icon: IconComponent;
  title: string;
  body: string;
};

export type GuidelineTone = "rules" | "tips";

const TONE_CLASSES: Record<GuidelineTone, { card: string; badge: string; iconWrap: string }> = {
  rules: {
    card: "border-warning/30 bg-warning-soft/10",
    badge: "bg-warning-soft text-warning-ink",
    iconWrap: "bg-warning-soft text-warning-ink",
  },
  tips: {
    card: "border-blue/30 bg-blue-soft/10",
    badge: "bg-blue-soft text-blue-ink",
    iconWrap: "bg-blue-soft text-blue-ink",
  },
};

export function EntityGuidelinesPanel({
  title,
  items,
  tone,
}: {
  title: string;
  items: GuidelineItem[];
  tone: GuidelineTone;
}) {
  const c = TONE_CLASSES[tone];

  return (
    <div className={`h-fit rounded-xl border p-5 ${c.card}`}>
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider ${c.badge}`}>
        {title}
      </span>
      <ul className="mt-4 space-y-4">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3">
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${c.iconWrap}`}>
              <item.icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-ink">{item.title}</div>
              <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">{item.body}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
