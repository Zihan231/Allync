"use client";

import { Suspense } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { AppLoader } from "@/components/common/AppLoader";
import { ProfileEditForm } from "@/components/dashboard/ProfileEditForm";
import { MyRolesCard } from "@/components/roles/MyRolesCard";
import { ProfileModeBar } from "@/components/roles/ProfileModeBar";

/**
 * The central profile: the personal info every profile shares (name, photos, contact,
 * ID) and the roles the user takes on. Each role's own profile is reached from the bar.
 */
export default function AccountProfilePage() {
  const { t } = useLanguage();
  const tp = t.coaching.profile;
  return (
    <div className="space-y-6">
      <ProfileModeBar current="central" />
      <header>
        <h1 className="font-display text-2xl font-black text-ink">{tp.centralTitle}</h1>
        <p className="mt-1 text-sm text-ink-soft">{tp.centralSubtitle}</p>
      </header>
      <MyRolesCard />
      <Suspense fallback={<AppLoader />}>
        <ProfileEditForm />
      </Suspense>
    </div>
  );
}
