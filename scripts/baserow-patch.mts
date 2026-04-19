/**
 * Apply all Baserow patches needed by the form templates,
 * derived from `pdf_compare/DISCREPANCIES.md`.
 *
 * Authentication: same as render-blank-pdfs.mts —
 *   $env:BASEROW_EMAIL = "..."; $env:BASEROW_PASSWORD = "..."
 *   # or
 *   $env:BASEROW_TOKEN = "<db-api-token>"
 *
 * Usage:
 *   npm run baserow:patch            # dry-run, shows what would change
 *   npm run baserow:patch -- --apply # actually mutate Baserow
 *   npm run baserow:patch -- --apply --only=field-renames,gr-forms
 *
 * Patches (each can be run individually via --only=<name>,<name>):
 *   field-renames    Rename existing field codes that drift from templates
 *   new-fields       Add missing field definitions (mother_*, request_ground, ES board, GDPR, etc.)
 *   gr-forms         Add 17 missing GR Forms rows + their basic FormField linkages
 *   gr-form-fields   Link new fields to GR-010, GR-017
 *   gdpr-form-fields Link new fields to GDPR-001/002/003
 *   es-form-fields   Link new board fields to ES-001
 *   coapplicants     Link applicant_2_x / applicant_3_x to all 63 SI/UT forms (756 rows)
 */
import process from "node:process";

const API = process.env.BASEROW_API ?? "https://db2.aftergroup.org";
const TOKEN = process.env.BASEROW_TOKEN ?? "";
const EMAIL = process.env.BASEROW_EMAIL ?? "";
const PASSWORD = process.env.BASEROW_PASSWORD ?? "";

const argv = new Set(process.argv.slice(2));
const APPLY = argv.has("--apply");
const ONLY_ARG = process.argv.find((a) => a.startsWith("--only="));
const ONLY = ONLY_ARG
  ? new Set(ONLY_ARG.replace("--only=", "").split(","))
  : null;

function shouldRun(name: string): boolean {
  return ONLY === null || ONLY.has(name);
}

function tag(): string {
  return APPLY ? "APPLY" : "DRY  ";
}

let authHeader: string | undefined;
async function ensureAuth(): Promise<string> {
  if (authHeader) return authHeader;
  if (TOKEN) {
    authHeader = `Token ${TOKEN}`;
    return authHeader;
  }
  if (!EMAIL || !PASSWORD) {
    throw new Error(
      "Set BASEROW_TOKEN or both BASEROW_EMAIL + BASEROW_PASSWORD.",
    );
  }
  const res = await fetch(`${API}/api/user/token-auth/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok)
    throw new Error(`JWT login failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { token?: string; access_token?: string };
  const jwt = data.token ?? data.access_token;
  if (!jwt) throw new Error("JWT login returned no token");
  authHeader = `JWT ${jwt}`;
  return authHeader;
}

async function api<T = unknown>(
  method: "GET" | "POST" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
): Promise<T> {
  const auth = await ensureAuth();
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: auth,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    throw new Error(
      `${method} ${path} → ${res.status}: ${await res.text()}`,
    );
  }
  return (await res.json()) as T;
}

const TABLES = {
  fields: 2639,
  services: 2640,
  forms: 2643,
  formFields: 2645,
  sections: 2635,
  fieldTypes: 2634,
} as const;

/* -------------------- type ids (from `list_fields`) ----------------- */
// Pulled from earlier MCP exploration:
const FIELD_TYPE = {
  text: 3,
  long_text: 4,
  egn: 5,
  lnch: 6,
  phone: 7,
  email: 8,
  date: 9,
  number: 10,
  boolean: 11,
  select: 12,
  radio: 13,
  address_composite: 14,
  file: 15,
} as const;

const SECTION = {
  applicant: 4,
  proxy: 5,
  subject: 6,
  request: 7,
  request_details: 8,
  deceased: 9,
  heirs: 10,
  attachments: 11,
  delivery: 12,
  fee: 13,
  signature: 14,
  consent: 15,
} as const;

