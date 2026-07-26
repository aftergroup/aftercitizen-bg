/**
 * Auth0 token verification for AfterCitizen functions.
 *
 * The SPA currently requests no custom API audience, so `getAccessTokenSilently`
 * yields an opaque token that cannot be verified here. We therefore verify the
 * **ID token**, which is an RS256 JWT signed by the same tenant and verifiable
 * against the same JWKS, with `aud` equal to the SPA client id.
 *
 * PREFERRED HARDENING: register an Auth0 API, add its identifier as
 * `authorizationParams.audience` in src/App.tsx, and set AUTH0_AUDIENCE here.
 * This module accepts either, so that migration needs no change on this side.
 *
 * Server-side environment:
 *   AUTH0_DOMAIN      tenant domain, e.g. example.eu.auth0.com
 *   AUTH0_CLIENT_ID   SPA client id (audience of the ID token)
 *   AUTH0_AUDIENCE    optional custom API identifier, once one exists
 */

import { createRemoteJWKSet, jwtVerify } from 'jose';
import { HttpError } from './http.mjs';

const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

let jwks;

function getJwks() {
  if (!AUTH0_DOMAIN) {
    throw new HttpError('Server is missing AUTH0_DOMAIN configuration', 500);
  }
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${AUTH0_DOMAIN}/.well-known/jwks.json`));
  }
  return jwks;
}

function bearerToken(request) {
  const header = request.headers.get('authorization') || '';
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  if (!match) throw new HttpError('Missing bearer token', 401);
  return match[1];
}

/**
 * Verify the caller's Auth0 token and return its subject.
 *
 * The `sub` returned here is the ONLY trustworthy identity in a request.
 * Never take a user id, email or row id from the request body.
 */
export async function requireUser(request) {
  const audiences = [AUTH0_AUDIENCE, AUTH0_CLIENT_ID].filter(Boolean);
  if (audiences.length === 0) {
    throw new HttpError('Server is missing AUTH0_CLIENT_ID configuration', 500);
  }

  const token = bearerToken(request);

  let payload;
  try {
    ({ payload } = await jwtVerify(token, getJwks(), {
      issuer: `https://${AUTH0_DOMAIN}/`,
      audience: audiences,
    }));
  } catch (error) {
    console.warn('[auth] token verification failed:', error.message);
    throw new HttpError('Invalid or expired session', 401);
  }

  if (!payload.sub) {
    throw new HttpError('Token has no subject', 401);
  }

  return {
    sub: payload.sub,
    email: String(payload.email || '').toLowerCase(),
    claims: payload,
  };
}
