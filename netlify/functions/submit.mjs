/**
 * Create a form submission.
 *
 * Anonymous submission is an existing product requirement -- a citizen can
 * file a form without an account -- so this endpoint does not require a
 * session. It does, however, refuse to be a general-purpose writer:
 *
 *  - it writes only to the Submissions and Submission Values tables
 *  - it builds the status and timestamp itself
 *  - it accepts values only for field codes that actually belong to the form
 *    being submitted, so a caller cannot stuff arbitrary columns
 *
 * If the caller happens to be signed in, the submission is linked to their
 * user row -- using the id resolved from the verified token, never one
 * supplied in the request.
 */

import { handler, json, readJson, HttpError } from './_shared/http.mjs';
import { T, list, createRow, batchCreate, rowId } from './_shared/baserow.mjs';
import { requireUser } from './_shared/auth.mjs';
import { resolveUser } from './_shared/session.mjs';

const MAX_VALUE_LENGTH = 10000;
const MAX_VALUES = 300;

export default handler(async (request) => {
  if (request.method !== 'POST') {
    throw new HttpError('This endpoint expects POST', 405);
  }

  const payload = await readJson(request);
  const formId = rowId(payload.formId);
  const values = payload.values && typeof payload.values === 'object' ? payload.values : {};

  const entries = Object.entries(values);
  if (entries.length > MAX_VALUES) {
    throw new HttpError('Too many values', 400);
  }

  // Only accept field codes that belong to this form. Without this an
  // anonymous caller could write arbitrary key/value rows into the values
  // table.
  const formFields = await list(T.formFields, {
    'filter__Form Field Linked Form__link_row_has': formId,
  });

  if (formFields.length === 0) {
    throw new HttpError('Unknown form', 400);
  }

  const fieldRefIds = new Set(
    formFields.map((ff) => ff['Form Field Linked Field']?.[0]?.id).filter(Boolean)
  );
  const allFields = await list(T.fields);
  const allowedCodes = new Set(
    allFields.filter((f) => fieldRefIds.has(f.id)).map((f) => f['Field Code'])
  );

  const rejected = entries.filter(([code]) => !allowedCodes.has(code)).map(([code]) => code);
  if (rejected.length > 0) {
    throw new HttpError(`Unknown field codes for this form: ${rejected.slice(0, 5).join(', ')}`, 400);
  }

  // Link the submission to the signed-in citizen when there is one. An absent
  // or invalid token simply means an anonymous submission.
  let linkedUserId = null;
  try {
    const identity = await requireUser(request);
    const user = await resolveUser(identity);
    linkedUserId = user?.id ?? null;
  } catch {
    linkedUserId = null;
  }

  const submission = await createRow(T.submissions, {
    'Submission Linked Form': [formId],
    ...(payload.serviceId ? { 'Submission Linked Service': [rowId(payload.serviceId)] } : {}),
    ...(linkedUserId ? { 'Submission Linked User': [linkedUserId] } : {}),
    'Submission Status': 'pending',
    'Submission Created On': new Date().toISOString(),
  });

  const submissionId = submission.id;

  const valueRows = entries.map(([code, value]) => ({
    'Value Field Code': code,
    'Value String': String(value ?? '').slice(0, MAX_VALUE_LENGTH),
    'Value Linked Submission': [submissionId],
  }));

  if (valueRows.length > 0) {
    await batchCreate(T.submissionValues, valueRows);
  }

  return json({ submissionId });
});
