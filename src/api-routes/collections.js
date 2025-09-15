/**
 * Collections + Videos API Routes (Express)
 * Migrated from Next.js route handlers to Vite-Express.
 * Uses Firebase Admin SDK directly to be Node-compatible.
 */

import { initializeApp, applicationDefault, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

// -----------------------------
// Firebase Admin Initialization
// -----------------------------
let adminDb = null;
function getAdminDb() {
  if (adminDb) return adminDb;

  if (!getApps().length) {
    try {
      // Prefer explicit JSON from env, then service account path, else ADC
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
      } else if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
        const saPath = path.isAbsolute(process.env.FIREBASE_SERVICE_ACCOUNT_PATH)
          ? process.env.FIREBASE_SERVICE_ACCOUNT_PATH
          : path.join(process.cwd(), process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
        if (fs.existsSync(saPath)) {
          const serviceAccount = JSON.parse(fs.readFileSync(saPath, 'utf8'));
          initializeApp({ credential: cert(serviceAccount), projectId: serviceAccount.project_id });
          // Set GOOGLE_APPLICATION_CREDENTIALS so underlying libs can pick it up
          process.env.GOOGLE_APPLICATION_CREDENTIALS = saPath;
        } else {
          // Fallback to ADC
          initializeApp({ credential: applicationDefault() });
        }
      } else {
        initializeApp({ credential: applicationDefault() });
      }
    } catch (err) {
      console.error('[collections-routes] Firebase Admin init error:', err);
      throw err;
    }
  }

  adminDb = getFirestore();
  // Do not call settings() here to avoid "settings() can only be called once" conflicts.
  return adminDb;
}

// -----------------------------
// Helpers: Auth/Access Context
// -----------------------------
async function getUserProfile(db, userId) {
  try {
    const snap = await db.collection('users').doc(userId).get();
    if (!snap.exists) return null;
    const data = snap.data() || {};
    return {
      uid: userId,
      email: data.email || '',
      displayName: data.name || data.displayName || 'User',
      role: data.role || 'creator',
      coachId: data.coachId,
      ...data,
    };
  } catch (e) {
    console.error('[collections-routes] getUserProfile error:', e);
    return null;
  }
}

async function getAccessibleCoaches(db, userProfile) {
  try {
    if (!userProfile) return [];
    if (userProfile.role === 'super_admin') {
      const qs = await db.collection('users').where('role', '==', 'coach').get();
      return qs.docs.map((d) => d.id);
    }
    if (userProfile.role === 'coach') return [userProfile.uid];
    if (userProfile.coachId) return [userProfile.coachId];

    const accessDoc = await db.collection('user_coach_access').doc(userProfile.uid).get();
    if (accessDoc.exists) return accessDoc.data()?.coaches || [];
    return [];
  } catch (e) {
    console.error('[collections-routes] getAccessibleCoaches error:', e);
    return [];
  }
}

function requireUserId(req, res) {
  const userId = req.headers['x-user-id'] || req.query.userId || (req.body && req.body.userId);
  if (!userId) {
    res.status(400).json({ success: false, error: 'userId required (x-user-id header or query/body param)' });
    return null;
  }
  return String(userId);
}

function validateApiKey(req, res) {
  const apiKey = req.headers['x-api-key'];
  const valid = apiKey && (apiKey === process.env.NEXT_PUBLIC_API_KEY || apiKey === process.env.API_KEY);
  if (!valid) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }
  return true;
}

// -----------------------------
// Route Handlers
// -----------------------------

export async function handleGetCollections(req, res) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const db = getAdminDb();
    const profile = await getUserProfile(db, userId);
    if (!profile) return res.status(404).json({ success: false, error: 'User not found' });

    let collections = [];
    if (profile.role === 'super_admin') {
      const qs = await db.collection('collections').orderBy('updatedAt', 'desc').get();
      collections = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
    } else {
      const coaches = await getAccessibleCoaches(db, profile);
      if (coaches.length === 0) return res.json({ success: true, collections: [], total: 0, accessibleCoaches: [] });
      const qs = await db
        .collection('collections')
        .where('userId', 'in', coaches.slice(0, 10)) // Firestore IN max 10 values
        .orderBy('updatedAt', 'desc')
        .get();
      collections = qs.docs.map((d) => ({ id: d.id, ...d.data() }));
    }

    res.json({ success: true, collections, total: collections.length });
  } catch (e) {
    console.error('[GET /api/collections] error:', e);
    res.status(500).json({ success: false, error: 'Failed to fetch collections' });
  }
}

