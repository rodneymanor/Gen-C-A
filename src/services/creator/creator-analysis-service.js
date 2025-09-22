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
} from '../../api-routes/utils/brand-voice-store.js';

const DEFAULT_BRAND_VOICE_ID = process.env.DEFAULT_BRAND_VOICE_ID || 'aronsogi';

class CreatorAnalysisServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'CreatorAnalysisServiceError';
    this.statusCode = statusCode;
  }
}

function extractTemplates(sectionName, text) {
  const sectionRegex = new RegExp(`\\s*##\\s*${sectionName}\\s*[\\r\\n]+([\\s\\S]*?)(?=\\n##|$)`, 'i');
  const match = text.match(sectionRegex);
  if (!match) return [];
  const block = match[1] || '';
  return block
    .split(/\n/)
    .map((line) => line.trim())
    .filter((line) => /^\d+\./.test(line))
    .map((line) => line.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);
}

function extractList(label, text) {
  const regex = new RegExp(`${label}\\s*:\\s*(.*)`, 'i');
  const match = text.match(regex);
  if (!match || !match[1]) return [];
  const raw = match[1].trim();
  return raw
    .replace(/[\[\]]/g, '')
    .split(/,\s*/)
    .map((value) => value.trim())
    .filter(Boolean);
}

function extractNumber(label, text) {
  const regex = new RegExp(`${label}\\s*:\\s*([0-9]+(?:\.[0-9]+)?)`, 'i');
  const match = text.match(regex);
  return match ? Number(match[1]) : undefined;
}

