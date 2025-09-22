import type { Request, Response } from 'express';
import { Router } from 'express';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';

import { getDb, getAuthAdmin, verifyBearer } from '../lib/firebase-admin.js';

interface AuthResult {
  uid: string;
}

interface RBACContext {
  userId: string;
  role: string;
  accessibleCoaches: string[];
  isSuperAdmin: boolean;
}

async function requireAuth(req: Request, res: Response): Promise<AuthResult | null> {
  const auth = await verifyBearer(req as unknown as { headers: Request['headers'] });
  if (!auth) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return null;
  }

  return { uid: auth.uid };
}

function toIso(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return undefined;
}

async function getAccessibleCoaches(db: Firestore, userId: string, userData: Record<string, unknown>): Promise<string[]> {
  const role = (userData.role as string) ?? 'creator';

  if (role === 'super_admin') {
    const coachesSnapshot = await db.collection('users').where('role', '==', 'coach').get();
    return coachesSnapshot.docs.map((doc) => doc.id);
  }

  if (role === 'coach') {
    return [userId];
  }

  if (typeof userData.coachId === 'string' && userData.coachId.trim()) {
    return [userData.coachId.trim()];
  }

  const accessDoc = await db.collection('user_coach_access').doc(userId).get();
  if (accessDoc.exists) {
    const accessData = accessDoc.data();
    if (Array.isArray(accessData?.coaches)) {
      return accessData.coaches.map((coachId: unknown) => String(coachId));
    }
  }

  return [];
}

async function getRBACContext(db: Firestore, userId: string): Promise<RBACContext> {
  const userSnap = await db.collection('users').doc(userId).get();
  const userData = userSnap.data() ?? {};
  const role = (userData.role as string) ?? 'creator';
  const accessibleCoaches = await getAccessibleCoaches(db, userId, userData);

  return {
    userId,
    role,
    accessibleCoaches,
    isSuperAdmin: role === 'super_admin',
  };
}

async function hasResourceAccess(
  db: Firestore,
  context: RBACContext,
  resourceType: 'collection' | 'video' | 'user',
  resourceId: string,
): Promise<boolean> {
  if (context.isSuperAdmin) {
    return true;
  }

  if (context.accessibleCoaches.length === 0) {
    return false;
  }

  const collectionName = resourceType === 'collection' ? 'collections' : 'videos';
  if (resourceType === 'user') {
    return context.accessibleCoaches.includes(resourceId) || resourceId === context.userId;
  }

  const snapshot = await db
    .collection(collectionName)
    .where('id', '==', resourceId)
    .where('userId', 'in', context.accessibleCoaches)
    .limit(1)
    .get();

  return !snapshot.empty;
}

async function canPerformAction(
  db: Firestore,
  context: RBACContext,
  action: 'read' | 'write' | 'delete',
  resourceType: 'collection' | 'video' | 'user',
  resourceId?: string,
): Promise<boolean> {
  if (context.isSuperAdmin) {
    return true;
  }

  if (resourceId) {
    return hasResourceAccess(db, context, resourceType, resourceId);
  }

  switch (action) {
    case 'read':
      return context.accessibleCoaches.length > 0 || context.role === 'coach';
    case 'write':
      return context.role === 'coach' || context.role === 'creator';
    case 'delete':
      return context.role === 'coach';
    default:
      return false;
  }
}

export const authRouter = Router();

authRouter.get('/profile', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = getDb();
  if (!db) {
    res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    return;
  }

  const adminAuth = getAuthAdmin();
  if (!adminAuth) {
    res.status(500).json({ success: false, error: 'Authentication service unavailable' });
    return;
  }

  try {
    const userRecord = await adminAuth.getUser(auth.uid);
    const profileDoc = await db.collection('users').doc(auth.uid).get();
    const profileData = profileDoc.data() ?? {};
    const rbacContext = await getRBACContext(db, auth.uid);

    res.json({
      success: true,
      user: {
        id: auth.uid,
        uid: auth.uid,
        email: userRecord.email ?? profileData.email ?? '',
        name: (profileData.name as string) ?? userRecord.displayName ?? '',
        displayName: (profileData.name as string) ?? userRecord.displayName ?? '',
        avatar: profileData.avatar ?? userRecord.photoURL ?? null,
        role: rbacContext.role,
        plan: profileData.plan ?? null,
        emailVerified: userRecord.emailVerified ?? false,
        isSuperAdmin: rbacContext.isSuperAdmin,
        accessibleCoaches: rbacContext.accessibleCoaches,
        preferences: profileData.preferences ?? {},
        createdAt: toIso(profileData.createdAt),
        updatedAt: toIso(profileData.updatedAt),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[backend][auth] Error fetching profile:', message);
    res.status(500).json({ success: false, error: 'Failed to fetch user profile' });
  }
});

authRouter.put('/profile', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = getDb();
  if (!db) {
    res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    return;
  }

  const adminAuth = getAuthAdmin();
  if (!adminAuth) {
    res.status(500).json({ success: false, error: 'Authentication service unavailable' });
    return;
  }

  try {
    const body = (req.body ?? {}) as Record<string, unknown>;
    const updateData: Record<string, unknown> = {};

    const newNameCandidate = (body.displayName as string) || (body.name as string);
    if (typeof newNameCandidate === 'string' && newNameCandidate.trim()) {
      const trimmed = newNameCandidate.trim();
      updateData.name = trimmed;
      try {
        await adminAuth.updateUser(auth.uid, { displayName: trimmed });
      } catch (error) {
        console.warn('[backend][auth] Failed to update auth display name:', error);
      }
    }

    if (body.preferences && typeof body.preferences === 'object') {
      updateData.preferences = body.preferences;
    }

    if (typeof body.avatar === 'string') {
      updateData.avatar = body.avatar;
    }

    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = FieldValue.serverTimestamp();
      await db.collection('users').doc(auth.uid).set(updateData, { merge: true });
    }

    const userRecord = await adminAuth.getUser(auth.uid);
    const profileDoc = await db.collection('users').doc(auth.uid).get();
    const profileData = profileDoc.data() ?? {};

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: auth.uid,
        uid: auth.uid,
        email: userRecord.email ?? profileData.email ?? '',
        name: (profileData.name as string) ?? userRecord.displayName ?? '',
        displayName: (profileData.name as string) ?? userRecord.displayName ?? '',
        avatar: profileData.avatar ?? userRecord.photoURL ?? null,
        role: profileData.role ?? 'creator',
        plan: profileData.plan ?? null,
        emailVerified: userRecord.emailVerified ?? false,
        preferences: profileData.preferences ?? {},
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[backend][auth] Error updating profile:', message);
    res.status(500).json({ success: false, error: 'Failed to update profile' });
  }
});

