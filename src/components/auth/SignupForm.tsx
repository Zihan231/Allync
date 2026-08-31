"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { FormField } from "./FormField";
import { RoleToggle } from "./RoleToggle";
import { ArrowRightIcon } from "../icons";

export function SignupForm() {
  const { t } = useLanguage();

  return (
    <div className="rounded-2xl border border-surface-line bg-surface/60 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur">
      <h2 className="font-display text-2xl font-bold text-ink">{t.auth.signupHeading}</h2>
      <p className="mt-1.5 text-sm text-ink-soft">
        {t.auth.alreadyHave}{" "}
        <Link href="/login" className="font-medium text-accent-ink hover:underline">
          {t.auth.loginLink}
        </Link>
      </p>

      <form className="mt-7 space-y-5">
        <FormField label={t.auth.fullName} type="text" name="name" placeholder={t.auth.fullNamePlaceholder} autoComplete="name" required />
        <FormField label={t.auth.email} type="email" name="email" placeholder="you@example.com" autoComplete="email" required />
        <FormField
          label={t.auth.password}
          type="password"
          name="password"
          placeholder={t.auth.passwordPlaceholder}
          autoComplete="new-password"
          required
        />

        <RoleToggle />

        <label className="flex items-start gap-2.5 text-sm text-ink-soft">
          <input
            type="checkbox"
            name="agree"
            required
            className="mt-0.5 h-4 w-4 rounded border-surface-line-strong bg-surface accent-accent"
          />
          <span>{t.auth.agreeTerms}</span>
        </label>

        <button
          type="submit"
          className="group flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg shadow-[0_0_24px_rgba(217,165,68,0.3)] transition-transform hover:-translate-y-0.5"
        >
          {t.auth.createAccountButton}
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </form>
    </div>
  );
}
