import fs from 'fs';
import path from 'path';

const REQUIRED = {
  'backend': ['BACKEND_PORT'],
  'dev-server': ['BACKEND_URL'],
  'frontend': ['NEXT_PUBLIC_APP_URL']
};

function hasAny(list) {
  return list.some((k) => !!process.env[k]);
}

export function loadDotEnvFiles() {
  const candidates = ['.env.local', '.env'];
  for (const file of candidates) {
    const p = path.resolve(process.cwd(), file);
    if (fs.existsSync(p)) {
      // eslint-disable-next-line global-require
      require('dotenv').config({ path: p });
    }
  }
}

export function validateEnv(runtime, { strict } = {}) {
  const missing = [];
  for (const key of (REQUIRED[runtime] || [])) {
    if (!process.env[key]) missing.push(key);
  }

  if (runtime === 'backend') {
    const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
    const hasPath = !!process.env.FIREBASE_SERVICE_ACCOUNT_PATH || !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const hasPair = !!process.env.FIREBASE_CLIENT_EMAIL && !!process.env.FIREBASE_PRIVATE_KEY;
    if (!hasServiceAccount && !hasPath && !hasPair) {
      missing.push('FIREBASE_SERVICE_ACCOUNT | FIREBASE_SERVICE_ACCOUNT_PATH | FIREBASE_CLIENT_EMAIL+FIREBASE_PRIVATE_KEY');
    }
  }

  if (runtime === 'dev-server') {
    if (!hasAny(['BACKEND_INTERNAL_URL', 'BACKEND_URL', 'BACKEND_DEV_URL'])) {
      missing.push('BACKEND_INTERNAL_URL | BACKEND_URL | BACKEND_DEV_URL');
    }
  }

  const shouldStrict = strict || process.env.STRICT_ENV === 'true';
  if (missing.length) {
    const where = String(runtime || '').toUpperCase();
    const msg = [
      `Environment validation failed for ${where}.`,
      'Missing variables:',
      ...missing.map((k) => `  - ${k}`),
      '',
      'Add them to .env.local or your host configuration. See .env.example for guidance.',
    ].join('\n');
    if (shouldStrict) throw new Error(msg);
    // eslint-disable-next-line no-console
    console.warn(`\n⚠️  ${msg}\n`);
  }
}

