import { useEffect, useState } from "react";
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
import { Drawer } from "@/components/Drawer";
import { Button } from "@/components/ui";
import { Check, Eye, EyeOff, Pencil } from "lucide-react";
import type { Form } from "@/lib/types";

type FormSortKey = "code" | "title" | "status" | "visible" | "modified";

export default function AdminForms() {
  const { municipalityId } = useCurrentMunicipality();
  const [editing, setEditing] = useState<Form | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "forms", municipalityId],
    queryFn: () => baserow.listFormsForMunicipality(municipalityId),
  });

  const table = useTableControls<Form, FormSortKey>({
    rows: data,
    searchFields: (f) => [f["Form Code"], f["Form Title BG"], f["Form Title EN"]],
    sorters: {
      code: (f) => f["Form Code"] ?? "",
      title: (f) => f["Form Title BG"] ?? "",
      status: (f) => getStatus(f) ?? "",
      visible: (f) => f["Form Is Visible"] ?? false,
      modified: (f) => f["Form Last Modified On"] ?? "",
    },
    defaultSort: { key: "code" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Формуляри</h1>
        <p className="text-sm text-muted-foreground">
          Управление на видимостта на формулярите за граждани.
        </p>
      </div>

      <SearchBar
        value={table.query}
        onChange={table.setQuery}
        placeholder="Търси по код или наименование…"
      />

      {isLoading ? (
        <div className="h-40 rounded-lg bg-muted/30 animate-pulse" />
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <SortableHeader label="Код" sortKey="code" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
                <SortableHeader label="Наименование" sortKey="title" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
                <SortableHeader label="Статус" sortKey="status" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
                <SortableHeader label="Видим" sortKey="visible" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
                <SortableHeader label="Последно" sortKey="modified" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
                <th className="px-4 py-2 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {table.pageRows.map((f) => (
                <tr key={f.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3 font-medium text-primary">
                    {f["Form Code"] || "—"}
                  </td>
                  <td className="px-4 py-3">{f["Form Title BG"] || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{getStatus(f) ?? "—"}</td>
                  <td className="px-4 py-3">
                    <VisibilityBadge visible={f["Form Is Visible"]} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDate(f["Form Last Modified On"])}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => setEditing(f)}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Pencil className="h-3.5 w-3.5" /> Редактирай
                    </button>
                  </td>
                </tr>
              ))}
              {table.totalFiltered === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">
                    Няма формуляри за този район.
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

      <EditFormDrawer form={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

function EditFormDrawer({ form, onClose }: { form: Form | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (form) {
      setIsVisible(form["Form Is Visible"] ?? true);
      setNotes(form["Form Notes"] ?? "");
    }
  }, [form]);

  const mutation = useMutation({
    mutationFn: (patch: Partial<Form>) => {
      if (!form) throw new Error("No form selected");
      return baserow.updateForm(form.id, patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "forms"] });
      toast.success("Формулярът е обновен");
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка при обновяване: ${msg}`);
    },
  });

  const isDirty =
    !!form &&
    ((form["Form Is Visible"] ?? true) !== isVisible ||
      (form["Form Notes"] ?? "") !== notes);

  return (
    <Drawer
      open={!!form}
      onClose={onClose}
      title={form ? `Редактиране · ${form["Form Code"]}` : ""}
      description={form?.["Form Title BG"]}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Отказ
          </Button>
          <Button
            disabled={!isDirty || mutation.isPending}
            onClick={() => mutation.mutate({ "Form Is Visible": isVisible, "Form Notes": notes })}
          >
            {mutation.isPending ? "Запазване…" : "Запази"}
          </Button>
        </>
      }
    >
      {form && (
        <div className="space-y-6 max-w-xl">
          <Section title="Видимост">
            <button
              type="button"
              onClick={() => setIsVisible((v) => !v)}
              className={`w-full flex items-center justify-between p-3 border rounded-md transition-colors ${
                isVisible ? "bg-secondary/60 border-secondary" : "bg-muted/40"
              }`}
            >
              <div className="flex items-center gap-3">
                {isVisible ? (
                  <Eye className="h-4 w-4 text-secondary-foreground" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
                <div className="text-left">
                  <div className="font-medium text-sm">
                    {isVisible ? "Видим за гражданите" : "Скрит от гражданите"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {isVisible
                      ? "Гражданите ще виждат този формуляр в списъка с услуги."
                      : "Формулярът няма да се показва в публичната страница."}
                  </div>
                </div>
              </div>
              <Toggle on={isVisible} />
            </button>
          </Section>

          <Section title="Информация">
            <ReadOnly label="Код" value={form["Form Code"]} />
            <ReadOnly label="Наименование BG" value={form["Form Title BG"]} />
            {form["Form Title EN"] && (
              <ReadOnly label="Title EN" value={form["Form Title EN"]} />
            )}
            <ReadOnly label="Статус" value={getStatus(form)} />
            {form["Form Blank PDF R2 URL"] && (
              <ReadOnly
                label="PDF образец"
                value={
                  <a
                    href={form["Form Blank PDF R2 URL"]}
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

          <Section title="Вътрешни бележки">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Бележки за администраторите…"
            />
          </Section>
        </div>
      )}
    </Drawer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {title}
      </h3>
      <div className="space-y-2">{children}</div>
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

function Toggle({ on }: { on: boolean }) {
  return (
    <div
      className={`relative h-5 w-9 rounded-full transition-colors ${
        on ? "bg-primary" : "bg-muted"
      }`}
    >
      <div
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
          on ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </div>
  );
}

function VisibilityBadge({ visible }: { visible?: boolean }) {
  if (visible) {
    return (
      <span className="inline-flex items-center gap-1 text-secondary-foreground bg-secondary px-2 py-0.5 rounded-full text-xs font-medium">
        <Check className="h-3 w-3" /> видим
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-xs font-medium">
      <EyeOff className="h-3 w-3" /> скрит
    </span>
  );
}

function getStatus(f: Form): string | undefined {
  const raw = f["Form Status"];
  if (!raw) return undefined;
  return typeof raw === "string" ? raw : raw.value;
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("bg-BG", { day: "2-digit", month: "short", year: "numeric" });
}
