import { Timestamp } from 'firebase-admin/firestore';

const COLLECTION_ROOT = 'brandVoiceLibrary';
const BRAND_VOICE_COLLECTION = 'brandVoices';
const ANALYSES_COLLECTION = 'analyses';

const toTimestamp = (value) => {
  if (!value) return Timestamp.fromDate(new Date());
  if (value instanceof Date) return Timestamp.fromDate(value);
  if (value instanceof Timestamp) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? Timestamp.fromDate(new Date()) : Timestamp.fromDate(parsed);
};

export const constants = {
  COLLECTION_ROOT,
  BRAND_VOICE_COLLECTION,
  ANALYSES_COLLECTION,
};

export function getBrandVoiceLibraryRef(db) {
  if (!db) return null;
  return db.collection(COLLECTION_ROOT);
}

export function getCreatorLibraryDocRef(db, creatorId) {
  if (!db || !creatorId) return null;
  const libraryRef = getBrandVoiceLibraryRef(db);
  return libraryRef.doc(String(creatorId));
}

export function getBrandVoiceDocRef(db, creatorId, brandVoiceId) {
  if (!db || !creatorId) return null;
  const creatorDoc = getCreatorLibraryDocRef(db, creatorId);
  const voiceId = brandVoiceId || creatorId;
  return creatorDoc.collection(BRAND_VOICE_COLLECTION).doc(String(voiceId));
}

export function getAnalysesCollectionRef(db, creatorId, brandVoiceId) {
  const voiceDoc = getBrandVoiceDocRef(db, creatorId, brandVoiceId);
  return voiceDoc.collection(ANALYSES_COLLECTION);
}

export async function ensureCreatorLibraryDoc(db, creatorId, metadata) {
  const creatorDoc = getCreatorLibraryDocRef(db, creatorId);
  if (!creatorDoc) return null;

  const now = Timestamp.fromDate(new Date());
  const payload = {
    creatorId: String(creatorId),
    updatedAt: now,
  };

  if (metadata?.creatorHandle) payload.creatorHandle = metadata.creatorHandle;
  if (metadata?.creatorName) payload.creatorName = metadata.creatorName;
  if (metadata?.niche) payload.niche = metadata.niche;

  const docSnap = await creatorDoc.get();
  if (!docSnap.exists) {
    payload.createdAt = now;
  }

  await creatorDoc.set(payload, { merge: true });
  return creatorDoc;
}

export function mergeTemplates(existingTemplates = {}, incomingTemplates = {}, sourceId) {
  const sections = ['hooks', 'bridges', 'ctas', 'nuggets'];
  const merged = {};

  for (const key of sections) {
    const existing = Array.isArray(existingTemplates[key]) ? existingTemplates[key] : [];
    const incoming = Array.isArray(incomingTemplates[key]) ? incomingTemplates[key] : [];

    const seen = new Set();
    const items = [];

    for (const item of existing) {
      if (!item || typeof item.pattern !== 'string') continue;
      const normalized = item.pattern.trim().toLowerCase();
      if (normalized.length === 0) continue;
      const cleaned = {
        pattern: item.pattern.trim(),
        variables: Array.isArray(item.variables)
          ? Array.from(new Set(item.variables.filter((value) => typeof value === 'string' && value.trim().length > 0))).map((value) => value.trim())
          : [],
        structure: typeof item.structure === 'string' && item.structure.trim().length > 0 ? item.structure.trim() : undefined,
      };
      if (item.lastSeenIn) cleaned.lastSeenIn = item.lastSeenIn;
      seen.add(normalized);
      items.push(cleaned);
    }

    for (const item of incoming) {
      if (!item || typeof item.pattern !== 'string') continue;
      const normalized = item.pattern.trim().toLowerCase();
      if (normalized.length === 0 || seen.has(normalized)) continue;
      const entry = {
        pattern: item.pattern.trim(),
        variables: Array.isArray(item.variables)
          ? Array.from(new Set(item.variables.filter((value) => typeof value === 'string' && value.trim().length > 0))).map((value) => value.trim())
          : [],
        structure: typeof item.structure === 'string' && item.structure.trim().length > 0 ? item.structure.trim() : undefined,
      };
      if (sourceId) entry.lastSeenIn = sourceId;
      items.push(entry);
      seen.add(normalized);
    }

    merged[key] = items.map((item) => {
      const copy = { ...item };
      Object.keys(copy).forEach((field) => {
        if (copy[field] === undefined) delete copy[field];
      });
      return copy;
    });
  }

  return merged;
}

