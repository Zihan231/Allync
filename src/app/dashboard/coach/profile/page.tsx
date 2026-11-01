"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { CoachShell } from "@/components/coaching/CoachShell";
import { CoachProfileForm } from "@/components/coaching/CoachProfileForm";

/** The coach card clubs see. */
export default function CoachProfilePage() {
  const { t } = useLanguage();
  const tc = t.coaching.coach;
  return (
    <CoachShell title={tc.tabs.profile} subtitle={tc.setupBody}>
      {(data, toast) => (
        <CoachProfileForm key={data.profile?.updatedAt ?? "new"} profile={data.profile} onSaved={(m) => toast(m, "success")} />
      )}
    </CoachShell>
  );
}
