// Load Firebase Admin compatibly in dev (TS) and prod (bundled JS)
async function loadFirebaseAdmin() {
  try {
    const mod = await import('../lib/firebase-admin.js');
    return mod.getAdminDb;
  } catch (e) {
    const mod = await import('../lib/firebase-admin.ts');
    return mod.getAdminDb;
  }
}

/**
 * GET /api/creator/analyzed-video-ids?handle=foo
 * Returns list of videoIds already analyzed for a creator (from scriptStructures)
 */
export async function handleListAnalyzedVideoIds(req, res) {
  try {
    const getAdminDb = await loadFirebaseAdmin();
    const handle = String(req.query?.handle || req.query?.creator || '').replace(/^@/, '').trim();
    const creatorId = String(req.query?.creatorId || '').trim();

    if (!handle && !creatorId) {
      return res.status(400).json({ success: false, error: 'handle or creatorId required' });
    }

    const db = getAdminDb();
    if (!db) {
      return res.json({ success: true, videoIds: [] });
    }

    let resolvedCreatorId = creatorId;

    if (!resolvedCreatorId) {
      // Resolve creatorId by handle
      const creatorsRef = db.collection('creators');
      const existing = await creatorsRef.where('handle', '==', handle).limit(1).get();
      if (existing.empty) {
        return res.json({ success: true, videoIds: [] });
      }
      resolvedCreatorId = existing.docs[0].id;
    }

    const q = await db
      .collection('scriptStructures')
      .where('creatorId', '==', resolvedCreatorId)
      .get();

    const ids = new Set();
    q.forEach((doc) => {
      const v = doc.data()?.videoId;
      if (v) ids.add(String(v));
    });

    return res.json({ success: true, videoIds: Array.from(ids) });
  } catch (error) {
    console.error('List analyzed video ids error:', error);
    return res.status(500).json({ success: false, error: 'Failed to list analyzed videos' });
  }
}
