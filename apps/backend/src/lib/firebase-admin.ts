import fs from 'fs';
import path from 'path';
import type { IncomingHttpHeaders } from 'http';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let initialized = false;

function initAdmin(): void {
  if (initialized || getApps().length) {
    initialized = true;
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  try {
    if (projectId && clientEmail && privateKey) {
      console.log('[firebase-admin] Initializing with inline service account.');
      initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
      initialized = true;
      return;
    }

    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (serviceAccountPath) {
      const resolved = path.isAbsolute(serviceAccountPath)
        ? serviceAccountPath
        : path.join(process.cwd(), serviceAccountPath);

      if (fs.existsSync(resolved)) {
        console.log('[firebase-admin] Initializing from service account file:', resolved);
        const content = JSON.parse(fs.readFileSync(resolved, 'utf8'));
        initializeApp({ credential: cert(content) });
        initialized = true;
        return;
      }
    }

    console.log('[firebase-admin] Falling back to applicationDefault credentials.');
    initializeApp({ credential: applicationDefault() });
    initialized = true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[firebase-admin] initialization failed, falling back to JSON store:', message);
  }
}

export function getDb(): Firestore | null {
  initAdmin();
  try {
    return getFirestore();
  } catch {
    return null;
  }
}

export function getCollectionRefByPath(
  db: Firestore | null,
  pathTemplate: string | undefined,
  uid: string
) {
  if (!db || !pathTemplate) return null;

  try {
    const segments = String(pathTemplate).split('/').filter(Boolean);
    let ref: any = null;

    for (let index = 0; index < segments.length; index++) {
      const segment = segments[index];
      const isCollection = index % 2 === 0;

      if (isCollection) {
        ref = ref ? ref.collection(segment) : db.collection(segment);
      } else {
        const id = segment === '{uid}' ? uid : segment;
        ref = ref.doc(id);
      }
    }

    return ref && typeof ref.add === 'function' ? ref : null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[firebase-admin] getCollectionRefByPath failed:', message);
    return null;
  }
}

export interface VerifiedBearer {
  uid: string;
  token: unknown;
}

export async function verifyBearer(headersCarrier: { headers: IncomingHttpHeaders }): Promise<VerifiedBearer | null> {
  initAdmin();
  const { headers } = headersCarrier;
  const header = headers['authorization'] || headers['Authorization'];
  if (typeof header !== 'string' || !header.startsWith('Bearer ')) {
    return null;
  }

  const token = header.slice('Bearer '.length);

  try {
    const auth = getAuth();
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid, token: decoded };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[firebase-admin] verifyIdToken failed:', message);
    return null;
  }
}

export function getAuthAdmin() {
  initAdmin();
  try {
    return getAuth();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[firebase-admin] getAuth failed:', message);
    return null;
  }
}