/* ====================================================================
 * 1. Field renames — fix drift between template lookups and Baserow
 * ==================================================================== */

interface FieldRename {
  rowId: number;
  from: string;
  to: string;
  reason: string;
}

const FIELD_RENAMES: FieldRename[] = [
  { rowId: 71,  from: "child_names_after_recognition", to: "child_name_after_recognition", reason: "GR-010 template lookup uses singular." },
  { rowId: 8,   from: "applicant_lnch", to: "applicant_lnc", reason: "GR-017 + RA-UT shells lookup uses 'lnc'." },
  { rowId: 9,   from: "applicant_bulstat_eik", to: "applicant_bulstat", reason: "RA-UT shells use 'applicant_bulstat'." },
  { rowId: 10,  from: "applicant_ztr_eik", to: "applicant_ztr", reason: "RA-UT shells use 'applicant_ztr'." },
  { rowId: 95,  from: "passport_issue_date", to: "passport_date", reason: "GDPR templates lookup uses 'passport_date'." },
];

async function patchFieldRenames(): Promise<void> {
  if (!shouldRun("field-renames")) return;
  console.log("\n=== field-renames ===");
  for (const r of FIELD_RENAMES) {
    console.log(`  [${tag()}] field ${r.rowId}: ${r.from} → ${r.to}  (${r.reason})`);
    if (APPLY) {
      await api(
        "PATCH",
        `/api/database/rows/table/${TABLES.fields}/${r.rowId}/?user_field_names=true`,
        { "Field Code": r.to },
      );
    }
  }
}

/* ====================================================================
 * 2. New fields — add missing definitions
 * ==================================================================== */

interface NewField {
  code: string;
  labelBg: string;
  typeId: number;
  category: string; // grouping for logging
}

const NEW_FIELDS: NewField[] = [
  // GR-010 mother fields the template references but Baserow lacks
  { code: "mother_id_doc_date",   labelBg: "Дата на издаване на документа на майката", typeId: FIELD_TYPE.date, category: "GR-010" },
  { code: "mother_id_doc_issuer", labelBg: "Издаден от (документ на майката)",         typeId: FIELD_TYPE.text, category: "GR-010" },
  { code: "mother_email",         labelBg: "E-mail на майката",                        typeId: FIELD_TYPE.email, category: "GR-010" },

  // GDPR templates
  { code: "request_ground",         labelBg: "Основание за искането (GDPR)",   typeId: FIELD_TYPE.text, category: "GDPR" },
  { code: "records_check_date",     labelBg: "Дата на справка в регистрите",   typeId: FIELD_TYPE.date, category: "GDPR" },
  { code: "records_check_place",    labelBg: "Място на справката",             typeId: FIELD_TYPE.text, category: "GDPR" },
  { code: "foreigner_id_number",    labelBg: "ЕНЧ (Личен номер на чужденец)",  typeId: FIELD_TYPE.text, category: "GDPR" },
];

// ES-001 board fields (4 roles × 5 rows × 4 cols = 80 fields)
const BOARD_ROLES = ["chairman_us", "member_us", "chairman_cs", "member_cs"] as const;
const BOARD_COLS = [
  { suffix: "name",    label: "Трите имена",     typeId: FIELD_TYPE.text },
  { suffix: "address", label: "Адрес",           typeId: FIELD_TYPE.text },
  { suffix: "phone",   label: "Телефон",         typeId: FIELD_TYPE.phone },
  { suffix: "email",   label: "Електронна поща", typeId: FIELD_TYPE.email },
] as const;
for (const role of BOARD_ROLES) {
  for (let i = 1; i <= 5; i++) {
    for (const col of BOARD_COLS) {
      NEW_FIELDS.push({
        code: `${role}_${i}_${col.suffix}`,
        labelBg: `${col.label} (${role}, ${i})`,
        typeId: col.typeId,
        category: "ES-001 board",
      });
    }
  }
}

