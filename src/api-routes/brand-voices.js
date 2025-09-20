// Use JS Firebase Admin utils compatible with Vercel runtime
import { getDb as getAdminDb } from './utils/firebase-admin.js';
import {
  getBrandVoiceLibraryRef,
  getBrandVoiceDocRef,
  getAnalysesCollectionRef,
  mergeTemplates,
  mergeTranscriptCollections,
  mergeVideoMeta,
  mergeStyleSignature,
} from './utils/brand-voice-store.js';

const toDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (value?.toDate && typeof value.toDate === 'function') {
    try {
      return value.toDate();
    } catch (_) {
      return null;
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export async function handleListBrandVoices(req, res) {
  try {
    const db = getAdminDb();
    if (!db) {
      console.error('[brand-voices] Firestore unavailable for handleListBrandVoices');
      return res.status(500).json({ success: false, error: 'Brand voices unavailable. Firestore not initialized.' });
    }

    const voicesSnap = await db.collectionGroup('brandVoices').get();
    const voices = [];

    for (const voiceDoc of voicesSnap.docs) {
      const voiceData = voiceDoc.data() || {};
      const parentCreator = voiceDoc.ref.parent.parent;
      const creatorId = voiceData.creatorId || (parentCreator ? parentCreator.id : null) || voiceDoc.id;
      const creatorName = voiceData.creatorName || voiceData.displayName || voiceDoc.id;
      const style = voiceData.styleSignature || {};
      const displayName = voiceData.displayName || creatorName;

      voices.push({
        id: voiceData.brandVoiceId || voiceDoc.id,
        creatorId,
        name: displayName,
        description: voiceData.description || `${displayName} brand voice`,
        tone: style.tone || voiceData.tone || 'Varied',
        voice: voiceData.voice || 'Derived from creator analysis',
        targetAudience: voiceData.targetAudience || voiceData.niche || 'General',
        keywords: Array.isArray(style.powerWords) && style.powerWords.length
          ? style.powerWords.slice(0, 8)
          : Array.isArray(voiceData.keywords)
            ? voiceData.keywords.slice(0, 8)
            : [],
        platforms: Array.isArray(voiceData.platforms) && voiceData.platforms.length
          ? voiceData.platforms
          : ['tiktok'],
        created: toDate(voiceData.updatedAt) || toDate(voiceData.createdAt) || new Date(),
        isShared: voiceData.isShared === true,
        isDefault: voiceData.isDefault === true,
      });
    }

    voices.sort((a, b) => {
      if (a.isDefault && !b.isDefault) return -1;
      if (!a.isDefault && b.isDefault) return 1;
      return (toDate(b.created)?.getTime() || 0) - (toDate(a.created)?.getTime() || 0);
    });

    return res.json({ success: true, voices });
  } catch (error) {
    console.error('List brand voices error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export async function handleGetBrandVoiceTemplates(req, res) {
  try {
    const creatorId = req.query?.creatorId || req.body?.creatorId;
    const brandVoiceId = req.query?.brandVoiceId || req.query?.voiceId || req.body?.brandVoiceId;
    if (!creatorId) return res.status(400).json({ success: false, error: 'creatorId is required' });

    const db = getAdminDb();
    if (!db) {
      console.error('[brand-voices] Firestore unavailable for handleGetBrandVoiceTemplates', { creatorId });
      return res.status(500).json({ success: false, error: 'Brand voice templates unavailable. Firestore not initialized.' });
    }

    const voiceDocRef = getBrandVoiceDocRef(db, creatorId, brandVoiceId || creatorId);

    const voiceDoc = await voiceDocRef.get();
    if (!voiceDoc.exists) {
      return res.status(404).json({ success: false, error: 'Brand voice not found' });
    }

    const voiceData = voiceDoc.data() || {};
    const templates = voiceData.templates || {};

    const mapTemplates = (items, type) => {
      if (!Array.isArray(items)) return [];
      return items
        .map((item, index) => {
          if (!item) return null;
          if (typeof item === 'string') {
            return { id: `${voiceDoc.id}:${type}:${index}`, pattern: item, variables: [] };
          }
          const pattern = item.pattern || '';
          if (!pattern) return null;
          return {
            id: item.id || `${voiceDoc.id}:${type}:${index}`,
            pattern,
            variables: Array.isArray(item.variables) ? item.variables : [],
            structure: item.structure,
          };
        })
        .filter(Boolean);
    };

    const styleSignature = voiceData.styleSignature || null;

    return res.json({
      success: true,
      templates: {
        hooks: mapTemplates(templates.hooks, 'hook'),
        bridges: mapTemplates(templates.bridges, 'bridge'),
        ctas: mapTemplates(templates.ctas, 'cta'),
        nuggets: mapTemplates(templates.nuggets, 'nugget'),
      },
      styleSignature,
    });
  } catch (error) {
    console.error('Get brand voice templates error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export async function handleDeleteBrandVoice(req, res) {
  try {
    const secret = req.headers['x-internal-secret'] || req.body?.secret;
    if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const creatorId = req.body?.creatorId || req.query?.creatorId;
    const brandVoiceId = req.body?.brandVoiceId || req.body?.voiceId || req.query?.brandVoiceId || req.query?.voiceId;
    if (!creatorId) return res.status(400).json({ success: false, error: 'creatorId is required' });

    const db = getAdminDb();
    if (!db) {
      console.error('[brand-voices] Firestore unavailable for handleDeleteBrandVoice', { creatorId });
      return res.status(500).json({ success: false, error: 'Unable to delete brand voice. Firestore not initialized.' });
    }

    const voiceRef = getBrandVoiceDocRef(db, creatorId, brandVoiceId || creatorId);
    const voiceSnap = await voiceRef.get();

    if (!voiceSnap.exists) {
      return res.status(404).json({ success: false, error: 'Brand voice not found' });
    }

    const voiceData = voiceSnap.data() || {};
    const wasDefault = voiceData.isDefault === true;

    await voiceRef.delete();

    const analysesRef = getAnalysesCollectionRef(db, creatorId, brandVoiceId || creatorId);
    const analysesSnap = await analysesRef.get();
    const batch = db.batch();
    analysesSnap.forEach((doc) => batch.delete(doc.ref));
    if (!analysesSnap.empty) {
      await batch.commit();
    }

    const creatorDocRef = getBrandVoiceLibraryRef(db).doc(String(creatorId));
    const remainingVoicesSnap = await creatorDocRef.collection('brandVoices').get();
    let reassignedDefault = null;

    if (remainingVoicesSnap.empty) {
      await creatorDocRef.delete();
    } else if (wasDefault) {
      const fallbackVoice = remainingVoicesSnap.docs[0];
      await fallbackVoice.ref.set({ isDefault: true }, { merge: true });
      reassignedDefault = fallbackVoice.id;
    }

    return res.json({
      success: true,
      deleted: {
        creatorId: String(creatorId),
        brandVoiceId: String(brandVoiceId || creatorId),
        reassignedDefault,
      },
    });
  } catch (error) {
    console.error('Delete brand voice error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

/**
 * Admin: Update brand voice metadata (displayName, isShared, isDefault)
 * POST /api/brand-voices/update-meta
 * body: { creatorId, displayName?: string, isShared?: boolean, isDefault?: boolean }
 * auth: x-internal-secret header must match INTERNAL_API_SECRET
 */
export async function handleUpdateBrandVoiceMeta(req, res) {
  try {
    const secret = req.headers['x-internal-secret'] || req.body?.secret;
    if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    const { creatorId, displayName, isShared, isDefault, brandVoiceId, voiceId } = req.body || {};
    if (!creatorId) return res.status(400).json({ success: false, error: 'creatorId is required' });

    const db = getAdminDb();
    if (!db) {
      console.error('[brand-voices] Firestore unavailable for handleUpdateBrandVoiceMeta', { creatorId });
      return res.status(500).json({ success: false, error: 'Unable to update brand voice meta. Firestore not initialized.' });
    }

    const effectiveVoiceId = brandVoiceId || voiceId || creatorId;
    const voiceRef = getBrandVoiceDocRef(db, creatorId, effectiveVoiceId);

    const voiceSnap = await voiceRef.get();
    if (!voiceSnap.exists) {
      return res.status(404).json({ success: false, error: 'Brand voice not found' });
    }

    // If making default, unset previous defaults within the same creator scope
    if (isDefault === true) {
      const siblings = await voiceRef.parent.get();
      const batch = db.batch();
      siblings.forEach((doc) => {
        if (doc.id === voiceRef.id) return;
        batch.set(doc.ref, { isDefault: false }, { merge: true });
      });
      if (!siblings.empty) await batch.commit();
    }

    const patch = {
      ...(displayName !== undefined ? { displayName: String(displayName) } : {}),
      ...(isShared !== undefined ? { isShared: !!isShared } : {}),
      ...(isDefault !== undefined ? { isDefault: !!isDefault } : {}),
      updatedAt: new Date(),
    };

    // Update style signature or templates if provided
    if (req.body?.templates) {
      patch.templates = mergeTemplates(voiceSnap.data()?.templates, req.body.templates);
    }
    if (req.body?.styleSignature) {
      patch.styleSignature = mergeStyleSignature(voiceSnap.data()?.styleSignature, req.body.styleSignature);
    }
    if (req.body?.perTranscript) {
      patch.perTranscript = mergeTranscriptCollections(voiceSnap.data()?.perTranscript, req.body.perTranscript);
    }
    if (req.body?.videoMeta) {
      patch.videoMeta = mergeVideoMeta(voiceSnap.data()?.videoMeta, req.body.videoMeta);
    }

    await voiceRef.set(patch, { merge: true });

    return res.json({ success: true });
  } catch (error) {
    console.error('Update brand voice meta error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
