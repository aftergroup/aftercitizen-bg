/**
 * Baserow API client for AfterCitizen.
 *
 * Reads from DB 265 ("AfterCitizen | Triaditza") on db2.aftergroup.org.
 * All calls use `?user_field_names=true` so responses match the types in types.ts.
 */

import type {
  Category, Municipality, Service, Form, FieldDef, FieldType, Section,
  Dictionary, DictionaryEntry, FormField, RenderedForm, RenderedField,
  AdminUser, UserRole, Submission, MunicipalDepartment, MunicipalUnitType,
  Country, Currency, IdentityDocument, Address, Settings,
} from "./types";

const API = import.meta.env.VITE_BASEROW_API ?? "https://db2.aftergroup.org";
const TOKEN = import.meta.env.VITE_BASEROW_TOKEN ?? "";

const T = {
  categories: Number(import.meta.env.VITE_BASEROW_CATEGORIES_TABLE_ID ?? 2631),
  municipalities: Number(import.meta.env.VITE_BASEROW_MUNICIPALITIES_TABLE_ID ?? 2632),
  fieldTypes: Number(import.meta.env.VITE_BASEROW_FIELD_TYPES_TABLE_ID ?? 2634),
  sections: Number(import.meta.env.VITE_BASEROW_FORM_SECTIONS_TABLE_ID ?? 2635),
  dictionaries: Number(import.meta.env.VITE_BASEROW_DICTIONARIES_TABLE_ID ?? 2636),
  dictionaryEntries: Number(import.meta.env.VITE_BASEROW_DICTIONARY_ENTRIES_TABLE_ID ?? 2637),
  templates: Number(import.meta.env.VITE_BASEROW_FORM_TEMPLATES_TABLE_ID ?? 2638),
  fields: Number(import.meta.env.VITE_BASEROW_FIELDS_TABLE_ID ?? 2639),
  services: Number(import.meta.env.VITE_BASEROW_SERVICES_TABLE_ID ?? 2640),
  forms: Number(import.meta.env.VITE_BASEROW_FORMS_TABLE_ID ?? 2643),
  formFields: Number(import.meta.env.VITE_BASEROW_FORM_FIELDS_TABLE_ID ?? 2645),
  submissions: Number(import.meta.env.VITE_BASEROW_SUBMISSIONS_TABLE_ID ?? 2647),
  submissionValues: Number(import.meta.env.VITE_BASEROW_SUBMISSION_VALUES_TABLE_ID ?? 2648),
  userRoles: Number(import.meta.env.VITE_BASEROW_USER_ROLES_TABLE_ID ?? 2655),
  adminUsers: Number(import.meta.env.VITE_BASEROW_ADMIN_USERS_TABLE_ID ?? 2657),
  municipalDepartments: Number(import.meta.env.VITE_BASEROW_MUNICIPAL_DEPARTMENTS_TABLE_ID ?? 2658),
  municipalUnitTypes: Number(import.meta.env.VITE_BASEROW_MUNICIPAL_UNIT_TYPES_TABLE_ID ?? 2656),
  identityDocuments: Number(import.meta.env.VITE_BASEROW_IDENTITY_DOCUMENTS_TABLE_ID ?? 2659),
  addresses: Number(import.meta.env.VITE_BASEROW_ADDRESSES_TABLE_ID ?? 2660),
  countries: Number(import.meta.env.VITE_BASEROW_COUNTRIES_TABLE_ID ?? 2654),
  currencies: Number(import.meta.env.VITE_BASEROW_CURRENCIES_TABLE_ID ?? 2653),
  settings: Number(import.meta.env.VITE_BASEROW_SETTINGS_TABLE_ID ?? 2663),
};

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (TOKEN) headers.Authorization = `Token ${TOKEN}`;
  return headers;
}

