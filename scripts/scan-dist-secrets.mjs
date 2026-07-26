#!/usr/bin/env node
/**
 * Post-build guard: scan the built bundle for credential-shaped strings.
 *
 * `check-vite-env.mjs` catches secrets that arrive through the environment.
 * This catches the other route -- a key pasted directly into source, which is
 * how the mirror-service secret ended up in the bundle.
 *
 * Runs as `postbuild`, so a leaking bundle fails the Netlify build instead of
 * being deployed.
 */

import fs from 'node:fs';
import path from 'node:path';

const DIST = path.resolve(process.cwd(), 'dist');

/** Credential formats with recognisable prefixes. */
const PATTERNS = [
  { name: 'Anthropic API key', re: /sk-ant-[A-Za-z0-9_-]{10,}/g },
  { name: 'OpenRouter API key', re: /sk-or-v1-[A-Za-z0-9_-]{10,}/g },
  { name: 'OpenAI API key', re: /\bsk-proj-[A-Za-z0-9_-]{10,}/g },
  { name: 'GitHub token', re: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}/g },
  { name: 'GitHub fine-grained PAT', re: /\bgithub_pat_[A-Za-z0-9_]{20,}/g },
  { name: 'Netlify token', re: /\bnfp_[A-Za-z0-9]{20,}/g },
  { name: 'Google API key', re: /\bAIza[A-Za-z0-9_-]{30,}/g },
  { name: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/g },
  { name: 'AWS access key id', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'Private key block', re: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
];

/**
 * Extra literal strings to scan for, supplied by the environment at build
 * time. Use this to assert a specific known secret (e.g. the Baserow account
 * password) is absent, without writing it into the repository.
 *
 *   SECRET_SCAN_LITERALS='hunter2,another-secret' npm run build
 */
const LITERALS = (process.env.SECRET_SCAN_LITERALS || '')
  .split(',')
  .map((value) => value.trim())
  .filter((value) => value.length >= 6);

function* walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (entry.isFile()) {
      yield full;
    }
  }
}

if (!fs.existsSync(DIST)) {
  console.error('scan-dist-secrets: dist/ not found -- run the build first.');
  process.exit(1);
}

const findings = [];

for (const file of walk(DIST)) {
  // Only text-like assets can leak a readable credential.
  if (!/\.(js|mjs|cjs|css|html|json|map|txt|svg)$/i.test(file)) continue;

  const content = fs.readFileSync(file, 'utf8');
  const relative = path.relative(process.cwd(), file);

  for (const { name, re } of PATTERNS) {
    const matches = content.match(re);
    if (matches) {
      findings.push({ file: relative, name, sample: `${matches[0].slice(0, 12)}...` });
    }
  }

  for (const literal of LITERALS) {
    if (content.includes(literal)) {
      findings.push({ file: relative, name: 'known secret literal', sample: '(redacted)' });
    }
  }
}

if (findings.length > 0) {
  console.error('\n[31mBuild blocked: credentials found in the built bundle.[0m\n');
  for (const finding of findings) {
    console.error(`  ${finding.file}: ${finding.name} (${finding.sample})`);
  }
  console.error(
    '\nThe bundle is public. Move the credential behind a Netlify Function in\n' +
      'netlify/functions/ and call it from the client instead.\n'
  );
  process.exit(1);
}

console.log(
  `scan-dist-secrets: scanned dist/ against ${PATTERNS.length} patterns` +
    `${LITERALS.length ? ` and ${LITERALS.length} literal(s)` : ''}. CLEAN`
);