async function patchNewFields(): Promise<{ codeToId: Record<string, number> }> {
  const codeToId: Record<string, number> = {};
  if (!shouldRun("new-fields")) return { codeToId };
  console.log("\n=== new-fields ===");

  // First check what already exists to avoid duplicates.
  const existing = await api<{ results: Array<{ id: number; "Field Code": string }> }>(
    "GET",
    `/api/database/rows/table/${TABLES.fields}/?user_field_names=true&size=200`,
  );
  let cur = existing.results;
  let nextPage = 2;
  while (cur.length === 200) {
    const more = await api<{ results: Array<{ id: number; "Field Code": string }> }>(
      "GET",
      `/api/database/rows/table/${TABLES.fields}/?user_field_names=true&size=200&page=${nextPage++}`,
    );
    cur = more.results;
    existing.results.push(...more.results);
  }
  const existingByCode = new Map(existing.results.map((r) => [r["Field Code"], r.id]));

  for (const f of NEW_FIELDS) {
    if (existingByCode.has(f.code)) {
      const id = existingByCode.get(f.code)!;
      codeToId[f.code] = id;
      console.log(`  [SKIP ] ${f.code} already exists (id ${id})`);
      continue;
    }
    console.log(`  [${tag()}] create field ${f.code} (${f.category})`);
    if (APPLY) {
      const created = await api<{ id: number }>(
        "POST",
        `/api/database/rows/table/${TABLES.fields}/?user_field_names=true`,
        {
          "Field Code": f.code,
          "Field Label BG": f.labelBg,
          "Field Linked Type": [f.typeId],
        },
      );
      codeToId[f.code] = created.id;
    }
  }
  return { codeToId };
}

/* ====================================================================
 * 3. Missing GR forms — 17 services have no Forms row
 * ==================================================================== */

const MISSING_GR: Array<{ code: string; titleBg: string; serviceCode: string }> = [
  { code: "GR-003", titleBg: "Издаване на удостоверение на родените от майката деца", serviceCode: "GR-003" },
  { code: "GR-011", titleBg: "Издаване на удостоверение за раждане – оригинал", serviceCode: "GR-011" },
  { code: "GR-013", titleBg: "Издаване на удостоверение за сключен граждански брак – оригинал", serviceCode: "GR-013" },
  { code: "GR-015", titleBg: "Издаване на препис-извлечение от акт за смърт – за първи път", serviceCode: "GR-015" },
  { code: "GR-022", titleBg: "Удостоверение за чужд гражданин за брак в РБ", serviceCode: "GR-022" },
  { code: "GR-024", titleBg: "Промяна в актовете за гражданско състояние", serviceCode: "GR-024" },
  { code: "GR-025", titleBg: "Издаване на справки по искане на съдебни изпълнители", serviceCode: "GR-025" },
  { code: "GR-026", titleBg: "Издаване на заверен препис от ЛРК / семеен регистър", serviceCode: "GR-026" },
  { code: "GR-027", titleBg: "Издаване на удостоверение за вписване в регистъра на населението", serviceCode: "GR-027" },
  { code: "GR-028", titleBg: "Издаване на препис от семеен регистър, воден до 1978 г.", serviceCode: "GR-028" },
  { code: "GR-029", titleBg: "Съставяне на актове за гражданско състояние от чужбина", serviceCode: "GR-029" },
  { code: "GR-031", titleBg: "Издаване на многоезично извлечение от акт за гражданско състояние", serviceCode: "GR-031" },
  { code: "GR-032", titleBg: "Издаване на удостоверение за правно ограничение", serviceCode: "GR-032" },
  { code: "GR-033", titleBg: "Установяване на българско гражданство — комплектоване на документи", serviceCode: "GR-033" },
  { code: "GR-034", titleBg: "Издаване на удостоверения за настойничество и попечителство", serviceCode: "GR-034" },
  { code: "GR-035", titleBg: "Отразяване на режим на имуществените отношения между съпрузи", serviceCode: "GR-035" },
  { code: "GR-036", titleBg: "Издаване на удостоверение за родителски права", serviceCode: "GR-036" },
];

