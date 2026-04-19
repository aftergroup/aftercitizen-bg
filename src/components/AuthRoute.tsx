/**
 * Lighter sibling of ProtectedRoute. Anyone authenticated through Auth0
 * can pass through — no `User Is Active` check, no role check. Used for
 * the universal /profile page where citizens manage their own account
 * even before an admin has activated them for the staff panel.
 */
import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useUserSync } from "@/hooks/useUserSync";

export function AuthRoute({ children }: { children: React.ReactNode }) {
  if (!import.meta.env.VITE_AUTH0_DOMAIN || !import.meta.env.VITE_AUTH0_CLIENT_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md bg-white border rounded-lg p-6 text-sm space-y-2">
          <div className="font-semibold text-destructive">Auth0 не е конфигуриран</div>
          <div className="text-muted-foreground">
            Добавете <code>VITE_AUTH0_DOMAIN</code> и <code>VITE_AUTH0_CLIENT_ID</code> в .env.
          </div>
        </div>
      </div>
    );
  }
  return <AuthRouteInner>{children}</AuthRouteInner>;
}

function AuthRouteInner({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, loginWithRedirect } = useAuth0();
  const { isSyncing, baserowUser } = useUserSync();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: window.location.pathname } });
    }
  }, [isLoading, isAuthenticated, loginWithRedirect]);

  if (isLoading || !isAuthenticated || isSyncing || !baserowUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="text-sm text-muted-foreground">
          {isSyncing ? "Синхронизация на профила…" : "Зареждане…"}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
