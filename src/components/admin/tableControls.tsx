/**
 * Shared search / sort / pagination controls for admin list pages.
 *
 * Pages feed raw rows in, declare which fields are searchable and what
 * column → accessor map they want to sort by, and render the rows returned
 * from `useTableControls`. This keeps the Baserow list call shape free of
 * UI state while every list page stays paginated, searchable and sortable
 * without re-solving it each time.
 */
import { useMemo, useState } from "react";
import { ChevronsUpDown, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui";

type Primitive = string | number | boolean | null | undefined;

export type SortDirection = "asc" | "desc";

export interface TableControlsOptions<T, K extends string> {
  rows: T[] | undefined;
  searchFields: (row: T) => Primitive[];
  sorters: Record<K, (row: T) => Primitive>;
  defaultSort?: { key: K; direction?: SortDirection };
  pageSize?: number;
}

export interface TableControlsResult<T, K extends string> {
  query: string;
  setQuery: (q: string) => void;
  sortKey: K | null;
  sortDir: SortDirection;
  toggleSort: (key: K) => void;
  page: number;
  setPage: (p: number) => void;
  pageSize: number;
  totalFiltered: number;
  totalPages: number;
  pageRows: T[];
}

export function useTableControls<T, K extends string>({
  rows,
  searchFields,
  sorters,
  defaultSort,
  pageSize = 25,
}: TableControlsOptions<T, K>): TableControlsResult<T, K> {
  const [query, setQueryRaw] = useState("");
  const [sortKey, setSortKey] = useState<K | null>(defaultSort?.key ?? null);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultSort?.direction ?? "asc");
  const [page, setPage] = useState(1);

  const setQuery = (q: string) => {
    setQueryRaw(q);
    setPage(1);
  };

  const toggleSort = (key: K) => {
    setPage(1);
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir("asc");
    } else if (sortDir === "asc") {
      setSortDir("desc");
    } else {
      setSortKey(null);
    }
  };

  const filteredSorted = useMemo(() => {
    const q = query.toLowerCase().trim();
    const base = (rows ?? []).filter((row) => {
      if (!q) return true;
      return searchFields(row).some(
        (v) => v != null && String(v).toLowerCase().includes(q),
      );
    });

    if (!sortKey) return base;
    const accessor = sorters[sortKey];
    const sorted = [...base].sort((a, b) => compare(accessor(a), accessor(b)));
    return sortDir === "asc" ? sorted : sorted.reverse();
  }, [rows, query, sortKey, sortDir, searchFields, sorters]);

  const totalFiltered = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const pageRows = filteredSorted.slice(
    (clampedPage - 1) * pageSize,
    clampedPage * pageSize,
  );

  return {
    query,
    setQuery,
    sortKey,
    sortDir,
    toggleSort,
    page: clampedPage,
    setPage,
    pageSize,
    totalFiltered,
    totalPages,
    pageRows,
  };
}

function compare(a: Primitive, b: Primitive): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
  return String(a).localeCompare(String(b), "bg");
}

// ------------ UI bits ------------

export function SearchBar({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Търсене…"}
        className="pl-9"
      />
    </div>
  );
}

export function SortableHeader<K extends string>({
  label,
  sortKey,
  activeKey,
  direction,
  onSort,
  className,
}: {
  label: React.ReactNode;
  sortKey: K;
  activeKey: K | null;
  direction: SortDirection;
  onSort: (key: K) => void;
  className?: string;
}) {
  const active = activeKey === sortKey;
  const Icon = !active ? ChevronsUpDown : direction === "asc" ? ChevronUp : ChevronDown;
  return (
    <th className={`px-4 py-2 font-medium ${className ?? ""}`}>
      <button
        onClick={() => onSort(sortKey)}
        className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
          active ? "text-foreground" : ""
        }`}
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
}

export function Pagination({
  page,
  totalPages,
  totalFiltered,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalFiltered: number;
  pageSize: number;
  onPageChange: (p: number) => void;
}) {
  if (totalFiltered === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalFiltered);
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2 border-t text-xs text-muted-foreground">
      <div>
        {from}–{to} от {totalFiltered}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Предишна страница"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="px-2">
          стр. {page} / {totalPages}
        </div>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:pointer-events-none"
          aria-label="Следваща страница"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
