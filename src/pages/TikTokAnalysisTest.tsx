import React, { useState } from 'react';
import { css } from '@emotion/react';

// Atlassian Design System Icons
import PersonIcon from '@atlaskit/icon/glyph/person';
import VideoIcon from '@atlaskit/icon/glyph/video-filled';
import SearchIcon from '@atlaskit/icon/glyph/search';
import DownloadIcon from '@atlaskit/icon/glyph/download';
import CheckCircleIcon from '@atlaskit/icon/glyph/check-circle';
import ErrorIcon from '@atlaskit/icon/glyph/error';
import RefreshIcon from '@atlaskit/icon/glyph/refresh';
import GraphLineIcon from '@atlaskit/icon/glyph/graph-line';
import DocumentIcon from '@atlaskit/icon/glyph/document';

import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

type PlatformType = 'tiktok' | 'instagram';

interface NormalizedHandleResult {
  identifier: string;
  displayHandle: string;
}

type TranscribedVideoMeta = {
  id: string;
  url?: string;
  title?: string;
  sourceUrl?: string;
  platform?: PlatformType;
  thumbnailUrl?: string | null;
};

const getPlatformLabel = (platform: PlatformType) => (platform === 'instagram' ? 'Instagram' : 'TikTok');

const extractInstagramUsernameFromInput = (input: string): string | null => {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const clean = trimmed.replace(/^@/, '');

  if (/^https?:\/\//i.test(clean)) {
    try {
      const url = new URL(clean);
      if (!url.hostname.includes('instagram.com')) {
        return null;
      }
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (!pathParts.length) {
        return null;
      }
      const candidate = pathParts[0].replace(/^@/, '').split(/[?#]/)[0];
      return /^[a-zA-Z0-9._]+$/.test(candidate) ? candidate : null;
    } catch (error) {
      console.warn('⚠️ Unable to parse Instagram URL', error);
      return null;
    }
  }

  const username = clean.split(/[?#]/)[0];
  return /^[a-zA-Z0-9._]+$/.test(username) ? username : null;
};

const normalizeHandleInput = (input: string, platform: PlatformType): NormalizedHandleResult => {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Please enter a username or profile URL.');
  }

  if (platform === 'instagram') {
    const username = extractInstagramUsernameFromInput(trimmed);
    if (!username) {
      throw new Error('Unable to extract an Instagram username from the provided input.');
    }
    return { identifier: username, displayHandle: `@${username}` };
  }

  let working = trimmed;
  if (/^https?:\/\//i.test(working)) {
    try {
      const url = new URL(working);
      if (url.hostname.includes('tiktok.com')) {
        const segments = url.pathname.split('/').filter(Boolean);
        const atHandle = segments.find((segment) => segment.startsWith('@'));
        if (atHandle) {
          working = atHandle.slice(1);
        } else if (segments.length) {
          working = segments[0];
        }
      }
    } catch (error) {
      console.warn('⚠️ Unable to parse TikTok URL', error);
    }
  }

  working = working.replace(/^@/, '').split(/[/?#]/)[0];
  if (!working) {
    throw new Error('TikTok username could not be determined from the input.');
  }

  return { identifier: working, displayHandle: `@${working}` };
};

interface InstagramUserIdApiResponse {
  success?: boolean;
  user_id?: string | number;
  error?: string;
}

interface InstagramReelsApiResponse {
  success?: boolean;
  data?: { items?: any[] };
  error?: string;
}

const parseJsonResponse = async <T,>(
  response: Response,
  context: string
): Promise<{ data: T | null; raw: string }> => {
  const raw = await response.text();

  if (!raw) {
    return { data: null, raw };
  }

  try {
    return { data: JSON.parse(raw) as T, raw };
  } catch (error) {
    console.warn(`⚠️ ${context}: Failed to parse JSON (status ${response.status}). Raw response:`, raw);
    throw new Error(`${context}: Received invalid JSON (status ${response.status}).`);
  }
};

interface DashManifestUrls {
  videoUrl?: string;
  audioUrl?: string;
}

const parseDashManifestForLowestUrls = (manifest?: string | null): DashManifestUrls => {
  const result: DashManifestUrls = {};
  if (!manifest || typeof manifest !== 'string') {
    return result;
  }

  try {
    if (typeof DOMParser === 'undefined') {
      return result;
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(manifest, 'application/xml');
    const adaptationSets = Array.from(doc.getElementsByTagName('AdaptationSet'));

    let lowestVideo: { url?: string; bandwidth: number } = { bandwidth: Number.POSITIVE_INFINITY };
    let lowestAudio: { url?: string; bandwidth: number } = { bandwidth: Number.POSITIVE_INFINITY };

    adaptationSets.forEach((set) => {
      const contentType = set.getAttribute('contentType') ?? '';
      const representations = Array.from(set.getElementsByTagName('Representation'));
      representations.forEach((rep) => {
        const bandwidthAttr = rep.getAttribute('bandwidth');
        const bandwidth = bandwidthAttr ? parseInt(bandwidthAttr, 10) : Number.POSITIVE_INFINITY;
        const baseUrl = rep.getElementsByTagName('BaseURL')[0]?.textContent?.trim();
        if (!baseUrl) return;

        if (contentType === 'video') {
          if (bandwidth < lowestVideo.bandwidth) {
            lowestVideo = { url: baseUrl, bandwidth };
          }
        } else if (contentType === 'audio') {
          if (bandwidth < lowestAudio.bandwidth) {
            lowestAudio = { url: baseUrl, bandwidth };
          }
        }
      });
    });

    if (lowestVideo.url) {
      result.videoUrl = lowestVideo.url;
    }
    if (lowestAudio.url) {
      result.audioUrl = lowestAudio.url;
    }
  } catch (error) {
    console.warn('⚠️ Failed to parse DASH manifest', error);
  }

  return result;
};

type VideoVersion = { bandwidth?: number; url?: string };

const selectLowestBandwidthVersion = <T extends VideoVersion>(versions?: T[] | null): T | null => {
  if (!Array.isArray(versions) || versions.length === 0) {
    return null;
  }

  const sorted = [...versions].sort((a, b) => (a.bandwidth ?? Number.POSITIVE_INFINITY) - (b.bandwidth ?? Number.POSITIVE_INFINITY));
  return sorted.find((item) => typeof item?.url === 'string' && item.url.length > 0) ?? null;
};

const mapInstagramMediaToVideo = (media: any) => {
  if (!media) return null;

  const dashManifest =
    media.video_dash_manifest ||
    media?.clips_metadata?.original_sound_info?.dash_manifest ||
    media?.clips_metadata?.music_info?.music_asset_info?.dash_manifest;

  const dashUrls = parseDashManifestForLowestUrls(dashManifest);
  const lowestVersion = selectLowestBandwidthVersion(media?.video_versions);

  const coverCandidate =
    media?.image_versions2?.candidates?.[0]?.url ||
    media?.image_versions2?.additional_candidates?.first_frame?.url ||
    media?.image_versions2?.additional_candidates?.igtv_first_frame?.url ||
    '';

  const audioUrl =
    dashUrls.audioUrl ||
    media?.clips_metadata?.original_sound_info?.progressive_download_url ||
    media?.clips_metadata?.music_info?.music_asset_info?.progressive_download_url ||
    null;

  const playUrl = lowestVersion?.url || dashUrls.videoUrl || audioUrl || '';
  const downloadUrl = playUrl; // For transcription, we need video not audio-only

  if (!downloadUrl) {
    return null;
  }

  const author = media?.user ?? {};
  const captionText = media?.caption?.text ?? '';

  return {
    id: media?.id || media?.code || String(media?.pk ?? ''),
    description: captionText,
    createTime: media?.taken_at ?? 0,
    duration: media?.video_duration ?? 0,
    cover: coverCandidate,
    playUrl,
    downloadUrl,
    audioUrl,
    stats: {
      diggCount: media?.like_count ?? 0,
      shareCount: 0,
      commentCount: media?.comment_count ?? 0,
      playCount: media?.play_count ?? 0,
      collectCount: 0,
    },
    music: {
      id:
        media?.clips_metadata?.music_info?.music_asset_info?.id ||
        String(media?.clips_metadata?.original_sound_info?.audio_asset_id ?? ''),
      title:
        media?.clips_metadata?.music_info?.music_asset_info?.title ||
        media?.clips_metadata?.original_sound_info?.original_audio_title ||
        'Original Audio',
      author:
        media?.clips_metadata?.music_info?.music_asset_info?.display_artist ||
        media?.clips_metadata?.original_sound_info?.ig_artist?.username ||
        author?.username ||
        '',
      playUrl:
        media?.clips_metadata?.music_info?.music_asset_info?.progressive_download_url ||
        media?.clips_metadata?.original_sound_info?.progressive_download_url ||
        audioUrl ||
        '',
      cover:
        media?.clips_metadata?.music_info?.music_asset_info?.cover_artwork_uri ||
        media?.clips_metadata?.music_info?.music_asset_info?.cover_artwork_thumbnail_uri ||
        '',
      original: !media?.clips_metadata?.music_info?.music_asset_info?.id,
      duration:
        media?.clips_metadata?.original_sound_info?.duration_in_ms
          ? media?.clips_metadata?.original_sound_info?.duration_in_ms / 1000
          : media?.video_duration ?? 0,
    },
    author: {
      id: String(author?.pk ?? author?.pk_id ?? author?.fbid_v2 ?? ''),
      username: author?.username ?? '',
      nickname: author?.full_name ?? author?.username ?? '',
      avatar: author?.profile_pic_url ?? '',
      verified: author?.is_verified ?? false,
      signature: '',
      stats: {
        followingCount: 0,
        followerCount: author?.follower_count ?? 0,
        heartCount: 0,
        videoCount: 0,
        diggCount: 0,
      },
    },
    platform: 'instagram',
    permalink: media?.code ? `https://www.instagram.com/reel/${media.code}/` : undefined,
  };
};

const mapInstagramItemsToResult = (items: any[], userId: string, username: string) => {
  const videos = (items || [])
    .map((item) => mapInstagramMediaToVideo(item?.media))
    .filter((video): video is ReturnType<typeof mapInstagramMediaToVideo> => Boolean(video));

  const firstMediaUser = items?.find((item) => item?.media?.user)?.media?.user;
  const userInfo = firstMediaUser
    ? {
        id: String(firstMediaUser?.pk ?? firstMediaUser?.pk_id ?? firstMediaUser?.fbid_v2 ?? userId),
        username: firstMediaUser?.username ?? username,
        nickname: firstMediaUser?.full_name ?? firstMediaUser?.username ?? username,
        avatar: firstMediaUser?.profile_pic_url ?? '',
        signature: '',
        verified: firstMediaUser?.is_verified ?? false,
        stats: {
          followingCount: 0,
          followerCount: firstMediaUser?.follower_count ?? 0,
          heartCount: 0,
          videoCount: videos.length,
          diggCount: 0,
        },
      }
    : {
        id: userId,
        username,
        nickname: username,
        avatar: '',
        signature: '',
        verified: false,
        stats: {
          followingCount: 0,
          followerCount: 0,
          heartCount: 0,
          videoCount: videos.length,
          diggCount: 0,
        },
      };

  return {
    success: true,
    platform: 'instagram' as const,
    userInfo,
    videos,
    platformUserId: userId,
  };
};

const pageStyles = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
`;

const headerStyles = css`
  text-align: center;
  margin-bottom: var(--space-8);

  h1 {
    font-size: var(--font-size-h1);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-3) 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
  }

  p {
    font-size: var(--font-size-body);
    color: var(--color-text-secondary);
    margin: 0;
  }
`;

const formStyles = css`
  margin-bottom: var(--space-6);

  .form-group {
    margin-bottom: var(--space-4);
  }

  .form-actions {
    display: flex;
    gap: var(--space-3);
    align-items: center;
    flex-wrap: wrap;
  }

  .platform-select {
    min-width: 160px;
  }

  .platform-select select {
    width: 100%;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-medium);
    background: var(--color-surface);
    font-family: var(--font-family-body);
    font-size: var(--font-size-body);
    color: var(--color-text-primary);
  }

  .input-container {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex: 1;
    min-width: 250px;

    .handle-icon {
      color: var(--color-text-secondary);
      flex-shrink: 0;
    }
  }
`;

const stepsContainerStyles = css`
  display: grid;
  gap: var(--space-4);
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
`;

const stepCardStyles = css`
  .step-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-3);
    padding-bottom: var(--space-2);
    border-bottom: var(--border-default);

    h3 {
      font-size: var(--font-size-h5);
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-primary);
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--space-2);
    }

    .step-status {
      display: flex;
      align-items: center;
      gap: var(--space-1);
      font-size: var(--font-size-body-small);
      font-weight: var(--font-weight-medium);

      &.pending {
        color: var(--color-text-secondary);
      }

      &.running {
        color: var(--color-information-500);
      }

      &.success {
        color: var(--color-success-500);
      }

      &.error {
        color: var(--color-danger-500);
      }
    }
  }

  .step-description {
    color: var(--color-text-secondary);
    font-size: var(--font-size-body-small);
    margin-bottom: var(--space-3);
  }

  .step-content {
    background: var(--color-surface);
    border: var(--border-default);
    border-radius: var(--radius-large);
    padding: var(--space-3);
    font-family: var(--font-family-monospace);
    font-size: var(--font-size-body-small);
    line-height: var(--line-height-relaxed);
    color: var(--color-text-primary);
    max-height: 300px;
    overflow-y: auto;
    white-space: pre-wrap;
  }

  .step-action {
    margin-top: var(--space-3);
  }
