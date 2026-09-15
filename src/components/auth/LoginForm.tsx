"use client";

import { useState, useEffect, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { FormField } from "./FormField";
import { ArrowRightIcon } from "../icons";

export function LoginForm() {
  const { t } = useLanguage();
  const { login, isAuthenticated, isLoading } = useSession();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isLoading, isAuthenticated, router]);

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
      await login({ email, password });
      router.push("/dashboard");
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
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-ink-faint">
        {t.auth.loginLegal}
      </p>
    </>
  );
}
