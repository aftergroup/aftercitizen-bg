import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { baserow } from "@/lib/baserow";
import { Check, X } from "lucide-react";

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

function UsersTab() {
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin", "adminUsers"],
    queryFn: () => baserow.listAdminUsers(),
  });

  if (isLoading) {
    return <div className="h-40 rounded-lg bg-muted/30 animate-pulse" />;
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Име</th>
            <th className="px-4 py-2 font-medium">Имейл</th>
            <th className="px-4 py-2 font-medium">Телефон</th>
            <th className="px-4 py-2 font-medium">Роля</th>
            <th className="px-4 py-2 font-medium">Активен</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {(users ?? []).map((u) => {
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
                  {u["User Linked User Role"]?.[0]?.value ?? (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <BoolBadge value={u["User Is Active"]} />
                </td>
              </tr>
            );
          })}
          {(users ?? []).length === 0 && (
            <tr>
              <td colSpan={5} className="p-8 text-center text-muted-foreground text-sm">
                Няма регистрирани служители.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function RolesTab() {
  const { data: roles, isLoading } = useQuery({
    queryKey: ["admin", "userRoles"],
    queryFn: () => baserow.listUserRoles(),
  });

  if (isLoading) {
    return <div className="h-40 rounded-lg bg-muted/30 animate-pulse" />;
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Наименование</th>
            <th className="px-4 py-2 font-medium">Активна</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {(roles ?? []).map((r) => (
            <tr key={r.id} className="hover:bg-accent/40">
              <td className="px-4 py-3 font-medium">{r["User Role Name"] || "—"}</td>
              <td className="px-4 py-3">
                <BoolBadge value={r["User Role Is Active"]} />
              </td>
            </tr>
          ))}
          {(roles ?? []).length === 0 && (
            <tr>
              <td colSpan={2} className="p-8 text-center text-muted-foreground text-sm">
                Няма дефинирани роли.
              </td>
            </tr>
          )}
        </tbody>
      </table>
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
