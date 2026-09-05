import { colorFromString, initialsFromName } from "@/lib/colorHash";

const sizeClasses: Record<string, string> = {
  xs: "h-6 w-6",
  sm: "h-9 w-9 text-[10px]",
  md: "h-12 w-12 text-xs",
  lg: "h-16 w-16 text-base",
};

const initialsTextClasses: Record<string, string> = {
  xs: "text-[8px]",
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-base",
};

// A club "badge" — a real crest image when one is available, otherwise a
// colored ring + tinted initials. Real Person/Club records here have no
// uploaded dpUrl for most fictional clubs, and Avatar's fallback is a fixed
// generic stock photo (meant for people, not club identity), so every
// opponent crest used to render as the same face. This component gives every
// club a distinct, deterministic identity instead.
export function ClubCrest({
  name,
  color,
  initials,
  imageUrl,
  size = "md",
  className = "",
}: {
  name: string;
  color?: string | null;
  initials?: string;
  imageUrl?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  const resolvedColor = color ?? colorFromString(name);
  const resolvedInitials = initials ?? initialsFromName(name);

  if (imageUrl) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-white p-0.5 ${sizeClasses[size]} ${className}`}
        style={{ boxShadow: `0 0 0 1.5px ${resolvedColor}80` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={name} className="h-full w-full rounded-full object-contain" />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-bold ${sizeClasses[size]} ${initialsTextClasses[size]} ${className}`}
      style={{ backgroundColor: `${resolvedColor}26`, color: resolvedColor, boxShadow: `0 0 0 1.5px ${resolvedColor}80` }}
    >
      {resolvedInitials}
    </div>
  );
}
