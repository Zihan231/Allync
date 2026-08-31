"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { updatePersonProfile } from "@/lib/mock/communityStore";
import { ImageUploadControl } from "@/components/common/ImageUploadControl";
import { LanguageSwitch } from "@/components/LanguageSwitch";

export default function VerifyProfilePage() {
  const { t } = useLanguage();
  const { user, setDpUrl, setVerificationStatus } = useSession();
  const router = useRouter();
  const [photo, setPhoto] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    updatePersonProfile(user.personId, {
      dpUrl: photo,
      inGameId: String(data.get("inGameId") ?? ""),
      facebookUrl: String(data.get("facebookUrl") ?? ""),
    });
    setDpUrl(photo);
    setVerificationStatus("verified");
    router.push("/dashboard");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center px-6 py-14">
      <div className="bg-grid pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_60%_60%_at_50%_0%,#000_0%,transparent_70%)]" />
      <div className="glow-gold pointer-events-none absolute left-1/2 top-0 h-[420px] w-[420px] -translate-x-1/2 blur-3xl" />

      <div className="relative w-full max-w-lg">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/" className="font-display text-lg font-bold tracking-tight text-ink">
            ALL<span className="text-accent">Y</span>NC
          </Link>
          <LanguageSwitch />
        </div>

        <div className="rounded-2xl border border-surface-line bg-surface/60 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur">
          <h1 className="font-display text-2xl font-bold text-ink">{t.dashboard.onboarding.title}</h1>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{t.dashboard.onboarding.intro}</p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <ImageUploadControl label={t.dashboard.onboarding.photoLabel} value={photo} onChange={setPhoto} />

            <label className="block">
              <span className="text-sm font-medium text-ink-soft">{t.dashboard.onboarding.inGameIdLabel}</span>
              <input
                name="inGameId"
                required
                className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-ink-soft">{t.dashboard.onboarding.facebookLabel}</span>
              <input
                name="facebookUrl"
                type="url"
                required
                placeholder="https://facebook.com/..."
                className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
              />
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="text-sm font-medium text-ink-soft">{t.dashboard.onboarding.deviceNameLabel}</span>
                <input
                  name="deviceName"
                  required
                  className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-3 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink-soft">{t.dashboard.onboarding.deviceModelLabel}</span>
                <input
                  name="deviceModel"
                  required
                  className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-3 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>
            </div>

            <button
              type="submit"
              className="w-full rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg transition-transform hover:-translate-y-0.5"
            >
              {t.dashboard.onboarding.submitCta}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
