/**
 * Universal /profile page — used by both citizens and staff. Tab-based
 * layout wraps every sub-area; each tab is a self-contained component so
 * they can be edited independently without touching the shell.
 *
 * Gated by AuthRoute (authentication required, no active/admin check) so
 * every authenticated Auth0 user can manage their own record in table
 * 2657 regardless of whether they've been granted staff access.
 */
import { useQuery } from "@tanstack/react-query";
import { Link, NavLink, Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { ArrowLeft, FileText, Files, Globe, Inbox, LogOut, MapPin, Settings, Shield, User, Users2 } from "lucide-react";
import { baserow } from "@/lib/baserow";
import { useUserSync } from "@/hooks/useUserSync";

import AccountTab from "./AccountTab";
import PersonalTab from "./PersonalTab";
import DocumentsTab from "./DocumentsTab";
import AddressesTab from "./AddressesTab";
import RepresentationTab from "./RepresentationTab";
import SettingsTab from "./SettingsTab";
import SecurityTab from "./SecurityTab";
import MySubmissionsTab from "./MySubmissionsTab";

const TABS = [
  { to: "account", label: "Профил", icon: User },
  { to: "personal", label: "Лични данни", icon: FileText },
  { to: "my-submissions", label: "Моите заявления", icon: Inbox },
  { to: "documents", label: "Документи", icon: Files },
  { to: "addresses", label: "Адреси", icon: MapPin },
  { to: "representation", label: "Представителство", icon: Users2 },
  { to: "settings", label: "Настройки", icon: Settings },
  { to: "security", label: "Сигурност", icon: Shield },
] as const;

export default function ProfilePage() {
  const { logout } = useAuth0();
  const { baserowUser } = useUserSync();
  const location = useLocation();

  // Refetch the user row whenever an edit succeeds — tabs emit this key
  // via `queryClient.invalidateQueries(["profile", "user"])`.
  const { data: fresh } = useQuery({
    queryKey: ["profile", "user", baserowUser?.id],
    queryFn: async () => {
      if (!baserowUser) return null;
      const rows = await baserow.listAdminUsers();
      return rows.find((u) => u.id === baserowUser.id) ?? baserowUser;
    },
    enabled: !!baserowUser,
    initialData: baserowUser,
  });

  const user = fresh ?? baserowUser;
  if (!user) return null;

  // `/profile` bare → send to first tab.
  if (location.pathname === "/profile" || location.pathname === "/profile/") {
    return <Navigate to="/profile/account" replace />;
  }

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="w-60 shrink-0 border-r bg-white flex flex-col">
        <Link to="/" className="flex items-center gap-2 p-4 border-b">
          <ArrowLeft className="h-4 w-4 text-muted-foreground" />
          <div className="min-w-0">
            <div className="font-semibold leading-none truncate">Моят профил</div>
            <div className="text-xs text-muted-foreground truncate">Обратно към сайта</div>
          </div>
        </Link>

        <nav className="flex-1 p-2 text-sm space-y-1">
          {TABS.map((t) => (
            <NavLink
              key={t.to}
              to={`/profile/${t.to}`}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent text-foreground"
                }`
              }
            >
              <t.icon className="h-4 w-4" />
              <span>{t.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t text-xs text-muted-foreground space-y-3">
          <div>
            <div className="font-medium text-foreground truncate">
              {user["User Appear As"] ||
                user["User Full Name"] ||
                [user["User First Name"], user["User Last Name"]]
                  .filter(Boolean)
                  .join(" ") ||
                user["User Email"]}
            </div>
            {user["User Email"] && <div className="truncate">{user["User Email"]}</div>}
          </div>
          <button
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Излизане
          </button>
          {user["User Default Language"] && (
            <div className="inline-flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {user["User Default Language"].toUpperCase()}
            </div>
          )}
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="container max-w-5xl py-8">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
}

// Thin page wrappers — each pulls the synced user from the outlet context
// so they all share the same reference and all re-render together when
// ProfilePage's query invalidates.
import { useOutletContext } from "react-router-dom";
import type { AdminUser } from "@/lib/types";

function useProfileUser(): AdminUser {
  return useOutletContext<{ user: AdminUser }>().user;
}

export function AccountTabPage() {
  return <AccountTab user={useProfileUser()} />;
}
export function PersonalTabPage() {
  return <PersonalTab user={useProfileUser()} />;
}
export function DocumentsTabPage() {
  return <DocumentsTab user={useProfileUser()} />;
}
export function AddressesTabPage() {
  return <AddressesTab user={useProfileUser()} />;
}
export function RepresentationTabPage() {
  return <RepresentationTab user={useProfileUser()} />;
}
export function SettingsTabPage() {
  return <SettingsTab user={useProfileUser()} />;
}
export function SecurityTabPage() {
  return <SecurityTab />;
}
export function MySubmissionsTabPage() {
  return <MySubmissionsTab user={useProfileUser()} />;
}
