"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useUserDocument } from "@/lib/api/hooks/useAdmin";
import { Button, Modal } from "./ui";

/** Opens a stored document (a data URL or a file URL) in a new tab; data URLs go through a blob first. */
async function openFull(url: string) {
  if (!url.startsWith("data:")) {
    window.open(url, "_blank", "noopener");
    return;
  }
  const blob = await (await fetch(url)).blob();
  window.open(URL.createObjectURL(blob), "_blank", "noopener");
}

/** Shows a user's uploaded ID document to staff. */
export function DocumentViewer({ userId, name, onClose }: { userId: string; name: string; onClose: () => void }) {
  const { t } = useLanguage();
  const tv = t.admin.verification;
  const { data, isLoading } = useUserDocument(userId);
  const url = data?.documentDataUrl ?? null;
  const isPdf = Boolean(url && (url.startsWith("data:application/pdf") || url.toLowerCase().endsWith(".pdf")));
  const typeLabel = data?.documentType ? ((tv.documentTypes as Record<string, string>)[data.documentType] ?? data.documentType) : "";

  return (
    <Modal
      wide
      title={format(tv.documentTitle, { name, type: typeLabel })}
      onClose={onClose}
      footer={
        <>
          {url ? (
            <Button variant="outline" onClick={() => void openFull(url)}>
              {tv.openFull}
            </Button>
          ) : null}
          <Button onClick={onClose}>{t.admin.common.close}</Button>
        </>
      }
    >
      {isLoading ? (
        <div className="h-72 animate-pulse rounded-xl bg-surface/40" />
      ) : !url ? (
        <p className="text-sm text-ink-faint">{t.admin.user.noDocument}</p>
      ) : isPdf ? (
        <div>
          <p className="mb-2 text-xs text-ink-faint">{tv.pdfNote}</p>
          <object data={url} type="application/pdf" className="h-[60vh] w-full rounded-xl border border-surface-line">
            <p className="text-sm text-ink-soft">{tv.pdfNote}</p>
          </object>
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- a data URL from the user's upload, not an optimisable asset
        <img src={url} alt={typeLabel} className="mx-auto max-h-[65vh] w-auto rounded-xl border border-surface-line object-contain" />
      )}
    </Modal>
  );
}
