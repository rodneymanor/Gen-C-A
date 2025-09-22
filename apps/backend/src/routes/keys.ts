import { Router, type Request, type Response } from 'express';
import { randomBytes, createHash } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';

import { getDb, verifyBearer, getAuthAdmin } from '../lib/firebase-admin.js';

const KEY_PREFIX = 'gencbeta_';

function maskKeyId(hash: string) {
  return hash.slice(0, 8);
}

type FirestoreDb = NonNullable<ReturnType<typeof getDb>>;

async function syncApiKeyState(
  db: FirestoreDb,
  uid: string,
  hash: string,
  apiKey: string | undefined,
  status: 'active' | 'disabled',
) {
  if (!apiKey) return;

  const now = FieldValue.serverTimestamp();
  const keyRef = db.collection('user_api_keys').doc(hash);
  const keyDoc = await keyRef.get();
  const payload: Record<string, unknown> = {
    userId: uid,
    status,
    managed: true,
    keyId: maskKeyId(hash),
    lastUpdatedAt: now,
  };

  if (!keyDoc.exists) {
    payload.createdAt = now;
  }

  if (status === 'active') {
    payload.revokedAt = FieldValue.delete();
  } else {
    payload.revokedAt = now;
  }

  await keyRef.set(payload, { merge: true });

  const userRef = db.collection('users').doc(uid);
  const userUpdate =
    status === 'active'
      ? { apiKeys: FieldValue.arrayUnion(apiKey) }
      : { apiKeys: FieldValue.arrayRemove(apiKey) };

  await userRef.set(userUpdate, { merge: true });
}

async function requireAuth(req: Request, res: Response) {
  const auth = await verifyBearer(req as unknown as { headers: Request['headers'] });
  if (!auth) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return null;
  }
  return auth;
}

export const keysRouter = Router();

keysRouter.post('/', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = getDb();
  if (!db) {
    res.status(503).json({ success: false, error: 'Firestore unavailable' });
    return;
  }

  try {
    const active = await db
      .collection('users')
      .doc(auth.uid)
      .collection('apiKeys')
      .where('status', '==', 'active')
      .limit(1)
      .get();

    if (!active.empty) {
      // Rotate existing active keys by disabling them before issuing a new one
      const now = FieldValue.serverTimestamp();
      const batch = db.batch();
      const syncOps: Array<Promise<void>> = [];
      for (const doc of active.docs) {
        const data = doc.data() as { apiKey?: string };
        batch.update(doc.ref, { status: 'disabled', revokedAt: now });
        if (data?.apiKey) {
          syncOps.push(
            syncApiKeyState(db as FirestoreDb, auth.uid, doc.id, String(data.apiKey), 'disabled'),
          );
        }
      }
      await batch.commit();
      await Promise.all(syncOps);
    }

    const rawKey = randomBytes(32).toString('base64url');
    const apiKey = `${KEY_PREFIX}${rawKey}`;
    const hash = createHash('sha256').update(apiKey).digest('hex');

    await db
      .collection('users')
      .doc(auth.uid)
      .collection('apiKeys')
      .doc(hash)
      .set({
        createdAt: FieldValue.serverTimestamp(),
        status: 'active',
        requestCount: 0,
        violations: 0,
        apiKey,
      });

    await syncApiKeyState(db as FirestoreDb, auth.uid, hash, apiKey, 'active');

    const authAdmin = getAuthAdmin();
    let email: string | null = null;
    if (authAdmin) {
      try {
        const userRecord = await authAdmin.getUser(auth.uid);
        email = userRecord.email ?? null;
      } catch (error) {
        console.warn('[keys] Failed to load user record for', auth.uid, error);
      }
    }

    res.status(201).json({
      success: true,
      apiKey,
      message: 'API key generated successfully',
      warning: 'This key will only be shown once. Please store it securely.',
      user: {
        id: auth.uid,
        email,
      },
      metadata: {
        keyId: maskKeyId(hash),
      },
    });
  } catch (error) {
    console.error('[keys] Failed to generate key:', error);
    res.status(500).json({ success: false, error: 'Failed to generate API key' });
  }
});

keysRouter.delete('/', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = getDb();
  if (!db) {
    res.status(503).json({ success: false, error: 'Firestore unavailable' });
    return;
  }

  try {
    const active = await db
      .collection('users')
      .doc(auth.uid)
      .collection('apiKeys')
      .where('status', '==', 'active')
      .get();

    if (active.empty) {
      res.status(404).json({ success: false, error: 'No active API key found' });
      return;
    }

    const batch = db.batch();
    const syncOperations: Array<Promise<void>> = [];
    for (const doc of active.docs) {
      const data = doc.data() as { apiKey?: string };
      batch.update(doc.ref, {
        status: 'disabled',
        revokedAt: FieldValue.serverTimestamp(),
      });
      if (data?.apiKey) {
        syncOperations.push(syncApiKeyState(db as FirestoreDb, auth.uid, doc.id, String(data.apiKey), 'disabled'));
      }
    }
    await batch.commit();
    await Promise.all(syncOperations);

    res.json({ success: true, revoked: active.size });
  } catch (error) {
    console.error('[keys] Failed to revoke key:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke API key' });
  }
});

keysRouter.get('/', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = getDb();
  if (!db) {
    res.status(503).json({ success: false, error: 'Firestore unavailable' });
    return;
  }

  try {
    const snapshot = await db
      .collection('users')
      .doc(auth.uid)
      .collection('apiKeys')
      .orderBy('createdAt', 'desc')
      .get();

    const syncOperations: Array<Promise<void>> = [];
    const keys = snapshot.docs.map((doc) => {
      const data = doc.data();
      if (data?.apiKey && data.status === 'active') {
        syncOperations.push(syncApiKeyState(db as FirestoreDb, auth.uid, doc.id, String(data.apiKey), 'active'));
      }
      return {
        keyId: maskKeyId(doc.id),
        status: data.status,
        createdAt: data.createdAt,
        lastUsed: data.lastUsed,
        requestCount: data.requestCount ?? 0,
        violations: data.violations ?? 0,
        lockoutUntil: data.lockoutUntil,
        revokedAt: data.revokedAt,
        apiKey: data.apiKey,
      };
    });

    await Promise.all(syncOperations);

    const activeKey = keys.find((key) => key.status === 'active') ?? null;

    res.json({
      success: true,
      hasActiveKey: !!activeKey,
      activeKey,
      keyHistory: keys,
      limits: {
        requestsPerMinute: 50,
        violationLockoutHours: 1,
        maxViolationsBeforeLockout: 2,
      },
    });
  } catch (error) {
    console.error('[keys] Failed to load key status:', error);
    res.status(500).json({ success: false, error: 'Failed to load API key status' });
  }
});