function extractString(label, text) {
  const regex = new RegExp(`${label}\\s*:\\s*(.+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : undefined;
}

function findPlaceholders(pattern) {
  const placeholders = new Set();
  const regex = /\\[([^\\]\n]+)\\]/g;
  let currentMatch;
  while ((currentMatch = regex.exec(pattern))) {
    placeholders.add(currentMatch[1].trim());
  }
  return Array.from(placeholders);
}

function ensureDataDir(subPath) {
  const baseDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir);
  const fullPath = path.join(baseDir, subPath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return { baseDir, fullPath };
}

const SERVICE_INSTANCE_KEY = '__creatorAnalysisService__';

class CreatorAnalysisService {
  constructor(firestore) {
    this.db = firestore || null;
  }

  persistLocal(summary) {
    const { baseDir } = ensureDataDir('creators/dummy.json');
    const creatorsDir = path.join(baseDir, 'creators');
    if (!fs.existsSync(creatorsDir)) fs.mkdirSync(creatorsDir);

    const creatorFile = path.join(creatorsDir, `${summary.handle}.json`);
    fs.writeFileSync(creatorFile, JSON.stringify(summary, null, 2));

    const voicesPath = path.join(baseDir, 'brand-voices.json');
    let voices = [];
    if (fs.existsSync(voicesPath)) {
      try {
        voices = JSON.parse(fs.readFileSync(voicesPath, 'utf8'));
      } catch (error) {
        console.warn('[CreatorAnalysisService] Failed to parse local brand voices file:', error?.message || error);
      }
    }

    const summaryId = summary.brandVoiceId || summary.creatorId || summary.handle;
    const existingIndex = Array.isArray(voices) ? voices.findIndex((voice) => voice.id === summaryId) : -1;
    const existing = existingIndex >= 0 ? voices[existingIndex] : null;

    const mergedTemplates = mergeTemplates(existing?.templates, summary.templates, `offline-${Date.now()}`);
    const mergedTranscripts = mergeTranscriptCollections(existing?.perTranscript, summary.perTranscript);
    const mergedVideoMeta = mergeVideoMeta(existing?.videoMeta, summary.videoMeta);
    const mergedStyleSignature = mergeStyleSignature(existing?.styleSignature, summary.styleSignature);

    const voiceEntry = {
      id: summaryId,
      creatorId: summary.creatorId || summary.handle,
      brandVoiceId: summary.brandVoiceId || summaryId,
      handle: summary.handle,
      displayName: summary.displayName || summary.name || summary.handle,
      description: summary.description || `${summary.handle} brand voice`,
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

    if (existingIndex >= 0) {
      voices[existingIndex] = voiceEntry;
    } else {
      voices = Array.isArray(voices) ? voices : [];
      voices.push(voiceEntry);
    }

    fs.writeFileSync(voicesPath, JSON.stringify(voices, null, 2));
  }

  async saveAnalysis(payload) {
    const {
      creator,
      analysisText,
      analysisJson,
      transcriptsCount = 5,
      niche = 'general',
      videoMeta,
    } = payload || {};

    if (!creator || !creator.handle || (!analysisText && !analysisJson)) {
      throw new CreatorAnalysisServiceError('Missing creator.handle and analysis content', 400);
    }

    const handle = String(creator.handle).replace(/^@/, '').trim();
    const name = creator.name || handle;
    const creatorId = creator.id || creator.creatorId || '';

    let firestore = this.db;
    let useFirestore = !!firestore;
    let fallbackSummary = null;

    const saved = { hooks: 0, bridges: 0, ctas: 0, nuggets: 0, scriptStructures: 0 };

    let hookTemplates = [];
    let bridgeTemplates = [];
    let ctaTemplates = [];
    let nuggetTemplates = [];
    let powerWords = [];
    let fillerPhrases = [];
    let transitionPhrases = [];
    let avgWordsPerSentence;
    let tone = 'Varied';
    let perTranscript = [];

    if (analysisJson) {
      hookTemplates = (analysisJson.templates?.hooks || []).map((hook) => hook.pattern).filter(Boolean);
      bridgeTemplates = (analysisJson.templates?.bridges || []).map((bridge) => bridge.pattern).filter(Boolean);
      ctaTemplates = (analysisJson.templates?.ctas || []).map((cta) => cta.pattern).filter(Boolean);
      nuggetTemplates = (analysisJson.templates?.nuggets || []).map((nugget) => ({
        pattern: nugget.pattern,
        structure: nugget.structure || 'unspecified',
        variables: nugget.variables || [],
      })).filter((nugget) => !!nugget.pattern);

      powerWords = analysisJson.styleSignature?.powerWords || [];
      fillerPhrases = analysisJson.styleSignature?.fillerPhrases || [];
      transitionPhrases = analysisJson.styleSignature?.transitionPhrases || [];
      avgWordsPerSentence = analysisJson.styleSignature?.avgWordsPerSentence;
      tone = analysisJson.styleSignature?.tone || 'Varied';
      perTranscript = Array.isArray(analysisJson.transcripts) ? analysisJson.transcripts : [];
    } else {
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

    const templatesPayload = {
      hooks: hookTemplates.map((pattern) => ({ pattern, variables: findPlaceholders(pattern) })),
      bridges: bridgeTemplates.map((pattern) => ({ pattern, variables: findPlaceholders(pattern) })),
      ctas: ctaTemplates.map((pattern) => ({ pattern, variables: findPlaceholders(pattern) })),
      nuggets: nuggetTemplates.map((nugget) => ({
        pattern: nugget.pattern,
        structure: nugget.structure || 'unspecified',
        variables:
          Array.isArray(nugget.variables) && nugget.variables.length
            ? nugget.variables
            : findPlaceholders(nugget.pattern),
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

    const summaryBase = {
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
      isDefault: (creatorId || handle) === DEFAULT_BRAND_VOICE_ID,
      isDefaultSetByUser: false,
      isShared: false,
      name,
    };

    const recordSavedCounts = () => {
      saved.hooks = templatesPayload.hooks.length;
      saved.bridges = templatesPayload.bridges.length;
      saved.ctas = templatesPayload.ctas.length;
      saved.nuggets = templatesPayload.nuggets.length;
      saved.scriptStructures = normalizedTranscripts.length;
    };

    try {
      if (useFirestore) {
        const libraryCreatorId = creatorId || handle;
        const brandVoiceId = libraryCreatorId;

        await ensureCreatorLibraryDoc(firestore, libraryCreatorId, {
          creatorHandle: handle,
          creatorName: name,
          niche,
        });

        const brandVoiceDocRef = getBrandVoiceDocRef(firestore, libraryCreatorId, brandVoiceId);
        const existingVoiceDoc = await brandVoiceDocRef.get();
        const existingData = existingVoiceDoc.exists ? existingVoiceDoc.data() || {} : {};

        const now = new Date();
        const nowIso = now.toISOString();
        const analysisId = `analysis-${Date.now()}`;

        const combinedTemplates = mergeTemplates(existingData.templates, templatesPayload, analysisId);
        const combinedTranscripts = mergeTranscriptCollections(existingData.perTranscript, normalizedTranscripts);
        const combinedVideoMeta = mergeVideoMeta(existingData.videoMeta, normalizedVideoMeta);
        const mergedStyleSignature = mergeStyleSignature(existingData.styleSignature, styleSignature);

        const userPinnedDefault = existingData.isDefaultSetByUser === true && existingData.isDefault === true;
        const isSeedDefault = (existingData.brandVoiceId || brandVoiceId || handle) === DEFAULT_BRAND_VOICE_ID;
        const isDefaultFlag = userPinnedDefault ? true : isSeedDefault;
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
          isDefaultSetByUser: userPinnedDefault,
          isShared: isSharedFlag,
        };

        await brandVoiceDocRef.set(brandVoicePayload, { merge: true });

        const analysesRef = getAnalysesCollectionRef(firestore, libraryCreatorId, brandVoiceId);
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

        recordSavedCounts();
      } else {
        fallbackSummary = { ...summaryBase };
        recordSavedCounts();
        this.persistLocal(fallbackSummary);
      }
    } catch (error) {
      if (!useFirestore) {
        throw error;
      }

      console.warn('[CreatorAnalysisService] Firestore persistence failed, falling back to local storage:', error?.message || error);
      fallbackSummary = { ...summaryBase };
      recordSavedCounts();
      this.persistLocal(fallbackSummary);
      firestore = null;
      useFirestore = false;
    }

    return {
      creator: { id: creatorId || handle, name, handle },
      brandVoice: { id: creatorId || handle, creatorId: creatorId || handle },
      saved,
      offline: !useFirestore,
    };
  }
}

export { CreatorAnalysisServiceError };

export function getCreatorAnalysisService(firestore) {
  const key = SERVICE_INSTANCE_KEY;
  if (!globalThis[key]) {
    globalThis[key] = new CreatorAnalysisService(firestore || null);
  } else if (firestore && !globalThis[key].db) {
    globalThis[key].db = firestore;
  }
  return globalThis[key];
}
