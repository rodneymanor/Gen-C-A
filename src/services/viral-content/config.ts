import type { TrackedCreator } from './types';

export const VIRAL_CONTENT_COLLECTION = 'viral_content_videos';

export const TRACKED_CREATORS: TrackedCreator[] = [
  {
    platform: 'youtube',
    slug: 'yt-garyvee',
    displayName: 'GaryVee',
    platformId: process.env.VIRAL_YOUTUBE_CHANNEL_ID ?? 'UCeY0bbntWzzVIaj2z3QigXg',
    profileUrl: 'https://www.youtube.com/channel/UCeY0bbntWzzVIaj2z3QigXg',
    limit: 50,
  },
  {
    platform: 'instagram',
    slug: 'ig-garyvee',
    displayName: 'GaryVee',
    platformId: process.env.VIRAL_INSTAGRAM_USER_ID ?? '25025320',
    secondaryId: process.env.VIRAL_INSTAGRAM_USERNAME ?? 'garyvee',
    profileUrl: 'https://www.instagram.com/garyvee/',
    limit: 50,
  },
  {
    platform: 'tiktok',
    slug: 'tt-garyvee',
    displayName: 'GaryVee',
    platformId: process.env.VIRAL_TIKTOK_USERNAME ?? 'garyvee',
    profileUrl: 'https://www.tiktok.com/@garyvee',
    limit: 50,
  },
];

