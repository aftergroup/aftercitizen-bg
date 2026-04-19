import { useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import {
  Building2,
  ChevronDown,
  ChevronRight,
  FileText,
  FormInput,
  LogOut,
  Settings,
  User,
  Users2,
} from "lucide-react";
import { useCurrentMunicipality } from "@/lib/currentMunicipality";
import { useUserSync } from "@/hooks/useUserSync";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { PROFILE_TABS } from "@/pages/profile/tabs";

export default function AdminLayout() {
  const { municipality } = useCurrentMunicipality();
  const { baserowUser } = useUserSync();
  const { isAdmin } = useIsAdmin();
  const { logout } = useAuth0();
  const location = useLocation();

  // Auto-expand the profile submenu whenever the user is on a /profile/* route.
  // Manual toggle via the header button overrides that default so admins can
  // collapse it back even while browsing their profile.
  const onProfileRoute = location.pathname.startsWith("/profile");
  const [profileOpen, setProfileOpen] = useState(onProfileRoute);
  const expanded = profileOpen || onProfileRoute;

  const displayName =
    baserowUser?.["User Appear As"] ||
    baserowUser?.["User Full Name"] ||
    [baserowUser?.["User First Name"], baserowUser?.["User Last Name"]]
      .filter(Boolean)
      .join(" ") ||
    baserowUser?.["User Email"] ||
    "…";

  return (
    <div className="min-h-screen bg-muted/30 flex">
      <aside className="w-60 shrink-0 border-r bg-white flex flex-col">
        <Link to="/" className="flex items-center gap-2 p-4 border-b">
          <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
            АЦ
          </div>
          <div className="min-w-0">
            <div className="font-semibold leading-none truncate">AfterCitizen</div>
            <div className="text-xs text-muted-foreground truncate">Админ панел</div>
          </div>
        </Link>

        <nav className="flex-1 overflow-y-auto p-2 text-sm space-y-1">
          <AdminNavItem to="/admin/submissions" icon={<FileText className="h-4 w-4" />}>
            Заявления
          </AdminNavItem>
          <AdminNavItem to="/admin/forms" icon={<FormInput className="h-4 w-4" />}>
            Формуляри
          </AdminNavItem>
          <AdminNavItem to="/admin/users" icon={<Users2 className="h-4 w-4" />}>
            Потребители
          </AdminNavItem>
          <AdminNavItem to="/admin/departments" icon={<Building2 className="h-4 w-4" />}>
            Отдели
          </AdminNavItem>
          {isAdmin && (
            <AdminNavItem to="/admin/settings" icon={<Settings className="h-4 w-4" />}>
              Настройки
            </AdminNavItem>
          )}

          <div className="pt-3 mt-3 border-t">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                onProfileRoute
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-accent text-foreground"
              }`}
            >
              <User className="h-4 w-4" />
              <span className="flex-1 text-left">Моят профил</span>
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>

            {expanded && (
              <div className="mt-1 ml-3 pl-3 border-l space-y-0.5">
                {PROFILE_TABS.map((t) => (
                  <NavLink
                    key={t.to}
                    to={`/profile/${t.to}`}
                    end
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-1.5 text-xs rounded-md transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-accent text-foreground"
                      }`
                    }
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    <span>{t.label}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t text-xs text-muted-foreground space-y-3">
          <div>
            <div className="uppercase tracking-wide text-[10px]">Район</div>
            <div className="font-medium text-foreground truncate">
              {municipality?.["Municipality Name BG"] ?? "…"}
            </div>
          </div>
          <div>
            <div className="uppercase tracking-wide text-[10px]">Служител</div>
            <div className="font-medium text-foreground truncate">{displayName}</div>
            {baserowUser?.["User Email"] && (
              <div className="truncate">{baserowUser["User Email"]}</div>
            )}
          </div>
          <button
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
            className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Излизане
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <div className="container max-w-6xl py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function AdminNavItem({
  to,
  icon,
  children,
}: {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "hover:bg-accent text-foreground"
        }`
      }
    >
      {icon}
      <span>{children}</span>
    </NavLink>
  );
}
