import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { ClubNewsItem } from "@/lib/mock/clubInsights";

export function ClubNewsFeed({ items }: { items: ClubNewsItem[] }) {
  const { t } = useLanguage();

  return (
    <div className="rounded-xl border border-surface-line bg-surface/30 p-5">
      <h3 className="font-display text-sm font-bold text-ink">{t.dashboard.clubOverview.newsFeedTitle}</h3>
      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li key={item.id} className="border-b border-surface-line/60 pb-3 last:border-0 last:pb-0">
            <p className="text-sm leading-relaxed text-ink-soft">{item.headline}</p>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-wide text-ink-faint">{item.date}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
