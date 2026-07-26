/**
 * Bridge between the Auth0 React context and the plain `baserow` client.
 *
 * The client is a module-level object, not a hook, so it cannot call
 * `useAuth0()`. `AuthTokenBridge` registers Auth0's token getter here once and
 * the client pulls from it when a call needs a session.
 *
 * We publish the **ID token**, because the SPA does not request a custom API
 * audience and so has no verifiable access token. See
 * `netlify/functions/_shared/auth.mjs` for the matching verification, and the
 * note there about migrating to a proper API audience.
 */

type TokenGetter = () => Promise<string | null>;

let getter: TokenGetter | null = null;

export function setAuthTokenGetter(fn: TokenGetter | null) {
  getter = fn;
}

/** Resolve the current token, or null when nobody is signed in. */
export async function getAuthToken(): Promise<string | null> {
  if (!getter) return null;
  try {
    return await getter();
  } catch {
    return null;
  }
}

export class NotAuthenticatedError extends Error {
  constructor(message = 'Необходимо е вписване.') {
    super(message);
    this.name = 'NotAuthenticatedError';
  }
}

/** Resolve the current token, throwing when there is none. */
export async function requireAuthToken(): Promise<string> {
  const token = await getAuthToken();
  if (!token) throw new NotAuthenticatedError();
  return token;
}
