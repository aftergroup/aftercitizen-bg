/**
 * Anonymous reads of public reference data.
 *
 * The citizen-facing pages (home, service list, form rendering) need this data
 * before anyone signs in, so this endpoint requires no session. It is
 * restricted to an explicit allowlist of reference tables -- catalogues of
 * services, forms, field definitions and dictionaries.
 *
 * No table here holds personal data. Tables that do (users, submissions,
 * submission values, identity documents, addresses) are deliberately absent
 * and are served only by `me.mjs` and `admin.mjs`, both of which require a
 * verified session.
 */

import { handler, json, readJson, HttpError } from './_shared/http.mjs';
import { T, list, rowId } from './_shared/baserow.mjs';

/**
 * Named datasets the public may read. Using names rather than table ids means
 * a caller cannot ask for an arbitrary table.
 */
const DATASETS = {
  categories: () => list(T.categories),
  municipalities: () => list(T.municipalities),
  services: () => list(T.services),
  forms: () => list(T.forms),
  fields: () => list(T.fields),
  fieldTypes: () => list(T.fieldTypes),
  sections: () => list(T.sections),
  dictionaries: () => list(T.dictionaries),
  dictionaryEntries: () => list(T.dictionaryEntries),
  countries: () => list(T.countries),
  currencies: () => list(T.currencies),
  // The Settings row holds site configuration (branding, contact address),
  // not personal data.
  settings: () => list(T.settings, { size: 1 }),
};

/** Parameterised reads, each constrained to a single safe filter. */
const QUERIES = {
  formFieldsForForm: (params) =>
    list(T.formFields, {
      'filter__Form Field Linked Form__link_row_has': rowId(params.formId),
    }),
  formsForMunicipality: (params) =>
    params.municipalityId
      ? list(T.forms, {
          'filter__Form Linked Municipality__link_row_has': rowId(params.municipalityId),
        })
      : list(T.forms),
  serviceByCode: async (params) => {
    const code = String(params.code || '').slice(0, 100);
    const rows = await list(T.services, { search: code });
    return rows.filter((r) => r['Service Code'] === code);
  },
  formByCode: async (params) => {
    const code = String(params.code || '').slice(0, 100);
    const rows = await list(T.forms, { search: code });
    return rows.filter((r) => r['Form Code'] === code);
  },
};

export default handler(async (request) => {
  if (request.method !== 'POST') {
    throw new HttpError('This endpoint expects POST', 405);
  }

  const payload = await readJson(request);
  const name = String(payload.dataset || payload.query || '');

  if (Object.prototype.hasOwnProperty.call(DATASETS, name)) {
    return json({ results: await DATASETS[name]() });
  }

  if (Object.prototype.hasOwnProperty.call(QUERIES, name)) {
    return json({ results: await QUERIES[name](payload.params || {}) });
  }

  throw new HttpError(`Unknown dataset: ${name}`, 400);
});
