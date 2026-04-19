/**
 * Render every form in the PDF registry as a blank PDF to pdf_compare/,
 * so you can diff each template side-by-side with the official blank in pdf/.
 *
 * Usage:
 *   # one-time: install tsx if not already
 *   npm install
 *   # optional: point at a different Baserow or supply a token
 *   $env:BASEROW_TOKEN = "<db-api-token>"
 *   npm run render:blanks
 *
 * The Baserow metadata is fetched once and cached to scripts/.baserow-cache.json
 * so subsequent runs are offline and fast. Delete the cache file to force a
 * refresh.
 */
import fs from "node:fs/promises";
import path from "node:path";
import React from "react";
import ReactPDF from "@react-pdf/renderer";

import type {
  Form,
  Service,
  FormField,
  FieldDef,
  FieldType,
  Section,
  Dictionary,
  DictionaryEntry,
  RenderedField,
  RenderedForm,
} from "../src/lib/types";
import { hasPdfTemplate, loadPdfTemplate } from "../src/lib/pdf/registry";

/* -------------------------------------------------------------------- */
/* Baserow fetcher (standalone, no Vite import.meta.env)                */
/* -------------------------------------------------------------------- */

const API = process.env.BASEROW_API ?? "https://db2.aftergroup.org";
const TOKEN = process.env.BASEROW_TOKEN ?? "";
const EMAIL = process.env.BASEROW_EMAIL ?? process.env.VITE_BASEROW_EMAIL ?? "";
const PASSWORD =
  process.env.BASEROW_PASSWORD ?? process.env.VITE_BASEROW_PASSWORD ?? "";

let authHeader: string | undefined;

