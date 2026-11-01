"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { BackButton } from "@/components/dashboard/BackButton";
import { CreatorShell } from "@/components/creators/CreatorShell";
import { DesignWizard } from "@/components/creators/DesignWizard";

/** Submitting a design, or (?edit=<id>) sending a new look for one to review. */
function NewDesign() {
  const { t } = useLanguage();
  const router = useRouter();
  const editId = useSearchParams().get("edit");

  return (
    <div className="space-y-4">
      <BackButton />
      <CreatorShell title={editId ? t.creators.wizard.editTitle : t.creators.wizard.title}>
        {(data, toast) => {
          const existing = editId ? (data.designs.find((d) => d.id === editId) ?? null) : null;
          return (
            <div className="mx-auto max-w-5xl rounded-2xl border border-surface-line bg-surface/40 p-4 sm:p-6">
              <DesignWizard
                key={existing?.id ?? "new"}
                existing={existing}
                commissionPct={data.commissionPct}
                onToast={toast}
                onDone={() => router.push("/dashboard/creator/designs")}
              />
            </div>
          );
        }}
      </CreatorShell>
    </div>
  );
}

export default function NewDesignPage() {
  return (
    <Suspense fallback={null}>
      <NewDesign />
    </Suspense>
  );
}
