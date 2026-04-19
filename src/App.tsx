import { useEffect, useState } from "react";
import { Routes, Route, Link, Navigate, Outlet, useNavigate } from "react-router-dom";
import { Auth0Provider, type AppState } from "@auth0/auth0-react";
import { useQuery } from "@tanstack/react-query";
import { Menu, X } from "lucide-react";
import HomePage from "./pages/HomePage";
import ServicesList from "./pages/ServicesList";
import FormPage from "./pages/FormPage";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import AdminSubmissionDetail from "./pages/admin/AdminSubmissionDetail";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDepartments from "./pages/admin/AdminDepartments";
import AdminForms from "./pages/admin/AdminForms";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { baserow } from "./lib/baserow";

const AUTH0_DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID;

function Auth0ProviderWithNavigate({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  // Citizen-facing pages don't need Auth0; only /admin does. If env vars
  // aren't set, render children bare — ProtectedRoute will surface the
  // missing-config error when a staff user tries to reach /admin.
  if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID) return <>{children}</>;

  const onRedirectCallback = (appState?: AppState) => {
    navigate(appState?.returnTo || window.location.pathname);
  };

  return (
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin + "/admin",
        scope: "openid profile email",
      }}
      onRedirectCallback={onRedirectCallback}
      cacheLocation="localstorage"
      useRefreshTokens={true}
    >
      {children}
    </Auth0Provider>
  );
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: () => baserow.listCategories(),
  });

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      className={`md:hidden fixed inset-0 z-50 ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity ${
          open ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      />
      <aside
        className={`absolute top-0 right-0 h-full w-4/5 max-w-sm bg-white shadow-xl flex flex-col transform transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
              АЦ
            </div>
            <div>
              <div className="font-semibold leading-none">AfterCitizen</div>
              <div className="text-xs text-muted-foreground">Район Триадица</div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Затвори менюто"
            className="p-2 -mr-2 rounded hover:bg-accent"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          <Link
            to="/services"
            onClick={onClose}
            className="block px-4 py-3 text-sm font-medium hover:bg-accent"
          >
            Всички услуги
          </Link>

          {categories && categories.length > 0 && (
            <>
              <div className="px-4 pt-4 pb-1 text-xs uppercase tracking-wide text-muted-foreground">
                Категории
              </div>
              {categories
                .slice()
                .sort((a, b) => (a["Category Order"] ?? 0) - (b["Category Order"] ?? 0))
                .map((c) => (
                  <Link
                    key={c.id}
                    to={`/services?category=${c["Category Code"]}`}
                    onClick={onClose}
                    className="block px-4 py-2.5 text-sm hover:bg-accent"
                  >
                    <span className="text-primary font-medium">{c["Category Code"]}</span>
                    <span className="mx-2 text-muted-foreground">·</span>
                    {c["Category Name BG"]}
                  </Link>
                ))}
            </>
          )}
        </nav>

        <div className="border-t p-4 text-xs text-muted-foreground space-y-2">
          <a
            href="https://triaditza.org"
            target="_blank"
            rel="noopener"
            className="block hover:text-primary"
          >
            Район Триадица →
          </a>
          <a
            href="mailto:deloviodstvo@triaditza.bg"
            className="block hover:text-primary"
          >
            deloviodstvo@triaditza.bg
          </a>
        </div>
      </aside>
    </div>
  );
}

function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Close the drawer when the viewport grows past the md breakpoint —
  // otherwise the body-scroll lock stays on after the drawer becomes hidden.
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (mql.matches) setMenuOpen(false);
    };
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold flex-shrink-0">
              АЦ
            </div>
            <div className="min-w-0">
              <div className="font-semibold leading-none truncate">AfterCitizen</div>
              <div className="text-xs text-muted-foreground truncate">Район Триадица</div>
            </div>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm">
            <Link to="/services" className="hover:text-primary transition-colors">
              Всички услуги
            </Link>
            <a
              href="https://triaditza.org"
              target="_blank"
              rel="noopener"
              className="hover:text-primary transition-colors"
            >
              Район Триадица
            </a>
          </nav>
          <button
            onClick={() => setMenuOpen(true)}
            aria-label="Отвори менюто"
            className="md:hidden p-2 -mr-2 rounded hover:bg-accent"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t bg-white mt-auto">
        <div className="container py-6 text-sm text-muted-foreground flex flex-col md:flex-row justify-between gap-2">
          <div>© 2026 AfterCitizen. Платформа за електронни услуги.</div>
          <div>
            Данните се подават към{" "}
            <a href="mailto:deloviodstvo@triaditza.bg" className="text-primary hover:underline">
              deloviodstvo@triaditza.bg
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Auth0ProviderWithNavigate>
      <AppRoutes />
    </Auth0ProviderWithNavigate>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="services" element={<ServicesList />} />
        <Route path="forms/:formCode" element={<FormPage />} />
      </Route>

      <Route
        path="admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="submissions" replace />} />
        <Route path="submissions" element={<AdminSubmissions />} />
        <Route path="submissions/:id" element={<AdminSubmissionDetail />} />
        <Route path="forms" element={<AdminForms />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="departments" element={<AdminDepartments />} />
      </Route>
    </Routes>
  );
}
