/**
 * Baserow client for AfterCitizen.
 *
 * This module holds NO Baserow credential. Every call goes to a Netlify
 * Function that keeps the token server-side and decides what the caller may
 * see:
 *
 *   public-data  anonymous reads of reference tables only (no personal data)
 *   submit       create a submission; validates field codes against the form
 *   me           the signed-in citizen's own profile, documents, addresses
 *                and submissions -- scoped server-side by the verified token
 *   admin        staff operations; requires an active, non-Citizen role
 *
 * The previous version shipped a workspace-wide token in the bundle and
 * enforced per-user scoping with client-side query filters. Anyone could read
 * the token from the page source, drop the filter, and retrieve every
 * citizen's identity documents and addresses. That scoping is now applied
 * server-side from the verified session and cannot be influenced by the
 * browser.
 *
 * The exported `baserow` surface is unchanged, so call sites did not move.
 * Methods that used to take a `userId` still accept one for compatibility, but
 * the value is ignored: the server uses the id it derives from the token.
 */

import type {
  Category, Municipality, Service, Form, FieldDef, FieldType, Section,
  Dictionary, DictionaryEntry, FormField, RenderedForm, RenderedField,
  AdminUser, UserRole, Submission, MunicipalDepartment, MunicipalUnitType,
  Country, Currency, IdentityDocument, Address, Settings,
} from "./types";
import { getAuthToken, requireAuthToken } from "./authToken";

const FUNCTIONS = "/.netlify/functions";

async function call<T>(
  endpoint: string,
  body: Record<string, unknown>,
  auth: "none" | "optional" | "required" = "none",
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (auth === "required") {
    headers.Authorization = `Bearer ${await requireAuthToken()}`;
  } else if (auth === "optional") {
    const token = await getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${FUNCTIONS}/${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.error || detail;
    } catch {
      // keep statusText
    }
    throw new Error(`${endpoint} failed (${res.status}): ${detail}`);
  }

  return (await res.json()) as T;
}

/** Anonymous read of an allowlisted reference dataset. */
async function publicList<T>(
  dataset: string,
  params?: Record<string, unknown>,
): Promise<T[]> {
  const body: Record<string, unknown> = { dataset };
  if (params) {
    body.query = dataset;
    body.params = params;
    delete body.dataset;
  }
  const data = await call<{ results: T[] }>("public-data", body);
  return data.results ?? [];
}

/** Signed-in citizen's own data. */
function me<T>(action: string, args: Record<string, unknown> = {}): Promise<T> {
  return call<T>("me", { action, ...args }, "required");
}