async function createRow<T>(tableId: number, payload: Partial<T>): Promise<T> {
  const res = await fetch(
    `${API}/api/database/rows/table/${tableId}/?user_field_names=true`,
    { method: "POST", headers: authHeaders(), body: JSON.stringify(payload) },
  );
  if (!res.ok) throw new Error(`Baserow ${tableId} create failed: ${res.status}`);
  return (await res.json()) as T;
}

async function updateRow<T>(tableId: number, id: number, patch: Partial<T>): Promise<T> {
  const res = await fetch(
    `${API}/api/database/rows/table/${tableId}/${id}/?user_field_names=true`,
    { method: "PATCH", headers: authHeaders(), body: JSON.stringify(patch) },
  );
  if (!res.ok) throw new Error(`Baserow ${tableId} update failed: ${res.status}`);
  return (await res.json()) as T;
}

async function deleteRow(tableId: number, id: number): Promise<void> {
  const res = await fetch(`${API}/api/database/rows/table/${tableId}/${id}/`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    throw new Error(`Baserow ${tableId} delete failed: ${res.status}`);
  }
}

async function list<T>(tableId: number, params: Record<string, string | number> = {}): Promise<T[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (TOKEN) headers.Authorization = `Token ${TOKEN}`;

  const all: T[] = [];
  let page = 1;
  while (true) {
    const qs = new URLSearchParams({
      user_field_names: "true",
      size: "200",
      page: String(page),
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    });
    const res = await fetch(`${API}/api/database/rows/table/${tableId}/?${qs}`, { headers });
    if (!res.ok) throw new Error(`Baserow ${tableId} fetch failed: ${res.status}`);
    const data = await res.json();
    all.push(...data.results);
    if (!data.next) break;
    page += 1;
    if (page > 20) break; // safety cap
  }
  return all;
}

export interface ReferenceData {
  fields: FieldDef[];
  types: FieldType[];
  sections: Section[];
  dicts: Dictionary[];
  entries: DictionaryEntry[];
  municipalities: Municipality[];
}

