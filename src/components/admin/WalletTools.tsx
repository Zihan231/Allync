"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { format } from "@/lib/i18n/translations";
import { useSession } from "@/lib/session/SessionContext";
import { hasRole } from "@/lib/api/admin";
import { useAdminWallet, usePlatformAction } from "@/lib/api/hooks/useAdmin";
import { tk } from "@/components/dashboard/transfers/shared";
import { Button, Field, Panel, ReasonDialog, inputClass } from "./ui";

/**
 * A wallet's balance for staff, with "Adjust wallet" for super admins.
 * `onMessage` shows the result (a toast on the host page).
 */
export function WalletPanel({
  ownerType,
  ownerId,
  ownerName,
  onMessage,
}: {
  ownerType: "user" | "club";
  ownerId: string;
  ownerName: string;
  onMessage: (text: string, tone: "success" | "error") => void;
}) {
  const { t } = useLanguage();
  const tm = t.admin.market;
  const { user: me } = useSession();
  const { data } = useAdminWallet(ownerType, ownerId, hasRole(me.systemRole, "admin"));
  const action = usePlatformAction();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const value = /^-?\d+$/.test(amount.trim()) ? Number(amount.trim()) : NaN;

  if (!hasRole(me.systemRole, "admin")) return null;
  return (
    <Panel
      title={tm.wallet}
      action={
        hasRole(me.systemRole, "super_admin") ? (
          <Button small variant="outline" onClick={() => setOpen(true)}>
            {tm.adjust}
          </Button>
        ) : null
      }
    >
      <div className="flex items-baseline gap-3">
        <span className="font-display text-2xl font-black tabular-nums text-ink">{data?.balanceTk != null ? tk(data.balanceTk) : "–"}</span>
        {data?.heldTk ? <span className="text-xs text-warning-ink">+ {tk(data.heldTk)} held</span> : null}
      </div>
      {open ? (
        <ReasonDialog
          title={format(tm.adjustTitle, { name: ownerName })}
          body={tm.adjustBody}
          confirmLabel={tm.adjust}
          canSubmit={Number.isFinite(value) && value !== 0}
          busy={action.isPending}
          extra={
            <Field label={tm.amount}>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="numeric" placeholder="500 / -200" className={inputClass} />
            </Field>
          }
          onCancel={() => setOpen(false)}
          onConfirm={async (reason) => {
            try {
              const result = (await action.mutateAsync({ kind: "adjustWallet", ownerType, ownerId, amountTk: value, reason })) as { balanceTk: number };
              setOpen(false);
              setAmount("");
              onMessage(format(tm.adjusted, { balance: tk(result.balanceTk) }), "success");
            } catch (err) {
              onMessage((err as { message?: string }).message ?? t.admin.common.errGeneric, "error");
            }
          }}
        />
      ) : null}
    </Panel>
  );
}

/** "End lock early" button + dialog for a player's active contract (admins). */
export function EndLockButton({
  userId,
  name,
  onMessage,
}: {
  userId: string;
  name: string;
  onMessage: (text: string, tone: "success" | "error") => void;
}) {
  const { t } = useLanguage();
  const tm = t.admin.market;
  const { user: me } = useSession();
  const action = usePlatformAction();
  const [open, setOpen] = useState(false);
  if (!hasRole(me.systemRole, "admin")) return null;
  return (
    <>
      <Button small variant="outline" onClick={() => setOpen(true)}>
        {tm.endLock}
      </Button>
      {open ? (
        <ReasonDialog
          title={format(tm.endLockTitle, { name })}
          body={tm.endLockBody}
          confirmLabel={tm.endLock}
          busy={action.isPending}
          onCancel={() => setOpen(false)}
          onConfirm={async (reason) => {
            try {
              await action.mutateAsync({ kind: "endLock", userId, reason });
              setOpen(false);
              onMessage(tm.lockEnded, "success");
            } catch (err) {
              onMessage((err as { message?: string }).message ?? t.admin.common.errGeneric, "error");
            }
          }}
        />
      ) : null}
    </>
  );
}
