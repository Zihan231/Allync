"use client";

export function AppLoader({
  message = "Loading ALLYNQ...",
  inline = false,
}: {
  message?: string;
  inline?: boolean;
}) {
  const content = (
    <div className="flex flex-col items-center justify-center gap-4 text-center select-none">
      <div className="relative flex h-16 w-16 items-center justify-center">
        {/* Outer glowing gold ring */}
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-surface-line border-t-accent shadow-[0_0_20px_rgba(217,165,68,0.35)]" />
        {/* Inner reverse spinner */}
        <div
          className="absolute inset-2 animate-spin rounded-full border border-surface-line border-b-blue opacity-75"
          style={{ animationDirection: "reverse", animationDuration: "1.2s" }}
        />
        {/* Center Logo Icon */}
        <span className="font-display text-sm font-black tracking-wider text-accent animate-pulse">
          Y
        </span>
      </div>

      <div className="space-y-1">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-soft animate-pulse">
          {message}
        </p>
        <div className="flex items-center justify-center gap-1">
          <span className="h-1 w-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="h-1 w-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="h-1 w-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );

  if (inline) {
    return (
      <div className="flex min-h-[350px] w-full items-center justify-center py-12">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-bg/95 backdrop-blur-md">
      {content}
    </div>
  );
}