export async function handleCreateCollection(req, res) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { title, description = '' } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }
    if (String(title).trim().length > 80) {
      return res.status(400).json({ success: false, error: 'Title too long (max 80)' });
    }
    if (String(description).trim().length > 500) {
      return res.status(400).json({ success: false, error: 'Description too long (max 500)' });
    }

    const db = getAdminDb();
    const profile = await getUserProfile(db, userId);
    if (!profile) return res.status(404).json({ success: false, error: 'User not found' });

    // Simple permission model: creators cannot create; coach/super_admin can
    if (profile.role === 'creator') {
      return res.status(403).json({ success: false, error: 'Insufficient permissions to create collections' });
    }

    const docRef = await db.collection('collections').add({
      title: String(title).trim(),
      description: String(description).trim(),
      userId,
      videoCount: 0,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      collection: { id: docRef.id, title: String(title).trim(), description: String(description).trim(), userId, videoCount: 0 },
    });
  } catch (e) {
    console.error('[POST /api/collections] error:', e);
    res.status(500).json({ success: false, error: 'Failed to create collection' });
  }
}

export async function handleGetUserCollections(req, res) {
  // Same as handleGetCollections for this app
  return handleGetCollections(req, res);
}

export async function handleGetCollectionVideos(req, res) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { collectionId, videoLimit } = req.body || {};
    const limit = Math.min(Number(videoLimit) || 24, 100);

    const db = getAdminDb();
    const profile = await getUserProfile(db, userId);
    if (!profile) return res.status(404).json({ success: false, error: 'User not found' });

    let videos = [];

    // If a specific collection is requested, verify access to that collection and fetch by collectionId only.
    // This avoids over-restricting by userId and reduces composite index requirements.
    if (collectionId && collectionId !== 'all-videos') {
      const collSnap = await db.collection('collections').doc(String(collectionId)).get();
      if (!collSnap.exists) return res.status(404).json({ success: false, error: 'Collection not found' });
      const ownerId = collSnap.data()?.userId;

      // Access check: super_admin always allowed. Others must have access to the collection owner
      if (profile.role !== 'super_admin') {
        const coaches = await getAccessibleCoaches(db, profile);
        const canAccess = ownerId && coaches.includes(ownerId);
        if (!canAccess) return res.status(403).json({ success: false, error: 'Access denied' });
      }

      try {
        const qs = await db
          .collection('videos')
          .where('collectionId', '==', collectionId)
          .orderBy('addedAt', 'desc')
          .limit(limit)
          .get();
        videos = qs.docs.map((d) => {
          const data = d.data();
          const addedAt = data.addedAt && typeof data.addedAt.toDate === 'function' ? data.addedAt.toDate().toISOString() : data.addedAt;
          const updatedAt = data.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate().toISOString() : data.updatedAt;
          return { id: d.id, ...data, addedAt, updatedAt };
        });
      } catch (err) {
        // Fallback: avoid composite index by querying without order and sorting in memory
        const backupLimit = Math.max(limit * 5, 100);
        const qs = await db
          .collection('videos')
          .where('collectionId', '==', collectionId)
          .limit(backupLimit)
          .get();
        videos = qs.docs.map((d) => {
          const data = d.data();
          const addedAt = data.addedAt && typeof data.addedAt.toDate === 'function' ? data.addedAt.toDate().toISOString() : data.addedAt;
          const updatedAt = data.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate().toISOString() : data.updatedAt;
          return { id: d.id, ...data, addedAt, updatedAt };
        });
        videos.sort((a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime());
        videos = videos.slice(0, limit);
      }

      return res.json({ success: true, videos, totalCount: videos.length });
    }

    // Otherwise, fetch latest videos across accessible owners
    if (profile.role === 'super_admin') {
      const qs = await db.collection('videos').orderBy('addedAt', 'desc').limit(limit).get();
      videos = qs.docs.map((d) => {
        const data = d.data();
        const addedAt = data.addedAt && typeof data.addedAt.toDate === 'function' ? data.addedAt.toDate().toISOString() : data.addedAt;
        const updatedAt = data.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate().toISOString() : data.updatedAt;
        return { id: d.id, ...data, addedAt, updatedAt };
      });
    } else {
      const coaches = await getAccessibleCoaches(db, profile);
      if (coaches.length === 0) return res.json({ success: true, videos: [], totalCount: 0 });
      try {
        const qs = await db
          .collection('videos')
          .where('userId', 'in', coaches.slice(0, 10))
          .orderBy('addedAt', 'desc')
          .limit(limit)
          .get();
        videos = qs.docs.map((d) => {
          const data = d.data();
          const addedAt = data.addedAt && typeof data.addedAt.toDate === 'function' ? data.addedAt.toDate().toISOString() : data.addedAt;
          const updatedAt = data.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate().toISOString() : data.updatedAt;
          return { id: d.id, ...data, addedAt, updatedAt };
        });
      } catch (err) {
        // Fallback without composite index: fetch recent videos globally then filter by accessible owners
        const backupLimit = Math.max(limit * 10, 200);
        const qs = await db
          .collection('videos')
          .orderBy('addedAt', 'desc')
          .limit(backupLimit)
          .get();
        const coachSet = new Set(coaches.slice(0, 10));
        videos = qs.docs
          .map((d) => {
            const data = d.data();
            const addedAt = data.addedAt && typeof data.addedAt.toDate === 'function' ? data.addedAt.toDate().toISOString() : data.addedAt;
            const updatedAt = data.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate().toISOString() : data.updatedAt;
            return { id: d.id, ...data, addedAt, updatedAt };
          })
          .filter((v) => coachSet.has(v.userId))
          .slice(0, limit);
      }
    }

    return res.json({ success: true, videos, totalCount: videos.length });
  } catch (e) {
    console.error('[POST /api/videos/collection] error:', e);
    res.status(500).json({ success: false, videos: [], totalCount: 0 });
  }
}

