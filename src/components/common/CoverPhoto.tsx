"use client";

import { useState } from "react";
import { colorFromString } from "@/lib/colorHash";
import { stockCoverUrl } from "@/lib/stockImage";
import { AvatarLightbox } from "./AvatarLightbox";

export function CoverPhoto({
  coverUrl,
  name,
  color,
  className = "",
}: {
  coverUrl: string | null | undefined;
  name: string;
  color?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = coverUrl || stockCoverUrl(name);
  const brand = color ?? colorFromString(name);

  if (failed) {
    return (
      <div
        className={`relative flex items-end overflow-hidden ${className}`}
        style={{
          background: `radial-gradient(120% 140% at 20% 0%, ${brand}3d 0%, var(--bg-raised) 70%)`,
        }}
      >
        <span
          className="pointer-events-none select-none pb-2 pl-2 font-display text-[6rem] font-bold leading-none opacity-[0.14]"
          style={{ color: brand }}
        >
          {name.slice(0, 1).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`relative block w-full cursor-zoom-in overflow-hidden ${className}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={`${name} cover`}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: `linear-gradient(to top, ${brand}40 0%, transparent 45%)` }}
        />
      </button>
      <AvatarLightbox src={src} alt={`${name} cover`} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
