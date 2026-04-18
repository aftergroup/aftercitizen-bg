/**
 * Shared helpers for PDF templates.
 *
 * These are intentionally generic so every form template (GR-012 today,
 * more tomorrow) formats dates, resolves dictionary values, and matches
 * checkbox states the same way.
 */
import type { RenderedField } from "@/lib/types";

export function formatBgDate(value: string | undefined | null): string {
  if (!value) return "";
  const s = String(value).trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    const [, y, m, d] = iso;
    return `${d}.${m}.${y}`;
  }
  return s;
}

/**
 * Resolve the raw submission value for a field. Returns the dictionary
 * label when the field is backed by a dictionary so PDFs show the
 * Bulgarian wording instead of the English key.
 */
export function getFieldValue(
  values: Record<string, string>,
  field: RenderedField | undefined,
): string {
  if (!field) return "";
  const raw = values[field.code];
  if (raw !== undefined && raw !== "" && raw !== "false") {
    if (field.dictionary) {
      const entry = field.dictionary.entries.find((e) => e.key === raw);
      return entry?.labelBg ?? String(raw);
    }
    return String(raw);
  }
  return field.defaultValue ?? "";
}

/**
 * Check whether a dictionary-backed field's submission matches any of
 * the given tokens. Tokens are matched against both the raw dictionary
 * key (e.g. "standard") and the Bulgarian label (e.g. "обикновена"),
 * so templates don't have to worry about which form the value takes.
 */
export function fieldValueMatches(
  values: Record<string, string>,
  field: RenderedField | undefined,
  tokens: string[],
): boolean {
  if (!field) return false;
  const raw = String(values[field.code] ?? "").trim().toLowerCase();
  if (!raw) return false;
  const lowered = tokens.map((t) => t.toLowerCase());
  if (lowered.some((t) => raw === t || raw.includes(t))) return true;
  if (field.dictionary) {
    const entry = field.dictionary.entries.find((e) => e.key === values[field.code]);
    if (entry) {
      const label = entry.labelBg.toLowerCase();
      if (lowered.some((t) => label.includes(t))) return true;
    }
  }
  return false;
}
