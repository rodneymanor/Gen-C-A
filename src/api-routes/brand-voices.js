// Use JS Firebase Admin utils compatible with Vercel runtime
import { getDb as getAdminDb } from './utils/firebase-admin.js';
import fs from 'fs';
import path from 'path';

export async function handleListBrandVoices(req, res) {
  try {
    const db = getAdminDb();
    let voices = [];
    let metaMap = {};
    // Load meta overrides (displayName, isShared, isDefault)
    if (db) {
      const metaSnap = await db.collection('brandVoiceMeta').get();
      metaSnap.forEach((d) => { metaMap[d.id] = d.data() || {}; });
    } else {
      const metaPath = path.join(process.cwd(), 'data', 'brand-voice-meta.json');
      if (fs.existsSync(metaPath)) {
        try { const raw = JSON.parse(fs.readFileSync(metaPath, 'utf8')); if (Array.isArray(raw)) { metaMap = Object.fromEntries(raw.map((m) => [m.creatorId, m])); } } catch {}
      }
    }
    if (db) {
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
    } else {
      // Offline fallback: read local file
      const voicesPath = path.join(process.cwd(), 'data', 'brand-voices.json');
      if (fs.existsSync(voicesPath)) {
        try { voices = JSON.parse(fs.readFileSync(voicesPath, 'utf8')); } catch {}
      }
      // Apply offline meta if present
      const metaPath = path.join(process.cwd(), 'data', 'brand-voice-meta.json');
      if (fs.existsSync(metaPath)) {
        try {
          const raw = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
          const metaArr = Array.isArray(raw) ? raw : [];
          const metaById = Object.fromEntries(metaArr.map((m) => [m.creatorId, m]));
          voices = voices.map((v) => ({
            ...v,
            name: metaById[v.id]?.displayName || v.name,
            isShared: !!metaById[v.id]?.isShared,
            isDefault: !!metaById[v.id]?.isDefault,
          }));
        } catch {}
      }
    }

    // Sort default first if exists
    voices.sort((a, b) => (b.isDefault === true ? 1 : 0) - (a.isDefault === true ? 1 : 0));
    return res.json({ success: true, voices, offline: !db });
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
    if (db) {
      // Firestore mode
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
    }

    // Offline/local mode
    const voicesPath = path.join(process.cwd(), 'data', 'brand-voices.json');
    const creatorPath = path.join(process.cwd(), 'data', 'creators', `${creatorId}.json`);
    let summary = null;
    if (fs.existsSync(creatorPath)) {
      try { summary = JSON.parse(fs.readFileSync(creatorPath, 'utf8')); } catch {}
    }
    if (!summary) return res.json({ success: true, templates: { hooks: [], bridges: [], ctas: [], nuggets: [] }, styleSignature: null, offline: true });

    const toArray = (arr) => Array.isArray(arr) ? arr : [];
    return res.json({
      success: true,
      templates: {
        hooks: toArray(summary.templates?.hooks).map((pattern, i) => ({ id: `hook_${i}`, pattern, variables: [] })),
        bridges: toArray(summary.templates?.bridges).map((pattern, i) => ({ id: `bridge_${i}`, pattern, variables: [] })),
        ctas: toArray(summary.templates?.ctas).map((pattern, i) => ({ id: `cta_${i}`, pattern, variables: [] })),
        nuggets: toArray(summary.templates?.nuggets).map((n, i) => ({ id: `nugget_${i}`, pattern: n.pattern || '', structure: n.structure || 'unspecified', variables: n.variables || [] })),
      },
      styleSignature: summary.styleSignature || null,
      offline: true,
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
    if (db) {
      // Delete creator doc
      await db.collection('creators').doc(creatorId).delete();
      // Delete related speakingStyles
      const styles = await db.collection('speakingStyles').where('creatorId', '==', creatorId).get();
      const batch = db.batch();
      styles.forEach((doc) => batch.delete(doc.ref));
      if (!styles.empty) await batch.commit();
      return res.json({ success: true, mode: 'firestore', deleted: { creator: creatorId, speakingStyles: styles.size } });
    }

    // Offline: update local JSON files
    const voicesPath = path.join(process.cwd(), 'data', 'brand-voices.json');
    const creatorFile = path.join(process.cwd(), 'data', 'creators', `${creatorId}.json`);
    let removed = { voices: false, creatorFile: false };
    if (fs.existsSync(voicesPath)) {
      try {
        const arr = JSON.parse(fs.readFileSync(voicesPath, 'utf8'));
        const next = Array.isArray(arr) ? arr.filter((v) => v.id !== creatorId) : arr;
        fs.writeFileSync(voicesPath, JSON.stringify(next, null, 2));
        removed.voices = true;
      } catch {}
    }
    if (fs.existsSync(creatorFile)) {
      try { fs.unlinkSync(creatorFile); removed.creatorFile = true; } catch {}
    }
    return res.json({ success: true, mode: 'offline', removed });
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
    if (db) {
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
      return res.json({ success: true, mode: 'firestore' });
    }

    // Offline
    const metaPath = path.join(process.cwd(), 'data', 'brand-voice-meta.json');
    let metaArr = [];
    if (fs.existsSync(metaPath)) {
      try { metaArr = JSON.parse(fs.readFileSync(metaPath, 'utf8')) || []; } catch {}
    }
    if (!Array.isArray(metaArr)) metaArr = [];
    const idx = metaArr.findIndex((m) => String(m.creatorId) === String(creatorId));
    const current = idx >= 0 ? metaArr[idx] : { creatorId: String(creatorId) };
    const next = {
      ...current,
      ...(displayName !== undefined ? { displayName: String(displayName) } : {}),
      ...(isShared !== undefined ? { isShared: !!isShared } : {}),
      ...(isDefault !== undefined ? { isDefault: !!isDefault } : {}),
      updatedAt: new Date().toISOString(),
    };
    // If making default, unset others
    if (next.isDefault === true) {
      metaArr = metaArr.map((m) => ({ ...m, isDefault: String(m.creatorId) === String(creatorId) }));
    }
    if (idx >= 0) metaArr[idx] = next; else metaArr.push(next);
    fs.mkdirSync(path.join(process.cwd(), 'data'), { recursive: true });
    fs.writeFileSync(metaPath, JSON.stringify(metaArr, null, 2));
    return res.json({ success: true, mode: 'offline' });
  } catch (error) {
    console.error('Update brand voice meta error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
