"use client";

import { useState } from "react";
import { colorFromString } from "@/lib/colorHash";
import { AvatarLightbox } from "./AvatarLightbox";

export function CoverPhoto({
  coverUrl,
  name,
  color,
  className = "",
  mode = "lightbox",
  hideInitial = false,
}: {
  coverUrl: string | null | undefined;
  name: string;
  color?: string;
  className?: string;
  mode?: "lightbox" | "static";
  /** No big first letter on the placeholder (e.g. when a profile photo overlaps that corner). */
  hideInitial?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [broken, setBroken] = useState(false);
  // No cover uploaded (or it won't load): a gradient in the brand colour, never a stock picture.
  const src = coverUrl || "";
  const failed = !src || broken;
  const brand = color ?? colorFromString(name);

  if (failed) {
    return (
      <div
        className={`relative flex items-end overflow-hidden ${className}`}
        style={{
          background: `radial-gradient(120% 140% at 20% 0%, ${brand}3d 0%, var(--bg-raised) 70%)`,
        }}
      >
        {hideInitial ? null : (
          <span
            className="pointer-events-none select-none pb-2 pl-2 font-display text-[6rem] font-bold leading-none opacity-[0.14]"
            style={{ color: brand }}
          >
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
      </div>
    );
  }

  const image = (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={`${name} cover`}
        className="h-full w-full object-cover"
        onError={() => setBroken(true)}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(to top, ${brand}40 0%, transparent 45%)` }}
      />
    </>
  );

  if (mode === "static") {
    return <div className={`relative block w-full overflow-hidden ${className}`}>{image}</div>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`relative block w-full cursor-zoom-in overflow-hidden ${className}`}
      >
        {image}
      </button>
      <AvatarLightbox src={src} alt={`${name} cover`} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
