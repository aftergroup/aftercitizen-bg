/**
 * Small helpers around Auth0's public endpoints. We only need the
 * unauthenticated `/dbconnections/change_password` call today — admins
 * trigger it from the user edit drawer and citizens trigger it from
 * their own profile. If more Auth0 interactions arrive, extend here.
 */
const DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN;
const CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID;
const CONNECTION =
  import.meta.env.VITE_AUTH0_DB_CONNECTION ?? "Username-Password-Authentication";

/**
 * Sends a password-reset email through Auth0's public change_password
 * endpoint. Requires only the target user's email — no admin token. The
 * user receives a signed link to pick a new password; nothing changes
 * until they open it.
 */
export async function sendAuth0PasswordReset(email: string): Promise<void> {
  if (!DOMAIN || !CLIENT_ID) throw new Error("Auth0 не е конфигуриран");
  if (!email) throw new Error("Липсва имейл");
  const res = await fetch(`https://${DOMAIN}/dbconnections/change_password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      email,
      connection: CONNECTION,
    }),
  });
  if (!res.ok) throw new Error(`Auth0 ${res.status}`);
}
