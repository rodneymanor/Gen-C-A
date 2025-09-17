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

    if (useFirestore) {
      try {
        // Upsert creator document keyed by handle
        const creatorsRef = db.collection('creators');
        const existing = await creatorsRef.where('handle', '==', handle).limit(1).get();
        const creatorDocRef = existing.empty ? creatorsRef.doc() : existing.docs[0].ref;

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

    // Save templates
    const addTemplates = async (col, patterns) => {
      if (!patterns.length) return 0;
      let count = 0;
      for (const pattern of patterns) {
        const variables = findPlaceholders(pattern);
        // Upsert by (creatorId, pattern) to avoid duplicates
        const existing = await db
          .collection(col)
          .where('pattern', '==', pattern)
          .where('creatorIds', 'array-contains', creatorId)
          .limit(1)
          .get();
        if (!existing.empty) {
          await existing.docs[0].ref.set({ pattern, variables, creatorIds: [creatorId], updatedAt: new Date() }, { merge: true });
        } else {
          await db.collection(col).add({ pattern, variables, creatorIds: [creatorId], createdAt: new Date() });
        }
        count++;
      }
      return count;
    };

    const saved = { hooks: 0, bridges: 0, ctas: 0, nuggets: 0, scriptStructures: 0 };

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
      const existingIdx = voices.findIndex((v) => v.handle === handle);
      const voiceEntry = {
        id: summary.creatorId || handle,
        name: name,
        handle,
        description: `${handle} brand voice`,
        tone: summary.styleSignature?.tone || 'Varied',
        keywords: summary.styleSignature?.powerWords || [],
        created: new Date().toISOString(),
      };
      if (existingIdx >= 0) voices[existingIdx] = voiceEntry; else voices.push(voiceEntry);
      fs.writeFileSync(voicesPath, JSON.stringify(voices, null, 2));
    };

    try {
      if (useFirestore) {
        saved.hooks = await addTemplates('hookTemplates', hookTemplates);
        saved.bridges = await addTemplates('bridgeTemplates', bridgeTemplates);
        saved.ctas = await addTemplates('ctaTemplates', ctaTemplates);

        if (nuggetTemplates.length) {
          for (const n of nuggetTemplates) {
            const pattern = n.pattern;
            const variables = n.variables || findPlaceholders(pattern);
            const structure = n.structure || 'unspecified';
            const existing = await db
              .collection('goldenNuggetTemplates')
              .where('pattern', '==', pattern)
              .where('creatorIds', 'array-contains', creatorId)
              .limit(1)
              .get();
            if (!existing.empty) {
              await existing.docs[0].ref.set({ pattern, structure, variables, creatorIds: [creatorId], updatedAt: new Date() }, { merge: true });
            } else {
              await db.collection('goldenNuggetTemplates').add({ pattern, structure, variables, creatorIds: [creatorId], createdAt: new Date() });
            }
            saved.nuggets++;
          }
        }

        if (perTranscript && perTranscript.length) {
          for (const item of perTranscript) {
            const i = (item.index ?? 1) - 1;
            const vm = Array.isArray(videoMeta) ? videoMeta[i] : undefined;
            const videoId = vm?.id || '';

            if (!videoId) {
              // No videoId to key on; add as new record to avoid data loss
              await db.collection('scriptStructures').add({
                videoId: '',
                creatorId,
                hook: item.hook || null,
                bridge: item.bridge || null,
                goldenNugget: item.goldenNugget || null,
                cta: item.cta || null,
                microHooks: item.microHooks || [],
                createdAt: new Date(),
              });
              saved.scriptStructures++;
              continue;
            }

            // Upsert by (creatorId, videoId) to avoid duplicates when adding more content later
            const existing = await db
              .collection('scriptStructures')
              .where('creatorId', '==', creatorId)
              .where('videoId', '==', videoId)
              .limit(1)
              .get();

            const payload = {
              videoId,
              creatorId,
              hook: item.hook || null,
              bridge: item.bridge || null,
              goldenNugget: item.goldenNugget || null,
              cta: item.cta || null,
              microHooks: item.microHooks || [],
              updatedAt: new Date(),
            };

            if (!existing.empty) {
              await existing.docs[0].ref.set(payload, { merge: true });
            } else {
              await db.collection('scriptStructures').add({ ...payload, createdAt: new Date() });
            }
            saved.scriptStructures++;
          }
        }

        await db.collection('speakingStyles').add({
          creatorId,
          pacing: { wordsPerMinute: undefined, pauseFrequency: undefined, emphasisPoints: [], pauseLocations: [] },
          vocabulary: { commonWords: [], industryTerms: [], emotionalWords: powerWords, fillerWords: fillerPhrases, powerWords, transitionPhrases },
          structure: {
            sentenceLength: avgWordsPerSentence ? (avgWordsPerSentence < 12 ? 'short' : avgWordsPerSentence > 20 ? 'long' : 'medium') : 'mixed',
            paragraphFlow: 'unspecified', repetitionPatterns: [], avgWordsPerSentence, questionFrequency: 0, personalPronounUsage: 'unspecified'
          },
          tonalElements: { enthusiasm: 0, authority: 0, relatability: 0, urgency: 0, humor: 0, controversy: 0, empathy: 0, tone },
          createdAt: new Date(),
        });
      } else {
        // Offline/local persistence
        fallbackSummary = {
          creatorId: creatorId || handle,
          name,
          handle,
          niche,
          transcriptsCount,
          templates: { hooks: hookTemplates, bridges: bridgeTemplates, ctas: ctaTemplates, nuggets: nuggetTemplates },
          styleSignature: { powerWords, fillerPhrases, transitionPhrases, avgWordsPerSentence, tone },
          perTranscript,
          savedAt: new Date().toISOString(),
        };
        persistLocal(fallbackSummary);
      }
    } catch (persistErr) {
      // Firestore failed (e.g., network). Fallback to local file storage.
      console.warn('Persisting to Firestore failed, falling back to local files:', persistErr?.message);
      fallbackSummary = {
        creatorId: creatorId || handle,
        name,
        handle,
        niche,
        transcriptsCount,
        templates: { hooks: hookTemplates, bridges: bridgeTemplates, ctas: ctaTemplates, nuggets: nuggetTemplates },
        styleSignature: { powerWords, fillerPhrases, transitionPhrases, avgWordsPerSentence, tone },
        perTranscript,
        savedAt: new Date().toISOString(),
      };
      persistLocal(fallbackSummary);
    }

    // Note: per-transcript scriptStructures were persisted above if Firestore is available.

    return res.json({
      success: true,
      creator: { id: creatorId || handle, name, handle },
      saved,
      offline: !!fallbackSummary,
    });
  } catch (error) {
    console.error('Save analysis error:', error);
    return res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
