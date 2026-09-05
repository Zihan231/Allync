import { colorFromString, initialsFromName } from "@/lib/colorHash";

const sizeClasses: Record<string, string> = {
  sm: "h-8 w-8 text-[10px]",
  md: "h-11 w-11 text-xs",
  lg: "h-16 w-16 text-base",
};

// A club "badge" — colored ring + tinted initials — instead of a person-style
// photo avatar. Real Person/Club records here have no uploaded dpUrl, and
// Avatar's fallback is a fixed generic stock photo (meant for people, not
// club identity), so every opponent crest rendered as the same face. This
// component gives every club a distinct, deterministic identity instead.
export function ClubCrest({
  name,
  color,
  initials,
  size = "md",
  className = "",
}: {
  name: string;
  color?: string | null;
  initials?: string;
  size?: keyof typeof sizeClasses;
  className?: string;
}) {
  const resolvedColor = color ?? colorFromString(name);
  const resolvedInitials = initials ?? initialsFromName(name);

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-display font-bold ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: `${resolvedColor}26`, color: resolvedColor, boxShadow: `0 0 0 1.5px ${resolvedColor}80` }}
    >
      {resolvedInitials}
    </div>
  );
}
