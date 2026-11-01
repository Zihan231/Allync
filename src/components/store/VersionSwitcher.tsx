"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSetDesignVersion } from "@/lib/api/hooks/useStore";
import { apiMessage } from "@/lib/api/creators";
import type { StoreItem } from "@/lib/api/store";

/**
 * For an owned creator design with more than one look: which one to show. Owners keep the
 * look they bought until they pick another; "latest" follows every new look from now on.
 */
export function VersionSwitcher({
  item,
  chosen,
  clubId,
  onToast,
}: {
  item: StoreItem;
  /** The owner's pinned version (undefined = follows the latest). */
  chosen: number | undefined;
  clubId?: string;
  onToast: (message: string, variant?: "success" | "error") => void;
}) {
  const { t } = useLanguage();
  const tv = t.creators.versions;
  const setVersion = useSetDesignVersion();
  const latest = item.version ?? 1;
  if (!item.versions?.length) return null;
  const outdated = chosen !== undefined && chosen < latest;
  const value = chosen === undefined || chosen === latest ? "latest" : String(chosen);

  return (
    <div className="flex flex-wrap items-center gap-2" data-testid="version-switcher">
      {outdated ? <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-bold text-accent-ink">{tv.newLook}</span> : null}
      <label className="flex items-center gap-1.5 text-[11px] text-ink-soft">
        {tv.look}
        <select
          value={value}
          disabled={setVersion.isPending}
          onChange={async (e) => {
            const version = e.target.value === "latest" ? null : Number(e.target.value);
            try {
              await setVersion.mutateAsync({ sku: item.sku, version, clubId });
              onToast(version === null ? tv.updated : tv.kept, "success");
            } catch (err) {
              onToast(apiMessage(err, t.dashboard.store.actionError), "error");
            }
          }}
          className="rounded-lg border border-surface-line-strong bg-bg-raised px-2 py-1 text-[11px] text-ink outline-none focus:border-accent"
        >
          <option value="latest">{format(tv.latest, { n: latest })}</option>
          {[...item.versions]
            .sort((a, b) => b.version - a.version)
            .map((v) => (
              <option key={v.version} value={v.version}>
                {format(tv.version, { n: v.version })}
              </option>
            ))}
        </select>
      </label>
    </div>
  );
}