authRouter.post('/rbac/can-perform', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = getDb();
  if (!db) {
    res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    return;
  }

  try {
    const body = (req.body ?? {}) as {
      userId?: string;
      action?: 'read' | 'write' | 'delete';
      resourceType?: 'collection' | 'video' | 'user';
      resourceId?: string;
    };

    if (!body.action || !body.resourceType) {
      res.status(400).json({ success: false, error: 'Missing required parameters: action and resourceType' });
      return;
    }

    const currentContext = await getRBACContext(db, auth.uid);

    let targetUserId = auth.uid;
    if (body.userId && body.userId !== auth.uid) {
      if (currentContext.isSuperAdmin) {
        targetUserId = body.userId;
      } else {
        res.status(403).json({ success: false, error: 'Insufficient permissions to check other users' });
        return;
      }
    }

    const targetContext = targetUserId === auth.uid
      ? currentContext
      : await getRBACContext(db, targetUserId);

    const canPerform = await canPerformAction(
      db,
      targetContext,
      body.action,
      body.resourceType,
      body.resourceId,
    );

    res.json({
      success: true,
      userId: targetUserId,
      action: body.action,
      resourceType: body.resourceType,
      resourceId: body.resourceId ?? null,
      canPerform,
    });
  } catch (error) {
    console.error('[backend][auth] Error checking permissions:', error);
    res.status(200).json({ success: true, userId: auth.uid, canPerform: false });
  }
});

authRouter.post('/rbac/context', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = getDb();
  if (!db) {
    res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    return;
  }

  try {
    const body = (req.body ?? {}) as { userId?: string };
    const currentContext = await getRBACContext(db, auth.uid);

    let targetUserId = auth.uid;
    if (body.userId && body.userId !== auth.uid) {
      if (currentContext.isSuperAdmin) {
        targetUserId = body.userId;
      } else {
        res.status(403).json({ success: false, error: 'Insufficient permissions to query other users' });
        return;
      }
    }

    const targetContext = targetUserId === auth.uid
      ? currentContext
      : await getRBACContext(db, targetUserId);

    res.json({
      success: true,
      userId: targetUserId,
      role: targetContext.role,
      accessibleCoaches: targetContext.accessibleCoaches,
      isSuperAdmin: targetContext.isSuperAdmin,
    });
  } catch (error) {
    console.error('[backend][auth] Error retrieving RBAC context:', error);
    res.status(200).json({
      success: true,
      userId: auth.uid,
      role: 'creator',
      accessibleCoaches: [],
      isSuperAdmin: false,
    });
  }
});

authRouter.post('/rbac/is-super-admin', async (req, res) => {
  const auth = await requireAuth(req, res);
  if (!auth) return;

  const db = getDb();
  if (!db) {
    res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    return;
  }

  try {
    const body = (req.body ?? {}) as { userId?: string };
    const currentContext = await getRBACContext(db, auth.uid);

    let targetUserId = auth.uid;
    if (body.userId && body.userId !== auth.uid) {
      if (currentContext.isSuperAdmin) {
        targetUserId = body.userId;
      } else {
        res.status(403).json({ success: false, error: 'Insufficient permissions to check other users' });
        return;
      }
    }

    const targetContext = targetUserId === auth.uid
      ? currentContext
      : await getRBACContext(db, targetUserId);

    res.json({ success: true, userId: targetUserId, isSuperAdmin: targetContext.isSuperAdmin });
  } catch (error) {
    console.error('[backend][auth] Error checking super admin status:', error);
    res.status(200).json({ success: true, userId: auth.uid, isSuperAdmin: false });
  }
});
