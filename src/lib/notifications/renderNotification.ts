import { format, roleLabel, type Locale, type TranslationDict } from "@/lib/i18n/translations";
import type { NotificationItem } from "@/lib/api/notifications";
import { formatGameRange, formatMatchTime, roundLabel } from "@/components/dashboard/fixtures/labels";

type Template = { title: string; message: string };

/**
 * A notification's title and message in the viewer's language, rendered from its
 * `code` + `params`. Notifications without a (known) code — e.g. ones saved before
 * codes existed — show the stored English text.
 */
export function renderNotification(
  n: Pick<NotificationItem, "title" | "message" | "code" | "params">,
  t: TranslationDict,
  locale: Locale,
): Template {
  const templates = t.dashboard.notificationMessages as Record<string, Template>;
  const template = n.code ? templates[n.code] : undefined;
  if (!template || !n.params) return { title: n.title, message: n.message };

  const p = n.params;
  const fields = t.dashboard.notificationFields as Record<string, string>;
  const values: Record<string, string | number> = {};
  for (const [key, value] of Object.entries(p)) values[key] = value ?? "";

  // Derived, localized values.
  if (p.startAt && p.endAt) {
    values.range = formatGameRange({ scheduledStart: String(p.startAt), scheduledEnd: String(p.endAt) }, t, locale) ?? "";
  }
  if (p.deadlineAt) values.deadline = formatMatchTime(String(p.deadlineAt), locale);
  if (typeof p.round === "string") values.round = roundLabel(p.round, t);
  if (typeof p.role === "string") values.role = roleLabel(p.role, t);
  if (typeof p.changes === "string") {
    values.changes = p.changes
      .split(",")
      .map((field) => fields[field.trim()] ?? field.trim())
      .join(", ");
  }
  if (!p.community && "community" in p) values.community = fields.community;

  return { title: format(template.title, values), message: format(template.message, values) };
}
