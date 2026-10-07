"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { format } from "@/lib/i18n/translations";
import {
  DEFAULT_PHONE_COUNTRY,
  PHONE_COUNTRIES,
  flagUrl,
  isValidNationalNumber,
  parsePhoneInput,
  toE164,
  type PhoneCountry,
} from "@/lib/phone";
import { FormField } from "./FormField";
import { ArrowRightIcon } from "../icons";
import { usePublicSettings } from "@/lib/api/hooks/useAdmin";

export function SignupForm() {
  const { t } = useLanguage();
  const { signup, isAuthenticated, isLoading } = useSession();
  const { data: platform } = usePublicSettings();
  const signupsClosed = platform?.features.signupsOpen === false;
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Country (Bangladesh by default) drives the phone's +code; typing a +code switches it.
  const [country, setCountry] = useState<PhoneCountry>(DEFAULT_PHONE_COUNTRY);
  const [national, setNational] = useState("");
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmTouched, setConfirmTouched] = useState(false);

  const confirmError =
    confirmPassword === ""
      ? t.auth.errConfirmPasswordRequired
      : confirmPassword !== password
        ? t.auth.errPasswordMismatch
        : null;
  // Say so as soon as the retyped password stops matching, not only on blur.
  const showConfirmError =
    confirmError !== null &&
    (confirmTouched || (confirmPassword !== "" && !password.startsWith(confirmPassword)));

  const phoneError = national === "" && !pendingCode
    ? t.auth.errPhoneRequired
    : isValidNationalNumber(national, country)
      ? null
      : format(t.auth.errPhoneInvalid, { country: country.name, example: `+${country.dialCode} ${country.example}` });

  const handlePhoneChange = (raw: string) => {
    const parsed = parsePhoneInput(raw, country);
    setCountry(parsed.country);
    setNational(parsed.national);
    setPendingCode(parsed.pending ?? null);
  };

  const handleCountryChange = (iso2: string) => {
    const next = PHONE_COUNTRIES.find((c) => c.iso2 === iso2) ?? DEFAULT_PHONE_COUNTRY;
    setCountry(next);
    setNational((n) => n.slice(0, next.digits[1]));
    setPendingCode(null);
  };

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();

    if (!name || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setConfirmTouched(true);
    if (confirmError) {
      setError(confirmError);
      return;
    }

    setPhoneTouched(true);
    if (phoneError) {
      setError(phoneError);
      return;
    }

    setLoading(true);
    try {
      await signup({ name, email, password, phoneNumber: toE164(national, country), country: country.name });
      router.push("/dashboard");
    } catch (err: any) {
      let msg = err?.message ?? "Registration failed";
      try {
        const jsonMatch = msg.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          msg = parsed.message || msg;
        }
      } catch {}
      msg = msg.replace(/^API \d+ [^:]+: /, "");
      setError(typeof msg === "string" ? msg : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-surface-line bg-surface/60 p-5 sm:p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur">
      <h2 className="font-display text-2xl font-bold text-ink">{t.auth.signupHeading}</h2>
      <p className="mt-1.5 text-sm text-ink-soft">
        {t.auth.alreadyHave}{" "}
        <Link href="/login" className="font-medium text-accent-ink hover:underline">
          {t.auth.loginLink}
        </Link>
      </p>

      {error && (
        <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {signupsClosed ? (
        <div className="mt-5 rounded-lg border border-warning/50 bg-warning-soft px-4 py-3 text-sm text-warning-ink">{t.admin.signupsClosed}</div>
      ) : null}

      <form className="mt-7 grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>
        <FormField
          label={t.auth.fullName}
          type="text"
          name="name"
          placeholder={t.auth.fullNamePlaceholder}
          autoComplete="name"
          required
        />
        <FormField
          label={t.auth.email}
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <label className="block">
          <span className="text-sm font-medium text-ink-soft">{t.auth.country}</span>
          <div className="relative mt-1.5">
            <Flag iso2={country.iso2} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2" />
            <select
              name="country"
              value={country.iso2}
              onChange={(e) => handleCountryChange(e.target.value)}
              autoComplete="country"
              className="w-full rounded-lg border border-surface-line bg-surface py-3 pl-12 pr-4 text-sm text-ink outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20 [color-scheme:dark]"
            >
              {PHONE_COUNTRIES.map((c) => (
                <option key={c.iso2} value={c.iso2}>
                  {c.name} (+{c.dialCode})
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-ink-soft">
            {t.auth.phone} <span className="text-accent">*</span>
          </span>
          <div
            className={`mt-1.5 flex items-stretch overflow-hidden rounded-lg border bg-surface transition-colors focus-within:ring-2 ${
              phoneTouched && phoneError
                ? "border-danger focus-within:ring-danger/20"
                : "border-surface-line focus-within:border-accent focus-within:ring-accent/20"
            }`}
          >
            {/* The country code is filled in from the chosen country. */}
            <span className="flex shrink-0 items-center gap-1.5 border-r border-surface-line bg-bg/40 px-3 font-mono text-sm text-ink-soft">
              <Flag iso2={country.iso2} />+{country.dialCode}
            </span>
            <input
              type="tel"
              name="phone"
              inputMode="tel"
              autoComplete="tel-national"
              required
              value={pendingCode ?? national}
              onChange={(e) => handlePhoneChange(e.target.value)}
              onBlur={() => setPhoneTouched(true)}
              placeholder={country.example}
              aria-invalid={phoneTouched && phoneError !== null}
              className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none"
            />
          </div>
          {phoneTouched && phoneError ? (
            <p className="mt-1.5 text-xs font-semibold text-danger-ink" role="alert">
              {phoneError}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-ink-faint">{t.auth.phoneHint}</p>
          )}
        </label>

        <FormField
          label={t.auth.password}
          type="password"
          name="password"
          placeholder={t.auth.passwordPlaceholder}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <FormField
          label={t.auth.confirmPassword}
          type="password"
          name="confirmPassword"
          placeholder={t.auth.confirmPasswordPlaceholder}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => setConfirmTouched(true)}
          error={showConfirmError ? confirmError : null}
          required
        />

        <label className="flex items-start gap-2.5 text-sm text-ink-soft sm:col-span-2">
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
          disabled={loading || signupsClosed}
          className="group flex w-full sm:col-span-2 items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg shadow-[0_0_24px_rgba(217,165,68,0.3)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
        >
          {loading ? "Creating account..." : t.auth.createAccountButton}
          <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </button>
      </form>
    </div>
  );
}

/** Small flag image for a country (ISO 3166 alpha-2). */
function Flag({ iso2, className = "" }: { iso2: string; className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- tiny external SVG, no optimisation needed
    <img
      src={flagUrl(iso2)}
      alt=""
      width={20}
      height={14}
      className={`h-3.5 w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-white/10 ${className}`}
    />
  );
}
