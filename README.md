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

## Local development
```bash
npm install
cp .env.example .env          # fill in VITE_BASEROW_TOKEN
npm run dev                   # starts on http://localhost:8080
```

## Deployment
Netlify auto-deploys `main`. Env vars must mirror `.env.example` plus a
production `VITE_BASEROW_TOKEN` scoped to DB 265.

## Status
🟡 **Pilot**. 142 services · 110 forms · 2,803 form fields defined in Baserow.
3 services flagged `pending_rebuild` (specialized ОПИС inventory formats):
SI-020, UT-005-2, SI-022.
