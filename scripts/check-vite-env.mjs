#!/usr/bin/env node
/**
 * Build-time guard: refuse to build if a secret-shaped `VITE_` variable exists.
 *
 * Vite inlines every `VITE_`-prefixed variable into the JavaScript bundle at
 * build time. There is no way to hide one afterwards -- static assets are
 * served before any authentication happens, so "it's behind a login" is not a
 * protection. A credential in a `VITE_` variable is a published credential.
 *
 * This runs as `prebuild`, so it fails the Netlify build rather than shipping.
 * Secrets belong in a non-`VITE_` variable read by a Netlify Function
 * (see `netlify/functions/`).
 */

import fs from 'node:fs';
import path from 'node:path';

/** Names ending in these are treated as credentials. */
const SECRET_SUFFIX = /(PASSWORD|TOKEN|SECRET|_KEY|PAT)$/;

/**
 * Names that match the pattern above but are demonstrably not credentials.
 * Keep this list short and justify every entry.
 */
const ALLOWLIST = new Set([
  // Public Auth0 SPA client identifier -- designed to be public, and already
  // visible in every login redirect.
  'VITE_AUTH0_CLIENT_ID',
]);

function collectNames() {
  const names = new Set();

  for (const key of Object.keys(process.env)) {
    if (key.startsWith('VITE_')) names.add(key);
  }

  // Also inspect any .env files Vite would load, so the guard catches a local
  // mistake before it is ever pushed.
  const root = process.cwd();
  for (const file of fs.readdirSync(root)) {
    if (!file.startsWith('.env')) continue;
    const full = path.join(root, file);
    if (!fs.statSync(full).isFile()) continue;

    for (const line of fs.readFileSync(full, 'utf8').split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = /^([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/.exec(trimmed);
      if (!match) continue;
      // Only flag variables that actually carry a value.
      if (match[1].startsWith('VITE_') && match[2].trim() !== '') {
        names.add(match[1]);
      }
    }
  }

  return names;
}

const offenders = [...collectNames()]
  .filter((name) => SECRET_SUFFIX.test(name) && !ALLOWLIST.has(name))
  .sort();

if (offenders.length > 0) {
  console.error('\n[31mBuild blocked: secret-shaped VITE_ variables found.[0m\n');
  for (const name of offenders) {
    console.error(`  - ${name}`);
  }
  console.error(
    '\nEverything prefixed VITE_ is inlined into the public JavaScript bundle.\n' +
      'Move each of these to a non-VITE_ variable and read it from a Netlify\n' +
      'Function in netlify/functions/ instead.\n\n' +
      'If one of these genuinely is not a credential, add it to ALLOWLIST in\n' +
      'scripts/check-vite-env.mjs with a comment explaining why.\n'
  );
  process.exit(1);
}

console.log('check-vite-env: no secret-shaped VITE_ variables. OK');
