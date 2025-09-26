import fs from 'fs';
import path from 'path';

type Runtime = 'backend' | 'dev-server' | 'frontend';

// Centralized list of known variables. Keep alphabetized.
const KNOWN_VARS = [
  'ADMIN_API_KEY',
  'ADMIN_DEFAULT_USER_ID',
  'AI_API_KEY',
  'ALLOW_EXTENSION_KEY_FALLBACK',
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_API_VERSION',
  'ANTHROPIC_MODEL',
  'APIFY_TOKEN',
  'API_KEY',
  'API_URL',
  'APP_URL',
  'BACKEND_DEV_URL',
  'BACKEND_INTERNAL_URL',
  'BACKEND_PORT',
  'BACKEND_URL',
  'BUNNY_CDN_HOSTNAME',
  'BUNNY_STORAGE_CDN',
  'BUNNY_STORAGE_ENABLED',
  'BUNNY_STORAGE_HOST',
  'BUNNY_STORAGE_PASSWORD',
  'BUNNY_STORAGE_ZONE',
  'BUNNY_STREAM_API_KEY',
  'BUNNY_STREAM_LIBRARY_ID',
  'CDN_API_KEY',
  'CONTENT_CREATED_AT_FIELDS',
  'CONTENT_NOTES_PATH',
  'CONTENT_SCRIPTS_PATH',
  'CONTENT_UPDATED_AT_FIELDS',
  'CONTENT_USER_FIELD',
  'CRON_SECRET',
  'DEFAULT_BRAND_VOICE_ID',
  'DEFAULT_EXTENSION_USER_ID',
  'EXTENSION_API_KEYS',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_PROJECT_ID',
  'FIREBASE_SERVICE_ACCOUNT',
  'FIREBASE_SERVICE_ACCOUNT_PATH',
  'FIREBASE_TEST_EMAIL',
  'FIREBASE_TEST_PASSWORD',
  'FORCE_JSON_FALLBACK',
  'FRONTEND_URL',
  'GEMINI_API_KEY',
  'GEMINI_MODEL',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'HEADLESS',
  'INSTAGRAM_CLIENT_ID',
  'INSTAGRAM_CLIENT_SECRET',
  'INSTAGRAM_RAPIDAPI_KEY',
  'INSTAGRAM_USER_ID_CACHE_TTL_MS',
  'INTERNAL_API_SECRET',
  'INTERNAL_API_URL',
  'INTERNAL_APP_URL',
  'LLM_PROVIDER',
  'LOG_REQUEST_DEBUG',
  'NEW_AI_API_KEY',
  'NEXT_PUBLIC_API_KEY',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NODE_ENV',
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
  'PORT',
  'R',
  'RAPIDAPI_KEY',
  'RAPIDAPI_MAX_ATTEMPTS',
  'RAPIDAPI_THROTTLE_MS',
  'RAPIDAPI_YOUTUBE_HOST',
  'TEST_BASE_URL',
  'TIKTOK_CLIENT_ID',
  'TIKTOK_CLIENT_SECRET',
  'VERCEL_URL',
  'VIDEO_TRANSCRIBE_MAX_BYTES',
  'VIRAL_CONTENT_COLLECTION',
  'VIRAL_INSTAGRAM_USERNAME',
  'VIRAL_INSTAGRAM_USER_ID',
  'VIRAL_TIKTOK_USERNAME',
  'VIRAL_YOUTUBE_CHANNEL_ID',
  'VITE_ANTHROPIC_API_KEY',
  'VITE_BACKEND_URL',
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_GEMINI_API_KEY',
  'VITE_OPENAI_API_KEY',
  'YOUTUBE_API_KEY',
];

// Minimal required sets per runtime. We keep this conservative to avoid breaking dev unexpectedly.
const REQUIRED: Record<Runtime, string[]> = {
  backend: [
    'BACKEND_PORT',
    'FIREBASE_PROJECT_ID',
    // One of these must exist; validate loosely below
    // 'FIREBASE_SERVICE_ACCOUNT' | 'FIREBASE_SERVICE_ACCOUNT_PATH' | ('FIREBASE_CLIENT_EMAIL' & 'FIREBASE_PRIVATE_KEY')
  ],
  'dev-server': [
    'BACKEND_URL', // or BACKEND_DEV_URL/BACKEND_INTERNAL_URL (checked loosely)
  ],
  frontend: [
    'NEXT_PUBLIC_APP_URL',
  ],
};

function hasAny(vars: string[]): boolean {
  return vars.some((v) => !!process.env[v]);
}

export function validateEnv(runtime: Runtime, { strict }: { strict?: boolean } = {}) {
  const missing: string[] = [];

  // Baseline required
  for (const key of REQUIRED[runtime]) {
    if (!process.env[key]) missing.push(key);
  }

  // Backend special cases (Firebase admin creds)
  if (runtime === 'backend') {
    const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT;
    const hasPath = !!process.env.FIREBASE_SERVICE_ACCOUNT_PATH || !!process.env.GOOGLE_APPLICATION_CREDENTIALS;
    const hasPair = !!process.env.FIREBASE_CLIENT_EMAIL && !!process.env.FIREBASE_PRIVATE_KEY;
    if (!hasServiceAccount && !hasPath && !hasPair) {
      missing.push('FIREBASE_SERVICE_ACCOUNT | FIREBASE_SERVICE_ACCOUNT_PATH | FIREBASE_CLIENT_EMAIL+FIREBASE_PRIVATE_KEY');
    }
  }

  // Dev server backend target
  if (runtime === 'dev-server') {
    if (!hasAny(['BACKEND_INTERNAL_URL', 'BACKEND_URL', 'BACKEND_DEV_URL'])) {
      missing.push('BACKEND_INTERNAL_URL | BACKEND_URL | BACKEND_DEV_URL');
    }
  }

  const shouldStrict = strict || process.env.STRICT_ENV === 'true';
  if (missing.length) {
    const where = runtime.toUpperCase();
    const msg = [
      `Environment validation failed for ${where}.`,
      'Missing variables:',
      ...missing.map((k) => `  - ${k}`),
      '',
      'Add them to .env.local or your host configuration. See .env.example for guidance.',
    ].join('\n');

    if (shouldStrict) {
      throw new Error(msg);
    } else {
      // Print warning but continue (default during migration)
      // eslint-disable-next-line no-console
      console.warn(`\n⚠️  ${msg}\n`);
    }
  }

  // Construct a typed-ish env export for convenience
  const env: Record<string, string | undefined> = {};
  for (const key of KNOWN_VARS) env[key] = process.env[key];
  return env as Readonly<typeof env>;
}

// Utility to ensure .env.local is discoverable during scripts
export function loadDotEnvFiles() {
  const candidates = ['.env.local', '.env'];
  for (const file of candidates) {
    const p = path.resolve(process.cwd(), file);
    if (fs.existsSync(p)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require('dotenv').config({ path: p });
    }
  }
}

