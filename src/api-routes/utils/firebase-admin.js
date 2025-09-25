import fs from 'fs';
import path from 'path';
import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';

function initAdmin() {
  if (getApps().length) return;

  // Prefer explicit service account from env vars
  // 1) FULL JSON via FIREBASE_SERVICE_ACCOUNT (parity with src/lib/firebase-admin.ts)
  // 2) Triplet env vars (PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY)
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  try {
    // Prefer full JSON blob if provided (common in Vercel)
    if (saJson) {
      const serviceAccount = JSON.parse(saJson);
      initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
      return;
    }

    if (projectId && clientEmail && privateKey) {
      initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
      return;
    }

    // Try service account file
    const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (saPath) {
      const resolved = path.isAbsolute(saPath) ? saPath : path.join(process.cwd(), saPath);
      if (fs.existsSync(resolved)) {
        const content = JSON.parse(fs.readFileSync(resolved, 'utf8'));
        initializeApp({ credential: cert(content) });
        return;
      }
    }

    // Fallback to ADC
    initializeApp({ credential: applicationDefault() });
  } catch (e) {
    console.warn('[firebase-admin] init failed, will use local JSON store. Error:', e?.message);
  }
}

export function getDb() {
  initAdmin();
  try {
    return getFirestore();
  } catch {
    return null;
  }
}

// Helper: resolve a Firestore collection reference from a path template like
// "scripts" or "users/{uid}/scripts" or deeper nested forms.
export function getCollectionRefByPath(db, pathTemplate, uid) {
  if (!db || !pathTemplate) return null;
  try {
    const parts = String(pathTemplate).split('/').filter(Boolean);
    let ref = null;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i % 2 === 0) {
        // collection segment
        ref = ref ? ref.collection(part) : db.collection(part);
      } else {
        // document segment
        const id = part === '{uid}' ? uid : part;
        ref = ref.doc(id);
      }
    }
    // Expect final to be a collection ref (odd number of segments → collection)
    return ref && typeof ref.add === 'function' ? ref : null;
  } catch (e) {
    console.warn('[firebase-admin] getCollectionRefByPath failed:', e?.message);
    return null;
  }
}

export async function verifyBearer(req) {
  initAdmin();
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice('Bearer '.length);
  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifyIdToken(token);
    return { uid: decoded.uid, token: decoded };
  } catch (e) {
    console.warn('[firebase-admin] verifyIdToken failed:', e?.message);
    return null;
  }
}
