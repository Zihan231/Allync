import { colorFromString, initialsFromName } from "@/lib/colorHash";

const sizeClasses: Record<string, string> = {
  xs: "h-6 w-6",
  sm: "h-9 w-9 text-[10px]",
  md: "h-12 w-12 text-xs",
  lg: "h-16 w-16 text-base",
  xl: "h-28 w-28 text-2xl sm:h-32 sm:w-32 sm:text-3xl",
};

const initialsTextClasses: Record<string, string> = {
  xs: "text-[8px]",
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-base",
  xl: "text-2xl sm:text-3xl",
};

// An entity "badge" (club or community) — a real crest image when one is
// available, otherwise a colored ring + tinted initials. Real records here
// often have no uploaded dpUrl, and Avatar's fallback is a fixed generic
// stock photo (meant for people, not entity identity), so every crest-less
// entity used to render as the same face. This component gives every one a
// distinct, deterministic identity instead.
export function ClubCrest({
  name,
  color,
  initials,
  imageUrl,
  size = "md",
  shape = "circle",
  className = "",
}: {
  name: string;
  color?: string | null;
  initials?: string;
  imageUrl?: string | null;
  size?: keyof typeof sizeClasses;
  shape?: "circle" | "square";
  className?: string;
}) {
  const resolvedColor = color ?? colorFromString(name);
  const resolvedInitials = initials ?? initialsFromName(name);
  const radius = shape === "square" ? "rounded-xl" : "rounded-full";

  if (imageUrl) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden bg-white p-0.5 ${radius} ${sizeClasses[size]} ${className}`}
        style={{ boxShadow: `0 0 0 1.5px ${resolvedColor}80` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={name} className={`h-full w-full object-contain ${radius}`} />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center font-display font-bold ${radius} ${sizeClasses[size]} ${initialsTextClasses[size]} ${className}`}
      style={{ backgroundColor: `${resolvedColor}26`, color: resolvedColor, boxShadow: `0 0 0 1.5px ${resolvedColor}80` }}
    >
      {resolvedInitials}
    </div>
  );
}
