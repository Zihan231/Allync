"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSession } from "@/lib/session/SessionContext";
import { useToast } from "@/lib/useToast";
import { hasRole } from "@/lib/api/admin";
import type { AdminStoreItem, StoreItemInput } from "@/lib/api/adminPlatform";
import { useAdminStoreItems, useSaveStoreItem } from "@/lib/api/hooks/useAdminStore";
import { ToastContainer } from "@/components/common/Toast";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Badge, Button, EmptyRow, Field, Kpi, Modal, Panel, inlineSelectClass, inputClass } from "@/components/admin/ui";

type Category = AdminStoreItem["category"];
const CATEGORIES: Category[] = ["theme", "frame", "title", "badge"];
const RARITIES = ["common", "rare", "epic", "legendary", "mythic"] as const;

const errorText = (err: unknown, fallback: string) => {
  const message = (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
  return (Array.isArray(message) ? message.join(", ") : message) || fallback;
};

/**
 * Staff store manager (Admin and above): every cosmetic on (or off) sale, with its
 * price, order and how it sells. Edits reach the players' store immediately.
 */
export default function AdminStorePage() {
  const { t } = useLanguage();
  const ts = t.admin.store;
  const { user: me } = useSession();
  const allowed = hasRole(me.systemRole, "admin");
  const { toasts, toast, dismiss } = useToast();
  const { data, isLoading } = useAdminStoreItems(allowed);
  const save = useSaveStoreItem();
  const [category, setCategory] = useState<Category | "all">("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<AdminStoreItem | "new" | null>(null);

  const items = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter(
      (item) =>
        (category === "all" || item.category === category) &&
        (!q || item.name.toLowerCase().includes(q) || item.sku.includes(q)),
    );
  }, [data, category, search]);

  if (!allowed) return <EmptyRow>{t.admin.noAccessBody}</EmptyRow>;

  const totals = (data ?? []).reduce(
    (sum, item) => ({
      onSale: sum.onSale + (item.active ? 1 : 0),
      owners: sum.owners + item.owners,
      revenue: sum.revenue + item.revenueTk,
    }),
    { onSale: 0, owners: 0, revenue: 0 },
  );

  async function toggle(item: AdminStoreItem) {
    try {
      await save.mutateAsync({ id: item.id, input: { active: !item.active } });
      toast(ts.saved, "success");
    } catch (err) {
      toast(errorText(err, t.admin.common.errGeneric), "error");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow={t.admin.eyebrow}
        title={ts.title}
        description={ts.description}
        action={
          <Button variant="primary" onClick={() => setEditing("new")}>
            {ts.newItem}
          </Button>
        }
      />

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Kpi label={ts.kpiItems} value={`${totals.onSale} / ${data?.length ?? 0}`} />
        <Kpi label={ts.kpiOwners} value={totals.owners.toLocaleString()} />
        <Kpi label={ts.kpiRevenue} value={`৳ ${totals.revenue.toLocaleString()}`} />
      </div>

      <Panel className="mt-4">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={ts.search} className={`${inputClass} max-w-xs`} />
          <select value={category} onChange={(e) => setCategory(e.target.value as Category | "all")} className={inlineSelectClass}>
            <option value="all">{ts.all}</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="h-48 animate-pulse rounded-xl bg-surface/40" />
        ) : items.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b border-surface-line text-left font-mono text-[10px] uppercase tracking-wide text-ink-faint">
                <tr>
                  <th className="px-3 py-2">{ts.colItem}</th>
                  <th className="px-3 py-2">{ts.colCategory}</th>
                  <th className="px-3 py-2 text-right">{ts.colPrice}</th>
                  <th className="px-3 py-2 text-right">{ts.colOwners}</th>
                  <th className="px-3 py-2 text-right">{ts.colRevenue}</th>
                  <th className="px-3 py-2">{ts.colStatus}</th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-surface-line/60 last:border-0">
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-ink">{item.name}</div>
                      <div className="font-mono text-[11px] text-ink-faint">
                        {item.sku}
                        {item.metadata?.rarity ? ` · ${item.metadata.rarity}` : ""}
                      </div>
                    </td>
                    <td className="px-3 py-2.5 capitalize text-ink-soft">{item.category}</td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-ink">{item.priceTk > 0 ? `৳${item.priceTk.toLocaleString()}` : ts.free}</td>
                    <td className="px-3 py-2.5 text-right font-mono">{item.owners}</td>
                    <td className="px-3 py-2.5 text-right font-mono">৳{item.revenueTk.toLocaleString()}</td>
                    <td className="px-3 py-2.5">
                      <Badge tone={item.active ? "success" : "neutral"}>{item.active ? ts.onSale : ts.hidden}</Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex justify-end gap-1">
                        <Button small variant="outline" onClick={() => setEditing(item)}>
                          {ts.edit}
                        </Button>
                        <Button small onClick={() => toggle(item)} disabled={save.isPending}>
                          {item.active ? ts.hide : ts.show}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyRow>{ts.empty}</EmptyRow>
        )}
      </Panel>

      {editing ? (
        <ItemEditor
          item={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={(created) => {
            setEditing(null);
            toast(created ? ts.created : ts.saved, "success");
          }}
        />
      ) : null}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

/** Create or edit one store item. */
function ItemEditor({ item, onClose, onSaved }: { item: AdminStoreItem | null; onClose: () => void; onSaved: (created: boolean) => void }) {
  const { t } = useLanguage();
  const ts = t.admin.store;
  const save = useSaveStoreItem();
  const [form, setForm] = useState({
    sku: item?.sku ?? "",
    name: item?.name ?? "",
    description: item?.description ?? "",
    category: (item?.category ?? "theme") as Category,
    priceTk: String(item?.priceTk ?? 0),
    rarity: (item?.metadata?.rarity as string | undefined) ?? "common",
    assetUrl: item?.assetUrl ?? "",
    sortOrder: String(item?.sortOrder ?? 0),
    active: item?.active ?? true,
  });
  const [error, setError] = useState("");
  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((f) => ({ ...f, [key]: value }));

  async function submit() {
    setError("");
    const input: StoreItemInput = {
      sku: form.sku.trim(),
      name: form.name.trim(),
      description: form.description,
      category: form.category,
      priceTk: Math.max(0, Math.round(Number(form.priceTk) || 0)),
      assetUrl: form.assetUrl,
      sortOrder: Math.round(Number(form.sortOrder) || 0),
      active: form.active,
      metadata: { ...(item?.metadata ?? {}), rarity: form.rarity },
    };
    try {
      await save.mutateAsync({ id: item?.id, input });
      onSaved(!item);
    } catch (err) {
      setError(errorText(err, t.admin.common.errGeneric));
    }
  }

  return (
    <Modal
      title={item ? ts.editItem : ts.newItem}
      onClose={onClose}
      footer={
        <>
          <Button onClick={onClose}>{ts.cancel}</Button>
          <Button variant="primary" onClick={submit} disabled={save.isPending || !form.sku.trim() || form.name.trim().length < 2}>
            {ts.save}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field label={ts.sku} hint={ts.skuHint}>
          <input value={form.sku} onChange={(e) => set("sku", e.target.value.toLowerCase())} className={`${inputClass} font-mono`} />
        </Field>
        <Field label={ts.name}>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={120} className={inputClass} />
        </Field>
        <Field label={ts.itemDescription}>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} maxLength={2000} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={ts.category}>
            <select value={form.category} onChange={(e) => set("category", e.target.value as Category)} className={inputClass}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ts.rarity}>
            <select value={form.rarity} onChange={(e) => set("rarity", e.target.value)} className={inputClass}>
              {RARITIES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </Field>
          <Field label={ts.price}>
            <input type="number" min={0} value={form.priceTk} onChange={(e) => set("priceTk", e.target.value)} className={`${inputClass} font-mono`} />
          </Field>
          <Field label={ts.sortOrder}>
            <input type="number" value={form.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} className={`${inputClass} font-mono`} />
          </Field>
        </div>
        <Field label={ts.assetUrl}>
          <input value={form.assetUrl} onChange={(e) => set("assetUrl", e.target.value)} className={inputClass} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
          {ts.active}
        </label>
        {error ? <p className="rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-xs font-semibold text-danger-ink">{error}</p> : null}
      </div>
    </Modal>
  );
}
