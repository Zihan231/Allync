"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCreateSponsorPost } from "@/lib/api/hooks/useSponsors";
import { BackButton } from "@/components/dashboard/BackButton";
import { CoachPostComposer } from "@/components/coaching/CoachPostComposer";
import { SponsorShell } from "@/components/sponsors/SponsorShell";

/** Writing a sponsored post; once sent for review it's back to the list. */
export default function NewSponsorPostPage() {
  const { t } = useLanguage();
  const tp = t.sponsors.posts;
  const router = useRouter();
  const create = useCreateSponsorPost();
  return (
    <div className="space-y-4">
      <BackButton />
      <SponsorShell title={tp.composerTitle}>
        {(_data, toast) => (
          <div className="mx-auto max-w-2xl">
            <CoachPostComposer
              title={tp.composerTitle}
              hint={tp.subtitle}
              submittedText={tp.submitted}
              submit={(input) => create.mutateAsync(input)}
              onToast={toast}
              onSubmitted={() => router.push("/dashboard/sponsor/posts")}
            />
          </div>
        )}
      </SponsorShell>
    </div>
  );
}
