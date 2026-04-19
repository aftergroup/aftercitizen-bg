/**
 * Baserow API client for AfterCitizen.
 *
 * Reads from DB 265 ("AfterCitizen | Triaditza") on db2.aftergroup.org.
 * All calls use `?user_field_names=true` so responses match the types in types.ts.
 */

import type {
  Category, Municipality, Service, Form, FieldDef, FieldType, Section,
  Dictionary, DictionaryEntry, FormField, RenderedForm, RenderedField,
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
};

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
