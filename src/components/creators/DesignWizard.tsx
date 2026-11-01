"use client";

import { useEffect, useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useCreateDesign, useUpdateDesign } from "@/lib/api/hooks/useCreators";
import {
  apiMessage,
  CREATOR_CATEGORIES,
  LIVE_CREATOR_CATEGORIES,
  RARITIES,
  reservedWordIn,
  type CreatorCategory,
  type CreatorDesign,
  type DesignFiles,
  type Rarity,
} from "@/lib/api/creators";
import type { DesignAssets } from "@/lib/api/store";
import { tk } from "@/components/dashboard/transfers/shared";
import { DesignPreview } from "./DesignPreview";

type Toast = (message: string, variant?: "success" | "error") => void;
type Step = "type" | "artwork" | "details";

/** Upload limits per file, as on the server. */
const MAX_KB: Record<"image" | "frame" | "banner" | "stickers", number> = { image: 1024, frame: 1024, banner: 5120, stickers: 512 };

/** Which file inputs each kind of design takes. */
function fileField(category: CreatorCategory): keyof typeof MAX_KB {
  if (category === "badge") return "image";
  if (category === "frame") return "frame";
  if (category === "sticker_pack") return "stickers";
  return "banner";
}

const themed = (category: CreatorCategory) => category === "theme" || category === "club_theme";

/**
 * Submitting a design in three steps (type, artwork with a live preview, details), or with
 * `existing`, sending a new look for a live design to review (artwork only).
 */
