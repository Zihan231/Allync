import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Log in — Allync",
};

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to your arena."
      subtitle="One account for every game, every community, and every club you're part of."
    >
      <div className="rounded-2xl border border-surface-line bg-surface/60 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur">
        <h2 className="font-display text-2xl font-bold text-ink">Log in</h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          New to Allync?{" "}
          <Link href="/signup" className="font-medium text-accent-ink hover:underline">
            Create an account
          </Link>
        </p>

        <form className="mt-7 space-y-5">
          <FormField label="Email" type="email" name="email" placeholder="you@example.com" autoComplete="email" required />
          <FormField
            label="Password"
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
              Remember me
            </label>
            <a href="#" className="font-medium text-blue-ink hover:underline">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            className="group flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg shadow-[0_0_24px_rgba(217,165,68,0.3)] transition-transform hover:-translate-y-0.5"
          >
            Log in
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-xs leading-relaxed text-ink-faint">
        By logging in you agree to Allync&rsquo;s Terms and Privacy Policy.
      </p>
    </AuthShell>
  );
}
