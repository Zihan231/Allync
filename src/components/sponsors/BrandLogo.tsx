"use client";

import { colorFromString } from "@/lib/colorHash";

const SIZES = { xs: "h-6 w-6 text-[9px]", sm: "h-9 w-9 text-xs", md: "h-12 w-12 text-sm", lg: "h-16 w-16 text-base", xl: "h-24 w-24 text-xl" };

/** A sponsor's logo (uncropped, on a plate), or their initials when they haven't uploaded one. */
export function BrandLogo({ name, logoUrl, size = "md", className = "" }: { name: string; logoUrl: string | null; size?: keyof typeof SIZES; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <span className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-surface-line bg-white/95 ${SIZES[size]} ${className}`}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={name} className="h-full w-full object-contain p-1" />
      ) : (
        <span className="flex h-full w-full items-center justify-center font-display font-black text-white" style={{ background: colorFromString(name) }}>
          {initials || "?"}
        </span>
      )}
    </span>
  );
}

/** The verified-sponsor tick. */
export function VerifiedTick({ label }: { label: string }) {
  return (
    <span title={label} aria-label={label} className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-black text-white">
      ✓
    </span>
  );
}