// Add Video to Collection
function generateTitleFromUrl(url) {
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase();
    if (host.includes('tiktok')) return `TikTok Video - ${new Date().toLocaleDateString()}`;
    if (host.includes('instagram')) return `Instagram Video - ${new Date().toLocaleDateString()}`;
  } catch {}
  return `Video - ${new Date().toLocaleDateString()}`;
}

function getDefaultThumbnail(platform) {
  const p = String(platform || '').toLowerCase();
  if (p.includes('tiktok')) return '/images/placeholder.svg';
  if (p.includes('instagram')) return '/images/instagram-placeholder.jpg';
  return '/images/video-placeholder.jpg';
}

function guessPlatformFromUrl(url) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes('tiktok')) return 'tiktok';
    if (host.includes('instagram')) return 'instagram';
  } catch {}
  return 'unknown';
}

export async function handleAddVideoToCollection(req, res) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { collectionId, videoData } = req.body || {};
    if (!collectionId || !videoData || !videoData.originalUrl) {
      return res.status(400).json({ success: false, error: 'collectionId and videoData.originalUrl are required' });
    }

    let platform = videoData.platform || guessPlatformFromUrl(videoData.originalUrl);
    const db = getAdminDb();
    const profile = await getUserProfile(db, userId);
    if (!profile) return res.status(404).json({ success: false, error: 'User not found' });

    // Minimal write permission check: creators may write only to accessible coaches' collections
    if (profile.role === 'creator') {
      const coaches = await getAccessibleCoaches(db, profile);
      const collSnap = await db.collection('collections').doc(String(collectionId)).get();
      if (!collSnap.exists) return res.status(404).json({ success: false, error: 'Collection not found' });
      const owner = collSnap.data()?.userId;
      if (!coaches.includes(owner)) {
        return res.status(403).json({ success: false, error: 'Insufficient permissions to add videos to this collection' });
      }
    }

    // Resolve the collection to determine the owning user (coach/owner)
    const collectionDoc = await db.collection('collections').doc(String(collectionId)).get();
    if (!collectionDoc.exists) {
      return res.status(404).json({ success: false, error: 'Collection not found' });
    }
    const collectionOwnerId = collectionDoc.data()?.userId || userId;

    const video = {
      url: videoData.originalUrl,
      title: generateTitleFromUrl(videoData.originalUrl),
      platform,
      thumbnailUrl: getDefaultThumbnail(platform),
      author: 'Unknown Creator',
      transcript: 'Transcript not available',
      visualContext: 'Imported via Import Video',
      fileSize: 0,
      duration: 0,
      // IMPORTANT: Set video userId to the collection owner so RBAC queries work
      userId: collectionOwnerId,
      collectionId,
      addedAt: videoData.addedAt || new Date().toISOString(),
      components: videoData.processing?.components || { hook: '', bridge: '', nugget: '', wta: '' },
      contentMetadata: { hashtags: [], mentions: [], description: '' },
      insights: { views: 0, likes: 0, comments: 0, saves: 0 },
      metadata: { source: 'import' },
    };

    const ref = await db.collection('videos').add(video);

    // best-effort update count
    if (collectionId && collectionId !== 'all-videos') {
      const cRef = db.collection('collections').doc(String(collectionId));
      const cSnap = await cRef.get();
      if (cSnap.exists) {
        const current = cSnap.data()?.videoCount || 0;
        await cRef.update({ videoCount: current + 1, updatedAt: new Date().toISOString() });
      }
    }

    res.status(201).json({ success: true, videoId: ref.id, video: { id: ref.id, ...video } });
  } catch (e) {
    console.error('[POST /api/videos/add-to-collection] error:', e);
    res.status(500).json({ success: false, error: 'Failed to add video to collection' });
  }
}

