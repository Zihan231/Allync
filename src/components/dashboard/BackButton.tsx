"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ArrowLeftIcon } from "@/components/icons";

export function BackButton({ href, label, className = "" }: { href?: string; label?: string; className?: string }) {
  const router = useRouter();
  const { t } = useLanguage();
  const text = label ?? t.dashboard.shared.back;

  const buttonClass = `group mb-4 inline-flex items-center gap-2 rounded-full border border-surface-line-strong bg-surface px-4 py-2 text-sm font-semibold text-ink shadow-[0_2px_8px_rgba(0,0,0,0.25)] transition-colors hover:border-accent hover:text-accent-ink ${className}`;

  if (href) {
    return (
      <Link href={href} className={buttonClass}>
        <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        {text}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => router.back()} className={buttonClass}>
      <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
      {text}
    </button>
  );
}
