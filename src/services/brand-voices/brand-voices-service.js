import {
  getBrandVoiceLibraryRef,
  getBrandVoiceDocRef,
  getAnalysesCollectionRef,
  mergeTemplates,
  mergeTranscriptCollections,
  mergeVideoMeta,
  mergeStyleSignature,
} from '../../api-routes/utils/brand-voice-store.js';

class BrandVoicesServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'BrandVoicesServiceError';
    this.statusCode = statusCode;
  }
}

function toDate(value) {
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
}

const SERVICE_INSTANCE_KEY = '__brandVoicesService__';

class BrandVoicesService {
  constructor(firestore) {
    if (!firestore) {
      throw new Error('Firestore instance is required to initialize BrandVoicesService');
    }
    this.db = firestore;
  }

  async listBrandVoices() {
    try {
      const voicesSnap = await this.db.collectionGroup('brandVoices').get();
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
          keywords:
            Array.isArray(style.powerWords) && style.powerWords.length
              ? style.powerWords.slice(0, 8)
              : Array.isArray(voiceData.keywords)
                ? voiceData.keywords.slice(0, 8)
                : [],
          platforms:
            Array.isArray(voiceData.platforms) && voiceData.platforms.length
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

      return voices;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new BrandVoicesServiceError(message, 500);
    }
  }

  async getTemplates({ creatorId, brandVoiceId }) {
    if (!creatorId) {
      throw new BrandVoicesServiceError('creatorId is required', 400);
    }

    const effectiveId = brandVoiceId || creatorId;
    const voiceDocRef = getBrandVoiceDocRef(this.db, creatorId, effectiveId);
    const voiceDoc = await voiceDocRef.get();
    if (!voiceDoc.exists) {
      throw new BrandVoicesServiceError('Brand voice not found', 404);
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

    return {
      templates: {
        hooks: mapTemplates(templates.hooks, 'hook'),
        bridges: mapTemplates(templates.bridges, 'bridge'),
        ctas: mapTemplates(templates.ctas, 'cta'),
        nuggets: mapTemplates(templates.nuggets, 'nugget'),
      },
      styleSignature: voiceData.styleSignature || null,
    };
  }

  async deleteBrandVoice({ creatorId, brandVoiceId }) {
    if (!creatorId) {
      throw new BrandVoicesServiceError('creatorId is required', 400);
    }

    const effectiveId = brandVoiceId || creatorId;
    const voiceRef = getBrandVoiceDocRef(this.db, creatorId, effectiveId);
    const voiceSnap = await voiceRef.get();

    if (!voiceSnap.exists) {
      throw new BrandVoicesServiceError('Brand voice not found', 404);
    }

    const voiceData = voiceSnap.data() || {};
    const wasDefault = voiceData.isDefault === true;

    await voiceRef.delete();

    const analysesRef = getAnalysesCollectionRef(this.db, creatorId, effectiveId);
    const analysesSnap = await analysesRef.get();
    const batch = this.db.batch();
    analysesSnap.forEach((doc) => batch.delete(doc.ref));
    if (!analysesSnap.empty) {
      await batch.commit();
    }

    const creatorDocRef = getBrandVoiceLibraryRef(this.db).doc(String(creatorId));
    const remainingVoicesSnap = await creatorDocRef.collection('brandVoices').get();
    let reassignedDefault = null;

    if (remainingVoicesSnap.empty) {
      await creatorDocRef.delete();
    } else if (wasDefault) {
      const fallbackVoice = remainingVoicesSnap.docs[0];
      await fallbackVoice.ref.set({ isDefault: true }, { merge: true });
      reassignedDefault = fallbackVoice.id;
    }

    return {
      creatorId: String(creatorId),
      brandVoiceId: String(effectiveId),
      reassignedDefault,
    };
  }

  async updateBrandVoiceMeta({
    creatorId,
    brandVoiceId,
    displayName,
    isShared,
    isDefault,
    templates,
    styleSignature,
    perTranscript,
    videoMeta,
  }) {
    if (!creatorId) {
      throw new BrandVoicesServiceError('creatorId is required', 400);
    }

    const effectiveId = brandVoiceId || creatorId;
    const voiceRef = getBrandVoiceDocRef(this.db, creatorId, effectiveId);
    const voiceSnap = await voiceRef.get();

    if (!voiceSnap.exists) {
      throw new BrandVoicesServiceError('Brand voice not found', 404);
    }

    if (isDefault === true) {
      const siblings = await voiceRef.parent.get();
      const batch = this.db.batch();
      siblings.forEach((doc) => {
        if (doc.id === voiceRef.id) return;
        batch.set(doc.ref, { isDefault: false, isDefaultSetByUser: false }, { merge: true });
      });
      if (!siblings.empty) {
        await batch.commit();
      }
    }

    const existing = voiceSnap.data() || {};
    const patch = {
      ...(displayName !== undefined ? { displayName: String(displayName) } : {}),
      ...(isShared !== undefined ? { isShared: !!isShared } : {}),
      ...(isDefault !== undefined ? { isDefault: !!isDefault, isDefaultSetByUser: !!isDefault } : {}),
      updatedAt: new Date(),
    };

    if (templates) {
      patch.templates = mergeTemplates(existing.templates, templates);
    }
    if (styleSignature) {
      patch.styleSignature = mergeStyleSignature(existing.styleSignature, styleSignature);
    }
    if (perTranscript) {
      patch.perTranscript = mergeTranscriptCollections(existing.perTranscript, perTranscript);
    }
    if (videoMeta) {
      patch.videoMeta = mergeVideoMeta(existing.videoMeta, videoMeta);
    }

    await voiceRef.set(patch, { merge: true });
  }
}

export { BrandVoicesServiceError };

export function getBrandVoicesService(firestore) {
  if (!firestore) {
    throw new Error('Firestore instance is required to get BrandVoicesService');
  }

  if (!globalThis[SERVICE_INSTANCE_KEY]) {
    globalThis[SERVICE_INSTANCE_KEY] = new BrandVoicesService(firestore);
  }

  return globalThis[SERVICE_INSTANCE_KEY];
}
