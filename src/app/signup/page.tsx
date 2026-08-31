import Link from "next/link";
import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormField } from "@/components/auth/FormField";
import { RoleToggle } from "@/components/auth/RoleToggle";
import { ArrowRightIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Create your account — Allync",
};

export default function SignupPage() {
  return (
    <AuthShell
      eyebrow="Players · Clubs · Organizers · Brands"
      title="Your community is one login away."
      subtitle="Create an account, pick eFootball, and find or found a community — player mode and organizer mode, on the same login."
    >
      <div className="rounded-2xl border border-surface-line bg-surface/60 p-8 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)] backdrop-blur">
        <h2 className="font-display text-2xl font-bold text-ink">Create your account</h2>
        <p className="mt-1.5 text-sm text-ink-soft">
          Already have one?{" "}
          <Link href="/login" className="font-medium text-accent-ink hover:underline">
            Log in
          </Link>
        </p>

        <form className="mt-7 space-y-5">
          <FormField label="Full name" type="text" name="name" placeholder="Your name" autoComplete="name" required />
          <FormField label="Email" type="email" name="email" placeholder="you@example.com" autoComplete="email" required />
          <FormField
            label="Password"
            type="password"
            name="password"
            placeholder="At least 8 characters"
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
            <span>
              I agree to Allync&rsquo;s Terms and Privacy Policy.
            </span>
          </label>

          <button
            type="submit"
            className="group flex w-full items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-display font-semibold text-bg shadow-[0_0_24px_rgba(217,165,68,0.3)] transition-transform hover:-translate-y-0.5"
          >
            Create account
            <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </form>
      </div>
    </AuthShell>
  );
}
