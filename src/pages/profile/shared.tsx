/**
 * Small form primitives shared by every profile tab. Kept in one file so
 * that the visual language of inputs/toggles/section cards stays consistent
 * across tabs — each tab page then only concerns itself with its own fields.
 */
import { Input } from "@/components/ui";

export function Card({
  title,
  description,
  children,
}: {
  title?: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border rounded-lg p-5 space-y-4">
      {(title || description) && (
        <div>
          {title && <h2 className="font-semibold text-sm">{title}</h2>}
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextField({
  value,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
}

export function SelectField<T extends string | number>({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: T | null | undefined;
  onChange: (v: T | null) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value ?? ""}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") onChange(null);
        else if (typeof options[0]?.value === "number") onChange(Number(raw) as T);
        else onChange(raw as T);
      }}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      <option value="">{placeholder ?? "— Избор —"}</option>
      {options.map((o) => (
        <option key={String(o.value)} value={String(o.value)}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function CheckboxField({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
}

export function selectValue(
  v: { value: string } | string | undefined,
): string | undefined {
  if (!v) return undefined;
  return typeof v === "string" ? v : v.value;
}
