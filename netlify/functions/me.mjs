/**
 * Per-citizen data: profile, identity documents, addresses, own submissions.
 *
 * Everything here is personal data. The rule this file enforces:
 *
 *   The user row id ALWAYS comes from the verified Auth0 token.
 *   It is never read from the request body.
 *
 * That is the fix for the original defect. Previously the browser held a
 * workspace-wide token and scoped its own reads with a query filter, so
 * dropping the filter returned every citizen's documents.
 *
 * Writes additionally verify that the target row is linked to the caller
 * before touching it, so a guessed row id cannot reach someone else's record.
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
import { resolveUser, resolveRoleName, assertOwnedByUser } from './_shared/session.mjs';

const DOC_LINK = 'Identity Document Linked User';
const ADDRESS_LINK = 'Address Linked User';
const SUBMISSION_LINK = 'Submission Linked User';

/**
 * Fields a citizen may set on their own profile. Anything outside this list is
 * dropped -- notably `User Is Active` and `User Linked User Role`, which would
 * otherwise let a citizen approve themselves into the staff panel.
 */
const SELF_EDITABLE_USER_FIELDS = new Set([
  // Account tab
  'User Appear As',
  'User Username',
  'User Phone',
  'User Default Language',
  // Personal tab
  'User First Name',
  'User Middle Name',
  'User Last Name',
  'User EGN',
  'User Date Of Birth',
  'User Gender',
  'User Nationality',
  'User Place Of Birth',
  'User Company',
  'User Job Role',
  'User Facebook URL',
  'User LinkedIn URL',
  // Settings tab
  'User Preferred Delivery Method',
  'User Marketing Opt In',
  'User Notification Opt In',
  // Representation tab
  'User Is Legal Representative',
  'User Represented Person EGN',
  'User Represented Person Full Name',
  'User Represented Person Relation',
]);

/**
 * Deliberately NOT self-editable:
 *
 *   User Is Active, User Linked User Role
 *     would let a citizen promote themselves into the staff panel.
 *
 *   auth0_user_id
 *     would let a citizen rebind their row to another identity.
 *
 *   User Email
 *     identity-bearing: `resolveUser` falls back to matching an existing row
 *     by email, so a writable email field is a way to collide with a
 *     provisioned staff row. It is synced from the verified token instead.
 */

function pick(patch, allowed) {
  const out = {};
  for (const [key, value] of Object.entries(patch || {})) {
    if (allowed.has(key)) out[key] = value;
  }
  return out;
}

/**
 * Force the owning link on a created row to the caller, ignoring whatever the
 * client sent.
 */
function withOwner(payload, linkField, userId) {
  return { ...(payload || {}), [linkField]: [userId] };
}

export default handler(async (request) => {
  if (request.method !== 'POST') {
    throw new HttpError('This endpoint expects POST', 405);
  }

  const identity = await requireUser(request);
  const user = await resolveUser(identity);
  const userId = user.id;

  const payload = await readJson(request);
  const action = String(payload.action || '');

  switch (action) {
    // --- profile ---------------------------------------------------------
    case 'getProfile': {
      const roleName = await resolveRoleName(user);
      return json({ user, roleName });
    }

    case 'updateProfile': {
      const patch = pick(payload.patch, SELF_EDITABLE_USER_FIELDS);
      const updated = await updateRow(T.adminUsers, userId, patch);
      return json({ user: updated });
    }

    // --- identity documents ----------------------------------------------
    case 'listIdentityDocuments':
      return json({
        results: await list(T.identityDocuments, {
          [`filter__${DOC_LINK}__link_row_has`]: userId,
        }),
      });

    case 'createIdentityDocument':
      return json({
        row: await createRow(T.identityDocuments, withOwner(payload.payload, DOC_LINK, userId)),
      });

    case 'updateIdentityDocument': {
      const id = rowId(payload.id);
      await assertOwnedByUser(await getRow(T.identityDocuments, id), DOC_LINK, userId);
      // Strip the link field so an update cannot reassign the row to someone else.
      const { [DOC_LINK]: _ignored, ...patch } = payload.patch || {};
      return json({ row: await updateRow(T.identityDocuments, id, patch) });
    }

    case 'deleteIdentityDocument': {
      const id = rowId(payload.id);
      await assertOwnedByUser(await getRow(T.identityDocuments, id), DOC_LINK, userId);
      await deleteRow(T.identityDocuments, id);
      return json({ success: true });
    }

    // --- addresses --------------------------------------------------------
    case 'listAddresses':
      return json({
        results: await list(T.addresses, {
          [`filter__${ADDRESS_LINK}__link_row_has`]: userId,
        }),
      });

    case 'createAddress':
      return json({
        row: await createRow(T.addresses, withOwner(payload.payload, ADDRESS_LINK, userId)),
      });

    case 'updateAddress': {
      const id = rowId(payload.id);
      await assertOwnedByUser(await getRow(T.addresses, id), ADDRESS_LINK, userId);
      const { [ADDRESS_LINK]: _ignored, ...patch } = payload.patch || {};
      return json({ row: await updateRow(T.addresses, id, patch) });
    }

    case 'deleteAddress': {
      const id = rowId(payload.id);
      await assertOwnedByUser(await getRow(T.addresses, id), ADDRESS_LINK, userId);
      await deleteRow(T.addresses, id);
      return json({ success: true });
    }

    // --- own submissions ---------------------------------------------------
    case 'listSubmissions':
      return json({
        results: await list(T.submissions, {
          [`filter__${SUBMISSION_LINK}__link_row_has`]: userId,
        }),
      });

    case 'getSubmission': {
      const id = rowId(payload.id);
      const row = await getRow(T.submissions, id);
      await assertOwnedByUser(row, SUBMISSION_LINK, userId);
      return json({ row });
    }

    default:
      throw new HttpError(`Unknown action: ${action}`, 400);
  }
});