async function ensureAuthHeader(): Promise<string | undefined> {
  if (authHeader) return authHeader;
  if (TOKEN) {
    authHeader = `Token ${TOKEN}`;
    return authHeader;
  }
  if (EMAIL && PASSWORD) {
    const res = await fetch(`${API}/api/user/token-auth/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    });
    if (!res.ok) {
      throw new Error(
        `JWT login failed: ${res.status} ${await res.text()}`,
      );
    }
    const data = (await res.json()) as { token?: string; access_token?: string };
    const jwt = data.token ?? data.access_token;
    if (!jwt) throw new Error("JWT login returned no token");
    authHeader = `JWT ${jwt}`;
    console.log("→ authenticated via JWT");
    return authHeader;
  }
  return undefined;
}

const TABLES = {
  fieldTypes: 2634,
  sections: 2635,
  dictionaries: 2636,
  dictionaryEntries: 2637,
  fields: 2639,
  services: 2640,
  forms: 2643,
  formFields: 2645,
} as const;

const CACHE_PATH = path.resolve("scripts/.baserow-cache.json");
const OUT_DIR = path.resolve("pdf_compare");

async function listAll<T = any>(
  tableId: number,
  extra: Record<string, string> = {},
): Promise<T[]> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const auth = await ensureAuthHeader();
  if (auth) headers.Authorization = auth;
  const rows: T[] = [];
  let page = 1;
  while (true) {
    const qs = new URLSearchParams({
      user_field_names: "true",
      size: "200",
      page: String(page),
      ...extra,
    });
    const res = await fetch(`${API}/api/database/rows/table/${tableId}/?${qs}`, {
      headers,
    });
    if (!res.ok) {
      throw new Error(
        `Baserow table ${tableId} page ${page} failed: ${res.status} ${await res.text()}`,
      );
    }
    const data = (await res.json()) as { results: T[]; next: string | null };
    rows.push(...data.results);
    if (!data.next) break;
    page += 1;
    if (page > 50) break;
  }
  return rows;
}

interface BaserowDump {
  forms: Form[];
  services: Service[];
  formFields: FormField[];
  fields: FieldDef[];
  types: FieldType[];
  sections: Section[];
  dicts: Dictionary[];
  entries: DictionaryEntry[];
}

async function fetchBaserow(): Promise<BaserowDump> {
  const [forms, services, formFields, fields, types, sections, dicts, entries] =
    await Promise.all([
      listAll<Form>(TABLES.forms),
      listAll<Service>(TABLES.services),
      listAll<FormField>(TABLES.formFields),
      listAll<FieldDef>(TABLES.fields),
      listAll<FieldType>(TABLES.fieldTypes),
      listAll<Section>(TABLES.sections),
      listAll<Dictionary>(TABLES.dictionaries),
      listAll<DictionaryEntry>(TABLES.dictionaryEntries),
    ]);
  return { forms, services, formFields, fields, types, sections, dicts, entries };
}

async function loadDump(refresh: boolean): Promise<BaserowDump> {
  if (!refresh) {
    try {
      const raw = await fs.readFile(CACHE_PATH, "utf8");
      console.log(`→ using cached Baserow dump (${CACHE_PATH})`);
      return JSON.parse(raw) as BaserowDump;
    } catch {
      /* fall through */
    }
  }
  console.log("→ fetching Baserow…");
  const dump = await fetchBaserow();
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await fs.writeFile(CACHE_PATH, JSON.stringify(dump, null, 2), "utf8");
  console.log(`→ cached to ${CACHE_PATH}`);
  return dump;
}

/* -------------------------------------------------------------------- */
/* buildRenderedForm — mirrors src/lib/baserow.ts                       */
/* -------------------------------------------------------------------- */

function buildRenderedForm(
  form: Form,
  service: Service | undefined,
  formFields: FormField[],
  dump: BaserowDump,
): RenderedForm {
  const fieldsById = new Map(dump.fields.map((f) => [f.id, f]));
  const typesById = new Map(dump.types.map((t) => [t.id, t]));
  const sectionsById = new Map(dump.sections.map((s) => [s.id, s]));
  const dictById = new Map(dump.dicts.map((d) => [d.id, d]));
  const entriesByDictId = new Map<number, DictionaryEntry[]>();
  for (const e of dump.entries) {
    const dictId = e["Entry Linked Dictionary"]?.[0]?.id;
    if (!dictId) continue;
    if (!entriesByDictId.has(dictId)) entriesByDictId.set(dictId, []);
    entriesByDictId.get(dictId)!.push(e);
  }

  const sorted = [...formFields].sort(
    (a, b) => Number(a["Form Field Order"]) - Number(b["Form Field Order"]),
  );

  const rendered: RenderedField[] = [];
  for (const ff of sorted) {
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
            .sort(
              (a, b) => (Number(a["Entry Order"]) || 0) - (Number(b["Entry Order"]) || 0),
            )
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

  return { form, service, sections: sectionsOrdered };
}

/* -------------------------------------------------------------------- */
/* Main                                                                 */
/* -------------------------------------------------------------------- */

async function main() {
  const args = new Set(process.argv.slice(2));
  const refresh = args.has("--refresh");
  const only = [...args].find((a) => a.startsWith("--only="))?.split("=")[1];

  const dump = await loadDump(refresh);

  const ffByFormId = new Map<number, FormField[]>();
  for (const ff of dump.formFields) {
    const formRef = ff["Form Field Linked Form"]?.[0];
    if (!formRef) continue;
    if (!ffByFormId.has(formRef.id)) ffByFormId.set(formRef.id, []);
    ffByFormId.get(formRef.id)!.push(ff);
  }

  const servicesByCode = new Map(dump.services.map((s) => [s["Service Code"], s]));

  await fs.mkdir(OUT_DIR, { recursive: true });

  const candidates = [...dump.forms]
    .filter((f) => hasPdfTemplate(f["Form Code"]))
    .filter((f) => !only || f["Form Code"] === only)
    .sort((a, b) => a["Form Code"].localeCompare(b["Form Code"]));

  console.log(`→ rendering ${candidates.length} forms to ${OUT_DIR}/`);

  let ok = 0;
  let fail = 0;
  for (const form of candidates) {
    const code = form["Form Code"];
    const outPath = path.join(OUT_DIR, `${code}.pdf`);
    try {
      const service = servicesByCode.get(code);
      const ffs = ffByFormId.get(form.id) ?? [];
      const schema = buildRenderedForm(form, service, ffs, dump);
      const Template = await loadPdfTemplate(code);
      if (!Template) throw new Error("template missing");
      const element = React.createElement(Template, { schema, values: {} });
      await ReactPDF.renderToFile(element as any, outPath);
      console.log(`  ✓ ${code}`);
      ok += 1;
    } catch (err) {
      console.error(`  ✗ ${code}: ${(err as Error).message}`);
      fail += 1;
    }
  }

  console.log(`\nDone: ${ok} ok, ${fail} failed.`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
