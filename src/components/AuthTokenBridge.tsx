import { useEffect } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { setAuthTokenGetter } from "@/lib/authToken";

/**
 * Publishes Auth0's ID token to the `baserow` client, which uses it to
 * authenticate calls to the `me` and `admin` Netlify Functions.
 *
 * Must be rendered inside <Auth0Provider>. Renders nothing.
 */
export function AuthTokenBridge() {
  const { getIdTokenClaims, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (!isAuthenticated) {
      setAuthTokenGetter(null);
      return;
    }

    setAuthTokenGetter(async () => {
      const claims = await getIdTokenClaims();
      return claims?.__raw ?? null;
    });

    return () => setAuthTokenGetter(null);
  }, [getIdTokenClaims, isAuthenticated]);

  return null;
}
