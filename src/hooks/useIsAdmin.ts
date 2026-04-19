/**
 * Role-based gates for the high-privilege corner of the admin panel.
 *
 * `isAdmin` covers Administrator + Super Administrator (edit settings,
 * manage staff, etc). `isSuperAdmin` is the narrower flag used to hide
 * the Super Administrator role and super-admin users from everyone
 * else — non-super admins shouldn't see or assign that tier.
 */
import { useUserSync } from "./useUserSync";

export const SUPER_ADMIN_ROLE_NAME = "Super Administrator";
const ADMIN_ROLE_NAMES = new Set(["Administrator", SUPER_ADMIN_ROLE_NAME]);

export function useIsAdmin(): {
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
} {
  const { baserowUser, isLoading, isSyncing, isAuthenticated } = useUserSync();
  const role = baserowUser?.["User Linked User Role"]?.[0]?.value ?? "";
  // When Auth0 has resolved but the provider hasn't produced a synced
  // row yet (first tick before `setIsSyncing(true)` is applied), treat
  // the session as still loading so we don't flash "access denied".
  const stillResolving = isAuthenticated && !baserowUser;
  return {
    isAdmin: ADMIN_ROLE_NAMES.has(role),
    isSuperAdmin: role === SUPER_ADMIN_ROLE_NAME,
    isLoading: isLoading || isSyncing || stillResolving,
  };
}
