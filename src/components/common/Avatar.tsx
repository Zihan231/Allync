"use client";

import { useState } from "react";
import Link from "next/link";
import { colorFromString, initialsFromName } from "@/lib/colorHash";
import { stockAvatarUrl } from "@/lib/stockImage";
import { AvatarLightbox } from "./AvatarLightbox";

const sizeClasses: Record<string, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-28 w-28 text-2xl sm:h-32 sm:w-32 sm:text-3xl",
};

export function Avatar({
  dpUrl,
  name,
  size = "md",
  mode = "lightbox",
  shape = "circle",
  href,
  className = "",
}: {
  dpUrl: string | null | undefined;
  name: string;
  size?: keyof typeof sizeClasses;
  mode?: "lightbox" | "link" | "static";
  shape?: "circle" | "square";
  href?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = dpUrl || stockAvatarUrl(name);
  const color = colorFromString(name);
  const initials = initialsFromName(name);
  const radius = shape === "square" ? "rounded-xl" : "rounded-full";

  const circle = failed ? (
    <div
      className={`flex h-full w-full items-center justify-center font-display font-bold ${radius}`}
      style={{ backgroundColor: `${color}33`, color }}
    >
      {initials}
    </div>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={`h-full w-full object-cover ${radius}`}
      onError={() => setFailed(true)}
    />
  );

  const base = `relative shrink-0 overflow-hidden ${radius} ${sizeClasses[size]} ${className}`;

  if (mode === "link" && href) {
    return (
      <Link href={href} className={base}>
        {circle}
      </Link>
    );
  }

  if (mode === "static") {
    return <div className={base}>{circle}</div>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => !failed && setOpen(true)}
        className={`${base} ${failed ? "cursor-default" : "cursor-zoom-in"}`}
      >
        {circle}
      </button>
      {!failed ? <AvatarLightbox src={src} alt={name} open={open} onClose={() => setOpen(false)} /> : null}
    </>
  );
}
