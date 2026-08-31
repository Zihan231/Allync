export function BracketView({
  rounds,
}: {
  rounds: { round: string; matchups: { a: string; b: string; score?: string }[] }[];
}) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max gap-6 pb-2">
        {rounds.map((round) => (
          <div key={round.round} className="flex w-48 flex-col gap-3">
            <div className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
              {round.round}
            </div>
            <div className="flex flex-1 flex-col justify-around gap-3">
              {round.matchups.map((m, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-surface-line bg-surface/50 p-2.5 text-xs"
                >
                  <div className="flex items-center justify-between py-0.5">
                    <span className={m.a === "TBD" ? "text-ink-faint" : "text-ink"}>{m.a}</span>
                  </div>
                  <div className="my-1 h-px bg-surface-line" />
                  <div className="flex items-center justify-between py-0.5">
                    <span className={m.b === "TBD" ? "text-ink-faint" : "text-ink"}>{m.b}</span>
                  </div>
                  {m.score ? (
                    <div className="mt-1.5 font-mono text-[10px] text-accent-ink">{m.score}</div>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
