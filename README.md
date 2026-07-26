# AfterCitizen | Район Триадица

Civic services platform for Sofia's Район Триадица. Citizens submit applications
online; forms are rendered dynamically from Baserow DB 265, the completed
submission is emailed to `deloviodstvo@triaditza.bg` and archived.

## Stack
- Vite + React 18 + TypeScript
- Tailwind + shadcn/ui primitives
- React Router 6, React Hook Form, TanStack Query
- Baserow (DB 265) as the schema + submission backend

## Data model
All service definitions live in Baserow. This app is a pure renderer — adding a
new service is done entirely in Baserow (no code changes needed) by linking
`Form Fields` rows to the vocabulary in `Fields`, grouping them in `Form Sections`,
and picking a `Form Template`.

See `docs/` (TBD) for the full schema reference.

## Data access and authorisation

The browser holds **no Baserow credential**. All data access goes through the
Netlify Functions in `netlify/functions/`, which keep the token server-side and
decide what each caller may see:

| Function | Session | Scope |
| --- | --- | --- |
| `public-data` | none | Reads of reference tables only — services, forms, field definitions, dictionaries. No personal data. |
| `submit` | optional | Creates a submission. Validates every field code against the form being submitted. Links to the citizen's row when signed in. |
| `me` | required | The signed-in citizen's own profile, identity documents, addresses and submissions. |
| `admin` | required + active non-Citizen role | Staff operations. |

The rule that matters, enforced in `me.mjs`:

> **The user row id always comes from the verified Auth0 token. It is never
> read from the request body.**

The previous version shipped a workspace-wide Baserow token in the bundle and
scoped per-user reads with a client-side query filter
(`filter__...__link_row_has=<userId>`). Anyone could read the token from the
page source, drop the filter, and retrieve every citizen's identity documents
and addresses. Writes now also verify that the target row belongs to the caller
before touching it, so a guessed row id cannot reach someone else's record.

Session verification currently uses the Auth0 **ID token**, because the SPA
requests no custom API audience. Registering an Auth0 API and setting
`authorizationParams.audience` in `src/App.tsx` plus `AUTH0_AUDIENCE` in the
site environment is the preferred hardening; the verification code already
accepts either.

## Local development
```bash
npm install
cp .env.example .env          # fill in the server-side values
npm run dev                   # starts on http://localhost:8080
```

Note that `npm run dev` serves the client only. To exercise the functions
locally, run `netlify dev` instead.

`npm run build` fails if a secret-shaped `VITE_` variable exists
(`scripts/check-vite-env.mjs`) or if the built bundle contains a
credential-shaped string (`scripts/scan-dist-secrets.mjs`). Anything prefixed
`VITE_` is inlined into the public bundle — see `.env.example`.

## Deployment
Netlify auto-deploys `main`. Environment variables must mirror `.env.example`.
`VITE_BASEROW_TOKEN` must be **deleted** from the site configuration, and the
old workspace-wide token revoked in Baserow — replacing the code does not
invalidate a token that is already public.

## Status
🟡 **Pilot**. 142 services · 110 forms · 2,803 form fields defined in Baserow.
3 services flagged `pending_rebuild` (specialized ОПИС inventory formats):
SI-020, UT-005-2, SI-022.
