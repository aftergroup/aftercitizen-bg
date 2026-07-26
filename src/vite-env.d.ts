/// <reference types="vite/client" />

/**
 * Only PUBLIC configuration belongs here. Anything prefixed VITE_ is inlined
 * into the JavaScript bundle at build time and is readable by anyone who views
 * source -- so no password, token or key may ever be declared in this file.
 *
 * Baserow table ids and the Baserow token moved to the Netlify Functions in
 * netlify/functions/, which read them from non-VITE_ variables.
 */
interface ImportMetaEnv {
  readonly VITE_AUTH0_DOMAIN?: string;
  readonly VITE_AUTH0_CLIENT_ID?: string;
  readonly VITE_AUTH0_DB_CONNECTION?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