export async function handleMoveVideo(req, res) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { videoId, targetCollectionId } = req.body || {};
    if (!videoId || typeof targetCollectionId === 'undefined') {
      return res.status(400).json({ success: false, error: 'Missing parameters: videoId, targetCollectionId' });
    }
    const db = getAdminDb();
    const profile = await getUserProfile(db, userId);
    if (!profile) return res.status(404).json({ success: false, error: 'User not found' });

    const videoRef = db.collection('videos').doc(String(videoId));
    const snap = await videoRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, error: 'Video not found' });
    const video = snap.data();

    // Permission: must be super_admin/coach owner or creator with access to coach
    if (profile.role !== 'super_admin') {
      const coaches = await getAccessibleCoaches(db, profile);
      if (!coaches.includes(video.userId)) {
        return res.status(403).json({ success: false, error: 'Insufficient permissions to move this video' });
      }
    }

    const prevCollectionId = video.collectionId;
    // If moving to a different collection owned by a different user, align the video.userId
    let targetOwnerId = video.userId;
    if (targetCollectionId && targetCollectionId !== 'all-videos') {
      const targetCollSnap = await db.collection('collections').doc(String(targetCollectionId)).get();
      if (targetCollSnap.exists) {
        targetOwnerId = targetCollSnap.data()?.userId || targetOwnerId;
      }
    }
    await videoRef.update({ collectionId: targetCollectionId, userId: targetOwnerId, updatedAt: new Date().toISOString() });

    // Update counts (best-effort)
    if (prevCollectionId && prevCollectionId !== 'all-videos') {
      const cRef = db.collection('collections').doc(prevCollectionId);
      const cSnap = await cRef.get();
      if (cSnap.exists) {
        const current = cSnap.data()?.videoCount || 0;
        await cRef.update({ videoCount: Math.max(0, current - 1), updatedAt: new Date().toISOString() });
      }
    }
    if (targetCollectionId && targetCollectionId !== 'all-videos') {
      const tcRef = db.collection('collections').doc(String(targetCollectionId));
      const tcSnap = await tcRef.get();
      if (tcSnap.exists) {
        const current = tcSnap.data()?.videoCount || 0;
        await tcRef.update({ videoCount: current + 1, updatedAt: new Date().toISOString() });
      }
    }

    res.json({ success: true, message: 'Video moved successfully' });
  } catch (e) {
    console.error('[POST /api/collections/move-video] error:', e);
    res.status(500).json({ success: false, error: 'Failed to move video' });
  }
}

