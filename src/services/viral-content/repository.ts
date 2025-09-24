import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase-admin';
import {
  NormalizedViralVideo,
  StoredViralVideo,
  ViralContentRepositoryOptions,
  ViralContentRepositoryRecord,
  ViralPlatform,
} from './types';
import { VIRAL_CONTENT_COLLECTION } from './config';

export class ViralContentRepository {
  private collectionName: string;

  constructor(private readonly options: Partial<ViralContentRepositoryOptions> = {}) {
    this.collectionName = options.collectionName ?? VIRAL_CONTENT_COLLECTION;
  }

  private get db() {
    const directDb = this.options.db;
    if (directDb) return directDb;
    const adminDb = getAdminDb();
    if (!adminDb) {
      throw new Error('[viral-content] Firestore is not configured');
    }
    return adminDb;
  }

  buildDocumentId(platform: ViralPlatform, creatorSlug: string, platformVideoId: string): string {
    return [platform, creatorSlug, platformVideoId].map((part) => part.replace(/[^a-zA-Z0-9_-]+/g, '')).join('_');
  }

  async upsertVideo(
    data: NormalizedViralVideo,
    options: {
      bunnyUrl?: string | null;
      syncDate: string;
    },
  ): Promise<{ record: ViralContentRepositoryRecord; isNew: boolean }>
  {
    const { syncDate, bunnyUrl } = options;
    const docId = this.buildDocumentId(data.platform, data.creatorSlug, data.platformVideoId);
    const collectionRef = this.db.collection(this.collectionName);
    const docRef = collectionRef.doc(docId);
    const nowIso = new Date().toISOString();
    const firstSeenDate = syncDate.slice(0, 10);

    const existingSnap = await docRef.get();
    const baseRecord: ViralContentRepositoryRecord = {
      id: docId,
      platform: data.platform,
      creatorSlug: data.creatorSlug,
      creatorName: data.creatorName,
      platformVideoId: data.platformVideoId,
      url: data.url,
      title: data.title,
      description: data.description,
      metrics: data.metrics,
      thumbnail: {
        original: data.thumbnailUrl,
        bunny: bunnyUrl ?? undefined,
      },
      thumbnailUrl: data.thumbnailUrl,
      publishedAt: data.publishedAt ?? null,
      fetchedAt: data.fetchedAt,
      raw: data.raw ?? {},
      firstSeenAt: nowIso,
      firstSeenDate,
      lastSeenAt: nowIso,
      lastSeenDate: firstSeenDate,
      lastSyncDate: syncDate,
      firestore: {
        path: docRef.path,
      },
    };

    if (!existingSnap.exists) {
      await docRef.set({
        ...baseRecord,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { record: baseRecord, isNew: true };
    }

    const existingData = existingSnap.data() as ViralContentRepositoryRecord | undefined;
    const recordToWrite: Partial<ViralContentRepositoryRecord> = {
      title: data.title,
      description: data.description,
      url: data.url,
      metrics: {
        ...existingData?.metrics,
        ...data.metrics,
      },
      thumbnail: {
        original: data.thumbnailUrl,
        bunny: bunnyUrl ?? existingData?.thumbnail?.bunny,
      },
      thumbnailUrl: data.thumbnailUrl,
      publishedAt: data.publishedAt ?? existingData?.publishedAt ?? null,
      fetchedAt: data.fetchedAt,
      lastSeenAt: nowIso,
      lastSeenDate: firstSeenDate,
      lastSyncDate: syncDate,
      updatedAt: FieldValue.serverTimestamp(),
      raw: data.raw ?? existingData?.raw ?? {},
    };

    await docRef.set(recordToWrite, { merge: true });

    return {
      record: {
        ...(existingData ?? baseRecord),
        ...recordToWrite,
        thumbnail: recordToWrite.thumbnail ?? existingData?.thumbnail ?? baseRecord.thumbnail,
        id: docId,
        firstSeenAt: existingData?.firstSeenAt ?? baseRecord.firstSeenAt,
        firstSeenDate: existingData?.firstSeenDate ?? baseRecord.firstSeenDate,
        firestore: { path: docRef.path },
      } as ViralContentRepositoryRecord,
      isNew: false,
    };
  }

  async listVideos(options: {
    limit?: number;
    platform?: ViralPlatform | 'all';
    includeNewSince?: string; // YYYY-MM-DD
  } = {}) {
    const { limit = 100, platform, includeNewSince } = options;
    const effectiveLimit = includeNewSince ? limit * 3 : limit;

    let query = this.db
      .collection(this.collectionName)
      .orderBy('firstSeenAt', 'desc')
      .limit(effectiveLimit);

    if (platform && platform !== 'all') {
      query = query.where('platform', '==', platform);
    }

    const snapshot = await query.get();
    let records = snapshot.docs.map((doc) => ({ id: doc.id, ...(doc.data() as any) }) as ViralContentRepositoryRecord);

    if (includeNewSince) {
      records = records.filter((record) => (record.firstSeenDate ?? '') >= includeNewSince).slice(0, limit);
    }

    if (!includeNewSince && records.length > limit) {
      records = records.slice(0, limit);
    }

    return records;
  }
}
