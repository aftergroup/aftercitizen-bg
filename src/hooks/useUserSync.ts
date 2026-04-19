/**
 * Auth0 → Baserow user sync, mirroring the Aftergroup Command Center
 * pattern (src/docs/USER_AUTHENTICATION.md).
 *
 * After Auth0 finishes authenticating, we look up the matching row in the
 * staff `Users` table (2657) by `auth0_user_id`. If missing, we create it
 * with `User Is Active = false` so new staff start deactivated and must be
 * approved by an existing admin in Baserow before they can see the panel.
 * If found, we keep first/last name + email in sync with the Auth0 profile.
 */
import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { baserow } from "@/lib/baserow";
import type { AdminUser } from "@/lib/types";

export interface UserSyncResult {
  isLoading: boolean;
  isSyncing: boolean;
  isAuthenticated: boolean;
  baserowUser: AdminUser | null;
  isRestricted: boolean;
}

export function useUserSync(): UserSyncResult {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth0();
  const [isSyncing, setIsSyncing] = useState(false);
  const [baserowUser, setBaserowUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.sub) return;

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
          // New staff member — created deactivated so an existing admin has
          // to flip `User Is Active` in Baserow before granting access.
          const created = await baserow.createAdminUser({
            "User Email": user.email ?? "",
            "User First Name": user.given_name ?? "",
            "User Last Name": user.family_name ?? "",
            "User Appear As": user.name ?? user.nickname ?? user.email ?? "",
            "User Username": user.nickname ?? user.email ?? "",
            "User Is Active": false,
            auth0_user_id: user.sub,
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
  }, [isAuthenticated, user?.sub, user?.email, user?.given_name, user?.family_name, user?.name, user?.nickname]);

  return {
    isLoading: isAuthLoading,
    isSyncing,
    isAuthenticated,
    baserowUser,
    isRestricted: baserowUser ? baserowUser["User Is Active"] !== true : false,
  };
}
