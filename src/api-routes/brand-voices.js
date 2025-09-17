// Use JS Firebase Admin utils compatible with Vercel runtime
import { getDb as getAdminDb } from './utils/firebase-admin.js';

export async function handleListBrandVoices(req, res) {
  try {
    const db = getAdminDb();
    if (!db) {
      console.error('[brand-voices] Firestore unavailable for handleListBrandVoices');
      return res.status(500).json({ success: false, error: 'Brand voices unavailable. Firestore not initialized.' });
    }
    let voices = [];
    let metaMap = {};
    // Load meta overrides (displayName, isShared, isDefault)
    const metaSnap = await db.collection('brandVoiceMeta').get();
    metaSnap.forEach((d) => { metaMap[d.id] = d.data() || {}; });
    const creatorsSnap = await db.collection('creators').limit(50).get();
    for (const doc of creatorsSnap.docs) {
      const c = doc.data();
      // Skip invalid creator docs that have neither name nor handle
      if (!c || (!c.name && !c.handle)) {
        continue;
      }
      const meta = metaMap[doc.id] || {};
      const displayName = meta.displayName || c.name || c.handle;
      const stylesSnap = await db.collection('speakingStyles').where('creatorId', '==', doc.id).limit(1).get();
      const style = stylesSnap.empty ? null : stylesSnap.docs[0].data();
      voices.push({
        id: doc.id,
        name: displayName,
        description: `${displayName} brand voice` + (style?.tonalElements?.tone ? ` • Tone: ${style.tonalElements.tone}` : ''),
        tone: style?.tonalElements?.tone || 'Varied',
        voice: 'Derived from creator analysis',
        targetAudience: c.niche || 'General',
        keywords: (style?.vocabulary?.powerWords || []).slice(0, 8),
        platforms: ['tiktok'],
        created: c.analysisDate || new Date(),
        isShared: !!meta.isShared,
        isDefault: !!meta.isDefault,
      });
    }

    // Sort default first if exists
    voices.sort((a, b) => (b.isDefault === true ? 1 : 0) - (a.isDefault === true ? 1 : 0));
    return res.json({ success: true, voices });
  } catch (error) {
    console.error('List brand voices error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}

export async function handleGetBrandVoiceTemplates(req, res) {
  try {
    const creatorId = req.query?.creatorId || req.body?.creatorId;
    if (!creatorId) return res.status(400).json({ success: false, error: 'creatorId is required' });

    const db = getAdminDb();
    if (!db) {
      console.error('[brand-voices] Firestore unavailable for handleGetBrandVoiceTemplates', { creatorId });
      return res.status(500).json({ success: false, error: 'Brand voice templates unavailable. Firestore not initialized.' });
    }

    const [hooksSnap, bridgesSnap, ctasSnap, nuggetsSnap, styleSnap] = await Promise.all([
      db.collection('hookTemplates').where('creatorIds', 'array-contains', creatorId).limit(100).get(),
      db.collection('bridgeTemplates').where('creatorIds', 'array-contains', creatorId).limit(100).get(),
      db.collection('ctaTemplates').where('creatorIds', 'array-contains', creatorId).limit(100).get(),
      db.collection('goldenNuggetTemplates').where('creatorIds', 'array-contains', creatorId).limit(100).get(),
      db.collection('speakingStyles').where('creatorId', '==', creatorId).limit(1).get(),
    ]);

    const toList = (snap) => snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
    const style = styleSnap.empty ? null : styleSnap.docs[0].data();

    return res.json({
      success: true,
      templates: {
        hooks: toList(hooksSnap),
        bridges: toList(bridgesSnap),
        ctas: toList(ctasSnap),
        nuggets: toList(nuggetsSnap),
      },
      styleSignature: style ? {
        powerWords: style?.vocabulary?.powerWords || [],
        fillerPhrases: style?.vocabulary?.fillerWords || [],
        transitionPhrases: style?.vocabulary?.transitionPhrases || [],
        avgWordsPerSentence: style?.structure?.avgWordsPerSentence,
        tone: style?.tonalElements?.tone || 'Varied',
      } : null,
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
    if (!creatorId) return res.status(400).json({ success: false, error: 'creatorId is required' });

    const db = getAdminDb();
    if (!db) {
      console.error('[brand-voices] Firestore unavailable for handleDeleteBrandVoice', { creatorId });
      return res.status(500).json({ success: false, error: 'Unable to delete brand voice. Firestore not initialized.' });
    }

    // Delete creator doc
    await db.collection('creators').doc(creatorId).delete();
    // Delete related speakingStyles
    const styles = await db.collection('speakingStyles').where('creatorId', '==', creatorId).get();
    const batch = db.batch();
    styles.forEach((doc) => batch.delete(doc.ref));
    if (!styles.empty) await batch.commit();
    return res.json({ success: true, deleted: { creator: creatorId, speakingStyles: styles.size } });
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

    const { creatorId, displayName, isShared, isDefault } = req.body || {};
    if (!creatorId) return res.status(400).json({ success: false, error: 'creatorId is required' });

    const db = getAdminDb();
    if (!db) {
      console.error('[brand-voices] Firestore unavailable for handleUpdateBrandVoiceMeta', { creatorId });
      return res.status(500).json({ success: false, error: 'Unable to update brand voice meta. Firestore not initialized.' });
    }

    const metaRef = db.collection('brandVoiceMeta').doc(String(creatorId));
    // If making default, unset previous defaults
    if (isDefault === true) {
      const prev = await db.collection('brandVoiceMeta').where('isDefault', '==', true).get();
      const batch = db.batch();
      prev.forEach((doc) => batch.set(doc.ref, { isDefault: false }, { merge: true }));
      if (!prev.empty) await batch.commit();
    }
    await metaRef.set({
      creatorId: String(creatorId),
      ...(displayName !== undefined ? { displayName: String(displayName) } : {}),
      ...(isShared !== undefined ? { isShared: !!isShared } : {}),
      ...(isDefault !== undefined ? { isDefault: !!isDefault } : {}),
      updatedAt: new Date(),
    }, { merge: true });
    return res.json({ success: true });
  } catch (error) {
    console.error('Update brand voice meta error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
