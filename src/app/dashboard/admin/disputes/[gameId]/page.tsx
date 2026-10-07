"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useToast } from "@/lib/useToast";
import { ToastContainer } from "@/components/common/Toast";
import { Avatar } from "@/components/common/Avatar";
import { BackButton } from "@/components/dashboard/BackButton";
import { Badge, Button, EmptyRow, Field, Panel, Tabs, fmtDateTime, inputClass } from "@/components/admin/ui";
import { useDecideDispute, useDispute } from "@/lib/api/hooks/useAdmin";
import type { DisputeDetail, EvidenceSubmission } from "@/lib/api/adminManage";

export default function DisputeDetailPage({ params }: { params: Promise<{ gameId: string }> }) {
  const { gameId } = use(params);
  const { t, locale } = useLanguage();
  const td = t.admin.disputes;
  const { toasts, toast, dismiss } = useToast();
  const { data, isLoading, error } = useDispute(gameId);

  if (isLoading) return <div className="h-96 animate-pulse rounded-2xl bg-surface/40" />;
  if (error || !data) return <EmptyRow>{(error as { message?: string } | null)?.message ?? td.empty}</EmptyRow>;
  const { game, tournament, reviewers } = data;
  const sideA = game.submissions.find((s) => s.side === "A");
  const sideB = game.submissions.find((s) => s.side === "B");
  const waiting = ["submitted", "awaiting_opponent", "rejected"].includes(game.status);

  return (
    <div>
      <BackButton href="/dashboard/admin/disputes" />
      <div className="mt-4">
        <div className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">
          {tournament.hostName} · {game.roundName}
          {game.groupLabel ? ` · ${game.groupLabel}` : ""} · #{game.slot}
          {game.isDecider ? " · decider" : ""}
        </div>
        <h1 className="mt-1 font-display text-2xl font-black text-ink">
          {game.playerA.name} <span className="text-ink-faint">vs</span> {game.playerB.name}
        </h1>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-soft">
          <span>{tournament.name}</span>
          <Badge tone="neutral">{game.status}</Badge>
          {tournament.type === "cvc" ? (
            <span>
              {game.entrantA} vs {game.entrantB}
            </span>
          ) : null}
        </div>
      </div>

      {!game.reviewOpen && game.reviewOpensAt ? (
        <p className="mt-4 rounded-xl bg-blue-soft p-3 text-sm text-ink">{format(td.windowNote, { date: fmtDateTime(game.reviewOpensAt, locale) })}</p>
      ) : null}
      {game.reviewNote ? <p className="mt-3 rounded-xl bg-bg-raised p-3 text-sm text-ink-soft">“{game.reviewNote}”</p> : null}

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <EvidenceColumn label={format(td.side, { side: "A" })} player={game.playerA} submission={sideA} />
        <EvidenceColumn label={format(td.side, { side: "B" })} player={game.playerB} submission={sideB} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {waiting ? (
          <DecidePanel data={data} sideA={sideA} sideB={sideB} onDone={(msg) => toast(msg, "success")} onError={(m) => toast(m, "error")} />
        ) : (
          <Panel>
            <p className="text-sm text-ink-soft">
              {game.goalsA != null ? `${game.playerA.name} ${game.goalsA} – ${game.goalsB} ${game.playerB.name}` : game.status}
            </p>
          </Panel>
        )}
        <Panel title={td.reviewers}>
          {reviewers.length ? (
            <ul className="space-y-1 text-sm text-ink-soft">
              {reviewers.map((r) => (
                <li key={r.id}>
                  <Link href={`/dashboard/admin/users/${r.id}`} className="hover:text-accent-ink">
                    {r.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-warning-ink">{td.noReviewers}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold">
            <Link href={`/dashboard/admin/content/tournament/${tournament.id}`} className="text-accent-ink hover:underline">
              {td.manageOfficials} →
            </Link>
            <a href={`/dashboard/efootball/tournaments/${tournament.id}`} className="text-accent-ink hover:underline">
              {td.openTournament} →
            </a>
          </div>
        </Panel>
      </div>
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

function EvidenceColumn({
  label,
  player,
  submission,
}: {
  label: string;
  player: { userId: string | null; name: string; dpUrl: string | null };
  submission: EvidenceSubmission | undefined;
}) {
  const { t, locale } = useLanguage();
  const td = t.admin.disputes;
  return (
    <Panel>
      <div className="flex items-center gap-2.5">
        <Avatar dpUrl={player.dpUrl} name={player.name} size="sm" mode="static" />
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase text-ink-faint">{label}</div>
          {player.userId ? (
            <Link href={`/dashboard/admin/users/${player.userId}`} className="truncate text-sm font-semibold text-ink hover:text-accent-ink">
              {player.name}
            </Link>
          ) : (
            <span className="text-sm font-semibold text-ink">{player.name}</span>
          )}
        </div>
        {submission ? <Badge tone="accent">{format(td.claimed, { a: submission.goalsA, b: submission.goalsB })}</Badge> : null}
      </div>
      {submission ? (
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {submission.screenshotUrls.map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer" className="block aspect-video overflow-hidden rounded-lg border border-surface-line">
                {/* eslint-disable-next-line @next/next/no-img-element -- uploaded match evidence served from /uploads */}
                <img src={url} alt="" className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
          {submission.videoUrl ? (
            <video src={submission.videoUrl} controls preload="metadata" className="w-full rounded-lg border border-surface-line">
              {td.video}
            </video>
          ) : null}
          <div className="font-mono text-[11px] text-ink-faint">{format(td.uploadedAt, { date: fmtDateTime(submission.submittedAt, locale) })}</div>
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-faint">{td.noEvidence}</p>
      )}
    </Panel>
  );
}

function DecidePanel({
  data,
  sideA,
  sideB,
  onDone,
  onError,
}: {
  data: DisputeDetail;
  sideA: EvidenceSubmission | undefined;
  sideB: EvidenceSubmission | undefined;
  onDone: (message: string) => void;
  onError: (message: string) => void;
}) {
  const { t } = useLanguage();
  const td = t.admin.disputes;
  const decide = useDecideDispute();
  const { game } = data;
  const [action, setAction] = useState<"approve" | "reject">("approve");
  const first = sideA ?? sideB;
  const [goalsA, setGoalsA] = useState(first ? String(first.goalsA) : "");
  const [goalsB, setGoalsB] = useState(first ? String(first.goalsB) : "");
  const [note, setNote] = useState("");
  const [decider, setDecider] = useState<"" | "A" | "B">("");
  const score = (v: string) => (/^\d{1,2}$/.test(v) ? Number(v) : null);
  const valid = action === "reject" ? note.trim().length >= 3 : score(goalsA) != null && score(goalsB) != null;

  async function submit() {
    try {
      const result = await decide.mutateAsync({
        gameId: game.gameId,
        action,
        goalsA: action === "approve" ? score(goalsA)! : undefined,
        goalsB: action === "approve" ? score(goalsB)! : undefined,
        note: note.trim() || undefined,
        deciderWinner: decider || undefined,
      });
      onDone(
        action === "reject"
          ? td.rejected
          : `${td.decided}${result.fixture === "completed" ? ` ${td.fixtureDone}` : result.fixture === "needs_decider" ? ` ${td.needsDecider}` : ""}`,
      );
    } catch (err) {
      onError((err as { message?: string }).message ?? t.admin.common.errGeneric);
    }
  }

  return (
    <Panel title={td.decideTitle}>
      <Tabs<"approve" | "reject">
        value={action}
        onChange={setAction}
        options={[
          { value: "approve", label: td.approve },
          { value: "reject", label: td.reject },
        ]}
      />
      <div className="mt-3 space-y-3">
        {action === "approve" ? (
          <>
            <Field label={td.finalScore}>
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-right text-xs text-ink-soft">{game.playerA.name}</span>
                <input value={goalsA} onChange={(e) => setGoalsA(e.target.value)} inputMode="numeric" className={`${inputClass} w-16 text-center`} aria-label="A" />
                <span className="text-ink-faint">–</span>
                <input value={goalsB} onChange={(e) => setGoalsB(e.target.value)} inputMode="numeric" className={`${inputClass} w-16 text-center`} aria-label="B" />
                <span className="min-w-0 flex-1 truncate text-xs text-ink-soft">{game.playerB.name}</span>
              </div>
            </Field>
            <div className="flex flex-wrap gap-2">
              {[sideA, sideB].filter(Boolean).map((s) => (
                <Button
                  key={s!.side}
                  small
                  variant="outline"
                  onClick={() => {
                    setGoalsA(String(s!.goalsA));
                    setGoalsB(String(s!.goalsB));
                  }}
                >
                  {format(td.useClaim, { side: s!.side })} ({s!.goalsA}–{s!.goalsB})
                </Button>
              ))}
            </div>
            {game.stage === "knockout" ? (
              <Field label={td.deciderWinner}>
                <select value={decider} onChange={(e) => setDecider(e.target.value as "" | "A" | "B")} className={inputClass}>
                  <option value="">–</option>
                  <option value="A">{game.entrantA}</option>
                  <option value="B">{game.entrantB}</option>
                </select>
              </Field>
            ) : null}
          </>
        ) : null}
        <Field label={action === "reject" ? td.rejectNoteLabel : td.noteLabel}>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={500} className={inputClass} />
        </Field>
        <div className="flex justify-end">
          <Button variant={action === "reject" ? "danger" : "primary"} disabled={!valid || decide.isPending} onClick={submit}>
            {action === "approve" ? td.approve : td.reject}
          </Button>
        </div>
      </div>
    </Panel>
  );
}
