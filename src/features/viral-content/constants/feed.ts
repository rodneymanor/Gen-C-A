import type { Platform, ViralVideo, ViralMetricTone } from '../types';

const metric = (label: string, value: string, tone: ViralMetricTone = 'neutral') => ({
  id: `${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${value}`,
  label,
  value,
  tone,
});

export const BASE_FEED: ViralVideo[] = [
  {
    id: 'yt-01',
    platform: 'youtube',
    creator: 'Ali Abdaal',
    title: 'How I plan my entire YouTube workflow in 2025',
    description:
      'A complete walkthrough of the systems, automations, and AI workflows we use to publish three videos every single week.',
    thumbnail: 'https://images.unsplash.com/photo-1525182008055-f88b95ff7980?auto=format&fit=crop&w=800&q=80',
    url: 'https://youtube.com/watch?v=workflow-demo',
    views: '1.8M views',
    publishedAt: '2 days ago',
    type: 'long',
    metrics: [
      metric('Watch retention', '72%', 'primary'),
      metric('Average view velocity', '4.8x', 'success'),
      metric('Comments', '5.4K', 'neutral'),
    ],
  },
  {
    id: 'tt-01',
    platform: 'tiktok',
    creator: '@latermedia',
    title: 'Hook template that keeps viewers to 90% watch time',
    description:
      'Breakdown of a 15 second hook with framing, punchline, and CTA you can swipe for your next short.',
    thumbnail: 'https://images.unsplash.com/photo-1504274066651-8d31a536b11a?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.tiktok.com/@latermedia/video/hook',
    views: '820K views',
    publishedAt: '5 hours ago',
    type: 'short',
    metrics: [
      metric('Hook score', '5.9x', 'success'),
      metric('Views', '820K', 'primary'),
      metric('Save rate', '6%', 'warning'),
    ],
  },
  {
    id: 'ig-01',
    platform: 'instagram',
    creator: '@jadecreative',
    title: 'Carousel: 5 lighting hacks for solo creators',
    description:
      'Swipe through the setup, gear list, and camera settings that made this shoot go viral on Reels.',
    thumbnail: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=800&q=80',
    url: 'https://instagram.com/p/lighting-hacks',
    views: '240K likes',
    publishedAt: '22 hours ago',
    type: 'short',
    metrics: [
      metric('Saves', '41K', 'primary'),
      metric('Shares', '9.3K', 'success'),
      metric('Completion', '87%', 'success'),
    ],
  },
  {
    id: 'yt-02',
    platform: 'youtube',
    creator: 'Vanessa Lau',
    title: 'Repurpose shorts into long form in 30 minutes',
    description:
      'Vanessa shares a Notion template and Claude prompts that turns five shorts into a 12 minute video script.',
    thumbnail: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=800&q=80',
    url: 'https://youtube.com/watch?v=repurpose-flow',
    views: '640K views',
    publishedAt: '3 days ago',
    type: 'long',
    metrics: [
      metric('Watch time', '18m', 'primary'),
      metric('New subs', '+12K', 'success'),
      metric('CTR', '5.1%', 'warning'),
    ],
  },
  {
    id: 'tt-02',
    platform: 'tiktok',
    creator: '@creatorsociety',
    title: 'Caption formula that works on every platform',
    description:
      'Swipe copy: tension, proof, CTA — with examples pulled from this morning’s top trending shorts.',
    thumbnail: 'https://images.unsplash.com/photo-1529154036614-a60975f5c760?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.tiktok.com/@creatorsociety/video/caption',
    views: '1.1M views',
    publishedAt: '11 hours ago',
    type: 'short',
    metrics: [
      metric('Swipe-through', '68%', 'primary'),
      metric('Likes', '210K', 'success'),
      metric('Completion', '91%', 'success'),
    ],
  },
  {
    id: 'ig-02',
    platform: 'instagram',
    creator: '@social.studio',
    title: 'Reel audio that trended in under 24 hours',
    description:
      'Use this audio with the included beat sheet to lock watch time above 85% on your next launch teaser.',
    thumbnail: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80',
    url: 'https://instagram.com/reel/trending-audio',
    views: '530K plays',
    publishedAt: '14 hours ago',
    type: 'short',
    metrics: [
      metric('Audio adoption', '37K', 'primary'),
      metric('Remixes', '1.4K', 'success'),
      metric('Saves', '22K', 'success'),
    ],
  },
  {
    id: 'yt-03',
    platform: 'youtube',
    creator: 'Think Media',
    title: 'Short-form gear kit under $600 (2025 edition)',
    description:
      'Hands-on review of cameras, lights, and microphones that shipped the best performing shorts this quarter.',
    thumbnail: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    url: 'https://youtube.com/watch?v=gear-kit',
    views: '410K views',
    publishedAt: '5 days ago',
    type: 'long',
    metrics: [
      metric('Watch retention', '63%', 'primary'),
      metric('Affiliate clicks', '8.6K', 'success'),
      metric('Avg view duration', '7m 12s', 'neutral'),
    ],
  },
  {
    id: 'tt-03',
    platform: 'tiktok',
    creator: '@marketingharry',
    title: 'Story beat map for 30 second ads',
    description:
      'Frame-by-frame timing to keep viewers hooked through the pitch without feeling salesy.',
    thumbnail: 'https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=800&q=80',
    url: 'https://www.tiktok.com/@marketingharry/video/storymap',
    views: '920K views',
    publishedAt: '8 hours ago',
    type: 'short',
    metrics: [
      metric('Hook score', '4.3x', 'success'),
      metric('Watch %', '88%', 'primary'),
      metric('Shares', '18K', 'success'),
    ],
  },
  {
    id: 'ig-03',
    platform: 'instagram',
    creator: '@filmcraft',
    title: 'BTS: shooting a viral talking-head short',
    description:
      'Camera moves, gestures, and lighting cues annotated so you can recreate the pacing this weekend.',
    thumbnail: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80',
    url: 'https://instagram.com/reel/bts-viral',
    views: '302K likes',
    publishedAt: '1 day ago',
    type: 'short',
    metrics: [
      metric('Likes', '302K', 'primary'),
      metric('Comments', '9.1K', 'neutral'),
      metric('Completion', '84%', 'success'),
    ],
  },
  {
    id: 'yt-04',
    platform: 'youtube',
    creator: 'Creator Hooks',
    title: '10 hooks that exploded on Shorts last week',
    description:
      'A rapid fire breakdown of hook structures across Instagram Reels and Shorts with scripts you can plug in.',
    thumbnail: 'https://images.unsplash.com/photo-1473187983305-f615310e7daa?auto=format&fit=crop&w=800&q=80',
    url: 'https://youtube.com/watch?v=hooks-explained',
    views: '288K views',
    publishedAt: '18 hours ago',
    type: 'long',
    metrics: [
      metric('Hook score', '6.1x', 'success'),
      metric('Shares', '11K', 'success'),
      metric('Watch time', '9m', 'primary'),
    ],
  },
];

