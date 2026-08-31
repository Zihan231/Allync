"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ImageUploadControl } from "@/components/common/ImageUploadControl";
import type { JoinPolicy } from "@/lib/mock/types";

export function EntityEditForm({
  nameLabel,
  descriptionLabel,
  submitLabel,
  initialName = "",
  initialDescription = "",
  initialDpUrl = null,
  initialCoverUrl = null,
  initialJoinPolicy = "instant",
  onSubmit,
}: {
  nameLabel: string;
  descriptionLabel: string;
  submitLabel: string;
  initialName?: string;
  initialDescription?: string;
  initialDpUrl?: string | null;
  initialCoverUrl?: string | null;
  initialJoinPolicy?: JoinPolicy;
  onSubmit: (values: {
    name: string;
    description: string;
    dpUrl: string | null;
    coverUrl: string | null;
    joinPolicy: JoinPolicy;
  }) => void;
}) {
  const { t } = useLanguage();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [dpUrl, setDpUrl] = useState<string | null>(initialDpUrl);
  const [coverUrl, setCoverUrl] = useState<string | null>(initialCoverUrl);
  const [joinPolicy, setJoinPolicy] = useState<JoinPolicy>(initialJoinPolicy);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, description, dpUrl, coverUrl, joinPolicy });
      }}
      className="space-y-5"
    >
      <label className="block">
        <span className="text-sm font-medium text-ink-soft">{nameLabel}</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink-soft">{descriptionLabel}</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1.5 w-full rounded-lg border border-surface-line bg-surface px-4 py-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <ImageUploadControl label={t.dashboard.shared.dpLabel} value={dpUrl} onChange={setDpUrl} />
        <ImageUploadControl label={t.dashboard.shared.coverLabel} value={coverUrl} onChange={setCoverUrl} />
      </div>

      <div>
        <span className="text-sm font-medium text-ink-soft">{t.dashboard.clubs.joinPolicyLabel}</span>
        <div className="mt-1.5 grid grid-cols-2 gap-2 rounded-lg border border-surface-line bg-surface p-1">
          <button
            type="button"
            onClick={() => setJoinPolicy("instant")}
            className={`rounded-md py-2 text-sm font-medium transition-colors ${
              joinPolicy === "instant" ? "bg-accent text-bg" : "text-ink-soft"
            }`}
          >
            {t.dashboard.clubs.joinPolicyInstant}
          </button>
          <button
            type="button"
            onClick={() => setJoinPolicy("approval")}
            className={`rounded-md py-2 text-sm font-medium transition-colors ${
              joinPolicy === "approval" ? "bg-accent text-bg" : "text-ink-soft"
            }`}
          >
            {t.dashboard.clubs.joinPolicyApproval}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg transition-transform hover:-translate-y-0.5"
      >
        {submitLabel}
      </button>
    </form>
  );
}
