"use client";

import { useMemo, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCreateCoachPost } from "@/lib/api/hooks/useCoaching";
import { CloseIcon, PlusIcon } from "@/components/icons";

const MAX_FILES = 4;
const MAX_IMAGE = 10 * 1024 * 1024;
const MAX_VIDEO = 200 * 1024 * 1024;

const errorMessage = (err: unknown) => {
  const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
  return Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
};

/** New tutorial post: text, video links and up to 4 photos / videos. It waits for staff review. */
export function CoachPostComposer({
  onToast,
  onSubmitted,
}: {
  onToast?: (message: string, variant?: "success" | "error") => void;
  /** After a successful submit (e.g. go back to the list). */
  onSubmitted?: () => void;
}) {
  const { t } = useLanguage();
  const tp = t.coaching.posts;
  const create = useCreateCoachPost();
  const [body, setBody] = useState("");
  const [links, setLinks] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const previews = useMemo(() => files.map((f) => ({ file: f, url: URL.createObjectURL(f), video: f.type.startsWith("video/") })), [files]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      const video = f.type.startsWith("video/");
      if (!video && !f.type.startsWith("image/")) continue;
      if (f.size > (video ? MAX_VIDEO : MAX_IMAGE)) {
        setError(tp.mediaHint);
        continue;
      }
      if (next.length < MAX_FILES) next.push(f);
    }
    setFiles(next);
  }

  async function submit() {
    setError("");
    const linkList = links.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (!body.trim() && !linkList.length && !files.length) return setError(tp.bodyPlaceholder);
    try {
      await create.mutateAsync({ body: body.trim(), links: linkList, files });
      setBody("");
      setLinks("");
      setFiles([]);
      onToast?.(tp.submitted, "success");
      onSubmitted?.();
    } catch (err) {
      setError(errorMessage(err) || t.coaching.deals.errGeneric);
    }
  }

  const field = "w-full rounded-lg border border-surface-line bg-bg px-3 py-2.5 text-sm text-ink outline-none focus:border-accent";

  return (
    <section className="rounded-2xl border border-surface-line bg-surface/50 p-4 sm:p-5">
      <h3 className="font-display text-base font-black text-ink">{tp.composerTitle}</h3>
      <p className="mt-1 text-xs text-ink-soft">{tp.composerHint}</p>

      <textarea
        aria-label={tp.composerTitle}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        maxLength={5000}
        placeholder={tp.bodyPlaceholder}
        className={`mt-4 ${field}`}
      />
      <label className="mt-3 block">
        <span className="text-xs font-semibold text-ink-soft">{tp.links}</span>
        <textarea value={links} onChange={(e) => setLinks(e.target.value)} rows={2} placeholder={tp.linksPlaceholder} className={`mt-1.5 font-mono ${field}`} />
      </label>

      {previews.length ? (
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {previews.map((p, i) => (
            <div key={p.url} className="relative overflow-hidden rounded-lg border border-surface-line bg-black">
              {p.video ? (
                <video src={p.url} className="aspect-square w-full object-cover" muted />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.url} alt="" className="aspect-square w-full object-cover" />
              )}
              <button
                type="button"
                aria-label={tp.delete}
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white"
              >
                <CloseIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime"
            multiple
            hidden
            data-testid="coach-post-files"
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={files.length >= MAX_FILES}
            className="inline-flex items-center gap-1.5 rounded-full border border-surface-line-strong px-3.5 py-1.5 text-xs font-semibold text-ink-soft hover:border-accent hover:text-accent-ink disabled:opacity-40"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            {tp.addMedia}
          </button>
          <p className="mt-1 text-[11px] text-ink-faint">{tp.mediaHint}</p>
        </div>
        <button
          type="button"
          onClick={submit}
          disabled={create.isPending}
          className="rounded-full bg-accent px-5 py-2.5 font-display text-sm font-black text-bg disabled:opacity-50"
        >
          {create.isPending ? tp.submitting : tp.submit}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-xs font-semibold text-danger-ink">
          {error}
        </p>
      ) : null}
    </section>
  );
}
