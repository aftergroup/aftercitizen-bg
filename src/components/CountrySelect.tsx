/**
 * Country picker with inline flag icons. Radix-based so we can render rich
 * option content (flag + name) — native <select> elements can't show CSS
 * backgrounds inside <option>. Uses the `flag-icons` stylesheet imported
 * globally from main.tsx, keyed by ISO 3166-1 alpha-2 country codes.
 */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import type { Country } from "@/lib/types";

export interface CountrySelectProps {
  value: number | null;
  onChange: (id: number | null) => void;
  countries: Country[];
  placeholder?: string;
}

export function CountrySelect({
  value,
  onChange,
  countries,
  placeholder = "Избор на държава",
}: CountrySelectProps) {
  const selected = countries.find((c) => c.id === value);

  return (
    <Select
      value={value ? String(value) : undefined}
      onValueChange={(v) => onChange(v ? Number(v) : null)}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder}>
          {selected ? <CountryOption country={selected} /> : placeholder}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {countries.map((c) => (
          <SelectItem key={c.id} value={String(c.id)}>
            <CountryOption country={c} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function CountryOption({ country }: { country: Country }) {
  const code = country["Country Code"]?.toLowerCase();
  const label =
    country["Country Name BG"] ||
    country["Country Name EN"] ||
    country["Country Code"] ||
    `#${country.id}`;
  return (
    <span className="inline-flex items-center gap-2">
      {code && (
        <span
          className={`fi fi-${code}`}
          style={{ width: 20, height: 15, borderRadius: 2 }}
          aria-hidden
        />
      )}
      <span>{label}</span>
    </span>
  );
}

/** Find Bulgaria's row id in a countries list, used as default nationality. */
export function findBulgariaId(countries: Country[] | undefined): number | null {
  if (!countries) return null;
  const bg = countries.find(
    (c) =>
      c["Country Code"]?.toUpperCase() === "BG" ||
      c["Country Name BG"] === "България" ||
      c["Country Name EN"] === "Bulgaria",
  );
  return bg?.id ?? null;
}
