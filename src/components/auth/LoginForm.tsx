"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import {
  isTwoFactorChallenge,
  setupStaffTwoFactor,
  type TwoFactorChallenge,
  type TwoFactorSetup,
} from "@/lib/api/auth";
import { FormField } from "./FormField";
import { ArrowRightIcon } from "../icons";

export function LoginForm() {
  const { t } = useLanguage();
  const { login, completeStaffTwoFactor, isAuthenticated, isLoading } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [challenge, setChallenge] = useState<TwoFactorChallenge | null>(null);
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    let cancelled = false;
    if (!twoFactorSetup?.otpauthUri) {
      setQrCodeUrl(null);
      return;
    }
    QRCode.toDataURL(twoFactorSetup.otpauthUri, {
      width: 224,
      margin: 1,
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setQrCodeUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrCodeUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [twoFactorSetup]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const data = new FormData(e.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    if (!email || !password) {
      setError("Please provide both email and password.");
      return;
    }

    setLoading(true);
    try {
      const result = await login({ email, password });
      if (isTwoFactorChallenge(result)) {
        setChallenge(result);
        if (result.setupRequired) {
          setTwoFactorSetup(await setupStaffTwoFactor(result.challengeToken));
        }
      } else {
        router.push(result.user.systemRole ? "/dashboard/admin" : "/dashboard");
      }
    } catch (err: any) {
      let msg = err?.message ?? "Invalid email or password";
      try {
        const jsonMatch = msg.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          msg = parsed.message || msg;
        }
      } catch {}
      msg = msg.replace(/^API \d+ [^:]+: /, "");
      setError(typeof msg === "string" ? msg : "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!challenge) return;
    setError(null);
    const code = String(new FormData(e.currentTarget).get("code") ?? "").replace(/\s/g, "");
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }
    setLoading(true);
    try {
      const result = await completeStaffTwoFactor(challenge.challengeToken, code);
      router.push(result.user.systemRole ? "/dashboard/admin" : "/dashboard");
    } catch (err: any) {
      setError(typeof err?.message === "string" ? err.message : "Could not verify that code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-surface-line bg-surface/60 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur">
        <h2 className="font-display text-2xl font-bold text-ink">{t.auth.loginHeading}</h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          {t.auth.newHere}{" "}
          <Link href="/signup" className="font-medium text-accent-ink hover:underline">
            {t.auth.createAccountLink}
          </Link>
        </p>

        {error && (
          <div className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {challenge ? (
          <form className="mt-7 space-y-5" onSubmit={handleTwoFactorSubmit}>
            <div>
              <h3 className="font-display text-lg font-semibold text-ink">Two-step sign-in</h3>
              <p className="mt-1 text-sm text-ink-soft">
                {challenge.setupRequired
                  ? "Add this account to an authenticator app, then enter its 6-digit code."
                  : "Enter the 6-digit code from your authenticator app."}
              </p>
            </div>
            {twoFactorSetup && (
              <div className="rounded-lg border border-surface-line bg-bg/50 p-3 text-sm text-ink-soft">
                <p className="mb-2 font-medium text-ink">Scan with your authenticator app</p>
                {qrCodeUrl ? (
                  <img
                    src={qrCodeUrl}
                    alt="Authenticator app setup QR code"
                    className="mx-auto h-48 w-48 rounded-md bg-white p-2"
                  />
                ) : (
                  <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-md bg-surface text-xs">
                    Preparing QR code…
                  </div>
                )}
                <p className="mt-3 text-xs">Open Google or Microsoft Authenticator, tap +, then scan this QR code.</p>
                <p className="mb-2 mt-4 font-medium text-ink">Or enter the setup key manually</p>
                <code className="block break-all rounded bg-surface px-2 py-1.5 text-xs text-accent-ink">{twoFactorSetup.secret}</code>
                <p className="mt-2 text-xs">In your authenticator app, choose “enter setup key” and use account name Allync.</p>
              </div>
            )}
            {challenge.setupRequired && !twoFactorSetup && (
              <p className="text-sm text-ink-soft">Preparing your authenticator setup…</p>
            )}
            <FormField
              label="Authenticator code"
              type="text"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              required
            />
            <button
              type="submit"
              disabled={loading || (challenge.setupRequired && !twoFactorSetup)}
              className="group flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg shadow-[0_0_24px_rgba(217,165,68,0.3)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
            >
              {loading ? "Verifying…" : "Verify and log in"}
              <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
            <button type="button" onClick={() => { setChallenge(null); setTwoFactorSetup(null); setQrCodeUrl(null); setError(null); }} className="w-full text-sm text-ink-soft hover:text-ink">
              Use a different account
            </button>
          </form>
        ) : (
        <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
          <FormField
            label={t.auth.email}
            type="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
          <FormField
            label={t.auth.password}
            type="password"
            name="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-ink-soft">
              <input
                type="checkbox"
                name="remember"
                className="h-4 w-4 rounded border-surface-line-strong bg-surface accent-accent"
              />
              {t.auth.rememberMe}
            </label>
            <a href="#" className="font-medium text-blue-ink hover:underline">
              {t.auth.forgotPassword}
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg shadow-[0_0_24px_rgba(217,165,68,0.3)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            {loading ? "Logging in..." : t.auth.loginButton}
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>
        )}
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-ink-faint">
        {t.auth.loginLegal}
      </p>
    </>
  );
}
