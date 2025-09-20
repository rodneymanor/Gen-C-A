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
import fs from 'fs';
import path from 'path';
import {
  ensureCreatorLibraryDoc,
  getAnalysesCollectionRef,
  getBrandVoiceDocRef,
  mergeTemplates,
  mergeTranscriptCollections,
  mergeVideoMeta,
  mergeStyleSignature,
  buildAnalysisRecord,
} from './utils/brand-voice-store.js';

function extractTemplates(sectionName, text) {
  // Match lines under a section like "## HOOK TEMPLATES" that start with number.
  const sectionRegex = new RegExp(`##\\s*${sectionName}\\s*[\\r\\n]+([\\s\\S]*?)(?=\\n##|$)`, 'i');
  const m = text.match(sectionRegex);
  if (!m) return [];
  const block = m[1] || '';
  return block
    .split(/\n/)
    .map(l => l.trim())
    .filter(l => /^\d+\./.test(l))
    .map(l => l.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
}

function extractList(label, text) {
  // e.g., "- Power words: [list]" or lines after label
  const regex = new RegExp(`${label}\s*:\s*(.*)`, 'i');
  const m = text.match(regex);
  if (m && m[1]) {
    const raw = m[1].trim();
    // Split by comma
    return raw
      .replace(/[\[\]]/g, '')
      .split(/,\s*/)
      .map(v => v.trim())
      .filter(Boolean);
  }
  return [];
}

function extractNumber(label, text) {
  const regex = new RegExp(`${label}\s*:\s*([0-9]+(?:\.[0-9]+)?)`, 'i');
  const m = text.match(regex);
  return m ? Number(m[1]) : undefined;
}

function extractString(label, text) {
  const regex = new RegExp(`${label}\s*:\s*(.+)`, 'i');
  const m = text.match(regex);
  return m ? m[1].trim() : undefined;
}

function findPlaceholders(pattern) {
  const placeholders = new Set();
  const regex = /\[([^\]\n]+)\]/g;
  let m;
  while ((m = regex.exec(pattern))) placeholders.add(m[1].trim());
  return Array.from(placeholders);
}

