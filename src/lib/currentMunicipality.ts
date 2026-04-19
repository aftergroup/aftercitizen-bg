/**
 * Placeholder for "which municipality is the signed-in staff user scoped to".
 *
 * Admin pages read this to filter Submissions / Users / Departments to
 * the staff member's own district. Until Auth0 + the staff-user → municipality
 * lookup is wired, this returns Район Триадица (row id 3) so the admin UI
 * is usable end-to-end against the current single-tenant data.
 *
 * When Auth0 lands: replace the body of this hook with a lookup from the
 * Auth0 `sub` claim → Users (2657) row → that row's linked municipality.
 * Every page calling `useCurrentMunicipality()` stays untouched.
 */
import { useQuery } from "@tanstack/react-query";
import { baserow } from "./baserow";
import type { Municipality } from "./types";

const PLACEHOLDER_MUNICIPALITY_ID = 3; // Район Триадица

export function useCurrentMunicipality(): {
  municipalityId: number;
  municipality: Municipality | undefined;
  isLoading: boolean;
} {
  const { data, isLoading } = useQuery({
    queryKey: ["municipalities"],
    queryFn: () => baserow.listMunicipalities(),
    staleTime: 60 * 60 * 1000,
  });
  const municipality = data?.find((m) => m.id === PLACEHOLDER_MUNICIPALITY_ID);
  return { municipalityId: PLACEHOLDER_MUNICIPALITY_ID, municipality, isLoading };
}
