import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { baserow } from "@/lib/baserow";
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
import { Check, KeyRound, Plus, X } from "lucide-react";
import { useIsAdmin, SUPER_ADMIN_ROLE_NAME } from "@/hooks/useIsAdmin";
import { translateRole } from "@/lib/roleTranslations";
import { sendAuth0PasswordReset } from "@/lib/auth0";
import type { AdminUser, UserRole } from "@/lib/types";

type Tab = "users" | "roles";

export default function AdminUsers() {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Потребители</h1>
        <p className="text-sm text-muted-foreground">
          Служители с достъп до админ панела и наличните роли.
        </p>
      </div>

      <div className="border-b flex gap-1">
        <TabButton active={tab === "users"} onClick={() => setTab("users")}>
          Служители
        </TabButton>
        <TabButton active={tab === "roles"} onClick={() => setTab("roles")}>
          Роли
        </TabButton>
      </div>

      {tab === "users" ? <UsersTab /> : <RolesTab />}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ======================= Staff users =======================

type UserSortKey = "name" | "email" | "phone" | "role" | "active";

function UsersTab() {
  const { isSuperAdmin } = useIsAdmin();
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "adminUsers"],
    queryFn: () => baserow.listAdminUsers(),
  });
  const { data: roles } = useQuery({
    queryKey: ["admin", "userRoles"],
    queryFn: () => baserow.listUserRoles(),
  });

  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<AdminUser | null>(null);

  // Resolve each row's linked role id → role name once. Baserow's default
  // link_row response returns the target's primary field in `.value`,
  // which for User Roles is the autonumber — so we can't compare names
  // directly without a lookup.
  const roleNameById = new Map(
    (roles ?? []).map((r) => [r.id, r["User Role Name"]]),
  );
  const getUserRoleName = (u: AdminUser): string => {
    const link = u["User Linked User Role"]?.[0];
    if (!link) return "";
    return roleNameById.get(link.id) ?? link.value ?? "";
  };

  // Non-super admins don't get to see (or manage) Super Administrator staff.
  const visibleUsers = (users ?? []).filter((u) => {
    if (isSuperAdmin) return true;
    return getUserRoleName(u) !== SUPER_ADMIN_ROLE_NAME;
  });

  const table = useTableControls<AdminUser, UserSortKey>({
    rows: visibleUsers,
    searchFields: (u) => [
      u["User Email"],
      u["User First Name"],
      u["User Last Name"],
      u["User Full Name"],
      u["User Username"],
      u["User Phone"],
      getUserRoleName(u),
    ],
    sorters: {
      name: (u) =>
        u["User Full Name"] ||
        [u["User First Name"], u["User Last Name"]].filter(Boolean).join(" ") ||
        u["User Appear As"] ||
        "",
      email: (u) => u["User Email"] ?? "",
      phone: (u) => u["User Phone"] ?? "",
      role: (u) => getUserRoleName(u),
      active: (u) => u["User Is Active"] ?? false,
    },
    defaultSort: { key: "name" },
  });

  if (isLoading) {
    return <div className="h-40 rounded-lg bg-muted/30 animate-pulse" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <SearchBar
          value={table.query}
          onChange={table.setQuery}
          placeholder="Търси по име, имейл, роля…"
        />
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Нов служител
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs tracking-wide text-muted-foreground">
            <tr>
              <SortableHeader label="Име" sortKey="name" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Имейл" sortKey="email" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Телефон" sortKey="phone" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Роля" sortKey="role" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Активен" sortKey="active" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
              <th className="px-4 py-2 font-medium text-right w-28">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {table.pageRows.map((u) => {
              const fullName =
                u["User Full Name"]?.trim() ||
                [u["User First Name"], u["User Last Name"]].filter(Boolean).join(" ") ||
                u["User Appear As"] ||
                u["User Username"] ||
                "—";
              return (
                <tr key={u.id} className="hover:bg-accent/40">
                  <td className="px-4 py-3 font-medium">{fullName}</td>
                  <td className="px-4 py-3">
                    {u["User Email"] ? (
                      <a
                        href={`mailto:${u["User Email"]}`}
                        className="text-primary hover:underline"
                      >
                        {u["User Email"]}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {u["User Phone"] || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {getUserRoleName(u) ? (
                      translateRole(getUserRoleName(u))
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <BoolBadge value={u["User Is Active"]} />
                  </td>
                  <td className="px-4 py-3">
                    <RowActions onEdit={() => setEditing(u)} onDelete={() => setDeleting(u)} />
                  </td>
                </tr>
              );
            })}
            {table.totalFiltered === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground text-sm">
                  Няма регистрирани служители.
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

      <UserDrawer
        open={!!editing || creating}
        user={editing}
        roles={roles ?? []}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
      />
      <DeleteUserDialog user={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}

function UserDrawer({
  open,
  user,
  roles,
  onClose,
}: {
  open: boolean;
  user: AdminUser | null;
  roles: UserRole[];
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { isSuperAdmin } = useIsAdmin();
  const isCreate = !user;

  const visibleRoles = isSuperAdmin
    ? roles
    : roles.filter((r) => r["User Role Name"] !== SUPER_ADMIN_ROLE_NAME);

  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [appearAs, setAppearAs] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  useEffect(() => {
    if (open) {
      setEmail(user?.["User Email"] ?? "");
      setFirstName(user?.["User First Name"] ?? "");
      setLastName(user?.["User Last Name"] ?? "");
      setAppearAs(user?.["User Appear As"] ?? "");
      setPhone(user?.["User Phone"] ?? "");
      setUsername(user?.["User Username"] ?? "");
      setIsActive(user?.["User Is Active"] ?? false);
      setRoleId(user?.["User Linked User Role"]?.[0]?.id ?? null);
    }
  }, [open, user]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<AdminUser> = {
        "User Email": email,
        "User First Name": firstName || undefined,
        "User Last Name": lastName || undefined,
        "User Appear As": appearAs || undefined,
        "User Username": username || undefined,
        "User Phone": phone || undefined,
        "User Is Active": isActive,
        "User Linked User Role": roleId ? [{ id: roleId, value: "" }] : [],
      };
      return isCreate
        ? baserow.createAdminUser(payload)
        : baserow.updateAdminUser(user!.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "adminUsers"] });
      toast.success(isCreate ? "Служителят е създаден" : "Служителят е обновен");
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка: ${msg}`);
    },
  });

  const canSave = !!email.trim();

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isCreate ? "Нов служител" : `Редактиране · ${user?.["User Email"] ?? ""}`}
      description={isCreate ? "Добавяне на нов служител" : undefined}
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
        <Section title="Идентичност">
          <FieldRow label="Имейл *">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </FieldRow>
          <FieldRow label="Потребителско име">
            <Input value={username} onChange={(e) => setUsername(e.target.value)} />
          </FieldRow>
          <FieldRow label="Име">
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </FieldRow>
          <FieldRow label="Фамилия">
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </FieldRow>
          <FieldRow label="Показвано име">
            <Input value={appearAs} onChange={(e) => setAppearAs(e.target.value)} />
          </FieldRow>
          <FieldRow label="Телефон">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FieldRow>
        </Section>

        <Section title="Роля и достъп">
          <FieldRow label="Роля">
            <select
              value={roleId ?? ""}
              onChange={(e) => setRoleId(e.target.value ? Number(e.target.value) : null)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              <option value="">— Без роля —</option>
              {visibleRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {translateRole(r["User Role Name"])}
                </option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="Активен">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
              />
              Разрешен достъп до админ панела
            </label>
          </FieldRow>

          {!isCreate && user?.["User Email"] && (
            <FieldRow
              label="Парола"
              hint="Изпраща имейл на служителя с връзка за задаване на нова парола."
            >
              <Button
                type="button"
                variant="outline"
                disabled={isSendingReset}
                onClick={async () => {
                  setIsSendingReset(true);
                  try {
                    await sendAuth0PasswordReset(user!["User Email"]);
                    toast.success(
                      `Изпратен е имейл за смяна на парола до ${user!["User Email"]}`,
                    );
                  } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    toast.error(`Грешка: ${msg}`);
                  } finally {
                    setIsSendingReset(false);
                  }
                }}
              >
                <KeyRound className="h-4 w-4" />
                {isSendingReset ? "Изпращане…" : "Изпрати имейл за смяна"}
              </Button>
            </FieldRow>
          )}
        </Section>
      </div>
    </Drawer>
  );
}

function DeleteUserDialog({ user, onClose }: { user: AdminUser | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => baserow.deleteAdminUser(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "adminUsers"] });
      toast.success("Служителят е изтрит");
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка: ${msg}`);
    },
  });

  return (
    <ConfirmDialog
      open={!!user}
      onClose={onClose}
      onConfirm={() => mutation.mutate()}
      title="Изтриване на служител"
      description={
        user ? (
          <>
            Сигурни ли сте, че искате да изтриете <b>{user["User Email"]}</b>?
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

// ======================= Roles =======================

type RoleSortKey = "name" | "active";

function RolesTab() {
  const { isSuperAdmin } = useIsAdmin();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "userRoles"],
    queryFn: () => baserow.listUserRoles(),
  });

  const [editing, setEditing] = useState<UserRole | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<UserRole | null>(null);

  const visibleRoles = (data ?? []).filter(
    (r) => isSuperAdmin || r["User Role Name"] !== SUPER_ADMIN_ROLE_NAME,
  );

  const table = useTableControls<UserRole, RoleSortKey>({
    rows: visibleRoles,
    searchFields: (r) => [r["User Role Name"]],
    sorters: {
      name: (r) => r["User Role Name"] ?? "",
      active: (r) => r["User Role Is Active"] ?? false,
    },
    defaultSort: { key: "name" },
  });

  if (isLoading) {
    return <div className="h-40 rounded-lg bg-muted/30 animate-pulse" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <SearchBar
          value={table.query}
          onChange={table.setQuery}
          placeholder="Търси роля…"
        />
        <Button onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Нова роля
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs tracking-wide text-muted-foreground">
            <tr>
              <SortableHeader label="Наименование" sortKey="name" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
              <SortableHeader label="Активна" sortKey="active" activeKey={table.sortKey} direction={table.sortDir} onSort={table.toggleSort} />
              <th className="px-4 py-2 font-medium text-right w-28">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {table.pageRows.map((r) => (
              <tr key={r.id} className="hover:bg-accent/40">
                <td className="px-4 py-3 font-medium">
                  {translateRole(r["User Role Name"]) || "—"}
                </td>
                <td className="px-4 py-3">
                  <BoolBadge value={r["User Role Is Active"]} />
                </td>
                <td className="px-4 py-3">
                  <RowActions onEdit={() => setEditing(r)} onDelete={() => setDeleting(r)} />
                </td>
              </tr>
            ))}
            {table.totalFiltered === 0 && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-muted-foreground text-sm">
                  Няма дефинирани роли.
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

      <RoleDrawer
        open={!!editing || creating}
        role={editing}
        onClose={() => {
          setEditing(null);
          setCreating(false);
        }}
      />
      <DeleteRoleDialog role={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}

function RoleDrawer({
  open,
  role,
  onClose,
}: {
  open: boolean;
  role: UserRole | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const isCreate = !role;

  const [name, setName] = useState("");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (open) {
      setName(role?.["User Role Name"] ?? "");
      setIsActive(role?.["User Role Is Active"] ?? true);
    }
  }, [open, role]);

  const mutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<UserRole> = {
        "User Role Name": name,
        "User Role Is Active": isActive,
      };
      return isCreate
        ? baserow.createUserRole(payload)
        : baserow.updateUserRole(role!.id, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "userRoles"] });
      toast.success(isCreate ? "Ролята е създадена" : "Ролята е обновена");
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
          ? "Нова роля"
          : `Редактиране · ${translateRole(role?.["User Role Name"]) || ""}`
      }
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>
            Отказ
          </Button>
          <Button
            disabled={!name.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "Запазване…" : isCreate ? "Създай" : "Запази"}
          </Button>
        </>
      }
    >
      <div className="max-w-xl space-y-4">
        <FieldRow label="Наименование *">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </FieldRow>
        <FieldRow label="Активна">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
            />
            Ролята може да се зачислява на служители
          </label>
        </FieldRow>
      </div>
    </Drawer>
  );
}

function DeleteRoleDialog({ role, onClose }: { role: UserRole | null; onClose: () => void }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => baserow.deleteUserRole(role!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "userRoles"] });
      toast.success("Ролята е изтрита");
      onClose();
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Грешка: ${msg}`);
    },
  });

  return (
    <ConfirmDialog
      open={!!role}
      onClose={onClose}
      onConfirm={() => mutation.mutate()}
      title="Изтриване на роля"
      description={
        role ? (
          <>
            Сигурни ли сте, че искате да изтриете ролята{" "}
            <b>{translateRole(role["User Role Name"])}</b>?
          </>
        ) : null
      }
      destructive
      confirmLabel="Изтрий"
      isPending={mutation.isPending}
    />
  );
}

// ======================= Shared =======================

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

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function BoolBadge({ value }: { value?: boolean }) {
  if (value) {
    return (
      <span className="inline-flex items-center gap-1 text-secondary-foreground bg-secondary px-2 py-0.5 rounded-full text-xs font-medium">
        <Check className="h-3 w-3" /> да
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-xs font-medium">
      <X className="h-3 w-3" /> не
    </span>
  );
}
