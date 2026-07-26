/**
 * Resolve a verified Auth0 subject to its Baserow user row, server-side.
 *
 * This is the heart of the authorisation fix. Previously the browser held a
 * workspace-wide token and scoped its own queries with
 * `filter__...link_row_has=<userId>`. Anyone could drop that filter and read
 * every citizen's identity documents and addresses.
 *
 * Now the user row id is derived here from the verified token and can never be
 * supplied by the caller.
 */

import { HttpError } from './http.mjs';
import { T, list, createRow, updateRow } from './baserow.mjs';

const DEFAULT_ROLE_NAME = 'Citizen';

/**
 * Find the Users row for an Auth0 subject, creating it on first sign-in.
 *
 * Mirrors the previous client-side `useUserSync` behaviour, but the lookup and
 * the create both happen with the server's credential.
 */
export async function resolveUser({ sub, email, claims = {} }) {
  const bySub = await list(T.adminUsers, { search: sub });
  let existing = bySub.find((row) => row.auth0_user_id === sub) || null;

  // Fall back to email: covers a row provisioned by an admin before the
  // employee first signed in, when the sub was not yet known.
  if (!existing && email) {
    const byEmail = await list(T.adminUsers, { search: email });
    existing =
      byEmail.find((row) => String(row['User Email'] || '').toLowerCase() === email) || null;
  }

  if (existing) {
    // Keep the row in step with the identity provider. Every value here comes
    // from the verified token, not from the request body.
    const patch = {};
    if (!existing.auth0_user_id) patch.auth0_user_id = sub;
    if (email && String(existing['User Email'] || '').toLowerCase() !== email) {
      patch['User Email'] = email;
    }
    if (claims.given_name && existing['User First Name'] !== claims.given_name) {
      patch['User First Name'] = claims.given_name;
    }
    if (claims.family_name && existing['User Last Name'] !== claims.family_name) {
      patch['User Last Name'] = claims.family_name;
    }

    return Object.keys(patch).length ? updateRow(T.adminUsers, existing.id, patch) : existing;
  }

  // New sign-up. Default to the Citizen role and an inactive account: staff
  // promotion happens in the admin panel, never here.
  const roles = await list(T.userRoles);
  const citizenRole = roles.find((r) => r['User Role Name'] === DEFAULT_ROLE_NAME);

  return createRow(T.adminUsers, {
    auth0_user_id: sub,
    'User Email': email || '',
    'User First Name': claims.given_name || '',
    'User Last Name': claims.family_name || '',
    'User Appear As': claims.name || claims.nickname || email || '',
    'User Username': claims.nickname || email || '',
    'User Is Active': false,
    ...(citizenRole ? { 'User Linked User Role': [citizenRole.id] } : {}),
  });
}

/** Resolve the role name for a user row. */
export async function resolveRoleName(user) {
  const link = user?.['User Linked User Role']?.[0];
  if (!link) return '';

  const roles = await list(T.userRoles);
  const role = roles.find((r) => r.id === link.id);
  return role?.['User Role Name'] || '';
}

/**
 * Require an active staff user (any role other than Citizen).
 *
 * Both conditions are checked here rather than in the UI: the previous build
 * enforced them only in React, which a caller with the token could bypass.
 */
export async function requireStaff(identity) {
  const user = await resolveUser(identity);

  if (!user['User Is Active']) {
    throw new HttpError('Account is not active', 403);
  }

  const roleName = await resolveRoleName(user);
  if (!roleName || roleName === DEFAULT_ROLE_NAME) {
    throw new HttpError('Staff role required', 403);
  }

  return { user, roleName };
}

/**
 * Assert that a row in `tableId` is linked to `userId` via `linkField`.
 * Used before any update or delete of per-citizen data, so a caller cannot
 * mutate another person's document or address by guessing a row id.
 */
export async function assertOwnedByUser(row, linkField, userId) {
  if (!row) throw new HttpError('Not found', 404);

  const links = row[linkField];
  const owned = Array.isArray(links) && links.some((link) => link?.id === userId);

  if (!owned) {
    // Deliberately a 404, not a 403: confirming the row exists would leak
    // that some other citizen holds it.
    throw new HttpError('Not found', 404);
  }

  return row;
}
