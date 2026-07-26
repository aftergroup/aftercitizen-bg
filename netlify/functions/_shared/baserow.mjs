/**
 * Server-side Baserow access.
 *
 * The token lives here and only here. It is never sent to the browser and is
 * never selected by the caller -- functions choose which table and which rows
 * a request may touch.
 *
 * Server-side environment:
 *   BASEROW_API     defaults to https://db2.aftergroup.org
 *   BASEROW_TOKEN   database token for DB 265 (AfterCitizen | Triaditza)
 */

import { HttpError } from './http.mjs';

const API = (process.env.BASEROW_API || 'https://db2.aftergroup.org').replace(/\/+$/, '');
const TOKEN = process.env.BASEROW_TOKEN;

/** Table ids. Defaults match DB 265; override per environment if needed. */
export const T = {
  categories: num('BASEROW_CATEGORIES_TABLE_ID', 2631),
  municipalities: num('BASEROW_MUNICIPALITIES_TABLE_ID', 2632),
  fieldTypes: num('BASEROW_FIELD_TYPES_TABLE_ID', 2634),
  sections: num('BASEROW_FORM_SECTIONS_TABLE_ID', 2635),
  dictionaries: num('BASEROW_DICTIONARIES_TABLE_ID', 2636),
  dictionaryEntries: num('BASEROW_DICTIONARY_ENTRIES_TABLE_ID', 2637),
  templates: num('BASEROW_FORM_TEMPLATES_TABLE_ID', 2638),
  fields: num('BASEROW_FIELDS_TABLE_ID', 2639),
  services: num('BASEROW_SERVICES_TABLE_ID', 2640),
  forms: num('BASEROW_FORMS_TABLE_ID', 2643),
  formFields: num('BASEROW_FORM_FIELDS_TABLE_ID', 2645),
  submissions: num('BASEROW_SUBMISSIONS_TABLE_ID', 2647),
  submissionValues: num('BASEROW_SUBMISSION_VALUES_TABLE_ID', 2648),
  userRoles: num('BASEROW_USER_ROLES_TABLE_ID', 2655),
  adminUsers: num('BASEROW_ADMIN_USERS_TABLE_ID', 2657),
  municipalDepartments: num('BASEROW_MUNICIPAL_DEPARTMENTS_TABLE_ID', 2658),
  municipalUnitTypes: num('BASEROW_MUNICIPAL_UNIT_TYPES_TABLE_ID', 2656),
  identityDocuments: num('BASEROW_IDENTITY_DOCUMENTS_TABLE_ID', 2659),
  addresses: num('BASEROW_ADDRESSES_TABLE_ID', 2660),
  countries: num('BASEROW_COUNTRIES_TABLE_ID', 2654),
  currencies: num('BASEROW_CURRENCIES_TABLE_ID', 2653),
  settings: num('BASEROW_SETTINGS_TABLE_ID', 2663),
};

function num(key, fallback) {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function headers() {
  if (!TOKEN) {
    throw new HttpError('Server is missing BASEROW_TOKEN', 500);
  }
  return { Authorization: `Token ${TOKEN}`, 'Content-Type': 'application/json' };
}

async function request(url, init = {}) {
  let response;
  try {
    response = await fetch(url, { ...init, headers: headers() });
  } catch (error) {
    console.error('[baserow] request failed:', error.message);
    throw new HttpError('Upstream request failed', 502);
  }

  if (response.status === 404) return null;

  if (!response.ok) {
    // Never relay the upstream body: it can echo filter parameters and row
    // contents into an error the caller can read.
    console.error('[baserow] error status', response.status, 'for', url.split('?')[0]);
    throw new HttpError('Database request failed', 502);
  }

  if (response.status === 204) return null;
  return response.json();
}

/** List all rows of a table, following pagination. */
export async function list(tableId, params = {}) {
  const all = [];
  let page = 1;

  for (;;) {
    const qs = new URLSearchParams({
      user_field_names: 'true',
      size: '200',
      page: String(page),
      ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
    });

    const data = await request(`${API}/api/database/rows/table/${tableId}/?${qs}`);
    if (!data) break;

    all.push(...(data.results || []));
    if (!data.next) break;
    page += 1;
    if (page > 20) break; // safety cap, mirrors the previous client behaviour
  }

  return all;
}

export function getRow(tableId, rowId) {
  return request(`${API}/api/database/rows/table/${tableId}/${rowId}/?user_field_names=true`);
}

export function createRow(tableId, payload) {
  return request(`${API}/api/database/rows/table/${tableId}/?user_field_names=true`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateRow(tableId, rowId, patch) {
  return request(`${API}/api/database/rows/table/${tableId}/${rowId}/?user_field_names=true`, {
    method: 'PATCH',
    body: JSON.stringify(patch),
  });
}

export async function deleteRow(tableId, rowId) {
  await request(`${API}/api/database/rows/table/${tableId}/${rowId}/`, { method: 'DELETE' });
}

export function batchCreate(tableId, items) {
  return request(`${API}/api/database/rows/table/${tableId}/batch/?user_field_names=true`, {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

/** Coerce a client-supplied row id to a positive integer. */
export function rowId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new HttpError('Invalid row id', 400);
  }
  return id;
}
