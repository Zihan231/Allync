"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useClubCoaching } from "@/lib/api/hooks/useCoaching";
import { useClubTransfers } from "@/lib/api/hooks/useTransfers";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { Avatar } from "@/components/common/Avatar";
import { formatShortDate } from "@/components/dashboard/fixtures/labels";
import { CoachingDealCard } from "./CoachingDealCard";

/** A club's coach (for everyone) and, for its President / GS, the open coaching requests and offers. */
export function ClubCoachingPanel({ clubId }: { clubId: string }) {
  const { t, locale } = useLanguage();
  const tcl = t.coaching.club;
  const { data } = useClubCoaching(clubId);
  const { data: clubTransfers } = useClubTransfers(data?.isLeader ? clubId : undefined);
  const { toasts, toast, dismiss } = useToast();
  if (!data) return null;
  const coach = data.coach;

  return (
    <section className="rounded-2xl border border-surface-line bg-surface/50 p-4 sm:p-5" data-testid="club-coaching">
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-base font-black text-ink">{tcl.title}</h2>
        {data.isLeader ? (
          <Link href="/dashboard/efootball/coaches" className="rounded-full border border-accent/50 px-3.5 py-1.5 text-xs font-bold text-accent-ink hover:bg-accent hover:text-bg">
            {tcl.findCoach}
          </Link>
        ) : null}
      </div>
      {coach ? (
        <Link href={`/dashboard/efootball/coaches/${coach.coach.id}`} className="mt-3 flex items-center gap-3 rounded-xl border border-surface-line bg-bg/40 p-3 hover:border-accent/50">
          <Avatar dpUrl={coach.coach.dpUrl} name={coach.coach.name} size="md" mode="static" />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold text-ink">{coach.coach.name}</div>
            {coach.endsAt ? <div className="text-[11px] text-ink-faint">{format(t.coaching.coach.endsOn, { date: formatShortDate(coach.endsAt, locale) })}</div> : null}
          </div>
        </Link>
      ) : (
        <p className="mt-2 text-sm text-ink-soft">{tcl.none}</p>
      )}

      {data.isLeader && (data.open.length || coach) ? (
        <div className="mt-4 space-y-3">
          {data.open.length ? <h3 className="text-xs font-bold uppercase tracking-wider text-ink-faint">{tcl.requests}</h3> : null}
          <div className="grid gap-3 md:grid-cols-2">
            {[...data.open, ...(coach ? [coach] : [])].map((d) => (
              <CoachingDealCard
                key={d.id}
                deal={d}
                viewer="club"
                canAct
                settings={data.settings}
                clubBalanceTk={clubTransfers?.wallet?.balanceTk ?? null}
                onToast={toast}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
