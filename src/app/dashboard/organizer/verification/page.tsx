"use client";

import { useState, type FormEvent } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatusPill } from "@/components/dashboard/StatusPill";

export default function VerificationPage() {
  const { t } = useLanguage();
  const { user, setKycStatus } = useSession();
  const c = t.dashboard.organizer.verification;
  const [submitted, setSubmitted] = useState(false);

  const tone = user.kycStatus === "verified" ? "success" : user.kycStatus === "pending" ? "warning" : "neutral";
  const label = {
    verified: c.statusVerified,
    pending: c.statusPending,
    unverified: c.statusUnverified,
  }[user.kycStatus];

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setKycStatus("pending");
    setSubmitted(true);
  };

  return (
    <div className="mx-auto max-w-xl">
      <PageHeader
        eyebrow={t.dashboard.shell.modeOrganizer}
        title={t.dashboard.shell.navVerification}
        action={<StatusPill tone={tone}>{label}</StatusPill>}
      />

      <div className="mt-6 rounded-xl border border-surface-line bg-surface/50 p-5">
        <h2 className="font-display text-sm font-semibold text-ink">{c.whyTitle}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{c.whyBody}</p>
      </div>

      {user.kycStatus === "unverified" ? (
        <div className="mt-6 rounded-xl border border-surface-line bg-surface/50 p-6">
          <h2 className="font-display mb-4 text-base font-semibold text-ink">{c.submitFormTitle}</h2>
          {submitted ? (
            <p className="text-sm text-success-ink">{c.submitted}</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-ink-soft">{c.fullNameLabel}</span>
                <input
                  required
                  defaultValue={user.name}
                  className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                />
              </label>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm font-medium text-ink-soft">{c.idTypeLabel}</span>
                  <input
                    required
                    placeholder="NID"
                    className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-ink-soft">{c.idNumberLabel}</span>
                  <input
                    required
                    className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
                  />
                </label>
              </div>
              <input type="file" className="block w-full text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-accent file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-bg" />
              <button
                type="submit"
                className="rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg transition-transform hover:-translate-y-0.5"
              >
                {c.submitButton}
              </button>
            </form>
          )}
        </div>
      ) : (
        <p className="mt-6 text-sm text-ink-soft">{c.submitted}</p>
      )}
    </div>
  );
}
