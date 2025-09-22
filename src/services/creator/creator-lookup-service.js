class CreatorLookupServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'CreatorLookupServiceError';
    this.statusCode = statusCode;
  }
}

const SERVICE_INSTANCE_KEY = '__creatorLookupService__';

class CreatorLookupService {
  constructor(firestore) {
    this.db = firestore || null;
  }

  async listAnalyzedVideoIds({ handle, creatorId }) {
    if (!handle && !creatorId) {
      throw new CreatorLookupServiceError('handle or creatorId required', 400);
    }

    if (!this.db) {
      return [];
    }

    let resolvedCreatorId = creatorId ? String(creatorId).trim() : '';

    if (!resolvedCreatorId && handle) {
      const normalizedHandle = String(handle).replace(/^@/, '').trim();
      if (!normalizedHandle) {
        return [];
      }
      const creatorsRef = this.db.collection('creators');
      const existing = await creatorsRef.where('handle', '==', normalizedHandle).limit(1).get();
      if (existing.empty) {
        return [];
      }
      resolvedCreatorId = existing.docs[0].id;
    }

    if (!resolvedCreatorId) {
      return [];
    }

    const snapshot = await this.db
      .collection('scriptStructures')
      .where('creatorId', '==', resolvedCreatorId)
      .get();

    const ids = new Set();
    snapshot.forEach((doc) => {
      const videoId = doc.data()?.videoId;
      if (videoId) {
        ids.add(String(videoId));
      }
    });

    return Array.from(ids);
  }
}

export { CreatorLookupServiceError };

export function getCreatorLookupService(firestore) {
  const key = SERVICE_INSTANCE_KEY;
  if (!globalThis[key]) {
    globalThis[key] = new CreatorLookupService(firestore || null);
  } else if (firestore && !globalThis[key].db) {
    globalThis[key].db = firestore;
  }
  return globalThis[key];
}
