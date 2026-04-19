import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { baserow } from "@/lib/baserow";
import { Button } from "@/components/ui";
import { Drawer } from "@/components/Drawer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { RowActions } from "@/components/admin/RowActions";
import { Check, Plus, Star } from "lucide-react";
import type { AdminUser, IdentityDocument } from "@/lib/types";
import { Card, FieldRow, SelectField, TextField, selectValue } from "./shared";

const DOC_TYPE_OPTIONS = [
  { value: "ЛК", label: "Лична карта" },
  { value: "Паспорт", label: "Паспорт" },
  { value: "Удостоверение ЕС", label: "Удостоверение ЕС" },
  { value: "Свидетелство за управление", label: "Свидетелство за управление" },
];

export default function DocumentsTab({ user }: { user: AdminUser }) {
  const [editing, setEditing] = useState<IdentityDocument | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<IdentityDocument | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["profile", "identityDocuments", user.id],
    queryFn: () => baserow.listIdentityDocumentsForUser(user.id),
  });

  return (
    <div className="space-y-4 max-w-3xl">
      <Card
        title="Документи за самоличност"
        description="Документи, които ще бъдат използвани при попълване на заявления."
      >
        <div className="flex justify-end">
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Нов документ
          </Button>
        </div>

        {isLoading ? (
          <div className="h-24 bg-muted/30 rounded animate-pulse" />
        ) : (data ?? []).length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            Няма добавени документи.
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-2 font-medium">Тип</th>
                  <th className="px-4 py-2 font-medium">Номер</th>
                  <th className="px-4 py-2 font-medium">Валиден до</th>
                  <th className="px-4 py-2 font-medium">Основен</th>
                  <th className="px-4 py-2 font-medium text-right w-28"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {(data ?? []).map((d) => (
                  <tr key={d.id} className="hover:bg-accent/40">
                    <td className="px-4 py-3 font-medium">
                      {selectValue(d["Identity Document Type"]) || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {d["Identity Document Number"] || "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(d["Identity Document Valid Until"])}
                    </td>
                    <td className="px-4 py-3">
                      {d["Identity Document Is Primary"] && (
                        <span className="inline-flex items-center gap-1 text-secondary-foreground bg-secondary px-2 py-0.5 rounded-full text-xs font-medium">
                          <Star className="h-3 w-3" /> основен
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <RowActions
                        onEdit={() => setEditing(d)}
                        onDelete={() => setDeleting(d)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <DocumentDrawer
        open={!!editing || creating}
        document={editing}
        userId={user.id}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
      />
      <DeleteDocumentDialog
        document={deleting}
        userId={user.id}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function DocumentDrawer({
  open,
  document,
  userId,
  onClose,
}: {
  open: boolean;
  document: IdentityDocument | null;
  userId: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isCreate = !document;

  const [type, setType] = useState<string | null>(null);
  const [number, setNumber] = useState("");
  const [issuedBy, setIssuedBy] = useState("");
  const [issuedOn, setIssuedOn] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);

  useEffect(() => {
    if (open) {
      setType(selectValue(document?.["Identity Document Type"]) ?? null);
      setNumber(document?.["Identity Document Number"] ?? "");
      setIssuedBy(document?.["Identity Document Issued By"] ?? "");
      setIssuedOn(document?.["Identity Document Issued On"] ?? "");
      setValidUntil(document?.["Identity Document Valid Until"] ?? "");
      setIsPrimary(document?.["Identity Document Is Primary"] ?? false);
    }
  }, [open, document]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<IdentityDocument> = {
        "Identity Document Type": type ? { value: type } : undefined,
        "Identity Document Number": number || undefined,
        "Identity Document Issued By": issuedBy || undefined,
        "Identity Document Issued On": issuedOn || undefined,
        "Identity Document Valid Until": validUntil || undefined,
        "Identity Document Is Primary": isPrimary,
      };
      if (isCreate) {
        return baserow.createIdentityDocument({
          ...payload,
          "Identity Document Linked User": [{ id: userId, value: "" }],
        });
      }
      return baserow.updateIdentityDocument(document!.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", "identityDocuments"] });
      toast.success(isCreate ? "Документът е добавен" : "Документът е обновен");
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка: ${msg}`);
    },
  });

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isCreate ? "Нов документ" : "Редактиране на документ"}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Отказ
          </Button>
          <Button
            disabled={!type || !number.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Запазване…" : isCreate ? "Създай" : "Запази"}
          </Button>
        </>
      }
    >
      <div className="grid md:grid-cols-2 gap-4 max-w-2xl">
        <FieldRow label="Тип *">
          <SelectField<string> value={type} onChange={setType} options={DOC_TYPE_OPTIONS} />
        </FieldRow>
        <FieldRow label="Номер *">
          <TextField value={number} onChange={setNumber} />
        </FieldRow>
        <FieldRow label="Издаден от">
          <TextField value={issuedBy} onChange={setIssuedBy} placeholder="МВР София" />
        </FieldRow>
        <FieldRow label="Дата на издаване">
          <TextField value={issuedOn} onChange={setIssuedOn} type="date" />
        </FieldRow>
        <FieldRow label="Валиден до">
          <TextField value={validUntil} onChange={setValidUntil} type="date" />
        </FieldRow>
        <FieldRow label="Основен документ">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPrimary}
              onChange={(e) => setIsPrimary(e.target.checked)}
            />
            Използвай по подразбиране при попълване на заявления
          </label>
        </FieldRow>
      </div>
    </Drawer>
  );
}

function DeleteDocumentDialog({
  document,
  userId,
  onClose,
}: {
  document: IdentityDocument | null;
  userId: number;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => baserow.deleteIdentityDocument(document!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["profile", "identityDocuments", userId],
      });
      toast.success("Документът е изтрит");
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка: ${msg}`);
    },
  });

  return (
    <ConfirmDialog
      open={!!document}
      onClose={onClose}
      onConfirm={() => mutation.mutate()}
      title="Изтриване на документ"
      description={
        document ? (
          <>
            Сигурни ли сте, че искате да изтриете{" "}
            <b>{selectValue(document["Identity Document Type"])}</b>{" "}
            {document["Identity Document Number"]}?
          </>
        ) : null
      }
      destructive
      confirmLabel="Изтрий"
      isPending={mutation.isPending}
    />
  );
}

function formatDate(iso?: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("bg-BG", { day: "2-digit", month: "short", year: "numeric" });
}