export function DesignWizard({
  existing,
  commissionPct,
  onToast,
  onDone,
}: {
  existing?: CreatorDesign | null;
  commissionPct: number;
  onToast: Toast;
  onDone: () => void;
}) {
  const { t } = useLanguage();
  const tc = t.creators;
  const tw = tc.wizard;
  const create = useCreateDesign();
  const update = useUpdateDesign();

  const [step, setStep] = useState<Step>(existing ? "artwork" : "type");
  const [category, setCategory] = useState<CreatorCategory>((existing?.category as CreatorCategory) ?? "badge");
  const [files, setFiles] = useState<File[]>([]);
  const [primary, setPrimary] = useState(existing?.assets?.colors?.primary ?? "#e11d48");
  const [secondary, setSecondary] = useState(existing?.assets?.colors?.secondary ?? "#0ea5e9");
  const [name, setName] = useState(existing?.name ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [priceTk, setPriceTk] = useState(existing?.priceTk ?? 100);
  const [rarity, setRarity] = useState<Rarity>((existing?.metadata?.rarity as Rarity) ?? "common");
  const [fileError, setFileError] = useState<string | null>(null);

  const field = fileField(category);
  const urls = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => urls.forEach((u) => URL.revokeObjectURL(u)), [urls]);

  // The look being previewed: the new files and colours over the current look.
  const assets: DesignAssets = {
    ...(existing?.assets ?? {}),
    ...(field === "image" && urls[0] ? { imageUrl: urls[0] } : {}),
    ...(field === "frame" && urls[0] ? { frameUrl: urls[0] } : {}),
    ...(field === "banner" && urls[0] ? { bannerUrl: urls[0] } : {}),
    ...(field === "stickers" && urls.length ? { stickers: urls } : {}),
    ...(themed(category) ? { colors: { primary, secondary } } : {}),
  };
  const hasArtwork = files.length > 0 || Boolean(existing);
  const blocked = reservedWordIn(name);
  const net = priceTk - Math.round((priceTk * commissionPct) / 100);
  const pending = create.isPending || update.isPending;

  const pickFiles = (list: FileList | null) => {
    const picked = Array.from(list ?? []);
    const tooBig = picked.find((f) => f.size > MAX_KB[field] * 1024);
    if (tooBig) return setFileError(tc.fileRules[category]);
    if (field === "frame" && picked.some((f) => f.type !== "image/png")) return setFileError(tc.fileRules.frame);
    if (field === "stickers" && (picked.length < 4 || picked.length > 12)) return setFileError(tc.fileRules.sticker_pack);
    setFileError(null);
    setFiles(field === "stickers" ? picked : picked.slice(0, 1));
  };

  const designFiles = (): DesignFiles =>
    field === "stickers" ? { stickers: files } : files[0] ? { [field]: files[0] } : {};
  const colours = themed(category) ? { primaryColor: primary, secondaryColor: secondary } : {};

  const submit = async () => {
    try {
      if (existing) {
        await update.mutateAsync({ id: existing.id, input: colours, files: designFiles() });
        onToast(tw.changeSent, "success");
      } else {
        await create.mutateAsync({
          input: { category, name: name.trim(), description: description.trim() || undefined, priceTk, rarity, ...colours },
          files: designFiles(),
        });
        onToast(tw.submitted, "success");
      }
      onDone();
    } catch (err) {
      onToast(apiMessage(err, t.coaching.deals.errGeneric), "error");
    }
  };

  const steps: Step[] = existing ? ["artwork"] : ["type", "artwork", "details"];
  const input = "w-full rounded-xl border border-surface-line-strong bg-bg-raised px-3 py-2.5 text-sm text-ink outline-none focus:border-accent";

  return (
    <div className="space-y-5">
      {existing ? <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning-ink">{tw.editHint}</p> : null}
      {steps.length > 1 ? (
        <ol className="flex gap-2">
          {steps.map((s, i) => (
            <li
              key={s}
              className={`flex-1 rounded-full px-3 py-1.5 text-center font-mono text-[11px] font-bold uppercase tracking-wide ${
                s === step ? "bg-accent text-bg" : steps.indexOf(step) > i ? "bg-accent-soft text-accent-ink" : "bg-surface text-ink-faint"
              }`}
            >
              {i + 1}. {tw.steps[s]}
            </li>
          ))}
        </ol>
      ) : null}

      {step === "type" ? (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-black text-ink">{tw.pickType}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {CREATOR_CATEGORIES.map((c) => {
              const live = LIVE_CREATOR_CATEGORIES.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  disabled={!live}
                  data-testid={`design-type-${c}`}
                  onClick={() => {
                    setCategory(c);
                    setFiles([]);
                    setFileError(null);
                    setStep("artwork");
                  }}
                  className={`rounded-2xl border p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    category === c ? "border-accent bg-accent-soft" : "border-surface-line bg-surface/50 hover:border-accent/50"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-black text-ink">{tc.categories[c]}</span>
                    {!live ? <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-bold text-ink-faint">{tc.comingSoon}</span> : null}
                  </div>
                  <p className="mt-1 text-xs text-ink-soft">{tc.categoryHints[c]}</p>
                </button>
              );
            })}
          </div>
        </section>
      ) : null}

      {step === "artwork" ? (
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <h2 className="font-display text-lg font-black text-ink">{tc.categories[category]}</h2>
              <p className="mt-1 text-xs text-ink-soft">{tc.fileRules[category]}</p>
            </div>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-surface-line-strong bg-surface/40 px-4 py-8 text-center hover:border-accent">
              <span className="rounded-full bg-accent px-4 py-2 font-display text-xs font-black text-bg">
                {files.length || existing ? tw.replace : tw.upload}
              </span>
              <span className="text-[11px] text-ink-faint">{files.map((f) => f.name).join(", ")}</span>
              <input
                type="file"
                className="sr-only"
                data-testid="design-file"
                accept={field === "frame" ? "image/png" : "image/png,image/webp,image/jpeg"}
                multiple={field === "stickers"}
                onChange={(e) => pickFiles(e.target.files)}
              />
            </label>
            {fileError ? <p className="text-xs font-semibold text-danger-ink">{fileError}</p> : null}
            {themed(category) ? (
              <div className="space-y-2">
                <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">{tw.colors}</div>
                <div className="flex flex-wrap gap-4">
                  {[
                    { label: tw.primary, value: primary, set: setPrimary },
                    { label: tw.secondary, value: secondary, set: setSecondary },
                  ].map((c) => (
                    <label key={c.label} className="flex items-center gap-2 text-sm text-ink-soft">
                      <input type="color" value={c.value} onChange={(e) => c.set(e.target.value)} className="h-9 w-12 cursor-pointer rounded-lg border border-surface-line-strong bg-transparent" />
                      {c.label}
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <div className="space-y-2">
            <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">
              {tw.preview} · {tw.previewHint}
            </div>
            <DesignPreview category={category} name={name} assets={assets} rarity={rarity} />
          </div>
        </section>
      ) : null}

      {step === "details" ? (
        <section className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="rounded-xl border border-surface-line bg-surface/50 px-4 py-3 text-xs leading-relaxed text-ink-soft">{tw.nameRule}</p>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-ink-soft">{tw.name}</span>
              <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder={tw.namePlaceholder} className={input} data-testid="design-name" />
              {blocked ? <span className="block text-xs font-semibold text-danger-ink">{format(tw.nameBlocked, { word: blocked })}</span> : null}
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-ink-soft">{tw.description}</span>
              <textarea value={description} maxLength={1000} rows={3} onChange={(e) => setDescription(e.target.value)} placeholder={tw.descriptionPlaceholder} className={input} />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-ink-soft">{tw.price}</span>
                <input
                  type="number"
                  min={0}
                  max={100000}
                  value={priceTk}
                  onChange={(e) => setPriceTk(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
                  className={input}
                  data-testid="design-price"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs font-semibold text-ink-soft">{tw.rarity}</span>
                <select value={rarity} onChange={(e) => setRarity(e.target.value as Rarity)} className={input}>
                  {RARITIES.map((r) => (
                    <option key={r} value={r}>
                      {tc.rarities[r]}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-[11px] text-ink-faint">{format(tw.priceHint, { net: tk(net), pct: commissionPct })}</p>
            <p className="text-[11px] text-ink-faint">{tw.rarityHint}</p>
          </div>
          <DesignPreview category={category} name={name} assets={assets} rarity={rarity} />
        </section>
      ) : null}

      <div className="flex flex-wrap justify-between gap-3 border-t border-surface-line pt-4">
        {steps.indexOf(step) > 0 ? (
          <button
            type="button"
            onClick={() => setStep(steps[steps.indexOf(step) - 1])}
            className="rounded-full border border-surface-line-strong px-5 py-2.5 text-sm font-semibold text-ink-soft hover:text-ink"
          >
            {tw.back}
          </button>
        ) : (
          <span />
        )}
        {step === "artwork" && !existing ? (
          <button
            type="button"
            disabled={!hasArtwork}
            onClick={() => (hasArtwork ? setStep("details") : onToast(tw.missingFile, "error"))}
            className="rounded-full bg-accent px-6 py-2.5 font-display text-sm font-black text-bg disabled:opacity-50"
            data-testid="design-next"
          >
            {tw.next}
          </button>
        ) : step !== "type" ? (
          <button
            type="button"
            disabled={pending || (existing ? !files.length && !themed(category) : !hasArtwork || name.trim().length < 2 || Boolean(blocked))}
            onClick={submit}
            className="rounded-full bg-accent px-6 py-2.5 font-display text-sm font-black text-bg disabled:opacity-50"
            data-testid="design-submit"
          >
            {pending ? tw.submitting : existing ? tw.saveChange : tw.submit}
          </button>
        ) : null}
      </div>
    </div>
  );
}
