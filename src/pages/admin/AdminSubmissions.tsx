import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { baserow } from "@/lib/baserow";
import { useCurrentMunicipality } from "@/lib/currentMunicipality";
import {
  Pagination,
  SearchBar,
  SortableHeader,
  useTableControls,
} from "@/components/admin/tableControls";
import { RowActions } from "@/components/admin/RowActions";
import { Drawer } from "@/components/Drawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui";
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
  const [editing, setEditing] = useState<Submission | null>(null);
  const [deleting, setDeleting] = useState<Submission | null>(null);

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
                <th className="px-4 py-2 font-medium text-right w-28">Действия</th>
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
                  <td className="px-4 py-3">
                    <RowActions onEdit={() => setEditing(s)} onDelete={() => setDeleting(s)} />
                  </td>
                </tr>
              ))}
              {table.totalFiltered === 0 && !isLoading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">
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

      <SubmissionDrawer submission={editing} onClose={() => setEditing(null)} />
      <DeleteSubmissionDialog submission={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}

function SubmissionDrawer({
  submission,
  onClose,
}: {
  submission: Submission | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SubmissionStatus | "">("");
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (submission) {
      setStatus((getStatus(submission) ?? "") as SubmissionStatus | "");
      setRejectionReason(submission["Submission Rejection Reason"] ?? "");
    }
  }, [submission]);

  const mutation = useMutation({
    mutationFn: () =>
      baserow.updateSubmission(submission!.id, {
        "Submission Status": status ? { value: status } : undefined,
        "Submission Rejection Reason": rejectionReason || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "submissions"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "submission"] });
      toast.success("Заявлението е обновено");
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка: ${msg}`);
    },
  });

  return (
    <Drawer
      open={!!submission}
      onClose={onClose}
      title={
        submission
          ? `Редактиране · ${submission["Submission VH Number"] || `#${submission.id}`}`
          : ""
      }
      description={submission?.["Submission Linked Service"]?.[0]?.value}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Отказ
          </Button>
          <Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending ? "Запазване…" : "Запази"}
          </Button>
        </>
      }
    >
      {submission && (
        <div className="grid md:grid-cols-2 gap-6">
          <Section title="Статус">
            <FieldRow label="Статус">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SubmissionStatus | "")}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">— Без статус —</option>
                {(Object.keys(STATUS_LABELS) as SubmissionStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </FieldRow>
            <FieldRow label="Причина за отказ">
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={6}
                className="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={'Попълва се само при статус „отказано"…'}
              />
            </FieldRow>
          </Section>

          <Section title="Детайли">
            <ReadOnly label="Гражданин" value={submission["Submission Citizen Name"]} />
            <ReadOnly label="Имейл" value={submission["Submission Citizen Email"]} />
            <ReadOnly label="Телефон" value={submission["Submission Citizen Phone"]} />
            <ReadOnly label="ВХ №" value={submission["Submission VH Number"]} />
            <ReadOnly
              label="Подадено на"
              value={formatDateTime(submission["Submission Submitted At"])}
            />
            {submission["Submission Filled PDF R2 URL"] && (
              <ReadOnly
                label="PDF"
                value={
                  <a
                    href={submission["Submission Filled PDF R2 URL"]}
                    target="_blank"
                    rel="noopener"
                    className="text-primary hover:underline"
                  >
                    Отвори
                  </a>
                }
              />
            )}
          </Section>
        </div>
      )}
    </Drawer>
  );
}

function DeleteSubmissionDialog({
  submission,
  onClose,
}: {
  submission: Submission | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => baserow.deleteSubmission(submission!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "submissions"] });
      toast.success("Заявлението е изтрито");
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка: ${msg}`);
    },
  });

  return (
    <ConfirmDialog
      open={!!submission}
      onClose={onClose}
      onConfirm={() => mutation.mutate()}
      title="Изтриване на заявление"
      description={
        submission ? (
          <>
            Сигурни ли сте, че искате да изтриете заявлението{" "}
            <b>{submission["Submission VH Number"] || `#${submission.id}`}</b>?
            Действието не може да бъде върнато.
          </>
        ) : null
      }
      destructive
      confirmLabel="Изтрий"
      isPending={mutation.isPending}
    />
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}

function ReadOnly({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-3 text-sm">
      <div className="text-muted-foreground">{label}</div>
      <div className="min-w-0 break-words">
        {value ? <span>{value}</span> : <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

function formatDateTime(iso?: string): string | undefined {
  if (!iso) return undefined;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("bg-BG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
