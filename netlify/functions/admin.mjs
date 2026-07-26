/**
 * Staff-only operations for the /admin panel.
 *
 * Every action here requires a verified Auth0 session belonging to a user row
 * that is BOTH active and holds a non-Citizen role. Those two checks used to
 * live only in React (`ProtectedRoute`), which anyone holding the public token
 * could bypass entirely; they are now enforced server-side.
 *
 * Municipality scoping note: the app is currently single-tenant and the client
 * resolves the municipality from a hardcoded placeholder
 * (src/lib/currentMunicipality.ts). When real multi-tenancy lands, derive the
 * municipality from the staff user's own row here and stop accepting it from
 * the request.
 */

import { handler, json, readJson, HttpError } from './_shared/http.mjs';
import { requireUser } from './_shared/auth.mjs';
import {
  T,
  list,
  getRow,
  createRow,
  updateRow,
  deleteRow,
  rowId,
} from './_shared/baserow.mjs';
import { requireStaff } from './_shared/session.mjs';

export default handler(async (request) => {
  if (request.method !== 'POST') {
    throw new HttpError('This endpoint expects POST', 405);
  }

  const identity = await requireUser(request);
  await requireStaff(identity);

  const payload = await readJson(request);
  const action = String(payload.action || '');

  switch (action) {
    // --- submissions -------------------------------------------------------
    case 'listSubmissions': {
      const municipalityId = payload.municipalityId ? rowId(payload.municipalityId) : null;
      return json({
        results: await list(
          T.submissions,
          municipalityId
            ? { 'filter__Submission Linked Municipality__link_row_has': municipalityId }
            : {}
        ),
      });
    }

    case 'getSubmission':
      return json({ row: await getRow(T.submissions, rowId(payload.id)) });

    case 'updateSubmission':
      return json({ row: await updateRow(T.submissions, rowId(payload.id), payload.patch || {}) });

    case 'deleteSubmission':
      await deleteRow(T.submissions, rowId(payload.id));
      return json({ success: true });

    case 'listSubmissionValues':
      return json({
        results: await list(T.submissionValues, {
          'filter__Value Linked Submission__link_row_has': rowId(payload.submissionId),
        }),
      });

    // --- staff users and roles --------------------------------------------
    case 'listUsers':
      return json({ results: await list(T.adminUsers) });

    case 'listUserRoles':
      return json({ results: await list(T.userRoles) });

    case 'createUser':
      return json({ row: await createRow(T.adminUsers, payload.payload || {}) });

    case 'updateUser':
      return json({ row: await updateRow(T.adminUsers, rowId(payload.id), payload.patch || {}) });

    case 'deleteUser':
      await deleteRow(T.adminUsers, rowId(payload.id));
      return json({ success: true });

    case 'createUserRole':
      return json({ row: await createRow(T.userRoles, payload.payload || {}) });

    case 'updateUserRole':
      return json({ row: await updateRow(T.userRoles, rowId(payload.id), payload.patch || {}) });

    case 'deleteUserRole':
      await deleteRow(T.userRoles, rowId(payload.id));
      return json({ success: true });

    // --- departments -------------------------------------------------------
    case 'listDepartments':
      return json({ results: await list(T.municipalDepartments) });

    case 'listUnitTypes':
      return json({ results: await list(T.municipalUnitTypes) });

    case 'createDepartment':
      return json({ row: await createRow(T.municipalDepartments, payload.payload || {}) });

    case 'updateDepartment':
      return json({
        row: await updateRow(T.municipalDepartments, rowId(payload.id), payload.patch || {}),
      });

    case 'deleteDepartment':
      await deleteRow(T.municipalDepartments, rowId(payload.id));
      return json({ success: true });

    // --- forms -------------------------------------------------------------
    case 'listForms': {
      const municipalityId = payload.municipalityId ? rowId(payload.municipalityId) : null;
      return json({
        results: await list(
          T.forms,
          municipalityId
            ? { 'filter__Form Linked Municipality__link_row_has': municipalityId }
            : {}
        ),
      });
    }

    case 'createForm':
      return json({ row: await createRow(T.forms, payload.payload || {}) });

    case 'updateForm':
      return json({ row: await updateRow(T.forms, rowId(payload.id), payload.patch || {}) });

    case 'deleteForm':
      await deleteRow(T.forms, rowId(payload.id));
      return json({ success: true });

    // --- settings ----------------------------------------------------------
    case 'getSettings': {
      const rows = await list(T.settings, { size: 1 });
      return json({ row: rows[0] ?? null });
    }

    case 'updateSettings':
      return json({ row: await updateRow(T.settings, rowId(payload.id), payload.patch || {}) });

    default:
      throw new HttpError(`Unknown action: ${action}`, 400);
  }
});