/** Staff-only operation. */
function admin<T>(action: string, args: Record<string, unknown> = {}): Promise<T> {
  return call<T>("admin", { action, ...args }, "required");
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
  // --- Public reference data (anonymous) ---------------------------
  listCategories: () => publicList<Category>("categories"),
  listMunicipalities: () => publicList<Municipality>("municipalities"),
  listServices: () => publicList<Service>("services"),
  listForms: () => publicList<Form>("forms"),
  listFields: () => publicList<FieldDef>("fields"),
  listFieldTypes: () => publicList<FieldType>("fieldTypes"),
  listSections: () => publicList<Section>("sections"),
  listDictionaries: () => publicList<Dictionary>("dictionaries"),
  listDictionaryEntries: () => publicList<DictionaryEntry>("dictionaryEntries"),
  listCountries: () => publicList<Country>("countries"),
  listCurrencies: () => publicList<Currency>("currencies"),

  listFormFieldsForForm: (formId: number) =>
    publicList<FormField>("formFieldsForForm", { formId }),

  async getServiceByCode(code: string): Promise<Service | null> {
    const rows = await publicList<Service>("serviceByCode", { code });
    return rows[0] ?? null;
  },

  async getFormByCode(code: string): Promise<Form | null> {
    const rows = await publicList<Form>("formByCode", { code });
    return rows[0] ?? null;
  },

  // --- Staff-side (requires an active non-Citizen role) -------------
  listAdminUsers: () => admin<{ results: AdminUser[] }>("listUsers").then((r) => r.results),
  listUserRoles: () => admin<{ results: UserRole[] }>("listUserRoles").then((r) => r.results),
  listMunicipalDepartments: () =>
    admin<{ results: MunicipalDepartment[] }>("listDepartments").then((r) => r.results),
  listMunicipalUnitTypes: () =>
    admin<{ results: MunicipalUnitType[] }>("listUnitTypes").then((r) => r.results),

  createAdminUser: (payload: Partial<AdminUser>) =>
    admin<{ row: AdminUser }>("createUser", { payload }).then((r) => r.row),
  updateAdminUser: (id: number, patch: Partial<AdminUser>) =>
    admin<{ row: AdminUser }>("updateUser", { id, patch }).then((r) => r.row),
  deleteAdminUser: (id: number) => admin<void>("deleteUser", { id }).then(() => undefined),

  createUserRole: (payload: Partial<UserRole>) =>
    admin<{ row: UserRole }>("createUserRole", { payload }).then((r) => r.row),
  updateUserRole: (id: number, patch: Partial<UserRole>) =>
    admin<{ row: UserRole }>("updateUserRole", { id, patch }).then((r) => r.row),
  deleteUserRole: (id: number) => admin<void>("deleteUserRole", { id }).then(() => undefined),

  createMunicipalDepartment: (payload: Partial<MunicipalDepartment>) =>
    admin<{ row: MunicipalDepartment }>("createDepartment", { payload }).then((r) => r.row),
  updateMunicipalDepartment: (id: number, patch: Partial<MunicipalDepartment>) =>
    admin<{ row: MunicipalDepartment }>("updateDepartment", { id, patch }).then((r) => r.row),
  deleteMunicipalDepartment: (id: number) =>
    admin<void>("deleteDepartment", { id }).then(() => undefined),

  /**
   * Look up the signed-in user's own row. Kept for compatibility with the
   * previous sync code -- the argument is ignored, because the server resolves
   * the row from the verified token rather than a client-supplied identifier.
   */
  async findAdminUserByAuth0Id(_auth0Id?: string): Promise<AdminUser | null> {
    const data = await me<{ user: AdminUser | null }>("getProfile");
    return data.user;
  },

  async findAdminUserByEmail(_email?: string): Promise<AdminUser | null> {
    const data = await me<{ user: AdminUser | null }>("getProfile");
    return data.user;
  },

  /** The signed-in user's row plus their resolved role name. */
  getProfile: () => me<{ user: AdminUser | null; roleName: string }>("getProfile"),

  updateProfile: (patch: Partial<AdminUser>) =>
    me<{ user: AdminUser }>("updateProfile", { patch }).then((r) => r.user),

  listFormsForMunicipality: (municipalityId?: number) =>
    publicList<Form>("formsForMunicipality", { municipalityId }),

  createForm: (payload: Partial<Form>) =>
    admin<{ row: Form }>("createForm", { payload }).then((r) => r.row),
  updateForm: (id: number, patch: Partial<Form>) =>
    admin<{ row: Form }>("updateForm", { id, patch }).then((r) => r.row),
  deleteForm: (id: number) => admin<void>("deleteForm", { id }).then(() => undefined),

  /** All submissions for a municipality. Staff only. */
  listSubmissions: (municipalityId: number) =>
    admin<{ results: Submission[] }>("listSubmissions", { municipalityId }).then((r) => r.results),

  /**
   * The signed-in citizen's own submissions. The server scopes these to the
   * caller; the `userId` argument is ignored.
   */
  listSubmissionsForUser: (_userId?: number) =>
    me<{ results: Submission[] }>("listSubmissions").then((r) => r.results),

  /**
   * Fetch one submission. Tries the citizen's own view first and falls back to
   * the staff view, so both callers keep working through one method.
   */
  async getSubmission(id: number): Promise<Submission | null> {
    try {
      const data = await me<{ row: Submission | null }>("getSubmission", { id });
      return data.row;
    } catch {
      const data = await admin<{ row: Submission | null }>("getSubmission", { id });
      return data.row;
    }
  },

  updateSubmission: (id: number, patch: Partial<Submission>) =>
    admin<{ row: Submission }>("updateSubmission", { id, patch }).then((r) => r.row),
  deleteSubmission: (id: number) => admin<void>("deleteSubmission", { id }).then(() => undefined),

  // --- Profile sub-tables (own rows only, enforced server-side) -----
  listIdentityDocumentsForUser: (_userId?: number) =>
    me<{ results: IdentityDocument[] }>("listIdentityDocuments").then((r) => r.results),
  createIdentityDocument: (payload: Partial<IdentityDocument>) =>
    me<{ row: IdentityDocument }>("createIdentityDocument", { payload }).then((r) => r.row),
  updateIdentityDocument: (id: number, patch: Partial<IdentityDocument>) =>
    me<{ row: IdentityDocument }>("updateIdentityDocument", { id, patch }).then((r) => r.row),
  deleteIdentityDocument: (id: number) =>
    me<void>("deleteIdentityDocument", { id }).then(() => undefined),

  listAddressesForUser: (_userId?: number) =>
    me<{ results: Address[] }>("listAddresses").then((r) => r.results),
  createAddress: (payload: Partial<Address>) =>
    me<{ row: Address }>("createAddress", { payload }).then((r) => r.row),
  updateAddress: (id: number, patch: Partial<Address>) =>
    me<{ row: Address }>("updateAddress", { id, patch }).then((r) => r.row),
  deleteAddress: (id: number) => me<void>("deleteAddress", { id }).then(() => undefined),

  // --- Application settings ----------------------------------------
  /** Public read: site configuration, not personal data. */
  async getSettings(): Promise<Settings | null> {
    const rows = await publicList<Settings>("settings");
    return rows[0] ?? null;
  },

  updateSettings: (id: number, patch: Partial<Settings>) =>
    admin<{ row: Settings }>("updateSettings", { id, patch }).then((r) => r.row),

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
   * Persist a submission via the `submit` function, which builds the rows and
   * validates every field code against the form being submitted.
   */
  async createSubmission(params: {
    formId: number;
    serviceId?: number;
    values: Record<string, string | boolean | number>;
  }): Promise<{ submissionId: number }> {
    return call<{ submissionId: number }>(
      "submit",
      {
        formId: params.formId,
        serviceId: params.serviceId,
        values: params.values,
      },
      // Anonymous submission is supported; when the citizen is signed in the
      // server links the submission to their row.
      "optional",
    );
  },
};
