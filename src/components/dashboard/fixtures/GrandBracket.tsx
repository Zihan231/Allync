"use client";

import { useEffect, useRef, useState } from "react";
import { TrophyIcon } from "@/components/icons";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import type { Fixture, FixtureEntrant, TournamentStructure } from "@/lib/api/tournaments";
import { EntrantBadge } from "./EntrantBadge";
import { fixtureKickoff } from "./MatchCard";
import { formatMatchTime, formatShortDate, gamePhase } from "./labels";

type Round = TournamentStructure["knockout"]["rounds"][number];

/** Layout sizes (px). Compact is used on narrow screens: crest-only boxes, tighter spacing. */
const REGULAR = {
  pitch: 64, // vertical space per first-round entrant
  nameW: 208, // first-round name box (crest + name + match date)
  nameH: 52,
  crestW: 76, // later-round crest box (crest + match date)
  crestH: 84,
  gap: 64, // horizontal space for connectors between columns
  centerW: 220, // trophy column
  titleH: 96,
  minBodyH: 460,
  finalist: 88,
  finalistOffset: 132,
};
const COMPACT = {
  pitch: 60,
  nameW: 50,
  nameH: 56,
  crestW: 50,
  crestH: 56,
  gap: 30,
  centerW: 116,
  titleH: 64,
  minBodyH: 300,
  finalist: 60,
  finalistOffset: 88,
};
/** Below this container width the compact layout is used. */
const COMPACT_BELOW = 900;

/** "Round of 16" → "R16", "Quarter-final" → "QF", "Semi-final" → "SF", "Final" → "F". */
function abbreviation(name: string): string {
  if (name === "Final") return "F";
  if (name === "Semi-final") return "SF";
  if (name === "Quarter-final") return "QF";
  const roundOf = name.match(/^Round of (\d+)$/);
  return roundOf ? `R${roundOf[1]}` : name;
}

interface Slot {
  entrant: FixtureEntrant | null;
  match: Fixture;
  isBye: boolean;
}

/**
 * UEFA-style knockout draw: first-round entrants as name boxes on the outside,
 * later rounds as crest boxes converging on the trophy (every box shows its
 * match date), round pills on every junction, and the two finalists above and
 * below the trophy. Left half feeds the top finalist, right half the bottom one.
 */