export const baserow = {
  listCategories: () => list<Category>(T.categories),
  listMunicipalities: () => list<Municipality>(T.municipalities),
  listServices: () => list<Service>(T.services),
  listForms: () => list<Form>(T.forms),

  // --- Admin-side -------------------------------------------------
  listAdminUsers: () => list<AdminUser>(T.adminUsers),
  listUserRoles: () => list<UserRole>(T.userRoles),
  listMunicipalDepartments: () => list<MunicipalDepartment>(T.municipalDepartments),
  listMunicipalUnitTypes: () => list<MunicipalUnitType>(T.municipalUnitTypes),

  /**
   * Look up the staff user row whose `auth0_user_id` matches the Auth0
   * subject. Uses Baserow's `search` first to narrow the result set, then
   * filters on the exact field client-side (search matches across fields).
   */
  async findAdminUserByAuth0Id(auth0Id: string): Promise<AdminUser | null> {
    const rows = await list<AdminUser>(T.adminUsers, { search: auth0Id });
    return rows.find((u) => u.auth0_user_id === auth0Id) ?? null;
  },

  /**
   * Look up the staff user row by email (case-insensitive). Used as a
   * fallback when no row matches the Auth0 sub — covers the case where
   * an admin provisioned the row before the employee first signed in
   * and Auth0 already had an account for that email.
   */
  async findAdminUserByEmail(email: string): Promise<AdminUser | null> {
    const normalized = email.toLowerCase();
    const rows = await list<AdminUser>(T.adminUsers, { search: email });
    return (
      rows.find((u) => (u["User Email"] ?? "").toLowerCase() === normalized) ??
      null
    );
  },

  createAdminUser: (payload: Partial<AdminUser>) => createRow<AdminUser>(T.adminUsers, payload),
  updateAdminUser: (id: number, patch: Partial<AdminUser>) =>
    updateRow<AdminUser>(T.adminUsers, id, patch),
  deleteAdminUser: (id: number) => deleteRow(T.adminUsers, id),

  createUserRole: (payload: Partial<UserRole>) => createRow<UserRole>(T.userRoles, payload),
  updateUserRole: (id: number, patch: Partial<UserRole>) =>
    updateRow<UserRole>(T.userRoles, id, patch),
  deleteUserRole: (id: number) => deleteRow(T.userRoles, id),

  createMunicipalDepartment: (payload: Partial<MunicipalDepartment>) =>
    createRow<MunicipalDepartment>(T.municipalDepartments, payload),
  updateMunicipalDepartment: (id: number, patch: Partial<MunicipalDepartment>) =>
    updateRow<MunicipalDepartment>(T.municipalDepartments, id, patch),
  deleteMunicipalDepartment: (id: number) => deleteRow(T.municipalDepartments, id),

  /** List forms scoped to a municipality (or all if id is omitted). */
  listFormsForMunicipality(municipalityId?: number) {
    const params: Record<string, string | number> = {};
    if (municipalityId) {
      params["filter__Form Linked Municipality__link_row_has"] = municipalityId;
    }
    return list<Form>(T.forms, params);
  },

  createForm: (payload: Partial<Form>) => createRow<Form>(T.forms, payload),
  updateForm: (id: number, patch: Partial<Form>) => updateRow<Form>(T.forms, id, patch),
  deleteForm: (id: number) => deleteRow(T.forms, id),

  /**
   * List submissions scoped to a single municipality. Uses Baserow's
   * server-side link-row filter so we only transfer rows the caller
   * is actually allowed to see, instead of filtering client-side.
   */
  listSubmissions(municipalityId: number) {
    return list<Submission>(T.submissions, {
      "filter__Submission Linked Municipality__link_row_has": municipalityId,
    });
  },

  /**
   * List submissions filed by a specific citizen. Used by the `/profile`
   * "my submissions" tab — Citizens see only their own rows, enforced by
   * the server-side `link_row_has` filter on `Submission Linked User`.
   */
  listSubmissionsForUser(userId: number) {
    return list<Submission>(T.submissions, {
      "filter__Submission Linked User__link_row_has": userId,
    });
  },

  async getSubmission(id: number): Promise<Submission | null> {
    const res = await fetch(
      `${API}/api/database/rows/table/${T.submissions}/${id}/?user_field_names=true`,
      { headers: authHeaders() },
    );
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Submission ${id} fetch failed: ${res.status}`);
    return (await res.json()) as Submission;
  },

  updateSubmission: (id: number, patch: Partial<Submission>) =>
    updateRow<Submission>(T.submissions, id, patch),
  deleteSubmission: (id: number) => deleteRow(T.submissions, id),

  // --- Profile (per-user) sub-tables ------------------------------
  listCountries: () => list<Country>(T.countries),

  listIdentityDocumentsForUser: (userId: number) =>
    list<IdentityDocument>(T.identityDocuments, {
      "filter__Identity Document Linked User__link_row_has": userId,
    }),
  createIdentityDocument: (payload: Partial<IdentityDocument>) =>
    createRow<IdentityDocument>(T.identityDocuments, payload),
  updateIdentityDocument: (id: number, patch: Partial<IdentityDocument>) =>
    updateRow<IdentityDocument>(T.identityDocuments, id, patch),
  deleteIdentityDocument: (id: number) => deleteRow(T.identityDocuments, id),

  listAddressesForUser: (userId: number) =>
    list<Address>(T.addresses, {
      "filter__Address Linked User__link_row_has": userId,
    }),
  createAddress: (payload: Partial<Address>) => createRow<Address>(T.addresses, payload),
  updateAddress: (id: number, patch: Partial<Address>) =>
    updateRow<Address>(T.addresses, id, patch),
  deleteAddress: (id: number) => deleteRow(T.addresses, id),

  // --- Application settings (singleton row in table 2663) ----------
  listCurrencies: () => list<Currency>(T.currencies),

  /**
   * Fetch the first (singleton) row from the Settings table. Returns null
   * if the table is empty — the admin UI should surface this as a first-run
   * state rather than a hard error.
   */
  async getSettings(): Promise<Settings | null> {
    const rows = await list<Settings>(T.settings, { size: 1 });
    return rows[0] ?? null;
  },

  updateSettings: (id: number, patch: Partial<Settings>) =>
    updateRow<Settings>(T.settings, id, patch),

  listFields: () => list<FieldDef>(T.fields),
  listFieldTypes: () => list<FieldType>(T.fieldTypes),
  listSections: () => list<Section>(T.sections),
  listDictionaries: () => list<Dictionary>(T.dictionaries),
  listDictionaryEntries: () => list<DictionaryEntry>(T.dictionaryEntries),

  /**
   * Fetch all reference tables in parallel. These are small, stable, form-agnostic
   * lookups — callers should cache the result aggressively (staleTime of an hour+).
   */
  async getReferenceData(): Promise<ReferenceData> {
    const [fields, types, sections, dicts, entries, municipalities] = await Promise.all([
      baserow.listFields(),
      baserow.listFieldTypes(),
      baserow.listSections(),
      baserow.listDictionaries(),
      baserow.listDictionaryEntries(),
      baserow.listMunicipalities(),
    ]);
    return { fields, types, sections, dicts, entries, municipalities };
  },

  /**
   * Pull just the FormFields that belong to a specific form. Uses Baserow's
   * server-side link-row filter so we fetch ~20 rows instead of all ~2,800.
   */
  listFormFieldsForForm(formId: number): Promise<FormField[]> {
    return list<FormField>(T.formFields, {
      "filter__Form Field Linked Form__link_row_has": formId,
    });
  },

  async getServiceByCode(code: string): Promise<Service | null> {
    const rows = await list<Service>(T.services, { search: code });
    return rows.find((r) => r["Service Code"] === code) ?? null;
  },

  async getFormByCode(code: string): Promise<Form | null> {
    const rows = await list<Form>(T.forms, { search: code });
    return rows.find((r) => r["Form Code"] === code) ?? null;
  },

  /**
   * Pure join: stitch pre-fetched reference data + form-specific rows into
   * the render-ready schema. Split out so the data-fetching layer (tanstack-query)
   * can cache each piece independently.
   */
  buildRenderedForm(
    form: Form,
    formFields: FormField[],
    reference: ReferenceData,
    service?: Service,
  ): RenderedForm {
    const { fields, types, sections, dicts, entries, municipalities } = reference;

    const municipalityId = service?.["Service Linked Municipality"]?.[0]?.id;
    const municipality = municipalityId
      ? municipalities.find((m) => m.id === municipalityId)
      : undefined;

    const fieldsById = new Map(fields.map((f) => [f.id, f]));
    const typesById = new Map(types.map((t) => [t.id, t]));
    const sectionsById = new Map(sections.map((s) => [s.id, s]));
    const dictById = new Map(dicts.map((d) => [d.id, d]));
    const entriesByDictId = new Map<number, DictionaryEntry[]>();
    for (const e of entries) {
      const dictId = e["Entry Linked Dictionary"]?.[0]?.id;
      if (!dictId) continue;
      if (!entriesByDictId.has(dictId)) entriesByDictId.set(dictId, []);
      entriesByDictId.get(dictId)!.push(e);
    }

    const formFormFields = [...formFields].sort(
      (a, b) => Number(a["Form Field Order"]) - Number(b["Form Field Order"])
    );

    const rendered: RenderedField[] = [];
    for (const ff of formFormFields) {
      const fieldRef = ff["Form Field Linked Field"]?.[0];
      const sectionRef = ff["Form Field Linked Section"]?.[0];
      if (!fieldRef || !sectionRef) continue;

      const field = fieldsById.get(fieldRef.id);
      const section = sectionsById.get(sectionRef.id);
      if (!field || !section) continue;

      const typeRef = field["Field Linked Type"]?.[0];
      const type = typeRef ? typesById.get(typeRef.id) : undefined;

      let dictionary: RenderedField["dictionary"];
      const dictRef = field["Field Linked Dictionary"]?.[0];
      if (dictRef) {
        const dict = dictById.get(dictRef.id);
        const dictEntries = entriesByDictId.get(dictRef.id) ?? [];
        if (dict) {
          dictionary = {
            code: dict["Dictionary Code"],
            entries: dictEntries
              .sort((a, b) => (a["Entry Order"] ?? 0) - (b["Entry Order"] ?? 0))
              .map((e) => ({ key: e["Entry Key"], labelBg: e["Entry Label BG"] })),
          };
        }
      }

      rendered.push({
        formFieldId: ff.id,
        order: Number(ff["Form Field Order"]),
        code: field["Field Code"],
        labelBg: ff["Form Field Label Override BG"] || field["Field Label BG"],
        helpBg: ff["Form Field Help Override BG"] || field["Field Help BG"],
        typeCode: type?.["Field Type Code"] ?? "text",
        htmlInput: type?.["Field Type HTML Input"] ?? "text",
        required: !!ff["Form Field Required"],
        defaultValue: ff["Form Field Default Value"] ?? undefined,
        dictionary,
        sectionCode: section["Section Code"],
        sectionNameBg: section["Section Name BG"],
      });
    }

    // Group by section, preserving the order the section first appears in.
    const sectionOrderByCode = new Map<string, { nameBg: string; firstSeen: number }>();
    rendered.forEach((r, i) => {
      if (!sectionOrderByCode.has(r.sectionCode)) {
        sectionOrderByCode.set(r.sectionCode, { nameBg: r.sectionNameBg, firstSeen: i });
      }
    });
    const sectionsOrdered = [...sectionOrderByCode.entries()]
      .sort((a, b) => a[1].firstSeen - b[1].firstSeen)
      .map(([code, meta]) => ({
        code,
        nameBg: meta.nameBg,
        fields: rendered.filter((r) => r.sectionCode === code),
      }));

    return { form, service, municipality, sections: sectionsOrdered };
  },

  /**
   * Convenience one-shot fetcher — kept for callers that don't need
   * the fine-grained cache the split fetchers enable.
   */
  async getRenderedForm(formCode: string): Promise<RenderedForm | null> {
    const [form, service, reference] = await Promise.all([
      baserow.getFormByCode(formCode),
      baserow.getServiceByCode(formCode),
      baserow.getReferenceData(),
    ]);
    if (!form) return null;
    const formFields = await baserow.listFormFieldsForForm(form.id);
    return baserow.buildRenderedForm(form, formFields, reference, service ?? undefined);
  },

  /**
   * Persist a submission. Creates a Submissions row + Submission Values rows.
   * Returns the submission id so callers can pass it to the email/PDF pipeline.
   */
  async createSubmission(params: {
    formId: number;
    serviceId?: number;
    values: Record<string, string | boolean | number>;
  }): Promise<{ submissionId: number }> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (TOKEN) headers.Authorization = `Token ${TOKEN}`;

    const subRes = await fetch(
      `${API}/api/database/rows/table/${T.submissions}/?user_field_names=true`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          "Submission Linked Form": [params.formId],
          ...(params.serviceId ? { "Submission Linked Service": [params.serviceId] } : {}),
          "Submission Status": "pending",
          "Submission Created On": new Date().toISOString(),
        }),
      }
    );
    if (!subRes.ok) throw new Error(`Submission create failed: ${subRes.status}`);
    const submission = await subRes.json();
    const submissionId: number = submission.id;

    const valueRows = Object.entries(params.values).map(([code, value]) => ({
      "Value Field Code": code,
      "Value String": String(value ?? ""),
      "Value Linked Submission": [submissionId],
    }));
    if (valueRows.length > 0) {
      await fetch(
        `${API}/api/database/rows/table/${T.submissionValues}/batch/?user_field_names=true`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ items: valueRows }),
        }
      );
    }
    return { submissionId };
  },
};
