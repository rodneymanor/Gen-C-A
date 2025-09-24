import { uploadThumbnailToBunny } from '@/lib/bunny-storage';
import { getAdminDb } from '@/lib/firebase-admin';
import { fetchVideosForCreator } from './fetchers';
import { TRACKED_CREATORS } from './config';
import { ViralContentRepository } from './repository';
import type {
  NormalizedViralVideo,
  SyncPerCreatorSummary,
  SyncSummary,
  TrackedCreator,
} from './types';

function formatSyncDate(date: Date): string {
  const utcDate = new Date(date);
  const iso = utcDate.toISOString();
  return iso.slice(0, 10);
}

async function maybeUploadThumbnail(
  creator: TrackedCreator,
  video: NormalizedViralVideo,
): Promise<string | null> {
  if (!video.thumbnailUrl) return null;
  const slugSafeId = video.platformVideoId.replace(/[^a-zA-Z0-9_-]+/g, '');
  const objectPath = `viral-content/${creator.slug}/${video.platform}/${slugSafeId}.jpg`;
  try {
    const uploadedUrl = await uploadThumbnailToBunny(video.thumbnailUrl, objectPath);
    return uploadedUrl;
  } catch (error) {
    console.error('[viral-content] Thumbnail upload failed', {
      creator: creator.slug,
      video: video.platformVideoId,
      error,
    });
    return null;
  }
}

export class ViralContentSyncService {
  private repository: ViralContentRepository;
  private creators: TrackedCreator[];

  constructor(creators: TrackedCreator[] = TRACKED_CREATORS) {
    const db = getAdminDb();
    if (!db) {
      throw new Error('[viral-content] Firestore is not initialized');
    }
    this.repository = new ViralContentRepository({ db });
    this.creators = creators;
  }

  async syncAll(options: {
    date?: Date;
    slugs?: string[];
    platforms?: ViralPlatform[];
  } = {}): Promise<SyncSummary> {
    const { date = new Date(), slugs, platforms } = options;
    const syncDate = formatSyncDate(date);
    const normalizedSlugs = slugs?.map((slug) => slug.toLowerCase());
    const normalizedPlatforms = platforms?.map((platform) => platform.toLowerCase() as ViralPlatform);

    const selectedCreators = this.creators.filter((creator) => {
      const matchesSlug = normalizedSlugs ? normalizedSlugs.includes(creator.slug.toLowerCase()) : true;
      const matchesPlatform = normalizedPlatforms ? normalizedPlatforms.includes(creator.platform) : true;
      return matchesSlug && matchesPlatform;
    });

    const creatorsToProcess = selectedCreators.length > 0 ? selectedCreators : this.creators;
    const summary: SyncPerCreatorSummary[] = [];
    let totalFetched = 0;
    let totalInserted = 0;
    let totalUpdated = 0;

    for (const creator of creatorsToProcess) {
      const creatorSummary: SyncPerCreatorSummary = {
        creator,
        fetched: 0,
        inserted: 0,
        updated: 0,
        errors: [],
      };

      try {
        const videos = await fetchVideosForCreator(creator);
        creatorSummary.fetched = videos.length;
        totalFetched += videos.length;

        for (const video of videos) {
          try {
            const bunnyUrl = await maybeUploadThumbnail(creator, video);
            const { isNew } = await this.repository.upsertVideo(video, {
              bunnyUrl: bunnyUrl ?? undefined,
              syncDate,
            });
            if (isNew) {
              creatorSummary.inserted += 1;
              totalInserted += 1;
            } else {
              creatorSummary.updated += 1;
              totalUpdated += 1;
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            console.error('[viral-content] Failed to upsert video', { creator: creator.slug, error });
            creatorSummary.errors.push({ message, details: error });
          }
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('[viral-content] Failed to sync creator', { creator: creator.slug, error });
        creatorSummary.errors.push({ message, details: error });
      }

      summary.push(creatorSummary);
    }

    return {
      totalFetched,
      totalNew: totalInserted,
      totalUpdated,
      creators: summary,
      ranAt: new Date().toISOString(),
    } satisfies SyncSummary;
  }

  async addManualVideo(payload: {
    platform: ViralPlatform;
    creatorSlug: string;
    creatorName: string;
    platformVideoId: string;
    url: string;
    title: string;
    description?: string;
    thumbnailUrl: string;
    publishedAt?: string;
    metrics?: {
      views?: number;
      likes?: number;
      comments?: number;
      shares?: number;
      followers?: number;
    };
    raw?: Record<string, unknown>;
    creatorPlatformId?: string;
  }) {
    const {
      platform,
      creatorSlug,
      creatorName,
      platformVideoId,
      url,
      title,
      description,
      thumbnailUrl,
      publishedAt,
      metrics,
      raw,
      creatorPlatformId,
    } = payload;

    const now = new Date();
    const syncDate = formatSyncDate(now);

    const trackedCreator =
      this.creators.find((creator) => creator.slug.toLowerCase() === creatorSlug.toLowerCase()) ?? {
        platform,
        slug: creatorSlug,
        displayName: creatorName,
        platformId: creatorPlatformId ?? platformVideoId,
        secondaryId: undefined,
        profileUrl: undefined,
      };

    const video: NormalizedViralVideo = {
      platform,
      creatorSlug,
      creatorName,
      platformVideoId,
      url,
      title,
      description: description ?? '',
      thumbnailUrl,
      metrics: {
        views: metrics?.views,
        likes: metrics?.likes,
        comments: metrics?.comments,
        shares: metrics?.shares,
        followers: metrics?.followers,
      },
      publishedAt: publishedAt ?? undefined,
      fetchedAt: now.toISOString(),
      raw,
    };

    const bunnyUrl = thumbnailUrl ? await maybeUploadThumbnail(trackedCreator, video) : null;

    return this.repository.upsertVideo(video, {
      bunnyUrl: bunnyUrl ?? undefined,
      syncDate,
    });
  }
}

export async function runViralContentSync(options: {
  date?: Date;
  slugs?: string[];
  platforms?: ViralPlatform[];
} = {}) {
  const service = new ViralContentSyncService();
  return service.syncAll(options);
}
