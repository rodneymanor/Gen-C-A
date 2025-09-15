import { getAdminDb } from './firebase-admin';

export async function verifyVideoOwnership(userId: string, videoId: string): Promise<{
  exists: boolean;
  isOwner: boolean;
  data?: any;
}> {
  const db = getAdminDb();
  if (!db) return { exists: false, isOwner: false };
  try {
    const snap = await db.collection('videos').doc(String(videoId)).get();
    if (!snap.exists) return { exists: false, isOwner: false };
    const data = snap.data();
    const isOwner = data?.userId === userId;
    return { exists: true, isOwner, data };
  } catch (e) {
    console.error('[collections-helpers] verifyVideoOwnership error:', e);
    return { exists: false, isOwner: false };
  }
}

export default {
  verifyVideoOwnership,
};

