/**
 * Role-based gate for the high-privilege corner of the admin panel.
 *
 * Only "Administrator" and "Super Administrator" roles can edit
 * application-wide settings; every other staff role (Mayor, Employee,
 * Chief Architect, …) has read-only access across the rest of the panel
 * but should not see settings at all.
 *
 * Used both to hide the Settings nav item and to guard the route itself.
 */
import { useUserSync } from "./useUserSync";

const ADMIN_ROLE_NAMES = new Set(["Administrator", "Super Administrator"]);

export function useIsAdmin(): { isAdmin: boolean; isLoading: boolean } {
  const { baserowUser, isLoading, isSyncing } = useUserSync();
  const role = baserowUser?.["User Linked User Role"]?.[0]?.value ?? "";
  return {
    isAdmin: ADMIN_ROLE_NAMES.has(role),
    isLoading: isLoading || isSyncing,
  };
}
