"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockPeople } from "@/lib/mock/communityStore";
import { Avatar } from "@/components/common/Avatar";
import { EmptyState } from "./EmptyState";
import { UsersIcon } from "@/components/icons";

export function JoinRequestQueue({
  requests,
  onApprove,
  onReject,
}: {
  requests: any[];
  onApprove: (id: string) => void | Promise<void>;
  onReject: (id: string) => void | Promise<void>;
}) {
  const { t } = useLanguage();
  const people = useMockPeople();
  const pending = requests.filter((r) => r.status === "pending");

  if (pending.length === 0) {
    return <EmptyState icon={UsersIcon} title={t.dashboard.clubs.noRequests} body="" />;
  }

  return (
    <div className="space-y-2">
      {pending.map((request) => {
        const person =
          people.find((p) => p.id === request.personId || p.id === request.requesterUserId) ||
          request.requesterUser || {
            id: request.personId || request.requesterUserId,
            name: request.requesterUser?.name || "Player",
            dpUrl: request.requesterUser?.dpUrl || null,
          };

        return (
          <div
            key={request.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-surface-line bg-surface/40 p-4 transition-all duration-200 ease-out hover:border-surface-line-strong"
          >
            <div className="flex items-center gap-3">
              <Avatar dpUrl={person.dpUrl} name={person.name} size="sm" mode="static" />
              <div>
                <span className="text-sm font-medium text-ink block">{person.name}</span>
                {request.createdAt ? (
                  <span className="text-[11px] text-ink-faint">
                    {new Date(request.createdAt).toLocaleDateString()}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onApprove(request.id)}
                className="rounded-full bg-success-soft px-3.5 py-1.5 text-xs font-semibold text-success-ink transition-all hover:bg-success hover:text-white active:scale-95"
              >
                {t.dashboard.organizer.community.approve}
              </button>
              <button
                type="button"
                onClick={() => onReject(request.id)}
                className="rounded-full bg-danger-soft px-3.5 py-1.5 text-xs font-semibold text-danger-ink transition-all hover:bg-danger hover:text-white active:scale-95"
              >
                {t.dashboard.organizer.community.reject}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
