/**
 * Universal /profile page — used by both citizens and staff.
 *
 * Gated by AuthRoute (authentication required, no active/admin check) so
 * every authenticated Auth0 user can manage their own record in table
 * 2657 regardless of whether they've been granted staff access.
 *
 * Users whose `User Is Active` flag is set (anyone who can reach the admin
 * panel) get the admin layout wrapped around /profile so the admin nav
 * stays available next to the profile tabs. Citizens (and deactivated
 * staff) get a dedicated single-purpose profile shell.
 */
import { createContext, useContext } from "react";
import { Link, NavLink, Navigate, Outlet, useLocation, useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth0 } from "@auth0/auth0-react";
import { ArrowLeft, Globe, LogOut } from "lucide-react";
import { baserow } from "@/lib/baserow";
import { useUserSync } from "@/hooks/useUserSync";
import AdminLayout from "@/pages/admin/AdminLayout";

import AccountTab from "./AccountTab";
import PersonalTab from "./PersonalTab";
import DocumentsTab from "./DocumentsTab";
import AddressesTab from "./AddressesTab";
import RepresentationTab from "./RepresentationTab";
import SettingsTab from "./SettingsTab";
import SecurityTab from "./SecurityTab";
import MySubmissionsTab from "./MySubmissionsTab";
import { PROFILE_TABS } from "./tabs";
import type { AdminUser } from "@/lib/types";

export default function ProfilePage() {
  const { baserowUser, isRestricted } = useUserSync();
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

  if (location.pathname === "/profile" || location.pathname === "/profile/") {
    return <Navigate to="/profile/account" replace />;
  }

  // `User Is Active` === has access to the admin panel. Use the admin
  // layout so their admin nav stays visible alongside the profile
  // tabs exposed from the expandable "Моят профил" submenu.
  if (!isRestricted) return <AdminProfileLayout user={user} />;

  return <CitizenProfileLayout user={user} />;
}

function AdminProfileLayout({ user }: { user: AdminUser }) {
  // AdminLayout already renders an Outlet; we feed it the user through
  // outlet context so the tab pages can read it exactly like they do in
  // the citizen shell.
  return (
    <OutletContextProvider user={user}>
      <AdminLayout />
    </OutletContextProvider>
  );
}

/**
 * Bridges AdminLayout's `<Outlet />` to the per-tab `useProfileUser` hook by
 * re-rendering the inner outlet with our own context prop. This keeps tab
 * pages layout-agnostic — they don't care whether they're nested inside
 * AdminLayout or CitizenProfileLayout.
 */
function OutletContextProvider({
  user,
  children,
}: {
  user: AdminUser;
  children: React.ReactNode;
}) {
  // The trick: we render children, and AdminLayout's Outlet picks up the
  // matched child route. But we need `user` flowing through. We solve this
  // by injecting `user` via React context (see the hook below).
  return <ProfileUserContext.Provider value={user}>{children}</ProfileUserContext.Provider>;
}

const ProfileUserContext = createContext<AdminUser | null>(null);

function CitizenProfileLayout({ user }: { user: AdminUser }) {
  const { logout } = useAuth0();
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
          {PROFILE_TABS.map((t) => (
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

// Thin page wrappers — read the synced user from either the outlet context
// (citizen layout) or the React context provider (admin layout) so the tab
// components stay layout-agnostic.
function useProfileUser(): AdminUser {
  const ctx = useOutletContext<{ user: AdminUser } | undefined>();
  const viaReactContext = useContext(ProfileUserContext);
  const user = ctx?.user ?? viaReactContext;
  if (!user) throw new Error("ProfileUserContext missing — is ProfilePage the parent route?");
  return user;
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
