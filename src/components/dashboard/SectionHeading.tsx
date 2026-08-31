import type { ReactNode } from "react";

export type SectionTone = "blue" | "accent" | "success" | "danger" | "warning";

const toneClasses: Record<SectionTone, { text: string; dot: string }> = {
  blue: { text: "text-blue-ink", dot: "bg-blue" },
  accent: { text: "text-accent-ink", dot: "bg-accent" },
  success: { text: "text-success-ink", dot: "bg-success" },
  danger: { text: "text-danger-ink", dot: "bg-danger" },
  warning: { text: "text-warning-ink", dot: "bg-warning" },
};

export function SectionHeading({
  tone,
  children,
  action,
  size = "eyebrow",
  className = "",
}: {
  tone: SectionTone;
  children: ReactNode;
  action?: ReactNode;
  size?: "eyebrow" | "title";
  className?: string;
}) {
  const c = toneClasses[tone];
  const textClasses =
    size === "eyebrow"
      ? "text-sm font-semibold uppercase tracking-wide"
      : "text-base font-semibold";

  return (
    <div className={`mb-3 flex items-center justify-between ${className}`}>
      <h2 className={`font-display flex items-center gap-2 ${textClasses} ${c.text}`}>
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${c.dot}`} />
        {children}
      </h2>
      {action}
    </div>
  );
}