export const PLATFORM_LABELS: Record<Exclude<Platform, 'all'>, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

export const PLATFORM_EMOJI: Record<Exclude<Platform, 'all'>, string> = {
  instagram: '📸',
  tiktok: '🎵',
  youtube: '▶️',
};

const PAGE_SIZE = 9;
const MAX_PAGES = 5;

const filterVideos = (platform: Platform, search: string) => {
  const query = search.trim().toLowerCase();
  return BASE_FEED.filter((video) => {
    const matchesPlatform = platform === 'all' || video.platform === platform;
    const matchesSearch =
      !query ||
      video.title.toLowerCase().includes(query) ||
      video.creator.toLowerCase().includes(query) ||
      video.description.toLowerCase().includes(query);
    return matchesPlatform && matchesSearch;
  });
};

export const fetchMockVideos = async (
  page: number,
  platform: Platform,
  search: string,
): Promise<{ items: ViralVideo[]; hasMore: boolean }> => {
  const filtered = filterVideos(platform, search);
  if (filtered.length === 0) {
    return { items: [], hasMore: false };
  }

  const startIndex = page * PAGE_SIZE;
  const items = Array.from({ length: PAGE_SIZE }, (_, index) => {
    const source = filtered[(startIndex + index) % filtered.length];
    const uniqueSuffix = page * PAGE_SIZE + index;
    return {
      ...source,
      id: `${source.id}-${uniqueSuffix}`,
      publishedAt: uniqueSuffix === 0 ? source.publishedAt : `${uniqueSuffix + 3} hours ago`,
      views: uniqueSuffix === 0 ? source.views : `${Math.max(120, 12 * uniqueSuffix)}K views`,
    } satisfies ViralVideo;
  });

  const hasMore = page + 1 < MAX_PAGES;

  await new Promise((resolve) => setTimeout(resolve, 420));

  return { items, hasMore };
};
