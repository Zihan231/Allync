"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { BackButton } from "@/components/dashboard/BackButton";
import { CoachShell } from "@/components/coaching/CoachShell";
import { CoachProfileForm } from "@/components/coaching/CoachProfileForm";
import { CoachPostComposer } from "@/components/coaching/CoachPostComposer";

/** Writing a tutorial post; once sent for review it's back to the list. */
export default function NewCoachPostPage() {
  const { t } = useLanguage();
  const router = useRouter();
  return (
    <div className="space-y-4">
      <BackButton />
      <CoachShell title={t.coaching.posts.composerTitle}>
        {(data, toast) => (
          <div className="mx-auto max-w-2xl">
            {data.profile ? (
              <CoachPostComposer onToast={toast} onSubmitted={() => router.push("/dashboard/coach/posts?sent=1")} />
            ) : (
              <CoachProfileForm profile={null} onSaved={(m) => toast(m, "success")} />
            )}
          </div>
        )}
      </CoachShell>
    </div>
  );
}
