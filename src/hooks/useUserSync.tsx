/**
 * Auth0 → Baserow user sync.
 *
 * The find-or-create, the email backfill and the profile-field sync all now
 * happen server-side in `netlify/functions/me.mjs` (see `resolveUser` in
 * `_shared/session.mjs`), driven by the verified token rather than by values
 * the browser supplies. This hook just fetches the result.
 *
 * That move is the point of the change: the previous version performed the
 * lookup from the browser using a workspace-wide Baserow token, which meant
 * the token — and therefore every citizen's record — was reachable by anyone
 * who viewed source.
 *
 * Exposed as a React Context so the fetch runs exactly once per session:
 * every `useUserSync()` call reads from the same provider state instead
 * of spinning up its own effect.
 */
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { baserow } from "@/lib/baserow";
import type { AdminUser } from "@/lib/types";

export interface UserSyncResult {
  isLoading: boolean;
  isSyncing: boolean;
  isAuthenticated: boolean;
  baserowUser: AdminUser | null;
  /** Role name of the signed-in user, resolved server-side. */
  roleName: string;
  isRestricted: boolean;
}

const DEFAULT_UNAUTH_STATE: UserSyncResult = {
  isLoading: false,
  isSyncing: false,
  isAuthenticated: false,
  baserowUser: null,
  roleName: "",
  isRestricted: false,
};

const UserSyncContext = createContext<UserSyncResult | null>(null);

export function UserSyncProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth0();
  const [isSyncing, setIsSyncing] = useState(false);
  const [baserowUser, setBaserowUser] = useState<AdminUser | null>(null);
  const [roleName, setRoleName] = useState("");

  useEffect(() => {
    if (!isAuthenticated || !user?.sub) {
      setBaserowUser(null);
      setRoleName("");
      return;
    }

    let cancelled = false;
    setIsSyncing(true);

    (async () => {
      try {
        const profile = await baserow.getProfile();
        if (cancelled) return;
        setBaserowUser(profile.user);
        setRoleName(profile.roleName ?? "");
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("User sync failed:", err);
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, user?.sub]);

  const value = useMemo<UserSyncResult>(
    () => ({
      isLoading: isAuthLoading,
      isSyncing,
      isAuthenticated,
      baserowUser,
      roleName,
      isRestricted: baserowUser ? baserowUser["User Is Active"] !== true : false,
    }),
    [isAuthLoading, isSyncing, isAuthenticated, baserowUser, roleName]
  );

  return <UserSyncContext.Provider value={value}>{children}</UserSyncContext.Provider>;
}

/**
 * Read the synced user from context. Returns a safe "unauthenticated"
 * default when called outside the provider (e.g. on citizen-facing pages
 * that don't mount Auth0) so components stay tolerant of both modes.
 */
export function useUserSync(): UserSyncResult {
  return useContext(UserSyncContext) ?? DEFAULT_UNAUTH_STATE;
}
