import { Routes, Route, Link, Outlet } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ServicesList from "./pages/ServicesList";
import FormPage from "./pages/FormPage";

function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold">
              АЦ
            </div>
            <div>
              <div className="font-semibold leading-none">AfterCitizen</div>
              <div className="text-xs text-muted-foreground">Район Триадица</div>
            </div>
          </Link>
          <nav className="flex gap-6 text-sm">
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
        </div>
      </header>

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
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="services" element={<ServicesList />} />
        <Route path="forms/:formCode" element={<FormPage />} />
      </Route>
    </Routes>
  );
}