const indexBy = (items, pickKey) => {
  const map = new Map();
  for (const item of items) {
    const key = pickKey(item);
    if (!key) continue;
    if (!map.has(key)) {
      map.set(key, item);
    }
  }
  return map;
};

export function mergeTranscriptCollections(existingTranscripts = [], incomingTranscripts = []) {
  const existing = Array.isArray(existingTranscripts) ? existingTranscripts : [];
  const incoming = Array.isArray(incomingTranscripts) ? incomingTranscripts : [];

  const keyFor = (item) => {
    if (!item) return null;
    if (typeof item.id === 'string' && item.id.trim().length > 0) return item.id.trim();
    if (typeof item.videoId === 'string' && item.videoId.trim().length > 0) return item.videoId.trim();
    if (typeof item.title === 'string' && item.title.trim().length > 0) return item.title.trim().toLowerCase();
    if (typeof item.transcript === 'string' && item.transcript.trim().length > 0) return item.transcript.trim().slice(0, 120);
    return null;
  };

  const mergedMap = indexBy(existing, keyFor);

  for (const item of incoming) {
    const key = keyFor(item);
    if (!key) continue;
    if (!mergedMap.has(key)) {
      mergedMap.set(key, item);
    }
  }

  return Array.from(mergedMap.values()).map((item) => {
    if (!item || typeof item !== 'object') return item;
    const copy = { ...item };
    Object.keys(copy).forEach((key) => {
      if (copy[key] === undefined) delete copy[key];
    });
    return copy;
  });
}

export function mergeVideoMeta(existingMeta = [], incomingMeta = []) {
  const existing = Array.isArray(existingMeta) ? existingMeta : [];
  const incoming = Array.isArray(incomingMeta) ? incomingMeta : [];

  const keyFor = (item) => {
    if (!item) return null;
    if (typeof item.id === 'string' && item.id.trim().length > 0) return item.id.trim();
    if (typeof item.videoId === 'string' && item.videoId.trim().length > 0) return item.videoId.trim();
    if (typeof item.url === 'string' && item.url.trim().length > 0) return item.url.trim();
    return null;
  };

  const mergedMap = indexBy(existing, keyFor);
  for (const item of incoming) {
    const key = keyFor(item);
    if (!key) continue;
    if (!mergedMap.has(key)) {
      mergedMap.set(key, item);
    }
  }

  return Array.from(mergedMap.values()).map((item) => {
    if (!item || typeof item !== 'object') return item;
    const copy = { ...item };
    Object.keys(copy).forEach((key) => {
      if (copy[key] === undefined) delete copy[key];
    });
    return copy;
  });
}

export function mergeStyleSignature(existingSignature = {}, incomingSignature = {}) {
  const mergeString = (current, next) => {
    if (typeof next === 'string' && next.trim().length > 0) return next.trim();
    if (typeof current === 'string' && current.trim().length > 0) return current.trim();
    return null;
  };

  const mergeArray = (current, next) => {
    const result = new Set();
    if (Array.isArray(current)) current.forEach((item) => { if (typeof item === 'string' && item.trim().length > 0) result.add(item.trim()); });
    if (Array.isArray(next)) next.forEach((item) => { if (typeof item === 'string' && item.trim().length > 0) result.add(item.trim()); });
    return Array.from(result);
  };

  return {
    powerWords: mergeArray(existingSignature.powerWords, incomingSignature.powerWords),
    fillerPhrases: mergeArray(existingSignature.fillerPhrases, incomingSignature.fillerPhrases),
    transitionPhrases: mergeArray(existingSignature.transitionPhrases, incomingSignature.transitionPhrases),
    avgWordsPerSentence: typeof incomingSignature.avgWordsPerSentence === 'number'
      ? incomingSignature.avgWordsPerSentence
      : typeof existingSignature.avgWordsPerSentence === 'number'
        ? existingSignature.avgWordsPerSentence
        : null,
    tone: mergeString(existingSignature.tone, incomingSignature.tone) || 'Varied',
  };
}

export function buildAnalysisRecord(analysisId, payload) {
  const now = new Date();
  return {
    analysisId,
    createdAt: payload?.createdAt ? toTimestamp(payload.createdAt) : Timestamp.fromDate(now),
    savedAt: payload?.savedAt ? toTimestamp(payload.savedAt) : Timestamp.fromDate(now),
    transcriptsCount: payload?.transcriptsCount ?? 0,
    templates: payload?.templates || {},
    styleSignature: payload?.styleSignature || {},
    perTranscript: payload?.perTranscript || [],
    videoMeta: payload?.videoMeta || [],
    analysis: payload?.analysis || {},
    source: payload?.source || 'analysis-service',
  };
}
