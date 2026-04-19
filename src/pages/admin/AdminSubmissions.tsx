import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { baserow } from "@/lib/baserow";
import { useCurrentMunicipality } from "@/lib/currentMunicipality";
import {
  Pagination,
  SearchBar,
  SortableHeader,
  useTableControls,
} from "@/components/admin/tableControls";
import type { Submission, SubmissionStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: "all" | SubmissionStatus; label: string }[] = [
  { value: "all", label: "Всички" },
  { value: "submitted", label: "Подадени" },
  { value: "emailed", label: "Изпратени" },
  { value: "acknowledged", label: "Потвърдени" },
  { value: "completed", label: "Приключени" },
  { value: "rejected", label: "Отказани" },
  { value: "draft", label: "Чернови" },
  { value: "cancelled", label: "Отменени" },
];

type SubmissionSortKey = "vh" | "service" | "citizen" | "status" | "submittedAt";

export default function AdminSubmissions() {
  const { municipalityId } = useCurrentMunicipality();
  const [statusFilter, setStatusFilter] = useState<"all" | SubmissionStatus>("all");

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["admin", "submissions", municipalityId],
    queryFn: () => baserow.listSubmissions(municipalityId),
  });

  const statusFiltered = (submissions ?? []).filter(
    (s) => statusFilter === "all" || getStatus(s) === statusFilter,
  );

  const table = useTableControls<Submission, SubmissionSortKey>({
    rows: statusFiltered,
    searchFields: (s) => [
      s["Submission Citizen Name"],
      s["Submission Citizen Email"],
      s["Submission UUID"],
      s["Submission VH Number"],
      s["Submission Linked Service"]?.[0]?.value,
    ],
    sorters: {
      vh: (s) => s["Submission VH Number"] ?? s.id,
      service: (s) => s["Submission Linked Service"]?.[0]?.value ?? "",
      citizen: (s) => s["Submission Citizen Name"] ?? "",
      status: (s) => getStatus(s) ?? "",
      submittedAt: (s) =>
        s["Submission Submitted At"] ?? s["Submission Created On"] ?? "",
    },
    defaultSort: { key: "submittedAt", direction: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Заявления</h1>
        <p className="text-sm text-muted-foreground">
          {submissions?.length ?? 0} заявления в района
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <SearchBar
          value={table.query}
          onChange={table.setQuery}
          placeholder="Търси по име, имейл, услуга, ВХ №…"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatusFilter(opt.value)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              statusFilter === opt.value
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-accent"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-muted/30 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <SortableHeader
                  label="ВХ №"
                  sortKey="vh"
                  activeKey={table.sortKey}
                  direction={table.sortDir}
                  onSort={table.toggleSort}
                />
                <SortableHeader
                  label="Услуга"
                  sortKey="service"
                  activeKey={table.sortKey}
                  direction={table.sortDir}
                  onSort={table.toggleSort}
                />
                <SortableHeader
                  label="Гражданин"
                  sortKey="citizen"
                  activeKey={table.sortKey}
                  direction={table.sortDir}
                  onSort={table.toggleSort}
                />
                <SortableHeader
                  label="Статус"
                  sortKey="status"
                  activeKey={table.sortKey}
                  direction={table.sortDir}
                  onSort={table.toggleSort}
                />
                <SortableHeader
                  label="Подадено"
                  sortKey="submittedAt"
                  activeKey={table.sortKey}
                  direction={table.sortDir}
                  onSort={table.toggleSort}
                />
              </tr>
            </thead>
            <tbody className="divide-y">
              {table.pageRows.map((s) => (
                <tr key={s.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3">
                    <Link
                      to={`/admin/submissions/${s.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {s["Submission VH Number"] || `#${s.id}`}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {s["Submission Linked Service"]?.[0]?.value ?? (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div>{s["Submission Citizen Name"] || "—"}</div>
                    {s["Submission Citizen Email"] && (
                      <div className="text-xs text-muted-foreground">
                        {s["Submission Citizen Email"]}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={getStatus(s)} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(s["Submission Submitted At"] ?? s["Submission Created On"])}
                  </td>
                </tr>
              ))}
              {table.totalFiltered === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                    Няма заявления по критериите.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Pagination
            page={table.page}
            totalPages={table.totalPages}
            totalFiltered={table.totalFiltered}
            pageSize={table.pageSize}
            onPageChange={table.setPage}
          />
        </div>
      )}
    </div>
  );
}

function getStatus(s: Submission): SubmissionStatus | undefined {
  const raw = s["Submission Status"];
  if (!raw) return undefined;
  return (typeof raw === "string" ? raw : raw.value) as SubmissionStatus;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("bg-BG", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-secondary text-secondary-foreground",
  emailed: "bg-primary/10 text-primary",
  acknowledged: "bg-secondary text-secondary-foreground",
  completed: "bg-primary text-primary-foreground",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  draft: "Чернова",
  submitted: "Подадено",
  emailed: "Изпратено",
  acknowledged: "Потвърдено",
  completed: "Приключено",
  rejected: "Отказано",
  cancelled: "Отменено",
};

function StatusBadge({ status }: { status?: SubmissionStatus }) {
  if (!status) return <span className="text-muted-foreground">—</span>;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
