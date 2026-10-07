"use client";

import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { getClub } from "@/lib/api/clubs";
import { getCommunity } from "@/lib/api/communities";

/** Banner on a club or community page while ALLYNQ staff have it frozen. */
export function FrozenNotice({ kind, id }: { kind: "club" | "community"; id: string }) {
  const { t } = useLanguage();
  const { data } = useQuery({
    queryKey: ["frozen", kind, id],
    queryFn: async () => {
      const item = kind === "club" ? await getClub(id) : await getCommunity(id);
      return { frozenAt: item.frozenAt ?? null, frozenReason: item.frozenReason ?? null };
    },
    enabled: Boolean(id),
    staleTime: 60_000,
  });
  if (!data?.frozenAt) return null;
  return (
    <div className="mt-3 rounded-xl border border-blue/40 bg-blue-soft px-4 py-3 text-sm text-ink" role="status">
      <span className="font-bold">❄ {t.admin.publicFrozen.title}</span> {t.admin.publicFrozen.body}
      {data.frozenReason ? <span className="text-ink-soft"> — {data.frozenReason}</span> : null}
    </div>
  );
}
