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
import { RowActions } from "@/components/admin/RowActions";
import { Drawer } from "@/components/Drawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button, Input } from "@/components/ui";
import { Check, Eye, EyeOff, Plus } from "lucide-react";
import type { Form } from "@/lib/types";

type FormSortKey = "code" | "title" | "status" | "visible" | "modified";

export default function AdminForms() {
  const { municipalityId } = useCurrentMunicipality();
  const [editing, setEditing] = useState<Form | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Form | null>(null);

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Формуляри</h1>
          <p className="text-sm text-muted-foreground">
            Управление на видимостта на формулярите за граждани.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Нов формуляр
        </Button>
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
                <th className="px-4 py-2 font-medium text-right w-28">Действия</th>
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
                  <td className="px-4 py-3">
                    <RowActions
                      onEdit={() => setEditing(f)}
                      onDelete={() => setDeleting(f)}
                    />
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

      <FormDrawer
        open={!!editing || creating}
        form={editing}
        municipalityId={municipalityId}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
      />

      <DeleteFormDialog form={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}

function FormDrawer({
  open,
  form,
  municipalityId,
  onClose,
}: {
  open: boolean;
  form: Form | null;
  municipalityId: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isCreate = !form;

  const [code, setCode] = useState("");
  const [titleBg, setTitleBg] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      setCode(form?.["Form Code"] ?? "");
      setTitleBg(form?.["Form Title BG"] ?? "");
      setTitleEn(form?.["Form Title EN"] ?? "");
      setIsVisible(form?.["Form Is Visible"] ?? true);
      setNotes(form?.["Form Notes"] ?? "");
    }
  }, [open, form]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<Form> = {
        "Form Code": code,
        "Form Title BG": titleBg,
        "Form Title EN": titleEn || undefined,
        "Form Is Visible": isVisible,
        "Form Notes": notes,
      };
      if (isCreate) {
        return baserow.createForm({
          ...payload,
          "Form Linked Municipality": [{ id: municipalityId, value: "" }],
        });
      }
      return baserow.updateForm(form!.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "forms"] });
      toast.success(isCreate ? "Формулярът е създаден" : "Формулярът е обновен");
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка: ${msg}`);
    },
  });

  const canSave = code.trim() && titleBg.trim();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isCreate ? "Нов формуляр" : `Редактиране · ${form?.["Form Code"] ?? ""}`}
      description={isCreate ? "Добавяне на формуляр към района" : form?.["Form Title BG"]}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Отказ
          </Button>
          <Button
            disabled={!canSave || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Запазване…" : isCreate ? "Създай" : "Запази"}
          </Button>
        </>
      }
    >
      <div className="grid md:grid-cols-2 gap-6">
        <Section title="Основна информация">
          <FieldRow label="Код *">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="напр. GR-042"
            />
          </FieldRow>
          <FieldRow label="Наименование BG *">
            <Input
              value={titleBg}
              onChange={(e) => setTitleBg(e.target.value)}
              placeholder="Издаване на…"
            />
          </FieldRow>
          <FieldRow label="Title EN">
            <Input
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="Optional English title"
            />
          </FieldRow>
          {!isCreate && form?.["Form Blank PDF R2 URL"] && (
            <FieldRow label="PDF образец">
              <a
                href={form["Form Blank PDF R2 URL"]}
                target="_blank"
                rel="noopener"
                className="text-sm text-primary hover:underline"
              >
                Отвори
              </a>
            </FieldRow>
          )}
          {!isCreate && (
            <FieldRow label="Статус">
              <span className="text-sm text-muted-foreground">
                {getStatus(form!) ?? "—"}
              </span>
            </FieldRow>
          )}
        </Section>

        <div className="space-y-6">
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

          <Section title="Вътрешни бележки">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Бележки за администраторите…"
            />
          </Section>
        </div>
      </div>
    </Drawer>
  );
}

function DeleteFormDialog({ form, onClose }: { form: Form | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => baserow.deleteForm(form!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "forms"] });
      toast.success("Формулярът е изтрит");
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка: ${msg}`);
    },
  });

  return (
    <ConfirmDialog
      open={!!form}
      onClose={onClose}
      onConfirm={() => mutation.mutate()}
      title="Изтриване на формуляр"
      description={
        form ? (
          <>
            Сигурни ли сте, че искате да изтриете <b>{form["Form Code"]}</b>
            {form["Form Title BG"] ? (
              <>
                {" "}
                — <i>{form["Form Title BG"]}</i>
              </>
            ) : null}
            ? Действието не може да бъде върнато.
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
