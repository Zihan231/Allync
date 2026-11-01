"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useUpdateCoachProfile } from "@/lib/api/hooks/useCoaching";
import type { CoachProfile } from "@/lib/api/coaching";

const errorMessage = (err: unknown) => {
  const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  return Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
};

/** The coach card clubs see: headline, bio, channel, specialities, usual fee, availability. */
export function CoachProfileForm({
  profile,
  onSaved,
}: {
  profile: CoachProfile | null;
  onSaved?: (message: string) => void;
}) {
  const { t } = useLanguage();
  const tc = t.coaching.coach;
  const save = useUpdateCoachProfile();
  const [headline, setHeadline] = useState(profile?.headline ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [channel, setChannel] = useState(profile?.youtubeChannelUrl ?? "");
  const [specialities, setSpecialities] = useState((profile?.specialities ?? []).join(", "));
  const [fee, setFee] = useState(profile?.askingFeeTk != null ? String(profile.askingFeeTk) : "");
  const [available, setAvailable] = useState(profile?.available ?? true);
  const [error, setError] = useState("");

  async function submit() {
    setError("");
    try {
      await save.mutateAsync({
        headline: headline.trim(),
        bio: bio.trim() || null,
        youtubeChannelUrl: channel.trim() || null,
        specialities: specialities.split(",").map((s) => s.trim()).filter(Boolean),
        askingFeeTk: fee ? Number(fee) : null,
        available,
      });
      onSaved?.(tc.profileSaved);
    } catch (err) {
      setError(errorMessage(err) || t.coaching.deals.errGeneric);
    }
  }

  const field = "mt-1.5 w-full rounded-lg border border-surface-line bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent";
  const label = "text-xs font-semibold text-ink-soft";

  return (
    <section className="space-y-4 rounded-2xl border border-surface-line bg-surface/50 p-4 sm:p-5">
      {!profile ? (
        <div className="rounded-xl border border-accent/40 bg-accent-soft/40 p-3">
          <div className="font-display text-sm font-black text-ink">{tc.setupTitle}</div>
          <p className="mt-1 text-xs text-ink-soft">{tc.setupBody}</p>
        </div>
      ) : null}
      <label className="block">
        <span className={label}>{tc.headline}</span>
        <input value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={120} placeholder={tc.headlinePlaceholder} className={field} />
      </label>
      <label className="block">
        <span className={label}>{tc.bio}</span>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={2000} className={field} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className={label}>{tc.channel}</span>
          <input value={channel} onChange={(e) => setChannel(e.target.value)} placeholder={tc.channelPlaceholder} className={field} />
        </label>
        <label className="block">
          <span className={label}>{tc.askingFee}</span>
          <input value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className={`${field} font-mono`} />
        </label>
      </div>
      <label className="block">
        <span className={label}>{tc.specialities}</span>
        <input value={specialities} onChange={(e) => setSpecialities(e.target.value)} placeholder={tc.specialitiesHint} className={field} />
      </label>
      <label className="flex items-start gap-3 rounded-xl border border-surface-line bg-bg/40 p-3">
        <input type="checkbox" checked={available} onChange={(e) => setAvailable(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--accent)]" />
        <span>
          <span className="block text-sm font-semibold text-ink">{tc.available}</span>
          <span className="block text-xs text-ink-soft">{tc.availableHint}</span>
        </span>
      </label>
      {error ? (
        <p role="alert" className="text-xs font-semibold text-danger-ink">
          {error}
        </p>
      ) : null}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={save.isPending}
          className="rounded-full bg-accent px-5 py-2.5 font-display text-sm font-black text-bg disabled:opacity-50"
        >
          {tc.saveProfile}
        </button>
      </div>
    </section>
  );
}
