import { Fragment, useEffect, useState } from "react";
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
import { ChevronDown, ChevronRight, Mail, Phone, Plus } from "lucide-react";
import type { AdminUser, MunicipalDepartment } from "@/lib/types";

type DeptSortKey = "name" | "type" | "manager";

export default function AdminDepartments() {
  const { municipalityId } = useCurrentMunicipality();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "departments"],
    queryFn: () => baserow.listMunicipalDepartments(),
  });
  const { data: staff } = useQuery({
    queryKey: ["admin", "adminUsers"],
    queryFn: () => baserow.listAdminUsers(),
  });

  const [editing, setEditing] = useState<MunicipalDepartment | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<MunicipalDepartment | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const scoped = (data ?? []).filter(
    (d) => d["Municipal Department Linked Municipality"]?.[0]?.id === municipalityId,
  );

  const table = useTableControls<MunicipalDepartment, DeptSortKey>({
    rows: scoped,
    searchFields: (d) => [
      d["Municipal Department Name BG"],
      d["Municipal Department Name EN"],
      d["Municipal Department Linked Manager"]?.[0]?.value,
      d["Municipal Department Email"],
      d["Municipal Department Phone"],
    ],
    sorters: {
      name: (d) => d["Municipal Department Name BG"] ?? "",
      type: (d) => d["Municipal Department Linked Unit Type"]?.[0]?.value ?? "",
      manager: (d) => d["Municipal Department Linked Manager"]?.[0]?.value ?? "",
    },
    defaultSort: { key: "name" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Отдели</h1>
          <p className="text-sm text-muted-foreground">
            Отделите на районната администрация.
          </p>
        </div>
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Нов отдел
        </Button>
      </div>

      <SearchBar
        value={table.query}
        onChange={table.setQuery}
        placeholder="Търси по наименование, ръководител, имейл…"
      />

      {isLoading ? (
        <div className="h-40 rounded-lg bg-muted/30 animate-pulse" />
      ) : (
        <div className="border rounded-lg overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs tracking-wide text-muted-foreground">
              <tr>
                <th className="w-8" />
                <SortableHeader label="Наименование" sortKey="name" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
                <SortableHeader label="Тип" sortKey="type" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
                <SortableHeader label="Ръководител" sortKey="manager" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
                <th className="px-4 py-2 font-medium text-right w-24">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {table.pageRows.map((d) => {
                const isOpen = expandedId === d.id;
                const hasDetails =
                  !!d["Municipal Department Email"] ||
                  !!d["Municipal Department Phone"];
                return (
                  <Fragment key={d.id}>
                    <tr className="hover:bg-accent/40">
                      <td className="pl-3 w-8">
                        <button
                          type="button"
                          onClick={() => setExpandedId(isOpen ? null : d.id)}
                          aria-label={isOpen ? "Свий" : "Разгъни"}
                          className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent"
                          disabled={!hasDetails}
                        >
                          {isOpen ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {d["Municipal Department Name BG"] || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {d["Municipal Department Linked Unit Type"]?.[0]?.value || "—"}
                      </td>
                      <td className="px-4 py-3">
                        {d["Municipal Department Linked Manager"]?.[0]?.value || (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <RowActions
                          onEdit={() => setEditing(d)}
                          onDelete={() => setDeleting(d)}
                        />
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="bg-muted/20">
                        <td />
                        <td colSpan={4} className="px-4 py-3">
                          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                              {d["Municipal Department Email"] ? (
                                <a
                                  href={`mailto:${d["Municipal Department Email"]}`}
                                  className="text-primary hover:underline"
                                >
                                  {d["Municipal Department Email"]}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                              {d["Municipal Department Phone"] ? (
                                <a
                                  href={`tel:${d["Municipal Department Phone"]}`}
                                  className="text-primary hover:underline"
                                >
                                  {d["Municipal Department Phone"]}
                                </a>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {table.totalFiltered === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                    Няма регистрирани отдели в района.
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

      <DepartmentDrawer
        open={!!editing || creating}
        department={editing}
        municipalityId={municipalityId}
        staff={staff ?? []}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
      />

      <DeleteDepartmentDialog
        department={deleting}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function DepartmentDrawer({
  open,
  department,
  municipalityId,
  staff,
  onClose,
}: {
  open: boolean;
  department: MunicipalDepartment | null;
  municipalityId: number;
  staff: AdminUser[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isCreate = !department;

  const [nameBg, setNameBg] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [managerId, setManagerId] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setNameBg(department?.["Municipal Department Name BG"] ?? "");
      setNameEn(department?.["Municipal Department Name EN"] ?? "");
      setEmail(department?.["Municipal Department Email"] ?? "");
      setPhone(department?.["Municipal Department Phone"] ?? "");
      setManagerId(department?.["Municipal Department Linked Manager"]?.[0]?.id ?? null);
    }
  }, [open, department]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<MunicipalDepartment> = {
        "Municipal Department Name BG": nameBg,
        "Municipal Department Name EN": nameEn || undefined,
        "Municipal Department Email": email || undefined,
        "Municipal Department Phone": phone || undefined,
        "Municipal Department Linked Manager": managerId
          ? [{ id: managerId, value: "" }]
          : [],
      };
      if (isCreate) {
        return baserow.createMunicipalDepartment({
          ...payload,
          "Municipal Department Linked Municipality": [{ id: municipalityId, value: "" }],
        });
      }
      return baserow.updateMunicipalDepartment(department!.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });
      toast.success(isCreate ? "Отделът е създаден" : "Отделът е обновен");
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
      title={
        isCreate
          ? "Нов отдел"
          : `Редактиране · ${department?.["Municipal Department Name BG"] ?? ""}`
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Отказ
          </Button>
          <Button
            disabled={!nameBg.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Запазване…" : isCreate ? "Създай" : "Запази"}
          </Button>
        </>
      }
    >
      <div className="grid md:grid-cols-2 gap-6">
        <Section title="Наименование">
          <FieldRow label="Наименование BG *">
            <Input value={nameBg} onChange={(e) => setNameBg(e.target.value)} />
          </FieldRow>
          <FieldRow label="Name EN">
            <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} />
          </FieldRow>
        </Section>

        <Section title="Контакти и ръководство">
          <FieldRow label="Имейл">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </FieldRow>
          <FieldRow label="Телефон">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FieldRow>
          <FieldRow label="Ръководител">
            <select
              value={managerId ?? ""}
              onChange={(e) => setManagerId(e.target.value ? Number(e.target.value) : null)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">— Без ръководител —</option>
              {staff.map((u) => {
                const label =
                  u["User Full Name"]?.trim() ||
                  [u["User First Name"], u["User Last Name"]].filter(Boolean).join(" ") ||
                  u["User Email"] ||
                  `#${u.id}`;
                return (
                  <option key={u.id} value={u.id}>
                    {label}
                  </option>
                );
              })}
            </select>
          </FieldRow>
        </Section>
      </div>
    </Drawer>
  );
}

function DeleteDepartmentDialog({
  department,
  onClose,
}: {
  department: MunicipalDepartment | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => baserow.deleteMunicipalDepartment(department!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "departments"] });
      toast.success("Отделът е изтрит");
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка: ${msg}`);
    },
  });

  return (
    <ConfirmDialog
      open={!!department}
      onClose={onClose}
      onConfirm={() => mutation.mutate()}
      title="Изтриване на отдел"
      description={
        department ? (
          <>
            Сигурни ли сте, че искате да изтриете{" "}
            <b>{department["Municipal Department Name BG"]}</b>?
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
