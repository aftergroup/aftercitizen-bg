/**
 * Auth0 → Baserow user sync, mirroring the Aftergroup Command Center
 * pattern (src/docs/USER_AUTHENTICATION.md).
 *
 * After Auth0 finishes authenticating, we look up the matching row in the
 * `Users` table (2657) by `auth0_user_id`. If missing, we create it with
 * the "Citizen" role linked by default — citizens can manage their own
 * profile and submissions right away, while the staff panel remains gated
 * by `User Is Active` and a non-Citizen role (toggled by an admin from the
 * admin panel). If found, we keep email/first/last name in sync with the
 * Auth0 profile.
 *
 * Exposed as a React Context so the sync runs exactly once per session:
 * every `useUserSync()` call reads from the same provider state instead
 * of spinning up its own effect. Without this, components that call
 * `useUserSync()` would each race their own sync on mount, producing
 * "access denied" flashes for staff while a second instance caught up.
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

const DEFAULT_ROLE_NAME = "Citizen";

export interface UserSyncResult {
  isLoading: boolean;
  isSyncing: boolean;
  isAuthenticated: boolean;
  baserowUser: AdminUser | null;
  isRestricted: boolean;
}

const DEFAULT_UNAUTH_STATE: UserSyncResult = {
  isLoading: false,
  isSyncing: false,
  isAuthenticated: false,
  baserowUser: null,
  isRestricted: false,
};

const UserSyncContext = createContext<UserSyncResult | null>(null);

export function UserSyncProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth0();
  const [isSyncing, setIsSyncing] = useState(false);
  const [baserowUser, setBaserowUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.sub) {
      setBaserowUser(null);
      return;
    }

    let cancelled = false;
    setIsSyncing(true);

    (async () => {
      try {
        const existing = await baserow.findAdminUserByAuth0Id(user.sub!);

        if (existing) {
          const patch: Partial<AdminUser> = {};
          if (user.email && existing["User Email"] !== user.email) {
            patch["User Email"] = user.email;
          }
          if (user.given_name && existing["User First Name"] !== user.given_name) {
            patch["User First Name"] = user.given_name;
          }
          if (user.family_name && existing["User Last Name"] !== user.family_name) {
            patch["User Last Name"] = user.family_name;
          }

          const next = Object.keys(patch).length
            ? await baserow.updateAdminUser(existing.id, patch)
            : existing;
          if (!cancelled) setBaserowUser(next);
        } else {
          // New sign-up — default to the Citizen role so the user can
          // immediately manage their profile and their own submissions.
          // Staff promotion happens in the admin panel (role change +
          // `User Is Active` flip).
          const roles = await baserow.listUserRoles();
          const citizenRole = roles.find(
            (r) => r["User Role Name"] === DEFAULT_ROLE_NAME,
          );
          const created = await baserow.createAdminUser({
            "User Email": user.email ?? "",
            "User First Name": user.given_name ?? "",
            "User Last Name": user.family_name ?? "",
            "User Appear As": user.name ?? user.nickname ?? user.email ?? "",
            "User Username": user.nickname ?? user.email ?? "",
            "User Is Active": false,
            auth0_user_id: user.sub,
            "User Linked User Role": citizenRole
              ? [{ id: citizenRole.id, value: citizenRole["User Role Name"] }]
              : [],
          });
          if (!cancelled) setBaserowUser(created);
        }
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
  }, [
    isAuthenticated,
    user?.sub,
    user?.email,
    user?.given_name,
    user?.family_name,
    user?.name,
    user?.nickname,
  ]);

  const value = useMemo<UserSyncResult>(
    () => ({
      isLoading: isAuthLoading,
      isSyncing,
      isAuthenticated,
      baserowUser,
      isRestricted: baserowUser ? baserowUser["User Is Active"] !== true : false,
    }),
    [isAuthLoading, isSyncing, isAuthenticated, baserowUser],
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
