import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useUserSync } from "@/hooks/useUserSync";

/**
 * Gate for admin pages. Shows four distinct states:
 *  - Auth0 still resolving  → loading shell
 *  - Not authenticated      → trigger Auth0 Universal Login
 *  - Authenticated, syncing → loading shell
 *  - Authenticated, synced, but `User Is Active` is false  → "awaiting approval"
 *  - Authenticated + active → render children
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!import.meta.env.VITE_AUTH0_DOMAIN || !import.meta.env.VITE_AUTH0_CLIENT_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md bg-white border rounded-lg p-6 text-sm space-y-2">
          <div className="font-semibold text-destructive">Auth0 не е конфигуриран</div>
          <div className="text-muted-foreground">
            Добавете <code>VITE_AUTH0_DOMAIN</code> и <code>VITE_AUTH0_CLIENT_ID</code> в .env,
            за да активирате админ панела.
          </div>
        </div>
      </div>
    );
  }
  return <ProtectedRouteInner>{children}</ProtectedRouteInner>;
}

function ProtectedRouteInner({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, loginWithRedirect, logout } = useAuth0();
  const { isSyncing, baserowUser, isRestricted } = useUserSync();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: window.location.pathname } });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  if (isLoading || !isAuthenticated || isSyncing || !baserowUser) {
    return <LoadingShell label={isSyncing ? "Синхронизация на профила…" : "Зареждане…"} />;
  }

  if (isRestricted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-6">
        <div className="max-w-md w-full bg-white border rounded-lg p-6 space-y-4">
          <h1 className="text-xl font-semibold">Акаунтът е в очакване на одобрение</h1>
          <p className="text-sm text-muted-foreground">
            Вашият профил е регистриран, но все още не е активиран от администратор на района.
            Моля, свържете се с администратора или опитайте отново по-късно.
          </p>
          <button
            onClick={() =>
              logout({ logoutParams: { returnTo: window.location.origin } })
            }
            className="text-sm text-primary hover:underline"
          >
            Излизане
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function LoadingShell({ label }: { label: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30">
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}
