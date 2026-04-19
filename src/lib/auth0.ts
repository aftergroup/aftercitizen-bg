/**
 * Helpers around Auth0's public database-connection endpoints. No admin
 * token is required: `/dbconnections/signup` provisions the account and
 * `/dbconnections/change_password` sends a reset link so the new user
 * picks their own password on first login. Suitable for an admin-panel
 * flow where a staffer provisions another staffer from the browser.
 */
const DOMAIN = import.meta.env.VITE_AUTH0_DOMAIN;
const CLIENT_ID = import.meta.env.VITE_AUTH0_CLIENT_ID;
const CONNECTION =
  import.meta.env.VITE_AUTH0_DB_CONNECTION ?? "Username-Password-Authentication";

function assertConfigured() {
  if (!DOMAIN || !CLIENT_ID) throw new Error("Auth0 не е конфигуриран");
}

/**
 * Sends a password-reset email through Auth0's public change_password
 * endpoint. Requires only the target user's email — no admin token. The
 * user receives a signed link to pick a new password; nothing changes
 * until they open it.
 */
export async function sendAuth0PasswordReset(email: string): Promise<void> {
  assertConfigured();
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

export interface Auth0SignupResult {
  /** Auth0 user id in the `auth0|{sub}` format that the sync hook matches on. */
  auth0UserId: string | null;
  /** True when signup was skipped because a user with this email already exists. */
  alreadyExists: boolean;
}

/**
 * Provisions a new Auth0 user in the configured database connection.
 *
 * Generates a cryptographically random throwaway password — the admin
 * never sees it and the user never needs it; we trigger a reset email
 * right after so they pick their own. Returns the Auth0 user id so the
 * caller can persist it on the Baserow row and the sync hook can match
 * on first login.
 *
 * If the email is already registered, resolves with `alreadyExists = true`
 * and a null id (we can't read the existing id from a public endpoint).
 * The caller should still create/update the Baserow row and send a reset
 * email — `useUserSync` will link them on first login via email + sub.
 */
export async function createAuth0User({
  email,
  name,
}: {
  email: string;
  name?: string;
}): Promise<Auth0SignupResult> {
  assertConfigured();
  if (!email) throw new Error("Липсва имейл");

  const res = await fetch(`https://${DOMAIN}/dbconnections/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: CLIENT_ID,
      connection: CONNECTION,
      email,
      password: generateThrowawayPassword(),
      name,
    }),
  });

  if (res.status >= 400 && res.status < 500) {
    const body = await res.json().catch(() => ({}));
    const code = body?.code ?? body?.name;
    const description: string = body?.description ?? body?.message ?? "";
    if (
      code === "invalid_signup" ||
      code === "user_exists" ||
      /already exists|invalid_signup/i.test(description)
    ) {
      return { auth0UserId: null, alreadyExists: true };
    }
    throw new Error(description || `Auth0 ${res.status}`);
  }
  if (!res.ok) throw new Error(`Auth0 ${res.status}`);

  const data = (await res.json()) as { _id?: string; id?: string };
  const id = data._id ?? data.id;
  if (!id) return { auth0UserId: null, alreadyExists: false };
  return { auth0UserId: `auth0|${id}`, alreadyExists: false };
}

function generateThrowawayPassword(): string {
  // Auth0 default policy expects a mix of categories and 8+ chars. We go
  // long and use crypto.getRandomValues so nobody can guess the throwaway
  // between signup and the user's own reset.
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  const base = Array.from(bytes)
    .map((b) => b.toString(36))
    .join("");
  return `${base}Aa9!`;
}
