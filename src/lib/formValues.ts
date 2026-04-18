/**
 * Collapse a react-hook-form value into the plain string the rest of
 * the pipeline (PDF templates, Baserow submissions) expects.
 *
 * File inputs arrive as `FileList`; without this helper they become
 * `"[object FileList]"` when stringified.
 */
export function stringifyFormValue(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "boolean" || typeof v === "number") return String(v);
  if (typeof FileList !== "undefined" && v instanceof FileList) {
    return Array.from(v)
      .map((f) => f.name)
      .filter(Boolean)
      .join(", ");
  }
  if (typeof File !== "undefined" && v instanceof File) {
    return v.name;
  }
  if (v instanceof Date) {
    return v.toISOString().slice(0, 10);
  }
  if (Array.isArray(v)) {
    return v.map(stringifyFormValue).filter(Boolean).join(", ");
  }
  return String(v);
}

export function stringifyFormValues(
  values: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(values)) out[k] = stringifyFormValue(v);
  return out;
}
