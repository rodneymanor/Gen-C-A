import { initializeApp, getApps, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

let db: Firestore | null = null;
let settingsApplied = false;
let loggedInit = false;

function detectCredentialMethod(): string {
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) return 'service_account_json';
    const triplet =
      (process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY;
    if (triplet) return 'triplet_env_vars';
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      return 'file_path_env';
    }
    return 'application_default_credentials_or_unknown';
  } catch {
    return 'unknown';
  }
}

export function getAdminDb(): Firestore | null {
  try {
    if (db) return db;

    // Initialize app if needed
    if (!getApps().length) {
      // Strategy order:
      // 1) FIREBASE_SERVICE_ACCOUNT (full JSON string)
      // 2) FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY
      // 3) FIREBASE_SERVICE_ACCOUNT_PATH or GOOGLE_APPLICATION_CREDENTIALS (file path)
      // 4) applicationDefault()

      const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
      const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;
      const privateKey = privateKeyEnv ? privateKeyEnv.replace(/\\n/g, '\n') : undefined;

      // 1) Full JSON blob (recommended for Vercel)
      if (saJson) {
        const serviceAccount = JSON.parse(saJson);
        initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
        if (!loggedInit) {
          console.log('[firebase-admin] initialized via service_account_json');
          loggedInit = true;
        }
      } else if (projectId && clientEmail && privateKey) {
        // 2) Triplet env vars
        initializeApp({ credential: cert({ projectId, clientEmail, privateKey }), projectId });
        if (!loggedInit) {
          console.log('[firebase-admin] initialized via triplet_env_vars');
          loggedInit = true;
        }
      } else {
        // 3) Service account file path
        let saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
        let resolvedPath = saPath ? (path.isAbsolute(saPath) ? saPath : path.join(process.cwd(), saPath)) : '';

        // Try to auto-discover a matching JSON file in project root if not provided or missing
        if (!resolvedPath || !fs.existsSync(resolvedPath)) {
          try {
            const files = fs
              .readdirSync(process.cwd())
              .filter((f) => /firebase-adminsdk-.*\.json$/i.test(f))
              .map((f) => ({ f, m: fs.statSync(path.join(process.cwd(), f)).mtimeMs }))
              .sort((a, b) => b.m - a.m)
              .map((x) => x.f);
            if (files.length > 0) {
              resolvedPath = path.join(process.cwd(), files[0]);
            }
          } catch {
            // ignore fs errors in serverless
          }
        }

        if (resolvedPath && fs.existsSync(resolvedPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
          initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
          if (!loggedInit) {
            console.log('[firebase-admin] initialized via service_account_file');
            loggedInit = true;
          }
        } else {
          // 4) ADC fallback
          initializeApp({ credential: applicationDefault() });
          if (!loggedInit) {
            console.log('[firebase-admin] initialized via application_default_credentials');
            loggedInit = true;
          }
        }
      }
    }

    db = getFirestore();
    if (!settingsApplied) {
      try {
        db.settings({ ignoreUndefinedProperties: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        if (!/settings\(\) once/i.test(message)) {
          throw error;
        }
      }
      settingsApplied = true;
    }
    return db;
  } catch (err) {
    try {
      const method = detectCredentialMethod();
      console.error('[firebase-admin] init error (method=' + method + '):', err);
    } catch {
      console.error('[firebase-admin] init error:', err);
    }
    return null;
  }
}

export function isAdminInitialized(): boolean {
  try {
    return getApps().length > 0;
  } catch {
    return false;
  }
}
