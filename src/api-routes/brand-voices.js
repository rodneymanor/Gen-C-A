import { getAdminDb } from '../lib/firebase-admin.ts';
import fs from 'fs';
import path from 'path';

export async function handleListBrandVoices(req, res) {
  try {
    const db = getAdminDb();
    let voices = [];
    if (db) {
      const creatorsSnap = await db.collection('creators').limit(50).get();
      for (const doc of creatorsSnap.docs) {
        const c = doc.data();
        const stylesSnap = await db.collection('speakingStyles').where('creatorId', '==', doc.id).limit(1).get();
        const style = stylesSnap.empty ? null : stylesSnap.docs[0].data();
        voices.push({
          id: doc.id,
          name: c.name || c.handle,
          description: `${c.handle} brand voice` + (style?.tonalElements?.tone ? ` • Tone: ${style.tonalElements.tone}` : ''),
          tone: style?.tonalElements?.tone || 'Varied',
          voice: 'Derived from creator analysis',
          targetAudience: c.niche || 'General',
          keywords: (style?.vocabulary?.powerWords || []).slice(0, 8),
          platforms: ['tiktok'],
          created: c.analysisDate || new Date(),
        });
      }
    } else {
      // Offline fallback: read local file
      const voicesPath = path.join(process.cwd(), 'data', 'brand-voices.json');
      if (fs.existsSync(voicesPath)) {
        try { voices = JSON.parse(fs.readFileSync(voicesPath, 'utf8')); } catch {}
      }
    }

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
