"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useMockPeople } from "@/lib/mock/communityStore";
import type { JoinRequest } from "@/lib/mock/types";
import { Avatar } from "@/components/common/Avatar";
import { EmptyState } from "./EmptyState";
import { UsersIcon } from "@/components/icons";

export function JoinRequestQueue({
  requests,
  onApprove,
  onReject,
}: {
  requests: JoinRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
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
        const person = people.find((p) => p.id === request.personId);
        if (!person) return null;
        return (
          <div
            key={request.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-surface-line bg-surface/40 p-4"
          >
            <div className="flex items-center gap-3">
              <Avatar dpUrl={person.dpUrl} name={person.name} size="sm" mode="static" />
              <span className="text-sm font-medium text-ink">{person.name}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onApprove(request.id)}
                className="rounded-full bg-success-soft px-3.5 py-1.5 text-xs font-semibold text-success-ink"
              >
                {t.dashboard.organizer.community.approve}
              </button>
              <button
                onClick={() => onReject(request.id)}
                className="rounded-full bg-danger-soft px-3.5 py-1.5 text-xs font-semibold text-danger-ink"
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
