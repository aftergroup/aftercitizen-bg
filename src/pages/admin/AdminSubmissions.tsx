import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { baserow } from "@/lib/baserow";
import { useCurrentMunicipality } from "@/lib/currentMunicipality";
import { Input } from "@/components/ui";
import { Search } from "lucide-react";
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

export default function AdminSubmissions() {
  const { municipalityId } = useCurrentMunicipality();
  const [statusFilter, setStatusFilter] = useState<"all" | SubmissionStatus>("all");
  const [query, setQuery] = useState("");

  const { data: submissions, isLoading } = useQuery({
    queryKey: ["admin", "submissions", municipalityId],
    queryFn: () => baserow.listSubmissions(municipalityId),
  });

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return (submissions ?? []).filter((s) => {
      const matchStatus = statusFilter === "all" || getStatus(s) === statusFilter;
      const matchQuery =
        !q ||
        s["Submission Citizen Name"]?.toLowerCase().includes(q) ||
        s["Submission Citizen Email"]?.toLowerCase().includes(q) ||
        s["Submission UUID"]?.toLowerCase().includes(q) ||
        s["Submission VH Number"]?.toLowerCase().includes(q) ||
        s["Submission Linked Service"]?.[0]?.value?.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [submissions, statusFilter, query]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Заявления</h1>
        <p className="text-sm text-muted-foreground">
          {submissions?.length ?? 0} заявления в района
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Търси по име, имейл, услуга, ВХ №…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
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
                <th className="px-4 py-2 font-medium">ВХ №</th>
                <th className="px-4 py-2 font-medium">Услуга</th>
                <th className="px-4 py-2 font-medium">Гражданин</th>
                <th className="px-4 py-2 font-medium">Статус</th>
                <th className="px-4 py-2 font-medium">Подадено</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((s) => (
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
              {filtered.length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                    Няма заявления по критериите.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