async function patchGrForms(): Promise<{ codeToId: Record<string, number> }> {
  const codeToId: Record<string, number> = {};
  if (!shouldRun("gr-forms")) return { codeToId };
  console.log("\n=== gr-forms ===");

  // Map service codes → service IDs
  const services = await api<{ results: Array<{ id: number; "Service Code": string }> }>(
    "GET",
    `/api/database/rows/table/${TABLES.services}/?user_field_names=true&size=200`,
  );
  const serviceCodeToId = new Map(
    services.results.map((s) => [s["Service Code"], s.id]),
  );

  // Existing forms (skip if code already present)
  const forms = await api<{ results: Array<{ id: number; "Form Code": string }> }>(
    "GET",
    `/api/database/rows/table/${TABLES.forms}/?user_field_names=true&size=200`,
  );
  const existingFormCodes = new Set(forms.results.map((f) => f["Form Code"]));

  for (const f of MISSING_GR) {
    if (existingFormCodes.has(f.code)) {
      console.log(`  [SKIP ] ${f.code} already exists`);
      continue;
    }
    const serviceId = serviceCodeToId.get(f.serviceCode);
    console.log(
      `  [${tag()}] create Forms row ${f.code} → service id ${serviceId ?? "MISSING"}`,
    );
    if (APPLY) {
      const payload: Record<string, unknown> = {
        "Form Code": f.code,
        "Form Title BG": f.titleBg,
      };
      if (serviceId) payload["Form Linked Service"] = [serviceId];
      const created = await api<{ id: number }>(
        "POST",
        `/api/database/rows/table/${TABLES.forms}/?user_field_names=true`,
        payload,
      );
      codeToId[f.code] = created.id;
    }
  }
  return { codeToId };
}

/* ====================================================================
 * 4. Co-applicants linkage — applicant_2_* / applicant_3_*  on SI/UT
 * ==================================================================== */

const COAPPLICANT_FIELDS = [
  { code: "applicant_2_first_name",  id: 222, order: 100 },
  { code: "applicant_2_father_name", id: 223, order: 101 },
  { code: "applicant_2_family_name", id: 224, order: 102 },
  { code: "applicant_2_egn",         id: 225, order: 103 },
  { code: "applicant_2_address",     id: 226, order: 104 },
  { code: "applicant_2_phone",       id: 227, order: 105 },
  { code: "applicant_3_first_name",  id: 228, order: 106 },
  { code: "applicant_3_father_name", id: 229, order: 107 },
  { code: "applicant_3_family_name", id: 230, order: 108 },
  { code: "applicant_3_egn",         id: 231, order: 109 },
  { code: "applicant_3_address",     id: 232, order: 110 },
  { code: "applicant_3_phone",       id: 233, order: 111 },
] as const;

// SI: 50..67, UT: 68..112 (form ids in Baserow forms table).
const COAPPLICANT_FORMS = [
  ...Array.from({ length: 18 }, (_, i) => 50 + i),  // SI-001..023 (form ids 50..67)
  ...Array.from({ length: 45 }, (_, i) => 68 + i),  // UT-001..044 (form ids 68..112)
];

async function patchCoapplicants(): Promise<void> {
  if (!shouldRun("coapplicants")) return;
  console.log("\n=== coapplicants ===");
  console.log(
    `  [${tag()}] would insert ${COAPPLICANT_FORMS.length} forms × ${COAPPLICANT_FIELDS.length} fields = ${COAPPLICANT_FORMS.length * COAPPLICANT_FIELDS.length} FormField rows`,
  );
  if (!APPLY) return;

  // Build batch — chunk in groups of 100 rows for safety.
  const allRows: Array<Record<string, unknown>> = [];
  for (const formId of COAPPLICANT_FORMS) {
    for (const f of COAPPLICANT_FIELDS) {
      allRows.push({
        "Form Field Linked Form": [formId],
        "Form Field Linked Field": [f.id],
        "Form Field Linked Section": [SECTION.applicant],
        "Form Field Order": f.order,
        "Form Field Required": false,
      });
    }
  }
  for (let i = 0; i < allRows.length; i += 100) {
    const chunk = allRows.slice(i, i + 100);
    console.log(`  [APPLY] batch ${i / 100 + 1}: ${chunk.length} rows`);
    await api(
      "POST",
      `/api/database/rows/table/${TABLES.formFields}/batch/?user_field_names=true`,
      { items: chunk },
    );
  }
}