`;

const errorStyles = css`
  background: var(--color-danger-50);
  border: 1px solid var(--color-danger-200);
  border-radius: var(--radius-large);
  padding: var(--space-4);
  color: var(--color-danger-500);
  font-size: var(--font-size-body);
  margin-bottom: var(--space-6);
`;

interface StepStatus {
  status: 'pending' | 'running' | 'success' | 'error';
  data?: any;
  error?: string;
}

// Inline Template Tester component
const TemplateTester: React.FC<{ templates: any }> = ({ templates }) => {
  const [type, setType] = React.useState<'hooks' | 'bridges' | 'ctas' | 'nuggets'>('hooks');
  const list: Array<any> = templates?.[type] || [];
  const [index, setIndex] = React.useState(0);

  const pattern: string = list[index]?.pattern || '';
  const placeholderVars: string[] = (list[index]?.variables && Array.isArray(list[index].variables))
    ? list[index].variables
    : Array.from(pattern.matchAll(/\[([^\]]+)\]/g)).map((m) => m[1]);

  const [values, setValues] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    // Reset when selection changes
    setValues({});
  }, [type, index]);

  const render = () => {
    let out = pattern || '';
    for (const v of placeholderVars) {
      const re = new RegExp(`\\[${v.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\]`, 'g');
      out = out.replace(re, values[v] ?? `[${v}]`);
    }
    return out;
  };

  if (!list.length) return <div style={{ marginTop: 12 }}>No templates available for testing.</div>;

  return (
    <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--color-border-subtle)' }}>
      <div style={{ fontWeight: 600, marginBottom: 8 }}>Test Template</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <select value={type} onChange={(e) => { setType(e.target.value as any); setIndex(0); }}>
          <option value="hooks">Hook</option>
          <option value="bridges">Bridge</option>
          <option value="ctas">Why to Act</option>
          <option value="nuggets">Golden Nugget</option>
        </select>

        <select value={index} onChange={(e) => setIndex(Number(e.target.value))}>
          {list.map((_: any, i: number) => (
            <option key={i} value={i}>#{i + 1}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: 8 }}>
        <div style={{ marginBottom: 4, color: 'var(--color-text-secondary)' }}>Pattern</div>
        <div style={{ fontFamily: 'var(--font-family-monospace)' }}>{pattern || '—'}</div>
      </div>

      {placeholderVars.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 8, marginBottom: 8 }}>
          {placeholderVars.map((v) => (
            <input
              key={v}
              placeholder={v}
              value={values[v] || ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [v]: e.target.value }))}
              style={{
                padding: '8px 10px',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                fontFamily: 'var(--font-family-monospace)'
              }}
            />
          ))}
        </div>
      )}

      <div>
        <div style={{ marginBottom: 4, color: 'var(--color-text-secondary)' }}>Rendered</div>
        <div style={{
          padding: 12,
          border: '1px solid var(--color-border-subtle)',
          borderRadius: 8,
          background: 'var(--color-surface)'
        }}>{render()}</div>
      </div>
    </div>
  );
};

export const TikTokAnalysisTest: React.FC = () => {
  // Controls
  const VIDEO_LIMIT = 20; // Number of videos to fetch/transcribe/analyze
  const TRANSCRIBE_CONCURRENCY = 2; // Parallel transcriptions (lowered for Gemini stability)
  const [platform, setPlatform] = useState<PlatformType>('tiktok');
  const [username, setUsername] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [customPrompt, setCustomPrompt] = useState<string>(
    'Return concise JSON with keys tone, style, hooks, transitions based on the transcripts. Keep it brief.'
  );
  const [systemPrompt, setSystemPrompt] = useState<string>(
    'You are an expert short-form video script analyst. Focus on hooks, bridges, golden nuggets, transitions, why to act prompts, and tone/style fingerprints. Be precise. When asked for JSON, return valid, minimal JSON only.'
  );
  // Advanced controls for Step 3
  const [advOpen, setAdvOpen] = useState<boolean>(false);
  const [analysisModel, setAnalysisModel] = useState<string>('gemini-1.5-flash');
  const [analysisMaxTokens, setAnalysisMaxTokens] = useState<number>(8000);
  const [analysisTemperature, setAnalysisTemperature] = useState<number>(0.2);

  // Step states
  const [step1, setStep1] = useState<StepStatus>({ status: 'pending' });
  const [step2, setStep2] = useState<StepStatus>({ status: 'pending' });
  const [step3, setStep3] = useState<StepStatus>({ status: 'pending' });
  const [step4, setStep4] = useState<StepStatus>({ status: 'pending' });
  const [step5, setStep5] = useState<StepStatus>({ status: 'pending' });
  const [stepRunPrompt, setStepRunPrompt] = useState<StepStatus>({ status: 'pending' });
  const [stepSave, setStepSave] = useState<StepStatus>({ status: 'pending' });

  const resetSteps = () => {
    setStep1({ status: 'pending' });
    setStep2({ status: 'pending' });
    setStep3({ status: 'pending' });
    setStep4({ status: 'pending' });
    setStep5({ status: 'pending' });
    setStepRunPrompt({ status: 'pending' });
    setStepSave({ status: 'pending' });
  };

  const fetchInstagramStepData = async (identifier: string, displayHandle: string) => {
    console.log('📸 Resolving Instagram user ID for', displayHandle);
    const userIdResponse = await fetch(`/api/instagram/user-id?username=${encodeURIComponent(identifier)}`);
    const { data: userIdResult } = await parseJsonResponse<InstagramUserIdApiResponse>(
      userIdResponse,
      'Instagram user lookup'
    );

    if (!userIdResponse.ok || !userIdResult?.success || !userIdResult?.user_id) {
      const userIdError = userIdResult?.error?.trim();
      const errorMessage = userIdError && userIdError.length > 0
        ? userIdError
        : `Failed to resolve Instagram user ID (HTTP ${userIdResponse.status})`;
      throw new Error(errorMessage);
    }

    if (!userIdResult) {
      throw new Error('Failed to resolve Instagram user ID (empty response).');
    }

    const userId = String(userIdResult.user_id);
    console.log(`📸 Fetching Instagram reels for user ID: ${userId}`);

    const reelsQuery = new URLSearchParams({
      user_id: userId,
      include_feed_video: 'true',
      username: identifier
    });
    const reelsResponse = await fetch(`/api/instagram/user-reels?${reelsQuery.toString()}`);
    const { data: reelsResult } = await parseJsonResponse<InstagramReelsApiResponse>(
      reelsResponse,
      'Instagram reels fetch'
    );

    if (!reelsResponse.ok || !reelsResult?.success) {
      const reelsError = reelsResult?.error?.trim();
      const errorMessage = reelsError && reelsError.length > 0
        ? reelsError
        : `Failed to fetch Instagram reels (HTTP ${reelsResponse.status})`;
      throw new Error(errorMessage);
    }

    if (!reelsResult) {
      throw new Error('Failed to fetch Instagram reels (empty response).');
    }

    const items = Array.isArray(reelsResult?.data?.items) ? reelsResult.data.items : [];
    let mapped;

    if (items.length > 0) {
      mapped = mapInstagramItemsToResult(items, userId, identifier);
    } else if (Array.isArray((reelsResult as any)?.processed?.videos) && (reelsResult as any).processed.videos.length) {
      const processed: any = (reelsResult as any).processed;
      const profileData = processed.profileData || {};
      const videos = processed.videos.map((video: any) => ({
        id: video.id,
        description: video.description ?? '',
        createTime: 0,
        duration: video.duration ?? 0,
        cover: video.thumbnailUrl ?? '',
        playUrl: video.playUrl ?? video.videoUrl,
        downloadUrl: video.downloadUrl ?? video.videoUrl,
        audioUrl: undefined,
        stats: {
          diggCount: video.likeCount ?? 0,
          shareCount: 0,
          commentCount: 0,
          playCount: video.viewCount ?? 0,
          collectCount: 0,
        },
        music: {
          id: '',
          title: video.title ?? 'Original Audio',
          author: video.author ?? identifier,
          playUrl: video.audioUrl ?? '',
          cover: video.thumbnailUrl ?? '',
          original: true,
          duration: video.duration ?? 0,
        },
        author: {
          id: userId,
          username: profileData?.displayName ?? identifier,
          nickname: profileData?.displayName ?? identifier,
          avatar: profileData?.profileImageUrl ?? '',
          verified: Boolean(profileData?.isVerified),
          signature: profileData?.bio ?? '',
          stats: {
            followingCount: profileData?.followingCount ?? 0,
            followerCount: profileData?.followersCount ?? 0,
            heartCount: profileData?.postsCount ?? 0,
            videoCount: processed.totalFound ?? processed.videos.length,
            diggCount: 0,
          },
        },
        platform: 'instagram' as const,
        permalink: undefined,
      }));

      mapped = {
        success: true,
        platform: 'instagram' as const,
        platformUserId: userId,
        userInfo: {
          id: userId,
          username: identifier,
          nickname: profileData?.displayName ?? identifier,
          avatar: profileData?.profileImageUrl ?? '',
          signature: profileData?.bio ?? '',
          verified: Boolean(profileData?.isVerified),
          stats: {
            followingCount: profileData?.followingCount ?? 0,
            followerCount: profileData?.followersCount ?? 0,
            heartCount: 0,
            videoCount: processed.videos.length,
            diggCount: 0,
          },
        },
        videos,
      };
    } else {
      mapped = mapInstagramItemsToResult([], userId, identifier);
    }

    return {
      ...mapped,
      platform: 'instagram' as const,
      platformUserId: userId,
      raw: { userId: userIdResult, reels: reelsResult },
    };
  };

  const handleStep1 = async () => {
    if (!username.trim()) return;

    setIsRunning(true);
    setStep1({ status: 'running' });

    try {
      const { identifier, displayHandle } = normalizeHandleInput(username, platform);
      setUsername(displayHandle);

      const platformLabel = getPlatformLabel(platform);
      console.log(`🚀 Step 1: Fetching ${platformLabel} videos for:`, displayHandle);

      let baseResult: any;

      if (platform === 'tiktok') {
        const response = await fetch('/api/tiktok/user-feed', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: identifier, count: VIDEO_LIMIT })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || `API returned ${response.status}`);
        }

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch videos');
        }

        baseResult = {
          ...result,
          platform: 'tiktok' as const,
          platformUserId: result?.userInfo?.id ?? identifier,
        };
      } else {
        baseResult = await fetchInstagramStepData(identifier, displayHandle);
      }

      // Optionally filter out videos already analyzed for this creator
      let filtered = baseResult?.videos || [];
      try {
        const lookup = await fetch(`/api/creator/analyzed-video-ids?handle=${encodeURIComponent(identifier)}`);
        const idsRes = await lookup.json();
        if (lookup.ok && idsRes?.success && Array.isArray(idsRes.videoIds) && idsRes.videoIds.length) {
          const existing = new Set(idsRes.videoIds.map(String));
          const before = filtered.length;
          filtered = filtered.filter((v: any) => !existing.has(String(v?.id)));
          console.log(`ℹ️ Filtered already-analyzed videos: ${before - filtered.length} removed, ${filtered.length} remaining`);
        }
      } catch (e) {
        console.warn('Skipping analyzed-video-ids check:', (e as any)?.message || e);
      }

      setStep1({ status: 'success', data: { ...baseResult, videos: filtered, displayHandle } });
      console.log(
        `✅ Step 1 completed (${getPlatformLabel(baseResult?.platform ?? platform)}):`,
        filtered.length,
        'videos ready'
      );
    } catch (error: any) {
      console.error('❌ Step 1 failed:', error);
      setStep1({ status: 'error', error: error.message });
    } finally {
      setIsRunning(false);
    }
  };

  const handleStep2 = async () => {
    if (step1.status !== 'success' || !step1.data?.videos) {
      alert('Step 1 must be completed first');
      return;
    }

    setStep2({ status: 'running' });

    try {
      console.log(`🚀 Step 2: Transcribing videos (parallel x${TRANSCRIBE_CONCURRENCY})...`);
      const videos = step1.data.videos.slice(0, VIDEO_LIMIT);

      // Concurrency-limited worker pool (size 3)
      const CONCURRENCY = TRANSCRIBE_CONCURRENCY;
      const results: Array<{ transcript?: string; meta?: TranscribedVideoMeta } | null> = new Array(videos.length).fill(null);
      let nextIndex = 0;

      const resolveScrapeSourceUrl = (video: any): string | null => {
        const directCandidates: Array<unknown> = [
          video?.permalink,
          video?.shareUrl,
          video?.share_url,
          video?.url,
          video?.meta?.permalink,
          video?.meta?.url,
        ];

        for (const candidate of directCandidates) {
          if (typeof candidate === 'string') {
            const trimmed = candidate.trim();
            if (trimmed.length > 0 && /^https?:\/\//i.test(trimmed)) {
              return trimmed;
            }
          }
        }

        const platformHint = (video?.platform || step1.data?.platform) as PlatformType | undefined;

        if (platformHint === 'tiktok') {
          const rawHandle =
            (typeof video?.author?.username === 'string' && video.author.username.trim()) ||
            (typeof video?.author?.uniqueId === 'string' && video.author.uniqueId.trim()) ||
            (typeof step1.data?.userInfo?.username === 'string' && step1.data.userInfo.username.trim()) ||
            '';

          if (rawHandle && video?.id) {
            const cleanHandle = rawHandle.replace(/^@/, '');
            return `https://www.tiktok.com/@${cleanHandle}/video/${video.id}`;
          }
        }

        if (platformHint === 'instagram') {
          const shortcode =
            (typeof video?.code === 'string' && video.code.trim()) ||
            (typeof video?.shortcode === 'string' && video.shortcode.trim()) ||
            (typeof video?.id === 'string' && video.id.length <= 15 ? video.id.trim() : '');

          if (shortcode) {
            return `https://www.instagram.com/reel/${shortcode.replace(/\//g, '')}/`;
          }
        }

        return null;
      };

      const preferAudioOnly = false;

      const worker = async (workerId: number) => {
        while (nextIndex < videos.length) {
          const i = nextIndex;
          nextIndex += 1;
          if (i >= videos.length) {
            return;
          }

          const video = videos[i];
          const scrapeSourceUrl = resolveScrapeSourceUrl(video);
          const fallbackTranscriptionUrl =
            video.downloadUrl ||
            video.playUrl ||
            video.audioUrl ||
            (video.meta?.url ? video.meta.url : undefined) ||
            (video.videoUrl ? video.videoUrl : undefined) ||
            null;

          if (!scrapeSourceUrl && !fallbackTranscriptionUrl) {
            console.warn(`⚠️ [W${workerId}] Unable to determine any transcription URL for video ${video?.id}, skipping.`);
            continue;
          }

          console.log(
            `🎬 [W${workerId}] ${scrapeSourceUrl ? 'Scraping +' : ''} transcribing video ${i + 1}/${videos.length}: ${video.id}`
          );

          try {
            let transcriptionUrl: string | null = fallbackTranscriptionUrl;
            let scrapedMeta: Partial<TranscribedVideoMeta> = {};

            if (scrapeSourceUrl) {
              try {
                const scrapeResponse = await fetch('/api/video/scrape-url', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ url: scrapeSourceUrl, options: { preferAudioOnly } })
                });

                const scrapeText = await scrapeResponse.text();
                let scrapeJson: any = null;
                if (scrapeText && scrapeText.trim().length) {
                  try {
                    scrapeJson = JSON.parse(scrapeText);
                  } catch (jsonError) {
                    console.warn(`⚠️ [W${workerId}] Failed to parse scrape response for ${video.id}:`, jsonError);
                  }
                }

                const scrapedResult = scrapeJson?.result;

                if (scrapeResponse.ok && scrapeJson?.success && scrapedResult?.downloadUrl) {
                  transcriptionUrl = scrapedResult.audioUrl || scrapedResult.downloadUrl || transcriptionUrl;
                  scrapedMeta = {
                    url: transcriptionUrl ?? undefined,
                    title: scrapedResult?.title ?? scrapedResult?.description,
                    sourceUrl: scrapeSourceUrl,
                    platform: scrapedResult?.platform as PlatformType | undefined,
                    thumbnailUrl: scrapedResult?.thumbnailUrl ?? null,
                  };
                } else {
                  const scrapeErrorMessage = scrapeJson?.error || scrapedResult?.error || scrapeResponse.statusText;
                  console.warn(`⚠️ [W${workerId}] Video ${i + 1} scraping failed:`, scrapeErrorMessage);
                }
              } catch (scrapeErr) {
                console.warn(`⚠️ [W${workerId}] Error scraping video ${i + 1}:`, scrapeErr);
              }
            }

            if (!transcriptionUrl) {
              console.warn(`⚠️ [W${workerId}] No transcription URL available for video ${video.id}, skipping.`);
              continue;
            }

            const transcriptionResponse = await fetch('/api/video/transcribe-from-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ videoUrl: transcriptionUrl })
            });

            const transcriptionResult = await transcriptionResponse.json();

            if (transcriptionResponse.ok && transcriptionResult.success && transcriptionResult.transcript) {
              results[i] = {
                transcript: transcriptionResult.transcript,
                meta: {
                  id: String(video.id ?? video.meta?.id ?? `video-${i}`),
                  url: transcriptionUrl,
                  title: scrapedMeta.title ?? video.description,
                  sourceUrl: scrapedMeta.sourceUrl ?? (typeof scrapeSourceUrl === 'string' ? scrapeSourceUrl : undefined),
                  platform: scrapedMeta.platform ?? (video.platform as PlatformType | undefined),
                  thumbnailUrl: scrapedMeta.thumbnailUrl ?? video.cover ?? null,
                },
              };
              console.log(`✅ [W${workerId}] Video ${i + 1} transcribed`);
            } else {
              console.warn(`⚠️ [W${workerId}] Video ${i + 1} transcription failed:`, transcriptionResult?.error);
            }
          } catch (err) {
            console.warn(`⚠️ [W${workerId}] Error transcribing video ${i + 1}:`, err);
          }
        }
      };

      const workerCount = Math.min(CONCURRENCY, videos.length);
      await Promise.all(Array.from({ length: workerCount }, (_, w) => worker(w + 1)));

      // Collect successful results in original order
      const transcripts: string[] = [];
      const videoMeta: TranscribedVideoMeta[] = [];
      results.forEach((r) => {
        if (r?.transcript) {
          transcripts.push(r.transcript);
          if (r.meta) videoMeta.push(r.meta);
        }
      });

      if (transcripts.length === 0) {
        throw new Error('No videos could be transcribed successfully');
      }

      setStep2({ status: 'success', data: { transcripts, videoMeta } });
      console.log('✅ Step 2 completed:', transcripts.length, 'transcripts created');

    } catch (error: any) {
      console.error('❌ Step 2 failed:', error);
      setStep2({ status: 'error', error: error.message });
    }
  };

  const handleStep3 = async () => {
    if (step2.status !== 'success' || !step2.data?.transcripts) {
      alert('Step 2 must be completed first');
      return;
    }

    setStep3({ status: 'running' });

    try {
      console.log('🚀 Step 3: Analyzing voice patterns (batched merge)...');
      const allTranscripts: string[] = step2.data.transcripts.slice(0, VIDEO_LIMIT);
      const BATCH_SIZE = 5; // Reduced from 10 to prevent timeouts and parsing issues

      const chunk = (arr: any[], size: number) => {
        const out: any[][] = [];
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
        return out;
      };

      const batches = chunk(allTranscripts, BATCH_SIZE);

      const buildPrompt = (batchTranscripts: string[]) => {
        const t = batchTranscripts;
        const tCount = t.length;
        const analysisInstruction = `Analyze these ${tCount} video transcripts and create reusable templates. For each transcript:

1. EXTRACT THE SECTIONS:
- Hook (first 3-5 seconds that grabs attention)
- Bridge (transition that sets up the main content)
- Golden Nugget (the main value/lesson/information)
- Why to Act (the closing reason to take action)

2. CREATE TEMPLATES from the hooks by replacing specific details with [VARIABLES]:
Example: "I made $5000 in 2 days" → "I [achievement] in [timeframe]"

3. DOCUMENT THE CREATOR'S STYLE:
- Common words/phrases they repeat
- Sentence length (short/long/mixed)
- Transition words between sections
- Speaking pace indicators (pauses, emphasis)

${Array.from({ length: tCount }, (_, i) => `[INSERT TRANSCRIPT ${i + 1}]`).join('\n')}

OUTPUT FORMAT:

## HOOK TEMPLATES
1. [Template with variables]
2. [Template with variables]
3. [Template with variables]

## BRIDGE TEMPLATES
1. [Template with variables]
2. [Template with variables]

## GOLDEN NUGGET STRUCTURE
- How they present main points
- Common frameworks used

## WHY TO ACT TEMPLATES
1. [Template with variables]
2. [Template with variables]

## STYLE SIGNATURE
- Power words: [list]
- Filler phrases: [list]
- Transition phrases: [list]
- Average words per sentence: [number]
- Tone: [description]`;

        const transcriptsBlock = t
          .map((content, i) => `\n[INSERT TRANSCRIPT ${i + 1}]\n${content ?? ''}`)
          .join('\n');

        const jsonHeader = `Return ONLY valid JSON with this schema and no markdown/code fences.\n\n{
  "templates": {
    "hooks": [{ "pattern": "string", "variables": ["string"], "sourceIndex": 1 }],
    "bridges": [{ "pattern": "string", "variables": ["string"], "sourceIndex": 1 }],
    "ctas": [{ "pattern": "string", "variables": ["string"], "sourceIndex": 1 }],
    "nuggets": [{ "pattern": "string", "structure": "string", "variables": ["string"], "sourceIndex": 1 }]
  },
  "styleSignature": {
    "powerWords": ["string"],
    "fillerPhrases": ["string"],
    "transitionPhrases": ["string"],
    "avgWordsPerSentence": 0,
    "tone": "string"
  },
  "transcripts": [{
    "index": 1,
    "hook": {"text": "string", "duration": 0, "type": "string", "emotionalTrigger": "string", "template": "string", "variables": {}},
    "bridge": {"text": "string", "transitionType": "string", "duration": 0, "template": "string", "variables": {}},
    "goldenNugget": {"text": "string", "valueType": "string", "deliveryMethod": "string", "duration": 0, "structure": "string", "keyPoints": ["string"], "template": "string", "variables": {}},
    "cta": {"text": "string", "type": "string", "placement": "string", "urgency": "string", "template": "string", "variables": {}},
    "microHooks": [{"text": "string", "position": 0, "purpose": "string", "template": "string", "variables": {}}]
  }]
}`;

        const densityRequirement = `\n\nTEMPLATE DENSITY REQUIREMENTS:\n- Produce exactly ${tCount} items in each of templates.hooks, templates.bridges, templates.nuggets, templates.ctas.\n- Map one item per transcript and set sourceIndex to that transcript's index (1-based).\n- Do NOT deduplicate or merge similar templates across transcripts — include them separately even if identical.\n- Keep patterns generalized with [VARIABLES], but preserve distinct phrasing per transcript.`;

        const composedPrompt = `${jsonHeader}\n\n${analysisInstruction}${densityRequirement}\n${transcriptsBlock}`;
        return composedPrompt;
      };

      const analyzeBatch = async (batchTranscripts: string[], retryCount = 0): Promise<any> => {
        const MAX_RETRIES = 2;
        
        // Helper: robust JSON parse with fallback extraction
        const tryParseJson = (text: string): any | null => {
          if (!text) return null;
          try {
            return JSON.parse(text);
          } catch {}
          // Strip markdown code fences if present
          const cleaned = text.replace(/```[\s\S]*?```/g, '').trim();
          try {
            return JSON.parse(cleaned);
          } catch {}
          // Extract first to last brace block as a last resort
          const first = cleaned.indexOf('{');
          const last = cleaned.lastIndexOf('}');
          if (first !== -1 && last !== -1 && last > first) {
            const slice = cleaned.substring(first, last + 1);
            try {
              return JSON.parse(slice);
            } catch {}
          }
          return null;
        };
        
        try {
          const composedPrompt = buildPrompt(batchTranscripts);
          console.log(`📊 Batch prompt length: ${Math.round(composedPrompt.length / 1000)}k chars`);
          
          const response = await fetch('/api/voice/analyze-patterns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: composedPrompt,
              responseType: 'json',
              temperature: analysisTemperature,
              maxTokens: analysisMaxTokens,
              model: analysisModel,
              systemPrompt: 'You are a strict JSON generator. Return ONLY valid JSON matching the schema. No markdown, no commentary, no code fences.'
            })
          });
          
          const result = await response.json();
          if (!response.ok) {
            throw new Error(result.error || `API returned ${response.status}`);
          }
          
          const parsed = tryParseJson(result?.content || '');
          if (!parsed) {
            console.warn(`Failed to parse JSON content for batch (attempt ${retryCount + 1})`);
            console.log('Response length:', result.content?.length);
            console.log('Response preview:', result.content?.substring(0, 200));
            
            // Retry with simpler approach if parsing fails
            if (retryCount < MAX_RETRIES) {
              console.log(`🔄 Retrying batch analysis (attempt ${retryCount + 2}/${MAX_RETRIES + 1})`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
              return analyzeBatch(batchTranscripts, retryCount + 1);
            }
            
            throw new Error(`Failed to parse JSON content after ${MAX_RETRIES + 1} attempts. The response might be malformed or truncated.`);
          }
          
          return parsed;
          
        } catch (error) {
          console.error(`Batch analysis error (attempt ${retryCount + 1}):`, error);
          
          // Retry on network errors or timeouts
          if (retryCount < MAX_RETRIES && 
              (error instanceof TypeError || // Network errors
               (error instanceof Error && error.message.includes('timeout')) ||
               (error instanceof Error && error.message.includes('503')) ||
               (error instanceof Error && error.message.includes('502')))) {
            console.log(`🔄 Retrying batch analysis due to network error (attempt ${retryCount + 2}/${MAX_RETRIES + 1})`);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
            return analyzeBatch(batchTranscripts, retryCount + 1);
          }
          
          throw error;
        }
      };

      const batchResults: any[] = [];
      for (let b = 0; b < batches.length; b++) {
        console.log(`🧩 Analyzing batch ${b + 1}/${batches.length} (${batches[b].length} transcripts)`);
        
        try {
          const r = await analyzeBatch(batches[b]);
          if (!r) throw new Error('Empty analysis result for a batch');
          batchResults.push(r);
          console.log(`✅ Batch ${b + 1}/${batches.length} completed successfully`);
        } catch (error) {
          console.error(`❌ Batch ${b + 1}/${batches.length} failed:`, error);
          throw new Error(`Batch ${b + 1} analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}. Try reducing the batch size or check your network connection.`);
        }
      }

      const combined: any = {
        templates: { hooks: [], bridges: [], ctas: [], nuggets: [] },
        styleSignature: { powerWords: [], fillerPhrases: [], transitionPhrases: [], avgWordsPerSentence: undefined, tone: 'Varied' },
        transcripts: [],
      };

      const uniqPush = (arr: any[], items: any[]) => {
        const set = new Set(arr.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))));
        for (const it of items) {
          const key = typeof it === 'string' ? it : JSON.stringify(it);
          if (!set.has(key)) {
            set.add(key);
            arr.push(it);
          }
        }
      };

      let globalOffset = 0;
      for (let b = 0; b < batchResults.length; b++) {
        const r = batchResults[b];
        const bt = batches[b];
        const localCount = bt.length;

        const adjustTemplates = (list: any[] = []) =>
          list.map((t: any, idx: number) => ({
            ...t,
            sourceIndex: globalOffset + (t?.sourceIndex ?? idx + 1),
          }));
        combined.templates.hooks.push(...adjustTemplates(r?.templates?.hooks));
        combined.templates.bridges.push(...adjustTemplates(r?.templates?.bridges));
        combined.templates.ctas.push(...adjustTemplates(r?.templates?.ctas));
        combined.templates.nuggets.push(...adjustTemplates(r?.templates?.nuggets));

        if (Array.isArray(r?.transcripts)) {
          combined.transcripts.push(
            ...r.transcripts.map((t: any, i: number) => ({ ...t, index: globalOffset + (t?.index ?? i + 1) }))
          );
        }

        uniqPush(combined.styleSignature.powerWords, r?.styleSignature?.powerWords || []);
        uniqPush(combined.styleSignature.fillerPhrases, r?.styleSignature?.fillerPhrases || []);
        uniqPush(combined.styleSignature.transitionPhrases, r?.styleSignature?.transitionPhrases || []);
        const avg = r?.styleSignature?.avgWordsPerSentence;
        if (typeof avg === 'number') {
          const current = combined.styleSignature.avgWordsPerSentence;
          combined.styleSignature.avgWordsPerSentence = typeof current === 'number' ? (current + avg) / 2 : avg;
        }
        if (r?.styleSignature?.tone && combined.styleSignature.tone === 'Varied') {
          combined.styleSignature.tone = r.styleSignature.tone;
        }

        globalOffset += localCount;
      }

      setStep3({ status: 'success', data: { raw: null, json: combined } });
      console.log('✅ Step 3 completed: Voice patterns analyzed (batched)');

    } catch (error: any) {
      console.error('❌ Step 3 failed:', error);
      setStep3({ status: 'error', error: error.message });
    }
  };

  // New: Run Prompt directly using current systemPrompt + customPrompt (+ transcripts if available)
  const handleRunPrompt = async () => {
    if (!customPrompt.trim() && !systemPrompt.trim()) {
      alert('Provide a system prompt and/or a prompt first');
      return;
    }

    setStepRunPrompt({ status: 'running' });

    try {
      console.log('🚀 Run Prompt: Executing current prompts...');

      const response = await fetch('/api/voice/analyze-patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: customPrompt?.trim() ? customPrompt : undefined,
          systemPrompt: systemPrompt?.trim() ? systemPrompt : undefined,
          // If transcripts exist from Step 2, include them; otherwise the prompt can still run
          transcripts: step2.status === 'success' ? step2.data?.transcripts : undefined,
          temperature: 0.2,
          maxTokens: 2048,
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `API returned ${response.status}`);
      }

      setStepRunPrompt({ status: 'success', data: result });
      console.log('✅ Run Prompt completed');

    } catch (error: any) {
      console.error('❌ Run Prompt failed:', error);
      setStepRunPrompt({ status: 'error', error: error.message });
    }
  };

  // Step: Save templates & voice to database
  const handleSaveToDatabase = async () => {
    if (step3.status !== 'success' || !step3.data) {
      alert('Please run Step 3 analysis first');
      return;
    }
    const analysisJson = step3.data.json;
    const analysisText = step3.data.raw || JSON.stringify(step3.data.json || {});
    if (!analysisJson && !analysisText) {
      alert('No analysis result to save');
      return;
    }

    setStepSave({ status: 'running' });
    try {
      const payload = {
        creator: { name: username.replace(/^@/, ''), handle: username },
        analysisJson,
        analysisText,
        transcriptsCount: step2.status === 'success' ? (step2.data?.transcripts?.length || 0) : 0,
        videoMeta: step2.status === 'success' ? (step2.data?.videoMeta || []) : [],
      };

      const response = await fetch('/api/creator/save-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      let result: any = null;
      try {
        result = await response.json();
      } catch (_) {
        throw new Error('Server returned an invalid response');
      }
      if (!response.ok || !result?.success) {
        throw new Error(result.error || `API returned ${response.status}`);
      }

      setStepSave({ status: 'success', data: result });
      console.log('✅ Save completed:', result);
    } catch (error: any) {
      console.error('❌ Save failed:', error);
      setStepSave({ status: 'error', error: error.message });
    }
  };

  const handleStep4 = async () => {
    if (step3.status !== 'success' || !step3.data) {
      alert('Step 3 must be completed first');
      return;
    }

    setStep4({ status: 'running' });

    try {
      console.log('🚀 Step 4: Generating persona metadata...');

      const response = await fetch('/api/personas/generate-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceAnalysis: step3.data })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `API returned ${response.status}`);
      }

      setStep4({ status: 'success', data: result });
      console.log('✅ Step 4 completed: Persona metadata generated');

    } catch (error: any) {
      console.error('❌ Step 4 failed:', error);
      setStep4({ status: 'error', error: error.message });
    }
  };

  const handleStep5 = async () => {
    if (step4.status !== 'success' || !step4.data) {
      alert('Step 4 must be completed first');
      return;
    }

    setStep5({ status: 'running' });

    try {
      console.log('🚀 Step 5: Creating final persona...');

      // Get auth token (assuming it exists in localStorage like other pages)
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const personaPlatform = ((step1.data as any)?.platform ?? platform) as PlatformType;

      const response = await fetch('/api/personas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: step4.data.title || `${username} Persona`,
          description: step4.data.description,
          platform: personaPlatform,
          username: username,
          analysis: step3.data,
          tags: step4.data.suggestedTags || [],
          creationStatus: 'created'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `API returned ${response.status}`);
      }

      setStep5({ status: 'success', data: result });
      console.log('✅ Step 5 completed: Persona created with ID:', result.personaId);

    } catch (error: any) {
      console.error('❌ Step 5 failed:', error);
      setStep5({ status: 'error', error: error.message });
    }
  };

  const getStatusIcon = (status: StepStatus['status']) => {
    switch (status) {
      case 'running':
        return <RefreshIcon label="Running" />;
      case 'success':
        return <CheckCircleIcon label="Success" />;
      case 'error':
        return <ErrorIcon label="Error" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: StepStatus['status']) => {
    switch (status) {
      case 'running':
        return 'Running...';
      case 'success':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return 'Ready';
    }
  };

  const formatStepData = (data: any) => {
    if (!data) return '';
    return JSON.stringify(data, null, 2);
  };

  const step1Data: any = step1.data;
  const selectedPlatformLabel = getPlatformLabel(platform);
  const handlePlaceholder =
    platform === 'instagram'
      ? 'Enter Instagram username or profile URL (e.g., @creator or instagram.com/creator)'
      : 'Enter TikTok username or profile URL (e.g., @creator or tiktok.com/@creator)';
  const normalizedUsername = username.trim();
  const fallbackHandle =
    normalizedUsername.length > 0
      ? normalizedUsername.startsWith('@')
        ? normalizedUsername
        : `@${normalizedUsername.replace(/^@/, '')}`
      : '';
  const resolvedHandleForDisplay: string = step1Data?.displayHandle ?? fallbackHandle;
  const stepPlatformLabel = step1Data?.platform
    ? getPlatformLabel(step1Data.platform as PlatformType)
    : selectedPlatformLabel;
  const latestVideosLabel = stepPlatformLabel === 'Instagram' ? 'reels' : 'videos';

  return (
    <div css={pageStyles}>
      <header css={headerStyles}>
        <h1>
          <SearchIcon label="Short-form Analysis" />
          TikTok & Instagram Analysis Test
        </h1>
        <p>Step-by-step TikTok and Instagram analysis: Fetch videos or reels → Transcribe → Analyze → Generate persona</p>
        <p style={{ marginTop: '8px' }}>
          <a href="#voice-analysis">Jump to Voice Analysis</a>
        </p>
      </header>

      <Card>
        <form css={formStyles} onSubmit={(e) => e.preventDefault()}>
          <div className="form-group">
            <div className="form-actions">
              <div className="platform-select">
                <select
                  value={platform}
                  onChange={(e) => {
                    const next = e.target.value as PlatformType;
                    setPlatform(next);
                    resetSteps();
                  }}
                  disabled={isRunning}
                  aria-label="Select platform"
                >
                  <option value="tiktok">TikTok</option>
                  <option value="instagram">Instagram</option>
                </select>
              </div>
              <div className="input-container">
                <PersonIcon label="Username" />
                <Input
                  type="text"
                  placeholder={handlePlaceholder}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isRunning}
                  required
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={!username.trim() || isRunning}
                onClick={resetSteps}
              >
                Reset
              </Button>
            </div>
          </div>
        </form>

        <div css={stepsContainerStyles}>
          {/* Step 1: Fetch Videos/Reels */}
          <Card css={stepCardStyles}>
            <div className="step-header">
              <h3>
                <VideoIcon label="Videos" />
                Step 1: Fetch Videos/Reels
              </h3>
              <div className={`step-status ${step1.status}`}>
                {getStatusIcon(step1.status)}
                {getStatusText(step1.status)}
              </div>
            </div>
            <div className="step-description">
              Fetch latest {latestVideosLabel} from {stepPlatformLabel} using a username or profile URL
            </div>
            {step1.data && (
              <div className="step-content">
                Found {step1.data.videos?.length || 0} {latestVideosLabel} for {resolvedHandleForDisplay || 'this creator'}
                {step1.data.userInfo && (
                  <div style={{ marginTop: 6 }}>
                    <div>
                      User: {step1.data.userInfo.nickname} ({step1.data.userInfo.username})
                    </div>
                    <div>Followers: {step1.data.userInfo.stats?.followerCount ?? 0}</div>
                  </div>
                )}
                {step1.data.platformUserId && (
                  <div style={{ marginTop: 6 }}>Platform user ID: {step1.data.platformUserId}</div>
                )}
                {/* Video list with thumbnail, title, and caption */}
                {Array.isArray(step1.data.videos) && step1.data.videos.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{
                      fontWeight: 600,
                      marginBottom: 8,
                      color: 'var(--color-text-secondary)'
                    }}>Latest {latestVideosLabel}</div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'minmax(120px, 160px) 1fr',
                      rowGap: 10,
                      columnGap: 12,
                    }}>
                      {step1.data.videos.map((vid: any, idx: number) => {
                        const title = vid?.music?.title || `Video ${idx + 1}`;
                        const caption = vid?.description || '';
                        const cover = vid?.cover || '';
                        return (
                          <React.Fragment key={vid?.id || idx}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                              {cover ? (
                                <img
                                  src={cover}
                                  alt={caption ? caption.slice(0, 80) : title}
                                  style={{
                                    width: 120,
                                    height: 160,
                                    objectFit: 'cover',
                                    borderRadius: 8,
                                    border: '1px solid var(--color-border-subtle)'
                                  }}
                                  loading="lazy"
                                />
                              ) : (
                                <div style={{
                                  width: 120,
                                  height: 160,
                                  borderRadius: 8,
                                  background: 'var(--color-surface-muted)',
                                  border: '1px solid var(--color-border-subtle)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--color-text-secondary)'
                                }}>No thumbnail</div>
                              )}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{
                                fontWeight: 600,
                                color: 'var(--color-text-primary)'
                              }}>{title}</div>
                              {caption && (
                                <div style={{
                                  marginTop: 4,
                                  color: 'var(--color-text-secondary)',
                                  whiteSpace: 'pre-wrap'
                                }}>{caption}</div>
                              )}
                              <div style={{
                                marginTop: 6,
                                fontSize: '12px',
                                color: 'var(--color-text-subtle)'
                              }}>
                                ID: {vid?.id}
                                {vid?.stats?.playCount ? ` • Plays: ${vid.stats.playCount}` : ''}
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
            {step1.error && (
              <div className="step-content" style={{ color: 'var(--color-danger-500)' }}>
                Error: {step1.error}
              </div>
            )}
            <div className="step-action">
              <Button
                variant="primary"
                disabled={!username.trim() || step1.status === 'running'}
                onClick={handleStep1}
                iconBefore={<SearchIcon label="" />}
              >
                {step1.status === 'running' ? 'Fetching...' : 'Fetch Videos'}
              </Button>
            </div>
          </Card>

          {/* Step 2: Transcribe Videos */}
          <Card css={stepCardStyles}>
            <div className="step-header">
              <h3>
                <DocumentIcon label="Transcripts" />
                Step 2: Transcribe Videos
              </h3>
              <div className={`step-status ${step2.status}`}>
                {getStatusIcon(step2.status)}
                {getStatusText(step2.status)}
              </div>
            </div>
            <div className="step-description">
              Transcribe individual videos to extract speech content
            </div>
            {step2.data && (
              <div className="step-content">
                Transcribed {step2.data.transcripts?.length || 0} videos
                {step2.data.transcripts?.map((transcript: string, i: number) => (
                  <div key={i} style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--color-border-subtle)' }}>
                    <strong>Video {i + 1}:</strong> {transcript.substring(0, 100)}...
                  </div>
                ))}
              </div>
            )}
            {step2.error && (
              <div className="step-content" style={{ color: 'var(--color-danger-500)' }}>
                Error: {step2.error}
              </div>
            )}
            <div className="step-action">
              <Button
                variant="primary"
                disabled={step1.status !== 'success' || step2.status === 'running'}
                onClick={handleStep2}
                iconBefore={<DownloadIcon label="" />}
              >
                {step2.status === 'running' ? 'Transcribing...' : 'Transcribe Videos'}
              </Button>
            </div>
          </Card>

          {/* Step 3: Analyze Voice Patterns */}
          <Card css={stepCardStyles} id="voice-analysis">
            <div className="step-header">
              <h3>
                <GraphLineIcon label="Analysis" />
                Step 3: Analyze Voice
              </h3>
              <div className={`step-status ${step3.status}`}>
                {getStatusIcon(step3.status)}
                {getStatusText(step3.status)}
              </div>
            </div>
            <div className="step-description">
              Analyze transcripts using the predefined analysis prompt. No prompt editing here.
            </div>
            {/* Advanced controls */}
            <div style={{ marginBottom: '12px' }}>
              <button type="button" onClick={() => setAdvOpen(v => !v)} style={{ marginBottom: 8 }}>
                {advOpen ? 'Hide Advanced' : 'Show Advanced'}
              </button>
              {advOpen && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }}>
                  <div>
                    <label htmlFor="analysis-model" style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6, color: 'var(--color-text-secondary)' }}>Model</label>
                    <select
                      id="analysis-model"
                      value={analysisModel}
                      onChange={(e) => setAnalysisModel(e.target.value)}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 8 }}
                    >
                      <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                      <option value="gemini-1.5-pro">gemini-1.5-pro</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="analysis-max-tokens" style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6, color: 'var(--color-text-secondary)' }}>Max tokens</label>
                    <input
                      id="analysis-max-tokens"
                      type="number"
                      min={1000}
                      max={32000}
                      step={100}
                      value={analysisMaxTokens}
                      onChange={(e) => setAnalysisMaxTokens(Number(e.target.value) || 6000)}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <label htmlFor="analysis-temperature" style={{ display: 'block', fontSize: '0.85rem', marginBottom: 6, color: 'var(--color-text-secondary)' }}>Temperature</label>
                    <input
                      id="analysis-temperature"
                      type="number"
                      min={0}
                      max={1}
                      step={0.1}
                      value={analysisTemperature}
                      onChange={(e) => setAnalysisTemperature(Math.min(1, Math.max(0, Number(e.target.value))))}
                      style={{ width: '100%', padding: '8px 10px', border: '1px solid var(--color-border)', borderRadius: 8 }}
                    />
                  </div>
                </div>
              )}
            </div>
            {step3.data && (
              <div className="step-content">
                {/* JSON-first output with copy helpers */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button onClick={() => navigator.clipboard.writeText(JSON.stringify(step3.data.json ?? step3.data.raw ?? {}, null, 2))}>Copy JSON</button>
                  <button onClick={() => step3.data.raw && navigator.clipboard.writeText(step3.data.raw)}>Copy Raw</button>
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>
                  {step3.data.json ? JSON.stringify(step3.data.json, null, 2) : (step3.data.raw || '')}
                </div>

                {/* Template tester */}
                {step3.data.json?.templates && (
                  <TemplateTester templates={step3.data.json.templates} />
                )}
              </div>
            )}
            {step3.error && (
              <div className="step-content" style={{ color: 'var(--color-danger-500)' }}>
                Error: {step3.error}
              </div>
            )}
            <div className="step-action">
              <Button
                variant="primary"
                disabled={step2.status !== 'success' || step3.status === 'running'}
                onClick={handleStep3}
                iconBefore={<GraphLineIcon label="" />}
              >
                {step3.status === 'running' ? 'Analyzing...' : 'Analyze Voice'}
              </Button>
            </div>
          </Card>

          {/* Step 4: Run Prompt (re-run current prompt/system with transcripts) */}
          <Card css={stepCardStyles} id="run-prompt">
            <div className="step-header">
              <h3>
                <GraphLineIcon label="Run Prompt" />
                Step 4: Run Prompt
              </h3>
              <div className={`step-status ${stepRunPrompt.status}`}>
                {getStatusIcon(stepRunPrompt.status)}
                {getStatusText(stepRunPrompt.status)}
              </div>
            </div>
            <div className="step-description">
              Execute the current System Prompt + Prompt. Includes transcripts from Step 2 if available.
            </div>
            {stepRunPrompt.data && (
              <div className="step-content">
                {stepRunPrompt.data.systemPrompt && (
                  <>
                    <div><strong>System Prompt:</strong></div>
                    <div style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>{stepRunPrompt.data.systemPrompt}</div>
                  </>
                )}
                <div><strong>Final Prompt:</strong></div>
                <div style={{ whiteSpace: 'pre-wrap', marginBottom: 12 }}>{stepRunPrompt.data.prompt}</div>
                <div><strong>Model Response:</strong></div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{stepRunPrompt.data.content || JSON.stringify(stepRunPrompt.data, null, 2)}</div>
              </div>
            )}
            {stepRunPrompt.error && (
              <div className="step-content" style={{ color: 'var(--color-danger-500)' }}>
                Error: {stepRunPrompt.error}
              </div>
            )}
            <div className="step-action">
              <Button
                variant="primary"
                disabled={stepRunPrompt.status === 'running'}
                onClick={handleRunPrompt}
                iconBefore={<GraphLineIcon label="" />}
              >
                {stepRunPrompt.status === 'running' ? 'Running...' : 'Run Prompt'}
              </Button>
            </div>
          </Card>

          {/* Step 5: Save Templates & Voice */}
          <Card css={stepCardStyles}>
            <div className="step-header">
              <h3>
                <DocumentIcon label="Save" />
                Step 5: Save Templates & Voice
              </h3>
              <div className={`step-status ${stepSave.status}`}>
                {getStatusIcon(stepSave.status)}
                {getStatusText(stepSave.status)}
              </div>
            </div>
            <div className="step-description">
              Save extracted templates and speaking style to your database for this creator.
            </div>
            {stepSave.data && (
              <div className="step-content">
                ✅ Saved for @{stepSave.data.creator?.handle} (ID: {stepSave.data.creator?.id})
                <div style={{ marginTop: 8 }}>
                  Hooks: {stepSave.data.saved?.hooks || 0}, Bridges: {stepSave.data.saved?.bridges || 0}, Why to Act prompts: {stepSave.data.saved?.ctas || 0}, Nuggets: {stepSave.data.saved?.nuggets || 0}
                </div>
                <div style={{ marginTop: 12 }}>
                  <a href="/write" target="_self">Go to Write → Brand Voice</a>
                </div>
              </div>
            )}
            {stepSave.error && (
              <div className="step-content" style={{ color: 'var(--color-danger-500)' }}>
                Error: {stepSave.error}
              </div>
            )}
            <div className="step-action">
              <Button
                variant="primary"
                disabled={step3.status !== 'success' || stepSave.status === 'running'}
                onClick={handleSaveToDatabase}
                iconBefore={<DocumentIcon label="" />}
              >
                {stepSave.status === 'running' ? 'Saving...' : 'Save to Database'}
              </Button>
            </div>
          </Card>

          {/* Step 6: Generate Metadata (placeholder) */}
          <Card css={stepCardStyles}>
            <div className="step-header">
              <h3>
                <DocumentIcon label="Metadata" />
                Step 6: Generate Metadata
              </h3>
              <div className={`step-status ${step4.status}`}>
                {getStatusIcon(step4.status)}
                {getStatusText(step4.status)}
              </div>
            </div>
            <div className="step-description">
              Generate persona title and description from voice analysis
            </div>
            {step4.data && (
              <div className="step-content">
                Title: {step4.data.title}
                {step4.data.description && (
                  <div style={{ marginTop: '12px' }}>
                    Description: {step4.data.description.substring(0, 200)}...
                  </div>
                )}
                {step4.data.suggestedTags && (
                  <div style={{ marginTop: '12px' }}>
                    Tags: {step4.data.suggestedTags.join(', ')}
                  </div>
                )}
              </div>
            )}
            {step4.error && (
              <div className="step-content" style={{ color: 'var(--color-danger-500)' }}>
                Error: {step4.error}
              </div>
            )}
            <div className="step-action">
              <Button
                variant="primary"
                disabled={step3.status !== 'success' || step4.status === 'running'}
                onClick={handleStep4}
                iconBefore={<DocumentIcon label="" />}
              >
                {step4.status === 'running' ? 'Generating...' : 'Generate Metadata'}
              </Button>
            </div>
          </Card>

          {/* Step 7: Create Persona */}
          <Card css={stepCardStyles}>
            <div className="step-header">
              <h3>
                <PersonIcon label="Persona" />
                Step 7: Create Persona
              </h3>
              <div className={`step-status ${step5.status}`}>
                {getStatusIcon(step5.status)}
                {getStatusText(step5.status)}
              </div>
            </div>
            <div className="step-description">
              Create the final persona in the database
            </div>
            {step5.data && (
              <div className="step-content">
                ✅ Persona created successfully!
                Persona ID: {step5.data.personaId}
                Name: {step5.data.persona?.name}
                Status: {step5.data.persona?.status}
              </div>
            )}
            {step5.error && (
              <div className="step-content" style={{ color: 'var(--color-danger-500)' }}>
                Error: {step5.error}
              </div>
            )}
            <div className="step-action">
              <Button
                variant="primary"
                disabled={step4.status !== 'success' || step5.status === 'running'}
                onClick={handleStep5}
                iconBefore={<PersonIcon label="" />}
              >
                {step5.status === 'running' ? 'Creating...' : 'Create Persona'}
              </Button>
            </div>
          </Card>
        </div>
      </Card>
    </div>
  );
};