export async function handleSaveCreatorAnalysis(req, res) {
  try {
    const getAdminDb = await loadFirebaseAdmin();
    const db = getAdminDb();

    const { creator, analysisText, analysisJson, transcriptsCount = 5, niche = 'general', videoMeta } = req.body || {};
    if (!creator || !creator.handle || (!analysisText && !analysisJson)) {
      return res.status(400).json({ success: false, error: 'Missing creator.handle and analysis content' });
    }

    const handle = String(creator.handle).replace(/^@/, '').trim();
    const name = creator.name || handle;

    let creatorId = '';
    let useFirestore = !!db;
    let fallbackSummary = null;
    let creatorDocRef = null;

    if (useFirestore) {
      try {
        // Upsert creator document keyed by handle
        const creatorsRef = db.collection('creators');
        const existing = await creatorsRef.where('handle', '==', handle).limit(1).get();
        creatorDocRef = existing.empty ? creatorsRef.doc() : existing.docs[0].ref;

        await creatorDocRef.set({
          name,
          handle,
          niche,
          analysisDate: new Date(),
          totalVideosAnalyzed: transcriptsCount,
          averageEngagement: 0,
        }, { merge: true });

        creatorId = creatorDocRef.id;
      } catch (initErr) {
        console.warn('Firestore not available, falling back to local storage:', initErr?.message);
        // Disable Firestore for the rest of the handler
        creatorId = handle;
        // Mark as offline by nulling db
        // Proceed; rest of persistence will use fallbackSummary
        // eslint-disable-next-line no-unused-vars
        useFirestore = false;
      }
    }

    let hookTemplates = [];
    let bridgeTemplates = [];
    let ctaTemplates = [];
    let nuggetTemplates = [];
    let powerWords = [];
    let fillerPhrases = [];
    let transitionPhrases = [];
    let avgWordsPerSentence = undefined;
    let tone = 'Varied';
    let perTranscript = [];

    if (analysisJson) {
      // Structured path
      hookTemplates = (analysisJson.templates?.hooks || []).map((h) => h.pattern).filter(Boolean);
      bridgeTemplates = (analysisJson.templates?.bridges || []).map((h) => h.pattern).filter(Boolean);
      ctaTemplates = (analysisJson.templates?.ctas || []).map((h) => h.pattern).filter(Boolean);
      nuggetTemplates = (analysisJson.templates?.nuggets || []).map((n) => ({ pattern: n.pattern, structure: n.structure || 'unspecified', variables: n.variables || [] })).filter((n) => !!n.pattern);

      powerWords = analysisJson.styleSignature?.powerWords || [];
      fillerPhrases = analysisJson.styleSignature?.fillerPhrases || [];
      transitionPhrases = analysisJson.styleSignature?.transitionPhrases || [];
      avgWordsPerSentence = analysisJson.styleSignature?.avgWordsPerSentence;
      tone = analysisJson.styleSignature?.tone || 'Varied';
      perTranscript = Array.isArray(analysisJson.transcripts) ? analysisJson.transcripts : [];
    } else {
      // Text parsing fallback
      const text = String(analysisText);
      hookTemplates = extractTemplates('HOOK TEMPLATES', text);
      bridgeTemplates = extractTemplates('BRIDGE TEMPLATES', text);
      ctaTemplates = extractTemplates('WHY TO ACT TEMPLATES', text);
      if (!ctaTemplates.length) {
        ctaTemplates = extractTemplates('CTA TEMPLATES', text);
      }
      const nuggetBlockMatch = text.match(/##\s*GOLDEN\s*NUGGET\s*STRUCTURE\s*[\r\n]+([\s\S]*?)(?=\n##|$)/i);
      const nuggetBlock = nuggetBlockMatch ? nuggetBlockMatch[1].trim() : '';
      if (nuggetBlock) {
        nuggetTemplates = [{ pattern: nuggetBlock, structure: 'unspecified', variables: findPlaceholders(nuggetBlock) }];
      }
      powerWords = extractList('Power words', text);
      fillerPhrases = extractList('Filler phrases', text);
      transitionPhrases = extractList('Transition phrases', text);
      avgWordsPerSentence = extractNumber('Average words per sentence', text);
      tone = extractString('Tone', text) || 'Varied';
    }

    const saved = { hooks: 0, bridges: 0, ctas: 0, nuggets: 0, scriptStructures: 0 };

    const templatesPayload = {
      hooks: hookTemplates.map((pattern) => ({ pattern, variables: findPlaceholders(pattern) })),
      bridges: bridgeTemplates.map((pattern) => ({ pattern, variables: findPlaceholders(pattern) })),
      ctas: ctaTemplates.map((pattern) => ({ pattern, variables: findPlaceholders(pattern) })),
      nuggets: nuggetTemplates.map((n) => ({
        pattern: n.pattern,
        structure: n.structure || 'unspecified',
        variables: Array.isArray(n.variables) && n.variables.length ? n.variables : findPlaceholders(n.pattern),
      })),
    };

    const styleSignature = {
      powerWords,
      fillerPhrases,
      transitionPhrases,
      avgWordsPerSentence,
      tone,
    };

    const normalizedTranscripts = Array.isArray(perTranscript) ? perTranscript : [];
    const normalizedVideoMeta = Array.isArray(videoMeta) ? videoMeta : [];

    const persistLocal = (summary) => {
      const baseDir = path.join(process.cwd(), 'data');
      const creatorsDir = path.join(baseDir, 'creators');
      const voicesPath = path.join(baseDir, 'brand-voices.json');
      if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);
      if (!fs.existsSync(creatorsDir)) fs.mkdirSync(creatorsDir);
      fs.writeFileSync(path.join(creatorsDir, `${handle}.json`), JSON.stringify(summary, null, 2));

      let voices = [];
      if (fs.existsSync(voicesPath)) {
        try { voices = JSON.parse(fs.readFileSync(voicesPath, 'utf8')); } catch {}
      }

      const summaryId = summary.brandVoiceId || summary.creatorId || handle;
      const existingIdx = Array.isArray(voices) ? voices.findIndex((v) => v.id === summaryId) : -1;
      const existing = existingIdx >= 0 ? voices[existingIdx] : null;

      const mergedTemplates = mergeTemplates(existing?.templates, summary.templates, `offline-${Date.now()}`);
      const mergedTranscripts = mergeTranscriptCollections(existing?.perTranscript, summary.perTranscript);
      const mergedVideoMeta = mergeVideoMeta(existing?.videoMeta, summary.videoMeta);
      const mergedStyleSignature = mergeStyleSignature(existing?.styleSignature, summary.styleSignature);

      const voiceEntry = {
        id: summaryId,
        creatorId: summary.creatorId || handle,
        brandVoiceId: summary.brandVoiceId || summaryId,
        handle: summary.handle || handle,
        displayName: summary.displayName || summary.name || name,
        description: summary.description || `${handle} brand voice`,
        templates: mergedTemplates,
        styleSignature: mergedStyleSignature,
        perTranscript: mergedTranscripts,
        videoMeta: mergedVideoMeta,
        analysis: summary.analysis,
        transcriptsCount: mergedTranscripts.length,
        niche: summary.niche,
        savedAt: summary.savedAt,
        updatedAt: summary.updatedAt,
        createdAt: existing?.createdAt || summary.createdAt || new Date().toISOString(),
        isDefault: existing?.isDefault ?? summary.isDefault ?? false,
        isShared: existing?.isShared ?? summary.isShared ?? false,
      };

      if (existingIdx >= 0) {
        voices[existingIdx] = voiceEntry;
      } else {
        voices = Array.isArray(voices) ? voices : [];
        voices.push(voiceEntry);
      }

      fs.writeFileSync(voicesPath, JSON.stringify(voices, null, 2));
    };

    try {
      if (useFirestore) {
        const libraryCreatorId = creatorId || handle;
        const brandVoiceId = libraryCreatorId;

        await ensureCreatorLibraryDoc(db, libraryCreatorId, {
          creatorHandle: handle,
          creatorName: name,
          niche,
        });

        const brandVoiceDocRef = getBrandVoiceDocRef(db, libraryCreatorId, brandVoiceId);
        const existingVoiceDoc = await brandVoiceDocRef.get();
        const existingData = existingVoiceDoc.exists ? existingVoiceDoc.data() || {} : {};

        const now = new Date();
        const nowIso = now.toISOString();
        const analysisId = `analysis-${Date.now()}`;

        const combinedTemplates = mergeTemplates(existingData.templates, templatesPayload, analysisId);
        const combinedTranscripts = mergeTranscriptCollections(existingData.perTranscript, normalizedTranscripts);
        const combinedVideoMeta = mergeVideoMeta(existingData.videoMeta, normalizedVideoMeta);
        const mergedStyleSignature = mergeStyleSignature(existingData.styleSignature, styleSignature);

        const isDefaultFlag = existingVoiceDoc.exists ? existingData.isDefault === true : true;
        const isSharedFlag = existingVoiceDoc.exists ? existingData.isShared === true : false;
        const existingDisplayName = existingData.displayName || name;
        const existingDescription = existingData.description || '';

        const brandVoicePayload = {
          creatorId: libraryCreatorId,
          brandVoiceId,
          handle,
          creatorHandle: handle,
          creatorName: name,
          displayName: existingDisplayName,
          description: existingDescription || `${name} brand voice`,
          transcriptsCount: combinedTranscripts.length,
          niche,
          templates: combinedTemplates,
          styleSignature: mergedStyleSignature,
          perTranscript: combinedTranscripts,
          videoMeta: combinedVideoMeta,
          analysis: {
            json: analysisJson || null,
            text: analysisText || null,
            latestAnalysisId: analysisId,
            lastRunAt: nowIso,
          },
          latestAnalysisId: analysisId,
          analysisCount: (existingData.analysisCount || 0) + 1,
          savedAt: nowIso,
          updatedAt: now,
          createdAt: existingData.createdAt || now,
          isDefault: isDefaultFlag,
          isShared: isSharedFlag,
        };

        await brandVoiceDocRef.set(brandVoicePayload, { merge: true });

        const analysesRef = getAnalysesCollectionRef(db, libraryCreatorId, brandVoiceId);
        const analysisRecord = buildAnalysisRecord(analysisId, {
          createdAt: now,
          savedAt: now,
          transcriptsCount,
          templates: templatesPayload,
          styleSignature,
          perTranscript: normalizedTranscripts,
          videoMeta: normalizedVideoMeta,
          analysis: {
            json: analysisJson || null,
            text: analysisText || null,
          },
        });
        await analysesRef.doc(analysisId).set(analysisRecord, { merge: true });

        saved.hooks = templatesPayload.hooks.length;
        saved.bridges = templatesPayload.bridges.length;
        saved.ctas = templatesPayload.ctas.length;
        saved.nuggets = templatesPayload.nuggets.length;
        saved.scriptStructures = normalizedTranscripts.length;
      } else {
        // Offline/local persistence
        fallbackSummary = {
          creatorId: creatorId || handle,
          brandVoiceId: creatorId || handle,
          handle,
          displayName: name,
          description: `${name} brand voice`,
          transcriptsCount,
          niche,
          templates: templatesPayload,
          styleSignature,
          perTranscript: normalizedTranscripts,
          videoMeta: normalizedVideoMeta,
          analysis: {
            json: analysisJson || null,
            text: analysisText || null,
          },
          savedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          isDefault: true,
          isShared: false,
        };
        saved.hooks = templatesPayload.hooks.length;
        saved.bridges = templatesPayload.bridges.length;
        saved.ctas = templatesPayload.ctas.length;
        saved.nuggets = templatesPayload.nuggets.length;
        saved.scriptStructures = normalizedTranscripts.length;
        persistLocal(fallbackSummary);
      }
    } catch (persistErr) {
      // Firestore failed (e.g., network). Fallback to local file storage.
      console.warn('Persisting to Firestore failed, falling back to local files:', persistErr?.message);
      fallbackSummary = {
        creatorId: creatorId || handle,
        brandVoiceId: creatorId || handle,
        handle,
        displayName: name,
        description: `${name} brand voice`,
        transcriptsCount,
        niche,
        templates: templatesPayload,
        styleSignature,
        perTranscript: normalizedTranscripts,
        videoMeta: normalizedVideoMeta,
        analysis: {
          json: analysisJson || null,
          text: analysisText || null,
        },
        savedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        isDefault: true,
        isShared: false,
      };
      saved.hooks = templatesPayload.hooks.length;
      saved.bridges = templatesPayload.bridges.length;
      saved.ctas = templatesPayload.ctas.length;
      saved.nuggets = templatesPayload.nuggets.length;
      saved.scriptStructures = normalizedTranscripts.length;
      persistLocal(fallbackSummary);
    }

    // Note: per-transcript scriptStructures were persisted above if Firestore is available.

    return res.json({
      success: true,
      creator: { id: creatorId || handle, name, handle },
      brandVoice: { id: creatorId || handle, creatorId: creatorId || handle },
      saved,
      offline: !!fallbackSummary,
    });
  } catch (error) {
    console.error('Save analysis error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
