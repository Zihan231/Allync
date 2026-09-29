"use client";

import { useEffect, useMemo, useState } from "react";
import { Avatar } from "@/components/common/Avatar";
import { CloseIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSubmitGameResult } from "@/lib/api/hooks/useTournaments";
import type { FixtureGame } from "@/lib/api/tournaments";

const MAX_SCREENSHOTS = 3;
const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 200 * 1024 * 1024;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

const digitsOnly = (value: string) => value.replace(/\D/g, "").slice(0, 2);
const megabytes = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

/**
 * One side's result for a 1v1 game: final score + screenshots + video.
 * `isResubmission` makes the files optional (the earlier evidence is kept).
 * Mount only while open.
 */
export function SubmitResultModal({
  tournamentId,
  game,
  isResubmission,
  onClose,
  onSubmitted,
}: {
  tournamentId: string;
  game: FixtureGame;
  isResubmission: boolean;
  onClose: () => void;
  onSubmitted: (message: string) => void;
}) {
  const { t } = useLanguage();
  const r = t.dashboard.results;
  const mutation = useSubmitGameResult(tournamentId);

  const [goalsA, setGoalsA] = useState("");
  const [goalsB, setGoalsB] = useState("");
  const [screenshots, setScreenshots] = useState<File[]>([]);
  const [video, setVideo] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const previews = useMemo(() => screenshots.map((file) => URL.createObjectURL(file)), [screenshots]);
  const videoPreview = useMemo(() => (video ? URL.createObjectURL(video) : null), [video]);
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews]);
  useEffect(() => () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
  }, [videoPreview]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !mutation.isPending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, mutation.isPending]);

  function addScreenshots(list: FileList | null) {
    if (!list) return;
    setError("");
    const incoming = Array.from(list);
    if (incoming.some((file) => !IMAGE_TYPES.includes(file.type))) return setError(r.errScreenshotType);
    if (incoming.some((file) => file.size > MAX_SCREENSHOT_BYTES)) return setError(r.errScreenshotSize);
    const next = [...screenshots, ...incoming];
    if (next.length > MAX_SCREENSHOTS) return setError(format(r.errTooManyScreenshots, { max: MAX_SCREENSHOTS }));
    setScreenshots(next);
  }

  function chooseVideo(list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    setError("");
    if (!VIDEO_TYPES.includes(file.type)) return setError(r.errVideoType);
    if (file.size > MAX_VIDEO_BYTES) return setError(r.errVideoSize);
    setVideo(file);
  }

  async function handleSubmit() {
    setError("");
    if (goalsA === "" || goalsB === "") return setError(r.errScore);
    if (!isResubmission && !screenshots.length) return setError(r.errScreenshots);
    if (!isResubmission && !video) return setError(r.errVideo);

    setProgress(0);
    try {
      await mutation.mutateAsync({
        gameId: game.id,
        input: { goalsA: Number(goalsA), goalsB: Number(goalsB), screenshots, video },
        onProgress: setProgress,
      });
      onSubmitted(r.sent);
      onClose();
    } catch (err: unknown) {
      setError((err as Error)?.message || r.errSend);
    }
  }

  const scoreInput = (value: string, onChange: (v: string) => void, label: string) => (
    <input
      type="text"
      inputMode="numeric"
      value={value}
      onChange={(e) => onChange(digitsOnly(e.target.value))}
      aria-label={label}
      placeholder="0"
      className="h-14 w-16 rounded-xl border border-surface-line bg-bg text-center font-display text-2xl font-black text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
    />
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-black/80 p-4 pt-[4vh] backdrop-blur-md">
      <button
        type="button"
        aria-label={r.cancel}
        disabled={mutation.isPending}
        onClick={onClose}
        className="fixed inset-0 cursor-default"
        tabIndex={-1}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="submit-result-title"
        className="relative mb-8 w-full max-w-xl overflow-hidden rounded-3xl border border-accent/30 bg-bg-raised shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-surface-line px-6 py-4">
          <div>
            <h3 id="submit-result-title" className="font-display text-lg font-black text-ink">{r.title}</h3>
            <p className="mt-0.5 text-xs leading-relaxed text-ink-soft">
              {format(r.subtitle, { a: game.playerA.name, b: game.playerB.name })}
            </p>
          </div>
          <button
            type="button"
            disabled={mutation.isPending}
            onClick={onClose}
            aria-label={r.cancel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-line/60 hover:text-ink disabled:opacity-40"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[72vh] space-y-6 overflow-y-auto px-6 py-5">
          {/* Score */}
          <section>
            <h4 className="mb-3 font-mono text-[11px] font-bold uppercase tracking-wider text-ink-soft">{r.score}</h4>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
                <Avatar dpUrl={game.playerA.dpUrl} name={game.playerA.name} size="md" mode="static" />
                <span className="max-w-full truncate text-xs font-semibold text-ink">{game.playerA.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {scoreInput(goalsA, setGoalsA, game.playerA.name)}
                <span className="font-display text-xl font-black text-ink-faint">:</span>
                {scoreInput(goalsB, setGoalsB, game.playerB.name)}
              </div>
              <div className="flex min-w-0 flex-col items-center gap-1.5 text-center">
                <Avatar dpUrl={game.playerB.dpUrl} name={game.playerB.name} size="md" mode="static" />
                <span className="max-w-full truncate text-xs font-semibold text-ink">{game.playerB.name}</span>
              </div>
            </div>
          </section>

          {isResubmission ? (
            <p className="rounded-lg bg-blue-soft px-3 py-2 text-xs text-blue-ink">{r.keepEarlier}</p>
          ) : null}

          {/* Screenshots */}
          <section>
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-soft">{r.screenshots}</h4>
            <p className="mt-1 text-xs text-ink-faint">{format(r.screenshotsHint, { max: MAX_SCREENSHOTS })}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {previews.map((url, index) => (
                <div key={url} className="relative h-24 w-36 overflow-hidden rounded-xl border border-surface-line">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setScreenshots((files) => files.filter((_, i) => i !== index))}
                    aria-label={r.removeFile}
                    className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-danger"
                  >
                    <CloseIcon className="h-3 w-3" />
                  </button>
                </div>
              ))}
              {screenshots.length < MAX_SCREENSHOTS ? (
                <label className="flex h-24 w-36 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-surface-line-strong text-xs font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent-ink">
                  <span className="text-lg">＋</span>
                  {r.chooseImages}
                  <input
                    type="file"
                    accept={IMAGE_TYPES.join(",")}
                    multiple
                    className="sr-only"
                    onChange={(e) => {
                      addScreenshots(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </label>
              ) : null}
            </div>
          </section>

          {/* Video */}
          <section>
            <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-ink-soft">{r.video}</h4>
            <p className="mt-1 text-xs text-ink-faint">{r.videoHint}</p>
            {video && videoPreview ? (
              <div className="mt-3 overflow-hidden rounded-xl border border-surface-line">
                <video src={videoPreview} controls className="max-h-56 w-full bg-black" />
                <div className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                  <span className="truncate text-ink-soft">
                    {video.name} · {megabytes(video.size)}
                  </span>
                  <button type="button" onClick={() => setVideo(null)} className="font-semibold text-danger-ink">
                    {r.removeFile}
                  </button>
                </div>
              </div>
            ) : (
              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-surface-line-strong py-6 text-xs font-semibold text-ink-soft transition-colors hover:border-accent hover:text-accent-ink">
                <span className="text-lg">🎬</span>
                {r.chooseVideo}
                <input
                  type="file"
                  accept={VIDEO_TYPES.join(",")}
                  className="sr-only"
                  onChange={(e) => {
                    chooseVideo(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </section>

          {error ? (
            <div className="rounded-xl border border-danger/40 bg-danger-soft p-3 text-xs font-semibold text-danger-ink" role="alert">
              {error}
            </div>
          ) : null}
        </div>

        <div className="border-t border-surface-line px-6 py-4">
          {mutation.isPending ? (
            <div className="mb-3">
              <div className="mb-1 font-mono text-[11px] text-ink-soft">{format(r.uploading, { percent: progress })}</div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-line">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : null}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={onClose}
              className="rounded-full border border-surface-line-strong px-4 py-2 text-xs font-semibold text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
            >
              {r.cancel}
            </button>
            <button
              type="button"
              disabled={mutation.isPending}
              onClick={handleSubmit}
              className="rounded-full bg-accent px-6 py-2.5 font-display text-sm font-black text-bg shadow-[0_0_20px_rgba(217,165,68,0.35)] transition-transform hover:-translate-y-0.5 disabled:opacity-40"
            >
              {r.send}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