export async function handleCopyVideo(req, res) {
  try {
    const userId = requireUserId(req, res);
    if (!userId) return;
    const { videoId, targetCollectionId } = req.body || {};
    if (!videoId || typeof targetCollectionId === 'undefined') {
      return res.status(400).json({ success: false, error: 'Missing parameters: videoId, targetCollectionId' });
    }
    const db = getAdminDb();
    const profile = await getUserProfile(db, userId);
    if (!profile) return res.status(404).json({ success: false, error: 'User not found' });

    const videoRef = db.collection('videos').doc(String(videoId));
    const snap = await videoRef.get();
    if (!snap.exists) return res.status(404).json({ success: false, error: 'Video not found' });
    const video = snap.data();

    if (profile.role !== 'super_admin') {
      const coaches = await getAccessibleCoaches(db, profile);
      if (!coaches.includes(video.userId)) {
        return res.status(403).json({ success: false, error: 'Insufficient permissions to copy this video' });
      }
    }

    // Align copied video's userId to the target collection owner for RBAC
    let targetOwnerId = video.userId;
    if (targetCollectionId && targetCollectionId !== 'all-videos') {
      const targetCollSnap = await db.collection('collections').doc(String(targetCollectionId)).get();
      if (targetCollSnap.exists) {
        targetOwnerId = targetCollSnap.data()?.userId || targetOwnerId;
      }
    }
    const newData = { ...video, userId: targetOwnerId, collectionId: targetCollectionId, addedAt: new Date().toISOString() };
    delete newData.id;
    const newRef = await db.collection('videos').add(newData);

    // Increment count on target
    if (targetCollectionId && targetCollectionId !== 'all-videos') {
      const tcRef = db.collection('collections').doc(String(targetCollectionId));
      const tcSnap = await tcRef.get();
      if (tcSnap.exists) {
        const current = tcSnap.data()?.videoCount || 0;
        await tcRef.update({ videoCount: current + 1, updatedAt: new Date().toISOString() });
      }
    }

    res.json({ success: true, message: 'Video copied successfully', newVideoId: newRef.id });
  } catch (e) {
    console.error('[POST /api/collections/copy-video] error:', e);
    res.status(500).json({ success: false, error: 'Failed to copy video' });
  }
}

export async function handleDeleteCollection(req, res) {
  try {
    if (!validateApiKey(req, res)) return;
    const userId = requireUserId(req, res);
    if (!userId) return;
    const collectionId = req.query.collectionId || (req.body && req.body.collectionId);
    if (!collectionId) return res.status(400).json({ success: false, error: 'collectionId required' });

    const db = getAdminDb();
    const profile = await getUserProfile(db, userId);
    if (!profile) return res.status(404).json({ success: false, error: 'User not found' });

    if (profile.role !== 'coach' && profile.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' });
    }

    const cRef = db.collection('collections').doc(String(collectionId));
    const cSnap = await cRef.get();
    if (!cSnap.exists) return res.status(404).json({ success: false, error: 'Collection not found' });
    const cData = cSnap.data();

    if (profile.role === 'coach' && cData.userId !== userId) {
      return res.status(403).json({ success: false, error: 'Access denied' });
    }

    await cRef.delete();
    res.json({ success: true, message: 'Collection deleted successfully', collectionId: String(collectionId) });
  } catch (e) {
    console.error('[DELETE /api/collections/delete] error:', e);
    res.status(500).json({ success: false, error: 'Failed to delete collection' });
  }
}

export async function handleUpdateCollection(req, res) {
  try {
    if (req.method !== 'PATCH') return res.status(405).json({ success: false, error: 'Method not allowed' });
    if (!validateApiKey(req, res)) return;
    const userId = requireUserId(req, res);
    if (!userId) return;

    const { collectionId, title, description } = req.body || {};
    if (!collectionId) return res.status(400).json({ success: false, error: 'collectionId is required' });

    const updates = {};
    if (typeof title === 'string') {
      const t = title.trim();
      if (!t) return res.status(400).json({ success: false, error: 'Title cannot be empty' });
      if (t.length > 80) return res.status(400).json({ success: false, error: 'Title too long (max 80)' });
      updates.title = t;
    }
    if (typeof description === 'string') {
      const d = description.trim();
      if (d.length > 500) return res.status(400).json({ success: false, error: 'Description too long (max 500)' });
      updates.description = d;
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, error: 'No valid fields provided to update' });
    }

    const db = getAdminDb();
    const profile = await getUserProfile(db, userId);
    if (!profile) return res.status(404).json({ success: false, error: 'User not found' });

    const cRef = db.collection('collections').doc(String(collectionId));
    const cSnap = await cRef.get();
    if (!cSnap.exists) return res.status(404).json({ success: false, error: 'Collection not found' });
    const cData = cSnap.data();

    const isOwner = cData.userId === userId;
    const isSuperAdmin = profile.role === 'super_admin';
    if (!isOwner && !isSuperAdmin) return res.status(403).json({ success: false, error: 'Access denied' });

    updates.updatedAt = new Date().toISOString();
    await cRef.update(updates);
    res.json({ success: true, message: 'Collection updated successfully', collectionId: String(collectionId) });
  } catch (e) {
    console.error('[PATCH /api/collections/update] error:', e);
    res.status(500).json({ success: false, error: 'Failed to update collection' });
  }
}
