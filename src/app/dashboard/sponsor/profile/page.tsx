"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ProfileModeBar } from "@/components/roles/ProfileModeBar";
import { SponsorShell } from "@/components/sponsors/SponsorShell";
import { SponsorProfileForm } from "@/components/sponsors/SponsorProfileForm";

/** The sponsor side of the account: the brand shown wherever they sponsor. */
export default function SponsorProfilePage() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6">
      <ProfileModeBar current="sponsor" />
      <SponsorShell title={t.sponsors.profile.title} requireProfile={false}>
        {(data, toast) => (
          <SponsorProfileForm
            key={data.profile?.userId ?? "new"}
            profile={data.profile}
            onSaved={(m) => toast(m, "success")}
            onError={(m) => toast(m, "error")}
          />
        )}
      </SponsorShell>
    </div>
  );
}
