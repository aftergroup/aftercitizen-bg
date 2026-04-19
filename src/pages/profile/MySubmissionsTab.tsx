import { useQuery } from "@tanstack/react-query";
import { baserow } from "@/lib/baserow";
import {
  Pagination,
  SearchBar,
  SortableHeader,
  useTableControls,
} from "@/components/admin/tableControls";
import type { AdminUser, Submission, SubmissionStatus } from "@/lib/types";
import { Card, selectValue } from "./shared";

type MySubSortKey = "vh" | "service" | "status" | "submittedAt";

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  draft: "Чернова",
  submitted: "Подадено",
  emailed: "Изпратено",
  acknowledged: "Потвърдено",
  completed: "Приключено",
  rejected: "Отказано",
  cancelled: "Отменено",
};

const STATUS_STYLES: Record<SubmissionStatus, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-secondary text-secondary-foreground",
  emailed: "bg-primary/10 text-primary",
  acknowledged: "bg-secondary text-secondary-foreground",
  completed: "bg-primary text-primary-foreground",
  rejected: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

export default function MySubmissionsTab({ user }: { user: AdminUser }) {
  const { data, isLoading } = useQuery({
    queryKey: ["profile", "mySubmissions", user.id],
    queryFn: () => baserow.listSubmissionsForUser(user.id),
  });

  const table = useTableControls<Submission, MySubSortKey>({
    rows: data,
    searchFields: (s) => [
      s["Submission VH Number"],
      s["Submission UUID"],
      s["Submission Linked Service"]?.[0]?.value,
      selectValue(s["Submission Status"]),
    ],
    sorters: {
      vh: (s) => s["Submission VH Number"] ?? s.id,
      service: (s) => s["Submission Linked Service"]?.[0]?.value ?? "",
      status: (s) => selectValue(s["Submission Status"]) ?? "",
      submittedAt: (s) =>
        s["Submission Submitted At"] ?? s["Submission Created On"] ?? "",
    },
    defaultSort: { key: "submittedAt", direction: "desc" },
  });

  return (
    <div className="space-y-4 max-w-5xl">
      <Card
        title="Моите заявления"
        description="Заявленията, които сте подали през платформата."
      >
        <SearchBar
          value={table.query}
          onChange={table.setQuery}
          placeholder="Търси по ВХ №, услуга или статус…"
        />

        {isLoading ? (
          <div className="h-24 bg-muted/30 rounded animate-pulse" />
        ) : table.totalFiltered === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Няма подадени заявления.
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
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
                  <th className="px-4 py-2 font-medium">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {table.pageRows.map((s) => {
                  const status = selectValue(s["Submission Status"]) as
                    | SubmissionStatus
                    | undefined;
                  return (
                    <tr key={s.id} className="hover:bg-accent/40">
                      <td className="px-4 py-3 font-medium">
                        {s["Submission VH Number"] || `#${s.id}`}
                      </td>
                      <td className="px-4 py-3">
                        {s["Submission Linked Service"]?.[0]?.value ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {status ? (
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[status]}`}
                          >
                            {STATUS_LABELS[status]}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(
                          s["Submission Submitted At"] ?? s["Submission Created On"],
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {s["Submission Filled PDF R2 URL"] ? (
                          <a
                            href={s["Submission Filled PDF R2 URL"]}
                            target="_blank"
                            rel="noopener"
                            className="text-primary hover:underline"
                          >
                            Отвори
                          </a>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
      </Card>
    </div>
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("bg-BG", { day: "2-digit", month: "short", year: "numeric" });
}
