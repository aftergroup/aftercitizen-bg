/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BASEROW_API?: string;
  readonly VITE_BASEROW_TOKEN?: string;
  readonly VITE_BASEROW_CATEGORIES_TABLE_ID?: string;
  readonly VITE_BASEROW_MUNICIPALITIES_TABLE_ID?: string;
  readonly VITE_BASEROW_FIELD_TYPES_TABLE_ID?: string;
  readonly VITE_BASEROW_FORM_SECTIONS_TABLE_ID?: string;
  readonly VITE_BASEROW_DICTIONARIES_TABLE_ID?: string;
  readonly VITE_BASEROW_DICTIONARY_ENTRIES_TABLE_ID?: string;
  readonly VITE_BASEROW_FORM_TEMPLATES_TABLE_ID?: string;
  readonly VITE_BASEROW_FIELDS_TABLE_ID?: string;
  readonly VITE_BASEROW_SERVICES_TABLE_ID?: string;
  readonly VITE_BASEROW_FORMS_TABLE_ID?: string;
  readonly VITE_BASEROW_FORM_FIELDS_TABLE_ID?: string;
  readonly VITE_BASEROW_SUBMISSIONS_TABLE_ID?: string;
  readonly VITE_BASEROW_SUBMISSION_VALUES_TABLE_ID?: string;
  readonly VITE_BASEROW_USER_ROLES_TABLE_ID?: string;
  readonly VITE_BASEROW_ADMIN_USERS_TABLE_ID?: string;
  readonly VITE_BASEROW_MUNICIPAL_DEPARTMENTS_TABLE_ID?: string;
  readonly VITE_AUTH0_DOMAIN?: string;
  readonly VITE_AUTH0_CLIENT_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