/* ====================================================================
 * 5. Link new fields to GR-010, GDPR-001/2/3, ES-001
 * ==================================================================== */

async function linkFieldsToForms(opts: {
  patchName: string;
  forms: number[];
  fieldCodes: string[];
  codeToId: Record<string, number>;
  section: number;
  startOrder: number;
}): Promise<void> {
  if (!shouldRun(opts.patchName)) return;
  console.log(`\n=== ${opts.patchName} ===`);

  // Resolve any unknown codes by looking them up in Baserow.
  const fieldIds: number[] = [];
  for (const code of opts.fieldCodes) {
    let id = opts.codeToId[code];
    if (!id) {
      const lookup = await api<{ results: Array<{ id: number; "Field Code": string }> }>(
        "GET",
        `/api/database/rows/table/${TABLES.fields}/?user_field_names=true&search=${encodeURIComponent(code)}&size=5`,
      );
      const match = lookup.results.find((r) => r["Field Code"] === code);
      if (!match) {
        console.log(`  [SKIP ] field ${code} not found in Baserow`);
        continue;
      }
      id = match.id;
    }
    fieldIds.push(id);
  }

  const rows: Array<Record<string, unknown>> = [];
  for (const formId of opts.forms) {
    for (let i = 0; i < fieldIds.length; i++) {
      rows.push({
        "Form Field Linked Form": [formId],
        "Form Field Linked Field": [fieldIds[i]],
        "Form Field Linked Section": [opts.section],
        "Form Field Order": opts.startOrder + i,
        "Form Field Required": false,
      });
    }
  }
  console.log(
    `  [${tag()}] would insert ${rows.length} FormField rows (${opts.forms.length} forms × ${fieldIds.length} fields)`,
  );
  if (!APPLY) return;
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    await api(
      "POST",
      `/api/database/rows/table/${TABLES.formFields}/batch/?user_field_names=true`,
      { items: chunk },
    );
  }
}

/* ====================================================================
 * Driver
 * ==================================================================== */

async function main(): Promise<void> {
  console.log(`baserow-patch — ${APPLY ? "APPLY" : "DRY-RUN"}${ONLY ? ` (only: ${[...ONLY].join(", ")})` : ""}`);

  await patchFieldRenames();

  const newFields = await patchNewFields();
  await patchGrForms();
  await patchCoapplicants();

  // GR-010: link new mother_id_doc_date / mother_id_doc_issuer / mother_email
  await linkFieldsToForms({
    patchName: "gr-form-fields",
    forms: [11], // GR-010
    fieldCodes: ["mother_id_doc_date", "mother_id_doc_issuer", "mother_email"],
    codeToId: newFields.codeToId,
    section: SECTION.applicant,
    startOrder: 200,
  });

  // GDPR-001/002/003: link the 4 new fields
  await linkFieldsToForms({
    patchName: "gdpr-form-fields",
    forms: [22, 23, 24],
    fieldCodes: ["request_ground", "records_check_date", "records_check_place", "foreigner_id_number"],
    codeToId: newFields.codeToId,
    section: SECTION.request,
    startOrder: 100,
  });

  // ES-001: link 80 board fields
  const boardCodes: string[] = [];
  for (const role of BOARD_ROLES) {
    for (let i = 1; i <= 5; i++) {
      for (const col of BOARD_COLS) boardCodes.push(`${role}_${i}_${col.suffix}`);
    }
  }
  await linkFieldsToForms({
    patchName: "es-form-fields",
    forms: [42],
    fieldCodes: boardCodes,
    codeToId: newFields.codeToId,
    section: SECTION.request,
    startOrder: 100,
  });

  console.log("\nDone.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
