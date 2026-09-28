"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/icons";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { useConfirm } from "@/lib/useConfirm";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useUpdateTournament } from "@/lib/api/hooks/useTournaments";
import type { BackendTournament, UpdateTournamentPayload } from "@/lib/api/tournaments";

const LINEUP_CUTOFF_MS = 2 * 60 * 60 * 1000;

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-surface-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all [color-scheme:dark]";

/** ISO timestamp -> value for a `datetime-local` input, in the viewer's timezone. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

const digitsOnly = (value: string) => value.replace(/\D/g, "");

/** Mount only while open: its fields start from the tournament's current values. */
export function EditTournamentModal({
  onClose,
  onSaved,
  tournament,
}: {
  onClose: () => void;
  onSaved: (message: string) => void;
  tournament: BackendTournament;
}) {
  const { t } = useLanguage();
  const tm = t.dashboard.tournamentManage;
  const tc = t.dashboard.tournamentCreate;
  const updateMutation = useUpdateTournament(tournament.id);
  const { confirm, confirmProps } = useConfirm();
  const confirmOpen = confirmProps.open;

  const [name, setName] = useState(tournament.name);
  const [capacity, setCapacity] = useState(String(tournament.maxParticipants));
  const [startAt, setStartAt] = useState(() => toLocalInput(tournament.startAt));
  const [endAt, setEndAt] = useState(() => toLocalInput(tournament.endAt));
  const [isPaid, setIsPaid] = useState(tournament.entryFeeBdt > 0);
  const [entryFee, setEntryFee] = useState(String(tournament.entryFeeBdt || 0));
  const [prizePool, setPrizePool] = useState(String(tournament.prizePoolBdt || 0));
  const [submitError, setSubmitError] = useState("");
  // Reference time for the 2-hour rule, fixed when the dialog opens.
  const [openedAt] = useState(() => Date.now());

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Escape belongs to the confirm dialog while it is open.
      if (e.key === "Escape" && !updateMutation.isPending && !confirmOpen) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, updateMutation.isPending, confirmOpen]);

  const isCvc = tournament.type === "cvc";
  const enrolled = tournament.participants?.length ?? 0;
  const capacityNumber = Number(capacity);
  const originalStart = toLocalInput(tournament.startAt);
  const startChanged = startAt !== originalStart;

  const nameError = name.trim() ? null : tm.errNameEmpty;
  const capacityError =
    capacity === ""
      ? isCvc ? tc.errCapacityEmptyClubs : tc.errCapacityEmptyPlayers
      : capacityNumber < 2
        ? isCvc ? tc.errCapacityMinClubs : tc.errCapacityMinPlayers
        : capacityNumber > 128
          ? isCvc ? tc.errCapacityMaxClubs : tc.errCapacityMaxPlayers
          : capacityNumber % 2 !== 0
            ? isCvc ? tc.errCapacityOddClubs : tc.errCapacityOddPlayers
            : capacityNumber < enrolled
              ? format(tm.errCapacityBelowEnrolled, { count: enrolled })
              : null;
  const startError = !startAt
    ? tc.errNoStart
    : startChanged && new Date(startAt).getTime() <= openedAt + LINEUP_CUTOFF_MS
      ? tc.errStartTooSoon
      : null;
  const endError =
    endAt && startAt && new Date(endAt).getTime() <= new Date(startAt).getTime()
      ? tm.errEndBeforeStart
      : null;
  const entryFeeError = isPaid && entryFee === "" ? tm.errAmount : null;
  const prizePoolError = prizePool === "" ? tm.errAmount : null;
  const firstError = nameError || capacityError || startError || endError || entryFeeError || prizePoolError;

  async function handleSave() {
    setSubmitError("");
    if (firstError) {
      setSubmitError(firstError);
      return;
    }

    const nextEntryFee = isPaid ? Number(entryFee) : 0;
    const nextPrizePool = Number(prizePool);
    const changedFields = [
      name.trim() !== tournament.name && tm.fieldName,
      capacityNumber !== tournament.maxParticipants && tm.fieldCapacity,
      startChanged && tm.fieldStart,
      endAt !== toLocalInput(tournament.endAt) && tm.fieldEnd,
      nextEntryFee !== tournament.entryFeeBdt && tm.fieldEntryFee,
      nextPrizePool !== tournament.prizePoolBdt && tm.fieldPrizePool,
    ].filter((field): field is string => Boolean(field));

    if (!changedFields.length) {
      setSubmitError(tm.noChanges);
      return;
    }

    const confirmed = await confirm(format(tm.saveConfirm, { fields: changedFields.join(", ") }), {
      title: tm.saveConfirmTitle,
      variant: "warning",
      confirmLabel: tm.saveConfirmLabel,
      cancelLabel: tm.cancel,
    });
    if (!confirmed) return;

    const payload: UpdateTournamentPayload = {
      name: name.trim(),
      maxParticipants: capacityNumber,
      entryFeeBdt: nextEntryFee,
      prizePoolBdt: nextPrizePool,
      endAt: endAt ? new Date(endAt).toISOString() : null,
    };
    // Only send the start time when it was changed, so an untouched past-due
    // start isn't re-validated against the 2-hour rule.
    if (startChanged) payload.startAt = new Date(startAt).toISOString();

    try {
      await updateMutation.mutateAsync(payload);
      onSaved(tm.toastUpdated);
      onClose();
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data;
      const message = Array.isArray(data?.message) ? data.message.join(", ") : data?.message;
      setSubmitError(message || (err as Error)?.message || tm.errUpdate);
    }
  }

  const errorText = (error: string | null) =>
    error ? (
      <p className="mt-1.5 text-xs font-semibold text-danger-ink" role="alert">
        {error}
      </p>
    ) : null;
  const invalidClass = (error: string | null) => (error ? "border-danger focus:border-danger" : "");

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 pt-[6vh] backdrop-blur-md sm:items-center sm:pt-4">
      <button
        type="button"
        aria-label={tm.cancel}
        disabled={updateMutation.isPending}
        onClick={onClose}
        className="fixed inset-0 cursor-default"
        tabIndex={-1}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-tournament-title"
        className="relative w-full max-w-xl rounded-2xl border border-surface-line bg-bg-raised shadow-[0_30px_90px_-20px_rgba(0,0,0,0.85)]"
      >
        <div className="flex items-center justify-between border-b border-surface-line px-6 py-4">
          <div>
            <h3 id="edit-tournament-title" className="font-display text-base font-bold text-ink">
              {tm.editTitle}
            </h3>
            <p className="text-xs text-ink-faint">{tm.editHint}</p>
          </div>
          <button
            type="button"
            disabled={updateMutation.isPending}
            onClick={onClose}
            aria-label={tm.cancel}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-surface-line/60 hover:text-ink disabled:opacity-40"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-6 py-5">
          <label className="block">
            <span className="text-xs font-semibold text-ink-soft">{tc.titleLabel} *</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={nameError !== null}
              className={`${fieldClass} ${invalidClass(nameError)}`}
            />
            {errorText(nameError)}
          </label>

          <label className="block">
            <span className="text-xs font-semibold text-ink-soft">{tc.capacityLabel}</span>
            <input
              type="text"
              inputMode="numeric"
              value={capacity}
              onChange={(e) => setCapacity(digitsOnly(e.target.value))}
              aria-invalid={capacityError !== null}
              className={`${fieldClass} ${invalidClass(capacityError)}`}
            />
            {errorText(capacityError)}
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-semibold text-ink-soft">{tc.startLabel}</span>
              <input
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
                aria-invalid={startError !== null}
                className={`${fieldClass} ${invalidClass(startError)}`}
              />
              {errorText(startError)}
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-ink-soft">{tc.endLabel}</span>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                aria-invalid={endError !== null}
                className={`${fieldClass} ${invalidClass(endError)}`}
              />
              {errorText(endError)}
            </label>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-surface-line bg-surface/40 p-1">
              {[false, true].map((paid) => (
                <button
                  key={String(paid)}
                  type="button"
                  onClick={() => setIsPaid(paid)}
                  className={`rounded-lg py-2 text-xs font-bold uppercase tracking-wider transition-all ${
                    isPaid === paid ? "bg-accent text-bg" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {paid ? tc.paidEntry : tc.freeEntry}
                </button>
              ))}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {isPaid ? (
                <label className="block">
                  <span className="text-xs font-semibold text-ink-soft">{tc.entryFeeLabel}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={entryFee}
                    onChange={(e) => setEntryFee(digitsOnly(e.target.value))}
                    aria-invalid={entryFeeError !== null}
                    className={`${fieldClass} ${invalidClass(entryFeeError)}`}
                  />
                  {errorText(entryFeeError)}
                </label>
              ) : null}
              <label className="block">
                <span className="text-xs font-semibold text-ink-soft">{tc.prizePoolLabel}</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={prizePool}
                  onChange={(e) => setPrizePool(digitsOnly(e.target.value))}
                  aria-invalid={prizePoolError !== null}
                  className={`${fieldClass} ${invalidClass(prizePoolError)}`}
                />
                {errorText(prizePoolError)}
              </label>
            </div>
          </div>

          <p className="text-xs text-ink-faint">{tm.formatLocked}</p>

          {submitError ? (
            <div className="rounded-xl border border-danger/40 bg-danger-soft p-3 text-xs text-danger-ink">
              {submitError}
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-surface-line px-6 py-4">
          <button
            type="button"
            disabled={updateMutation.isPending}
            onClick={onClose}
            className="rounded-full border border-surface-line-strong px-4 py-2 text-xs font-semibold text-ink-soft transition-colors hover:text-ink disabled:opacity-40"
          >
            {tm.cancel}
          </button>
          <button
            type="button"
            disabled={updateMutation.isPending}
            onClick={handleSave}
            className="rounded-full bg-accent px-5 py-2 font-display text-xs font-semibold text-bg shadow-[0_0_18px_rgba(217,165,68,0.3)] transition-all hover:brightness-110 disabled:opacity-40"
          >
            {updateMutation.isPending ? tm.saving : tm.save}
          </button>
        </div>
      </div>
      <ConfirmDialog {...confirmProps} />
    </div>
  );
}