export function GrandBracket({
  rounds,
  title,
  isCvC,
  now,
  highlightParticipantId,
  onOpenMatch,
}: {
  rounds: Round[];
  title?: string;
  isCvC: boolean;
  now: number;
  highlightParticipantId?: string | null;
  onOpenMatch: (match: Fixture) => void;
}) {
  const { t, locale } = useLanguage();
  const s = t.dashboard.schedule;

  // Measure the available width: pick the layout and scale the drawing to fit.
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const compact = containerWidth !== null && containerWidth < COMPACT_BELOW;
  const G = compact ? COMPACT : REGULAR;
  const PITCH = G.pitch;
  const NAME_W = G.nameW;
  const NAME_H = G.nameH;
  const CREST_W = G.crestW;
  const CREST_H = G.crestH;
  const GAP = G.gap;
  const CENTER_W = G.centerW;
  const TITLE_H = G.titleH;
  const MIN_BODY_H = G.minBodyH;
  const FINALIST = G.finalist;

  const ordered = [...rounds].sort((a, b) => a.round - b.round);
  const final = ordered[ordered.length - 1].matches[0];
  const halfRounds = ordered.slice(0, -1); // rounds drawn in each half (outermost first)
  const perHalf = (round: Round, half: 0 | 1) => {
    const matches = [...round.matches].sort((a, b) => a.matchNumber - b.matchNumber);
    const mid = matches.length / 2;
    return half === 0 ? matches.slice(0, mid) : matches.slice(mid);
  };

  const firstRoundPerHalf = halfRounds.length ? perHalf(halfRounds[0], 0).length : 0;
  const leafCount = firstRoundPerHalf * 2;
  const bodyH = Math.max(leafCount * PITCH, MIN_BODY_H);
  const leafOffset = (bodyH - leafCount * PITCH) / 2;

  // Column c (0 = outermost) holds the entrants of halfRounds[c].
  const colX = (c: number) => (c === 0 ? 0 : NAME_W + GAP + (c - 1) * (CREST_W + GAP));
  const colW = (c: number) => (c === 0 ? NAME_W : CREST_W);
  const halfW = halfRounds.length ? colX(halfRounds.length - 1) + colW(halfRounds.length - 1) + GAP : 0;
  const totalW = halfW * 2 + CENTER_W;
  const centerX = halfW + CENTER_W / 2;
  const centerY = TITLE_H + bodyH / 2;

  /** Vertical centres of column c's boxes, derived from the first-round leaves. */
  const colY = (c: number): number[] => {
    let ys = Array.from({ length: leafCount }, (_, i) => TITLE_H + leafOffset + i * PITCH + PITCH / 2);
    for (let k = 0; k < c; k++) ys = ys.filter((_, i) => i % 2 === 0).map((y, i) => (y + ys[i * 2 + 1]) / 2);
    return ys;
  };

  const slotsFor = (round: Round, half: 0 | 1): Slot[] =>
    perHalf(round, half).flatMap((match) => [
      { entrant: match.participantA, match, isBye: match.status === "bye" && !match.participantA },
      { entrant: match.participantB, match, isBye: match.status === "bye" && !match.participantB },
    ]);

  const mirror = (x: number, w: number, half: 0 | 1) => (half === 0 ? x : totalW - x - w);

  const lines: Array<{ d: string; live: boolean }> = [];
  const pills: Array<{ x: number; y: number; match: Fixture; label: string }> = [];
  const boxes: Array<{ x: number; y: number; w: number; h: number; slot: Slot; kind: "name" | "crest"; half: 0 | 1 }> = [];

  for (const half of [0, 1] as const) {
    halfRounds.forEach((round, c) => {
      const ys = colY(c);
      const w = colW(c);
      const h = c === 0 ? NAME_H : CREST_H;
      slotsFor(round, half).forEach((slot, i) => {
        boxes.push({
          x: mirror(colX(c), w, half),
          y: ys[i] - h / 2,
          w,
          h,
          slot,
          kind: c === 0 && !compact ? "name" : "crest",
          half,
        });
      });

      // Junction of each pair → next column box (or the finalist for the last half-round).
      const inner = mirror(colX(c) + w, 0, half); // edge facing the centre
      const junctionX = half === 0 ? inner + GAP / 2 : inner - GAP / 2;
      perHalf(round, half).forEach((match, k) => {
        const y1 = ys[k * 2];
        const y2 = ys[k * 2 + 1];
        const yMid = (y1 + y2) / 2;
        const live = match.games.some((g) => gamePhase(g, now) === "playing");
        lines.push({ d: `M ${inner} ${y1} H ${junctionX} V ${y2} M ${inner} ${y2} H ${junctionX}`, live });

        if (c < halfRounds.length - 1) {
          // Outer edge of the next column's box.
          const target = half === 0 ? colX(c + 1) : totalW - colX(c + 1);
          lines.push({ d: `M ${junctionX} ${yMid} H ${target}`, live });
        } else {
          // Last half-round (semi-final): run to the finalist box above / below the trophy.
          const finalistY = half === 0 ? centerY - G.finalistOffset : centerY + G.finalistOffset;
          const finalistEdge = half === 0 ? centerX - FINALIST / 2 : centerX + FINALIST / 2;
          const elbowX = half === 0 ? finalistEdge - 24 : finalistEdge + 24;
          lines.push({ d: `M ${junctionX} ${yMid} H ${elbowX} V ${finalistY} H ${finalistEdge}`, live });
        }
        pills.push({ x: junctionX, y: yMid, match, label: abbreviation(match.roundName) });
      });
    });
  }

  const finalists: Array<{ entrant: FixtureEntrant | null; y: number }> = [
    { entrant: final?.participantA ?? null, y: centerY - G.finalistOffset },
    { entrant: final?.participantB ?? null, y: centerY + G.finalistOffset },
  ];
  const championId = final && (final.status === "completed" || final.status === "bye") ? final.winnerParticipantId : null;
  const finalLive = final?.games.some((g) => gamePhase(g, now) === "playing") ?? false;
  const isMine = (entrant: FixtureEntrant | null) => Boolean(entrant && entrant.participantId === highlightParticipantId);

  /** Match date (and time, when there is room) shown inside each team box. */
  const matchDate = (match: Fixture, layout: "inline" | "stacked") => {
    const kickoff = fixtureKickoff(match);
    if (!kickoff) return null;
    const date = formatShortDate(kickoff, locale);
    const time = formatMatchTime(kickoff, locale);
    if (layout === "inline") {
      return <span className="block truncate font-mono text-[10px] text-ink-soft">{`${date} · ${time}`}</span>;
    }
    return (
      <span className={`block text-center font-mono leading-tight text-ink-soft ${compact ? "text-[8px]" : "text-[9px]"}`}>
        {date}
        {compact ? null : (
          <>
            <br />
            {time}
          </>
        )}
      </span>
    );
  };
  const isOut = (slot: Slot) => {
    const m = slot.match;
    if (m.status !== "completed" && m.status !== "bye") return false;
    return !slot.entrant || (m.winnerParticipantId !== slot.entrant.participantId);
  };

  const totalH = TITLE_H + bodyH + 24;
  const scale = containerWidth ? Math.min(1, containerWidth / totalW) : 1;
  const offsetX = containerWidth && scale === 1 ? (containerWidth - totalW) / 2 : 0;

  return (
    <div
      ref={containerRef}
      className="overflow-hidden rounded-3xl border border-blue/25 bg-[radial-gradient(ellipse_at_center,rgba(76,141,255,0.18),transparent_65%)]"
      style={{ height: totalH * scale }}
    >
      <div
        className="relative origin-top-left"
        style={{ width: totalW, height: totalH, transform: `translate(${offsetX}px, 0) scale(${scale})` }}
      >
        {/* Title */}
        <div className={`absolute inset-x-0 text-center ${compact ? "top-3" : "top-5"}`}>
          <div className={`font-mono font-bold uppercase text-ink-soft ${compact ? "text-[9px] tracking-[0.3em]" : "text-[11px] tracking-[0.4em]"}`}>
            {s.roadToFinal}
          </div>
          <div className={`mt-1 truncate px-4 font-display font-black uppercase tracking-wide text-ink ${compact ? "text-lg" : "text-3xl"}`}>
            {title ?? s.grandFinal}
          </div>
        </div>

        {/* Connectors */}
        <svg className="pointer-events-none absolute inset-0" width={totalW} height={totalH} aria-hidden="true">
          {lines.map((line, i) => (
            <path
              key={i}
              d={line.d}
              fill="none"
              strokeWidth={2.5}
              strokeLinejoin="round"
              className={line.live ? "stroke-danger" : "stroke-[color:var(--surface-line-strong)]"}
            />
          ))}
        </svg>

        {/* Entrant boxes */}
        {boxes.map((box, i) => {
          const out = isOut(box.slot);
          const mine = isMine(box.slot.entrant);
          const tone = box.half === 0 ? "bg-surface-line/80 border-surface-line-strong" : "bg-blue-soft border-blue/40";
          return (
            <button
              key={i}
              type="button"
              onClick={() => onOpenMatch(box.slot.match)}
              title={box.slot.entrant?.name ?? undefined}
              style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
              className={`absolute flex items-center overflow-hidden rounded-md border transition-all hover:z-10 hover:scale-[1.04] hover:border-accent focus-visible:outline-2 focus-visible:outline-accent ${tone} ${
                box.kind === "crest" ? "flex-col justify-center gap-0.5 px-0.5" : "gap-2.5 px-2.5"
              } ${out ? "opacity-45 grayscale" : ""} ${mine ? "ring-2 ring-accent shadow-[0_0_16px_-2px_rgba(217,165,68,0.7)]" : ""}`}
            >
              {box.slot.entrant ? (
                box.kind === "name" ? (
                  <>
                    <EntrantBadge entrant={box.slot.entrant} isCvC={isCvC} size="sm" />
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate font-display text-sm font-bold uppercase tracking-wide text-ink">
                        {box.slot.entrant.name}
                      </span>
                      {matchDate(box.slot.match, "inline")}
                    </span>
                  </>
                ) : (
                  <>
                    <EntrantBadge entrant={box.slot.entrant} isCvC={isCvC} size={compact ? "sm" : "md"} />
                    {matchDate(box.slot.match, "stacked")}
                  </>
                )
              ) : (
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-ink-faint">
                  {box.slot.isBye ? t.dashboard.fixtures.bye : t.dashboard.fixtures.tbd}
                </span>
              )}
            </button>
          );
        })}

        {/* Round pills */}
        {pills.map((pill, i) => {
          const live = pill.match.games.some((g) => gamePhase(g, now) === "playing");
          const scored = pill.match.scoreA !== null && pill.match.scoreB !== null;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onOpenMatch(pill.match)}
              title={scored ? `${pill.match.participantA?.name ?? ""} ${pill.match.scoreA}–${pill.match.scoreB} ${pill.match.participantB?.name ?? ""}` : undefined}
              style={{ left: pill.x, top: pill.y }}
              className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
            >
              <span
                className={`rounded-md border px-2 py-0.5 font-mono text-[11px] font-black ${
                  live ? "border-danger bg-danger text-white" : "border-surface-line-strong bg-bg-raised text-ink hover:border-accent"
                }`}
              >
                {pill.label}
              </span>
            </button>
          );
        })}

        {/* Centre: finalists + trophy */}
        {finalists.map(({ entrant, y }, i) => {
          const champion = entrant && entrant.participantId === championId;
          const loser = championId && entrant && !champion;
          return (
            <button
              key={i}
              type="button"
              disabled={!final}
              onClick={() => final && onOpenMatch(final)}
              style={{ left: centerX - FINALIST / 2, top: y - FINALIST / 2, width: FINALIST, height: FINALIST }}
              className={`absolute flex flex-col items-center justify-center gap-0.5 rounded-lg border-2 transition-transform hover:scale-105 ${
                champion
                  ? "border-accent bg-accent/30 shadow-[0_0_30px_rgba(217,165,68,0.8)]"
                  : i === 0
                    ? "border-surface-line-strong bg-surface-line/80"
                    : "border-blue/50 bg-blue-soft"
              } ${loser ? "opacity-45 grayscale" : ""} ${isMine(entrant) ? "ring-2 ring-accent" : ""}`}
            >
              {entrant ? (
                <>
                  <EntrantBadge entrant={entrant} isCvC={isCvC} size={compact ? "sm" : "md"} />
                  {final ? matchDate(final, "stacked") : null}
                </>
              ) : (
                <svg viewBox="0 0 24 24" className="h-9 w-9 text-ink-faint/60" fill="currentColor" aria-hidden="true">
                  <path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" />
                </svg>
              )}
            </button>
          );
        })}

        <div className="absolute flex flex-col items-center" style={{ left: centerX, top: centerY, transform: "translate(-50%, -50%)" }}>
          <span aria-hidden="true" className="absolute -inset-8 rounded-full bg-accent/20 blur-2xl motion-safe:animate-pulse" />
          <TrophyIcon
            className={`relative text-accent drop-shadow-[0_0_25px_rgba(217,165,68,0.7)] ${compact ? "h-12 w-12" : "h-24 w-24"}`}
          />
          <span
            className={`relative mt-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-black ${
              finalLive ? "border-danger bg-danger text-white" : "border-accent/60 bg-bg-raised text-accent"
            }`}
          >
            {abbreviation("Final")}
          </span>
          {championId ? (
            <span className="relative mt-1 font-mono text-[10px] font-black uppercase tracking-[0.3em] text-accent">{s.champion}</span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
