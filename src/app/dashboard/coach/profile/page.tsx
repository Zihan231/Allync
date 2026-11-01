"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { CoachShell } from "@/components/coaching/CoachShell";
import { CoachProfileForm } from "@/components/coaching/CoachProfileForm";
import { ProfileModeBar } from "@/components/roles/ProfileModeBar";

/** The coach side of the account: the coach card clubs see. */
export default function CoachProfilePage() {
  const { t } = useLanguage();
  const tc = t.coaching.coach;
  return (
    <div className="space-y-6">
      <ProfileModeBar current="coach" />
      <CoachShell title={tc.tabs.profile} subtitle={tc.setupBody}>
        {(data, toast) => (
          <CoachProfileForm key={data.profile?.updatedAt ?? "new"} profile={data.profile} onSaved={(m) => toast(m, "success")} />
        )}
      </CoachShell>
    </div>
  );
}
