import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { css } from '@emotion/react'
import AddIcon from '@atlaskit/icon/glyph/add'
import { Button } from '../components/ui/Button'
import { useAuth } from '../contexts/AuthContext'
import { VoiceLibrary } from '../features/brandhub/components/VoiceLibrary'
import { OnboardingSection } from '../features/brandhub/components/OnboardingSection'
import { OnboardingModal } from '../features/brandhub/components/OnboardingModal'
import { ContentBlueprint } from '../features/brandhub/components/ContentBlueprint'
import { CreateVoiceModal } from '../features/brandhub/components/CreateVoiceModal'
import { WorkflowSpotlightModal } from '../features/brandhub/components/WorkflowSpotlightModal'
import { defaultIntentSelection, intentOptions, onboardingPrompts } from '../features/brandhub/constants/onboarding'
import { useBrandVoices } from '../features/brandhub/hooks/useBrandVoices'
import { useBrandHubOnboarding } from '../features/brandhub/hooks/useBrandHubOnboarding'
import { TabKey } from '../features/brandhub/types/brandHub'

const pageContainerStyles = css`
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6) var(--layout-gutter);
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
`

const headerStyles = css`
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: var(--space-4);
  align-items: flex-start;

  .header-text {
    flex: 1;
    min-width: 260px;

    h1 {
      margin: 0 0 var(--space-2);
      font-size: var(--font-size-h2);
      font-weight: var(--font-weight-semibold);
      color: var(--color-neutral-900);
    }

    p {
      margin: 0;
      font-size: var(--font-size-body-large);
      color: var(--color-neutral-600);
      line-height: var(--line-height-relaxed, 1.6);
    }
  }

  .header-actions {
    display: flex;
    gap: var(--space-3);
    align-items: center;
  }
`

const tabListStyles = css`
  display: flex;
  gap: var(--space-2);
  border-bottom: 1px solid var(--color-neutral-200);
  padding-bottom: var(--space-2);
  overflow-x: auto;
`

const tabTriggerStyles = (isActive: boolean) => css`
  background: transparent;
  border: none;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--radius-medium) var(--radius-medium) 0 0;
  cursor: pointer;
  position: relative;
  color: ${isActive ? 'var(--color-neutral-900)' : 'var(--color-neutral-600)'};
  font-size: var(--font-size-body);
  font-weight: ${isActive ? 'var(--font-weight-semibold)' : 'var(--font-weight-medium)'};
  display: grid;
  gap: 4px;
  transition: var(--transition-all);

  &:focus-visible {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }

  .tab-hint {
    font-size: var(--font-size-caption);
    color: ${isActive ? 'var(--color-neutral-600)' : 'var(--color-neutral-500)'};
    white-space: nowrap;
  }

  &::after {
    content: '';
    position: absolute;
    left: 0;
    bottom: -9px;
    height: 3px;
    width: 100%;
    background: ${isActive ? 'var(--color-primary-500)' : 'transparent'};
    border-radius: var(--radius-pill, 999px);
    transition: var(--transition-all);
  }
`

const voicesLayoutStyles = css`
  display: grid;
  gap: var(--space-6);
`

const tabConfig: Array<{ id: TabKey; label: string; hint: string }> = [
  { id: 'voices', label: 'Voice library', hint: 'Manage active brand voices' },
  {
    id: 'onboarding',
    label: 'Interactive onboarding',
    hint: 'Capture strategic context with audio'
  },
  { id: 'blueprint', label: 'Content blueprint', hint: 'Translate answers into pillars' }
]

type PlatformType = 'tiktok' | 'instagram'

interface NormalizedHandleResult {
  identifier: string
  displayHandle: string
}

type TranscribedVideoMeta = {
  id: string
  url?: string
  title?: string
  sourceUrl?: string
  platform?: PlatformType
  thumbnailUrl?: string | null
}

type WorkflowStatus = 'pending' | 'running' | 'success' | 'error'

interface WorkflowStepState {
  status: WorkflowStatus
  message?: string
  data?: any
}

interface InstagramUserIdApiResponse {
  success?: boolean
  user_id?: string | number
  error?: string
}

interface InstagramReelsApiResponse {
  success?: boolean
  data?: { items?: any[] }
  error?: string
}

interface DashManifestUrls {
  videoUrl?: string
  audioUrl?: string
}

type VideoVersion = { bandwidth?: number; url?: string }

const VIDEO_LIMIT = 12
const TRANSCRIBE_CONCURRENCY = 3
const ANALYSIS_MODEL = 'gemini-1.5-flash'
const ANALYSIS_TEMPERATURE = 0.2
const ANALYSIS_MAX_TOKENS = 8000

const initialStepState = (): WorkflowStepState => ({ status: 'pending' as WorkflowStatus })

const buildInitialWorkflowState = () => ({
  step1: initialStepState(),
  step2: initialStepState(),
  step3: initialStepState(),
  step5: initialStepState()
})

const formatDuration = (seconds?: number): string => {
  if (typeof seconds !== 'number' || Number.isNaN(seconds) || seconds <= 0) {
    return '—'
  }
  const totalSeconds = Math.round(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remaining = totalSeconds % 60
  return `${minutes}:${remaining.toString().padStart(2, '0')}`
}

const formatPostedAt = (createTime?: number): string => {
  if (typeof createTime !== 'number' || Number.isNaN(createTime) || createTime <= 0) {
    return '—'
  }
  const millis = createTime > 1e12 ? createTime : createTime * 1000
  const date = new Date(millis)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }
  return date.toLocaleDateString()
}

const extractInstagramUsernameFromInput = (input: string): string | null => {
  const trimmed = input.trim()
  if (!trimmed) return null

  const clean = trimmed.replace(/^@/, '')

  if (/^https?:\/\//i.test(clean)) {
    try {
      const url = new URL(clean)
      if (!url.hostname.includes('instagram.com')) {
        return null
      }
      const pathParts = url.pathname.split('/').filter(Boolean)
      if (!pathParts.length) {
        return null
      }
      const candidate = pathParts[0].replace(/^@/, '').split(/[?#]/)[0]
      return /^[a-zA-Z0-9._]+$/.test(candidate) ? candidate : null
    } catch (error) {
      console.warn('Unable to parse Instagram URL', error)
      return null
    }
  }

  const username = clean.split(/[?#]/)[0]
  return /^[a-zA-Z0-9._]+$/.test(username) ? username : null
}

const normalizeHandleInput = (input: string, platform: PlatformType): NormalizedHandleResult => {
  const trimmed = input.trim()
  if (!trimmed) {
    throw new Error('Please enter a username or profile URL.')
  }

  if (platform === 'instagram') {
    const username = extractInstagramUsernameFromInput(trimmed)
    if (!username) {
      throw new Error('Unable to extract an Instagram username from the provided input.')
    }
    return { identifier: username, displayHandle: `@${username}` }
  }

  let working = trimmed
  if (/^https?:\/\//i.test(working)) {
    try {
      const url = new URL(working)
      if (url.hostname.includes('tiktok.com')) {
        const segments = url.pathname.split('/').filter(Boolean)
        const atHandle = segments.find((segment) => segment.startsWith('@'))
        if (atHandle) {
          working = atHandle.slice(1)
        } else if (segments.length) {
          working = segments[0]
        }
      }
    } catch (error) {
      console.warn('Unable to parse TikTok URL', error)
    }
  }

  working = working.replace(/^@/, '').split(/[/?#]/)[0]
  if (!working) {
    throw new Error('TikTok username could not be determined from the input.')
  }

  return { identifier: working, displayHandle: `@${working}` }
}

const parseJsonResponse = async <T,>(response: Response, context: string): Promise<{ data: T | null; raw: string }> => {
  const raw = await response.text()

  if (!raw) {
    return { data: null, raw }
  }

  try {
    return { data: JSON.parse(raw) as T, raw }
  } catch (error) {
    console.warn(`${context}: Failed to parse JSON (status ${response.status}). Raw response:`, raw)
    throw new Error(`${context}: Received invalid JSON (status ${response.status}).`)
  }
}

const parseDashManifestForLowestUrls = (manifest?: string | null): DashManifestUrls => {
  const result: DashManifestUrls = {}
  if (!manifest || typeof manifest !== 'string') {
    return result
  }

  try {
    if (typeof DOMParser === 'undefined') {
      return result
    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(manifest, 'application/xml')
    const adaptationSets = Array.from(doc.getElementsByTagName('AdaptationSet'))

    let lowestVideo: { url?: string; bandwidth: number } = { bandwidth: Number.POSITIVE_INFINITY }
    let lowestAudio: { url?: string; bandwidth: number } = { bandwidth: Number.POSITIVE_INFINITY }

    adaptationSets.forEach((set) => {
      const contentType = set.getAttribute('contentType') ?? ''
      const representations = Array.from(set.getElementsByTagName('Representation'))
      representations.forEach((rep) => {
        const bandwidthAttr = rep.getAttribute('bandwidth')
        const bandwidth = bandwidthAttr ? parseInt(bandwidthAttr, 10) : Number.POSITIVE_INFINITY
        const baseUrl = rep.getElementsByTagName('BaseURL')[0]?.textContent?.trim()
        if (!baseUrl) return

        if (contentType === 'video') {
          if (bandwidth < lowestVideo.bandwidth) {
            lowestVideo = { url: baseUrl, bandwidth }
          }
        } else if (contentType === 'audio') {
          if (bandwidth < lowestAudio.bandwidth) {
            lowestAudio = { url: baseUrl, bandwidth }
          }
        }
      })
    })

    if (lowestVideo.url) {
      result.videoUrl = lowestVideo.url
    }
    if (lowestAudio.url) {
      result.audioUrl = lowestAudio.url
    }
  } catch (error) {
    console.warn('Failed to parse DASH manifest', error)
  }

  return result
}

const selectLowestBandwidthVersion = <T extends VideoVersion>(versions?: T[] | null): T | null => {
  if (!Array.isArray(versions) || versions.length === 0) {
    return null
  }

  const sorted = [...versions].sort(
    (a, b) => (a.bandwidth ?? Number.POSITIVE_INFINITY) - (b.bandwidth ?? Number.POSITIVE_INFINITY)
  )
  return sorted.find((item) => typeof item?.url === 'string' && item.url.length > 0) ?? null
}

const mapInstagramMediaToVideo = (media: any) => {
  if (!media) return null

  const dashManifest =
    media.video_dash_manifest ||
    media?.clips_metadata?.original_sound_info?.dash_manifest ||
    media?.clips_metadata?.music_info?.music_asset_info?.dash_manifest

  const dashUrls = parseDashManifestForLowestUrls(dashManifest)
  const lowestVersion = selectLowestBandwidthVersion(media?.video_versions)

  const coverCandidate =
    media?.image_versions2?.candidates?.[0]?.url ||
    media?.image_versions2?.additional_candidates?.first_frame?.url ||
    media?.image_versions2?.additional_candidates?.igtv_first_frame?.url ||
    ''

  const audioUrl =
    dashUrls.audioUrl ||
    media?.clips_metadata?.original_sound_info?.progressive_download_url ||
    media?.clips_metadata?.music_info?.music_asset_info?.progressive_download_url ||
    null

  const playUrl = lowestVersion?.url || dashUrls.videoUrl || audioUrl || ''
  const downloadUrl = playUrl

  if (!downloadUrl) {
    return null
  }

  const author = media?.user ?? {}
  const captionText = media?.caption?.text ?? ''

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
      collectCount: 0
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
          : media?.video_duration ?? 0
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
        diggCount: 0
      }
    },
    platform: 'instagram' as const,
    permalink: media?.code ? `https://www.instagram.com/reel/${media.code}/` : undefined
  }
}

const mapInstagramItemsToResult = (items: any[], userId: string, username: string) => {
  const videos = (items || [])
    .map((item) => mapInstagramMediaToVideo(item?.media))
    .filter((video): video is NonNullable<ReturnType<typeof mapInstagramMediaToVideo>> => Boolean(video))

  const firstMediaUser = items?.find((item) => item?.media?.user)?.media?.user
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
          diggCount: 0
        }
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
          diggCount: 0
        }
      }

  return {
    success: true,
    platform: 'instagram' as const,
    userInfo,
    videos,
    platformUserId: userId
  }
}

const fetchInstagramStepData = async (identifier: string, displayHandle: string) => {
  console.log('Resolving Instagram user ID for', displayHandle)
  const userIdResponse = await fetch(`/api/instagram/user-id?username=${encodeURIComponent(identifier)}`)
  const { data: userIdResult } = await parseJsonResponse<InstagramUserIdApiResponse>(
    userIdResponse,
    'Instagram user lookup'
  )

  if (!userIdResponse.ok || !userIdResult?.success || !userIdResult?.user_id) {
    const userIdError = userIdResult?.error?.trim()
    const errorMessage = userIdError && userIdError.length > 0
      ? userIdError
      : `Failed to resolve Instagram user ID (HTTP ${userIdResponse.status})`
    throw new Error(errorMessage)
  }

  const userId = String(userIdResult.user_id)
  console.log(`Fetching Instagram reels for user ID: ${userId}`)

  const reelsQuery = new URLSearchParams({
    user_id: userId,
    include_feed_video: 'true',
    username: identifier
  })
  const reelsResponse = await fetch(`/api/instagram/user-reels?${reelsQuery.toString()}`)
  const { data: reelsResult } = await parseJsonResponse<InstagramReelsApiResponse>(
    reelsResponse,
    'Instagram reels fetch'
  )

  if (!reelsResponse.ok || !reelsResult?.success) {
    const reelsError = reelsResult?.error?.trim()
    const errorMessage = reelsError && reelsError.length > 0
      ? reelsError
      : `Failed to fetch Instagram reels (HTTP ${reelsResponse.status})`
    throw new Error(errorMessage)
  }

  if (!reelsResult) {
    throw new Error('Failed to fetch Instagram reels (empty response).')
  }

  const items = Array.isArray(reelsResult?.data?.items) ? reelsResult.data.items : []
  let mapped

  if (items.length > 0) {
    mapped = mapInstagramItemsToResult(items, userId, identifier)
  } else if (Array.isArray((reelsResult as any)?.processed?.videos) && (reelsResult as any).processed.videos.length) {
    const processed: any = (reelsResult as any).processed
    const profileData = processed.profileData || {}
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
        collectCount: 0
      },
      music: {
        id: '',
        title: video.title ?? 'Original Audio',
        author: video.author ?? identifier,
        playUrl: video.audioUrl ?? '',
        cover: video.thumbnailUrl ?? '',
        original: true,
        duration: video.duration ?? 0
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
          diggCount: 0
        }
      },
      platform: 'instagram' as const,
      permalink: undefined
    }))

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
          diggCount: 0
        }
      },
      videos
    }
  } else {
    mapped = mapInstagramItemsToResult([], userId, identifier)
  }

  return {
    ...mapped,
    platform: 'instagram' as const,
    platformUserId: userId,
    raw: { userId: userIdResult, reels: reelsResult }
  }
}

export const BrandHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('voices')
  const [isCreateVoiceModalOpen, setIsCreateVoiceModalOpen] = useState(false)
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false)
  const [isWorkflowSpotlightOpen, setIsWorkflowSpotlightOpen] = useState(false)
  const [selectedIntents, setSelectedIntents] = useState<string[]>(
    () => Array.from(defaultIntentSelection)
  )
  const { firebaseUser } = useAuth()

  const { brandVoices, isLoading, error, refresh } = useBrandVoices()

  const {
    responses,
    setResponse,
    hasCompleted,
    setCompleted,
    activeQuestionIndex,
    setActiveQuestionIndex,
    completedCount,
    isQuestionnaireComplete
  } = useBrandHubOnboarding({ userId: firebaseUser?.uid })

  const totalQuestions = onboardingPrompts.length

  const [voiceWorkflow, setVoiceWorkflow] = useState(buildInitialWorkflowState)
  const [voiceContext, setVoiceContext] = useState<{
    identifier: string
    displayHandle: string
    platform: PlatformType
  } | null>(null)
  const [voiceVideos, setVoiceVideos] = useState<any[]>([])
  const [voiceVideoMeta, setVoiceVideoMeta] = useState<TranscribedVideoMeta[]>([])
  const [voiceTranscripts, setVoiceTranscripts] = useState<string[]>([])
  const [voiceAnalysis, setVoiceAnalysis] = useState<{ raw: string | null; json: any } | null>(null)
  const [voiceStepRaw, setVoiceStepRaw] = useState<any>(null)

  const resetVoiceWorkflow = useCallback(() => {
    setVoiceWorkflow(buildInitialWorkflowState())
    setVoiceContext(null)
    setVoiceVideos([])
    setVoiceVideoMeta([])
    setVoiceTranscripts([])
    setVoiceAnalysis(null)
    setVoiceStepRaw(null)
  }, [])

  useEffect(() => {
    if (!isCreateVoiceModalOpen) {
      resetVoiceWorkflow()
    }
  }, [isCreateVoiceModalOpen, resetVoiceWorkflow])

  const handleTabChange = (tab: TabKey) => {
    if (tab === 'blueprint' && !isQuestionnaireComplete) {
      setActiveTab('onboarding')
      return
    }
    setActiveTab(tab)
  }

  const handleIntentToggle = (intent: string) => {
    setSelectedIntents((prev) =>
      prev.includes(intent) ? prev.filter((item) => item !== intent) : [...prev, intent]
    )
  }

  const handleOpenCreateVoiceModal = () => {
    resetVoiceWorkflow()
    setIsCreateVoiceModalOpen(true)
  }

  const handleCloseCreateVoiceModal = () => {
    setIsCreateVoiceModalOpen(false)
  }

  const handleFetchCreatorVideos = useCallback(
    async (input: string, platform: PlatformType) => {
      setVoiceWorkflow({
        step1: { status: 'running' },
        step2: initialStepState(),
        step3: initialStepState(),
        step5: initialStepState()
      })

      setVoiceContext(null)
      setVoiceVideos([])
      setVoiceVideoMeta([])
      setVoiceTranscripts([])
      setVoiceAnalysis(null)
      setVoiceStepRaw(null)

      try {
        const { identifier, displayHandle } = normalizeHandleInput(input, platform)
        setVoiceContext({ identifier, displayHandle, platform })

        let baseResult: any

        if (platform === 'tiktok') {
          const response = await fetch('/api/tiktok/user-feed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: identifier, count: VIDEO_LIMIT })
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result?.error || `API returned ${response.status}`)
          }

          if (!result?.success) {
            throw new Error(result?.error || 'Failed to fetch videos')
          }

          baseResult = {
            ...result,
            platform: 'tiktok' as const,
            platformUserId: result?.userInfo?.id ?? identifier
          }
        } else {
          baseResult = await fetchInstagramStepData(identifier, displayHandle)
        }

        let filtered: any[] = baseResult?.videos || []
        try {
          const lookup = await fetch(
            `/api/creator/analyzed-video-ids?handle=${encodeURIComponent(identifier)}`
          )
          const idsRes = await lookup.json()
          if (lookup.ok && idsRes?.success && Array.isArray(idsRes.videoIds) && idsRes.videoIds.length) {
            const existing = new Set(idsRes.videoIds.map(String))
            filtered = filtered.filter((video: any) => !existing.has(String(video?.id)))
          }
        } catch (filterError) {
          console.warn('Skipping analyzed video filter', filterError)
        }

        if (!filtered.length) {
          throw new Error('No new videos found to analyze for this creator.')
        }

        setVoiceWorkflow({
          step1: {
            status: 'success',
            data: {
              videoCount: filtered.length,
              displayHandle,
              platform
            }
          },
          step2: initialStepState(),
          step3: initialStepState(),
          step5: initialStepState()
        })
        setVoiceVideos(filtered)
        setVoiceStepRaw(baseResult)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setVoiceWorkflow({
          step1: { status: 'error', message },
          step2: initialStepState(),
          step3: initialStepState(),
          step5: initialStepState()
        })
        setVoiceContext(null)
        throw error
      }
    },
    []
  )

  const handleAnalyzeCreator = useCallback(async () => {
    if (!voiceContext || !voiceVideos.length) {
      throw new Error('Fetch creator videos before analyzing.')
    }

    const videos = voiceVideos.slice(0, VIDEO_LIMIT)

    setVoiceWorkflow((prev) => ({
      ...prev,
      step2: { status: 'running' },
      step3: initialStepState(),
      step5: initialStepState()
    }))

    const results: Array<{ transcript?: string; meta?: TranscribedVideoMeta } | null> = new Array(videos.length).fill(null)
    let nextIndex = 0

    const resolveScrapeSourceUrl = (video: any): string | null => {
      const directCandidates: Array<unknown> = [
        video?.permalink,
        video?.shareUrl,
        video?.share_url,
        video?.url,
        video?.meta?.permalink,
        video?.meta?.url
      ]

      for (const candidate of directCandidates) {
        if (typeof candidate === 'string') {
          const trimmed = candidate.trim()
          if (trimmed.length > 0 && /^https?:\/\//i.test(trimmed)) {
            return trimmed
          }
        }
      }

      const platformHint = (video?.platform || voiceContext.platform) as PlatformType | undefined

      if (platformHint === 'tiktok') {
        const rawHandle =
          (typeof video?.author?.username === 'string' && video.author.username.trim()) ||
          (typeof video?.author?.uniqueId === 'string' && video.author.uniqueId.trim()) ||
          (typeof voiceStepRaw?.userInfo?.username === 'string' && voiceStepRaw.userInfo.username.trim()) ||
          voiceContext.identifier

        if (rawHandle && video?.id) {
          const cleanHandle = rawHandle.replace(/^@/, '')
          return `https://www.tiktok.com/@${cleanHandle}/video/${video.id}`
        }
      }

      if (platformHint === 'instagram') {
        const shortcode =
          (typeof video?.code === 'string' && video.code.trim()) ||
          (typeof video?.shortcode === 'string' && video.shortcode.trim()) ||
          (typeof video?.id === 'string' && video.id.length <= 15 ? video.id.trim() : '')

        if (shortcode) {
          return `https://www.instagram.com/reel/${shortcode.replace(/\//g, '')}/`
        }
      }

      return null
    }

    try {
      const worker = async () => {
        while (nextIndex < videos.length) {
          const currentIndex = nextIndex
          nextIndex += 1

          const video = videos[currentIndex]
          const scrapeSourceUrl = resolveScrapeSourceUrl(video)
          const fallbackTranscriptionUrl =
            video.downloadUrl ||
            video.playUrl ||
            video.audioUrl ||
            (video.meta?.url ? video.meta.url : undefined) ||
            (video.videoUrl ? video.videoUrl : undefined) ||
            null

          if (!scrapeSourceUrl && !fallbackTranscriptionUrl) {
            console.warn('Skipping video due to missing transcription URL', video?.id)
            continue
          }

          try {
            const transcriptionUrl: string | null = fallbackTranscriptionUrl
            const scrapedMeta: Partial<TranscribedVideoMeta> = {
              url: transcriptionUrl ?? undefined,
              sourceUrl: typeof scrapeSourceUrl === 'string' ? scrapeSourceUrl : undefined,
              platform: (video.platform as PlatformType | undefined) ?? voiceContext.platform
            }

            if (!transcriptionUrl) {
              console.warn('No transcription URL available for video', video?.id)
              continue
            }

            const transcriptionResponse = await fetch('/api/video/transcribe-from-url', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ videoUrl: transcriptionUrl })
            })

            const transcriptionResult = await transcriptionResponse.json()

            if (
              transcriptionResponse.ok &&
              transcriptionResult?.success &&
              transcriptionResult?.transcript
            ) {
              results[currentIndex] = {
                transcript: transcriptionResult.transcript,
                meta: {
                  id: String(video.id ?? video.meta?.id ?? `video-${currentIndex}`),
                  url: transcriptionUrl,
                  title: scrapedMeta.title ?? video.description,
                  sourceUrl:
                    scrapedMeta.sourceUrl ??
                    (typeof scrapeSourceUrl === 'string' ? scrapeSourceUrl : undefined),
                  platform: scrapedMeta.platform,
                  thumbnailUrl: scrapedMeta.thumbnailUrl ?? video.cover ?? null
                }
              }
            } else {
              console.warn('Transcription failed for video', video?.id, transcriptionResult?.error)
            }
          } catch (workerError) {
            console.warn('Error transcribing video', video?.id, workerError)
          }
        }
      }

      const workerCount = Math.min(TRANSCRIBE_CONCURRENCY, videos.length)
      await Promise.all(Array.from({ length: workerCount }, () => worker()))

      const transcripts: string[] = []
      const videoMeta: TranscribedVideoMeta[] = []
      results.forEach((result) => {
        if (result?.transcript) {
          transcripts.push(result.transcript)
          if (result.meta) {
            videoMeta.push(result.meta)
          }
        }
      })

      if (!transcripts.length) {
        throw new Error('No videos could be transcribed successfully.')
      }

      setVoiceTranscripts(transcripts)
      setVoiceVideoMeta(videoMeta)
      setVoiceWorkflow((prev) => ({
        ...prev,
        step2: {
          status: 'success',
          data: {
            transcripts: transcripts.length,
            videosProcessed: videos.length
          }
        }
      }))

      setVoiceWorkflow((prev) => ({ ...prev, step3: { status: 'running' } }))

      const allTranscripts = transcripts.slice(0, VIDEO_LIMIT)
      const chunk = <T,>(arr: T[], size: number) => {
        const out: T[][] = []
        for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
        return out
      }

      const batches = chunk(allTranscripts, 5)

      const buildPrompt = (batchTranscripts: string[]) => {
        const t = batchTranscripts
        const tCount = t.length
        const analysisInstruction = `Analyze these ${tCount} video transcripts and create reusable templates. For each transcript:\n\n1. EXTRACT THE SECTIONS:\n- Hook (first 3-5 seconds that grabs attention)\n- Bridge (transition that sets up the main content)\n- Golden Nugget (the main value/lesson/information)\n- Why to Act (the closing reason to take action)\n\n2. CREATE TEMPLATES from the hooks by replacing specific details with [VARIABLES]:\nExample: "I made $5000 in 2 days" → "I [achievement] in [timeframe]"\n\n3. DOCUMENT THE CREATOR'S STYLE:\n- Common words/phrases they repeat\n- Sentence length (short/long/mixed)\n- Transition words between sections\n- Speaking pace indicators (pauses, emphasis)\n\n${Array.from({ length: tCount }, (_, i) => `[INSERT TRANSCRIPT ${i + 1}]`).join('\n')}\n\nOUTPUT FORMAT:\n\n## HOOK TEMPLATES\n1. [Template with variables]\n2. [Template with variables]\n3. [Template with variables]\n\n## BRIDGE TEMPLATES\n1. [Template with variables]\n2. [Template with variables]\n\n## GOLDEN NUGGET STRUCTURE\n- How they present main points\n- Common frameworks used\n\n## WHY TO ACT TEMPLATES\n1. [Template with variables]\n2. [Template with variables]\n\n## STYLE SIGNATURE\n- Power words: [list]\n- Filler phrases: [list]\n- Transition phrases: [list]\n- Average words per sentence: [number]\n- Tone: [description]`

        const transcriptsBlock = t
          .map((content, i) => `\n[INSERT TRANSCRIPT ${i + 1}]\n${content ?? ''}`)
          .join('\n')

        const jsonHeader = `Return ONLY valid JSON with this schema and no markdown/code fences.\n\n{\n  "templates": {\n    "hooks": [{ "pattern": "string", "variables": ["string"], "sourceIndex": 1 }],\n    "bridges": [{ "pattern": "string", "variables": ["string"], "sourceIndex": 1 }],\n    "ctas": [{ "pattern": "string", "variables": ["string"], "sourceIndex": 1 }],\n    "nuggets": [{ "pattern": "string", "structure": "string", "variables": ["string"], "sourceIndex": 1 }]\n  },\n  "styleSignature": {\n    "powerWords": ["string"],\n    "fillerPhrases": ["string"],\n    "transitionPhrases": ["string"],\n    "avgWordsPerSentence": 0,\n    "tone": "string"\n  },\n  "transcripts": [{\n    "index": 1,\n    "hook": {"text": "string", "duration": 0, "type": "string", "emotionalTrigger": "string", "template": "string", "variables": {}},\n    "bridge": {"text": "string", "transitionType": "string", "duration": 0, "template": "string", "variables": {}},\n    "goldenNugget": {"text": "string", "valueType": "string", "deliveryMethod": "string", "duration": 0, "structure": "string", "keyPoints": ["string"], "template": "string", "variables": {}},\n    "cta": {"text": "string", "type": "string", "placement": "string", "urgency": "string", "template": "string", "variables": {}},\n    "microHooks": [{"text": "string", "position": 0, "purpose": "string", "template": "string", "variables": {}}]\n  }]\n}`

        const densityRequirement = `\n\nTEMPLATE DENSITY REQUIREMENTS:\n- Produce exactly ${tCount} items in each of templates.hooks, templates.bridges, templates.nuggets, templates.ctas.\n- Map one item per transcript and set sourceIndex to that transcript's index (1-based).\n- Do NOT deduplicate or merge similar templates across transcripts — include them separately even if identical.\n- Keep patterns generalized with [VARIABLES], but preserve distinct phrasing per transcript.`

        const composedPrompt = `${jsonHeader}\n\n${analysisInstruction}${densityRequirement}\n${transcriptsBlock}`
        return composedPrompt
      }

      const analyzeBatch = async (batchTranscripts: string[], retryCount = 0): Promise<any> => {
        const MAX_RETRIES = 2

        const tryParseJson = (text: string): any | null => {
          if (!text) return null
          try {
            return JSON.parse(text)
          } catch {}
          const cleaned = text.replace(/```[\s\S]*?```/g, '').trim()
          try {
            return JSON.parse(cleaned)
          } catch {}
          const first = cleaned.indexOf('{')
          const last = cleaned.lastIndexOf('}')
          if (first !== -1 && last !== -1 && last > first) {
            const slice = cleaned.substring(first, last + 1)
            try {
              return JSON.parse(slice)
            } catch {}
          }
          return null
        }

        try {
          const composedPrompt = buildPrompt(batchTranscripts)
          const response = await fetch('/api/voice/analyze-patterns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: composedPrompt,
              responseType: 'json',
              temperature: ANALYSIS_TEMPERATURE,
              maxTokens: ANALYSIS_MAX_TOKENS,
              model: ANALYSIS_MODEL,
              systemPrompt:
                'You are a strict JSON generator. Return ONLY valid JSON matching the schema. No markdown, no commentary, no code fences.'
            })
          })

          const result = await response.json()
          if (!response.ok) {
            throw new Error(result?.error || `API returned ${response.status}`)
          }

          const parsed = tryParseJson(result?.content || '')
          if (!parsed) {
            if (retryCount < MAX_RETRIES) {
              await new Promise((resolve) => setTimeout(resolve, 1000))
              return analyzeBatch(batchTranscripts, retryCount + 1)
            }
            throw new Error('Failed to parse JSON content from analysis response.')
          }

          return parsed
        } catch (analysisError) {
          if (
            retryCount < MAX_RETRIES &&
            analysisError instanceof Error &&
            /(timeout|503|502)/i.test(analysisError.message)
          ) {
            await new Promise((resolve) => setTimeout(resolve, 2000))
            return analyzeBatch(batchTranscripts, retryCount + 1)
          }
          throw analysisError
        }
      }

      const batchResults: any[] = []
      for (let b = 0; b < batches.length; b += 1) {
        const r = await analyzeBatch(batches[b])
        if (!r) {
          throw new Error(`Analysis batch ${b + 1} returned empty results.`)
        }
        batchResults.push(r)
      }

      const combined: any = {
        templates: { hooks: [], bridges: [], ctas: [], nuggets: [] },
        styleSignature: {
          powerWords: [],
          fillerPhrases: [],
          transitionPhrases: [],
          avgWordsPerSentence: undefined,
          tone: 'Varied'
        },
        transcripts: []
      }

      const uniqPush = (arr: any[], items: any[]) => {
        const set = new Set(arr.map((item) => (typeof item === 'string' ? item : JSON.stringify(item))))
        items.forEach((entry) => {
          const key = typeof entry === 'string' ? entry : JSON.stringify(entry)
          if (!set.has(key)) {
            set.add(key)
            arr.push(entry)
          }
        })
      }

      let globalOffset = 0
      for (let i = 0; i < batchResults.length; i += 1) {
        const r = batchResults[i]
        const bt = batches[i]
        const localCount = bt.length

        const adjustTemplates = (list: any[] = []) =>
          list.map((template: any, idx: number) => ({
            ...template,
            sourceIndex: globalOffset + (template?.sourceIndex ?? idx + 1)
          }))

        combined.templates.hooks.push(...adjustTemplates(r?.templates?.hooks))
        combined.templates.bridges.push(...adjustTemplates(r?.templates?.bridges))
        combined.templates.ctas.push(...adjustTemplates(r?.templates?.ctas))
        combined.templates.nuggets.push(...adjustTemplates(r?.templates?.nuggets))

        if (Array.isArray(r?.transcripts)) {
          combined.transcripts.push(
            ...r.transcripts.map((t: any, index: number) => ({
              ...t,
              index: globalOffset + (t?.index ?? index + 1)
            }))
          )
        }

        uniqPush(combined.styleSignature.powerWords, r?.styleSignature?.powerWords || [])
        uniqPush(combined.styleSignature.fillerPhrases, r?.styleSignature?.fillerPhrases || [])
        uniqPush(combined.styleSignature.transitionPhrases, r?.styleSignature?.transitionPhrases || [])

        const avg = r?.styleSignature?.avgWordsPerSentence
        if (typeof avg === 'number') {
          const current = combined.styleSignature.avgWordsPerSentence
          combined.styleSignature.avgWordsPerSentence =
            typeof current === 'number' ? (current + avg) / 2 : avg
        }

        if (r?.styleSignature?.tone && combined.styleSignature.tone === 'Varied') {
          combined.styleSignature.tone = r.styleSignature.tone
        }

        globalOffset += localCount
      }

      console.log('[BrandHub] Voice analysis ready', {
        transcripts: allTranscripts.length,
        hooks: combined?.templates?.hooks?.length ?? 0,
        bridges: combined?.templates?.bridges?.length ?? 0,
        ctas: combined?.templates?.ctas?.length ?? 0,
        nuggets: combined?.templates?.nuggets?.length ?? 0
      })
      setVoiceAnalysis({ raw: null, json: combined })
      setVoiceWorkflow((prev) => ({
        ...prev,
        step3: {
          status: 'success',
          data: {
            transcripts: allTranscripts.length,
            hooks: combined?.templates?.hooks?.length ?? 0,
            bridges: combined?.templates?.bridges?.length ?? 0,
            ctas: combined?.templates?.ctas?.length ?? 0,
            nuggets: combined?.templates?.nuggets?.length ?? 0
          }
        }
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setVoiceWorkflow((prev) => ({
        ...prev,
        step2: prev.step2.status === 'running' ? { status: 'error', message } : prev.step2,
        step3: { status: 'error', message }
      }))
      throw error
    }
  }, [voiceContext, voiceVideos, voiceStepRaw])

  const handleCreatePersona = useCallback(async () => {
    if (!voiceContext || !voiceAnalysis) {
      throw new Error('Complete the analysis before creating a brand voice.')
    }

    setVoiceWorkflow((prev) => ({ ...prev, step5: { status: 'running' } }))

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      if (typeof window !== 'undefined') {
        try {
          console.log('[BrandHub] handleCreatePersona token lookup', {
            hasToken: Boolean(token),
            storedKeys: Object.keys(localStorage ?? {})
          })
        } catch (storageError) {
          console.warn('[BrandHub] Unable to inspect localStorage keys', storageError)
        }
      }

      if (!token) {
        console.error('[BrandHub] Missing auth token, aborting persona save')
        throw new Error('Authentication token not found. Please log in again.')
      }

      const payload = {
        name: `${voiceContext.displayHandle} Persona`,
        description: `Auto-generated voice persona for ${voiceContext.displayHandle}.`,
        platform: voiceContext.platform,
        username: voiceContext.displayHandle,
        analysis: voiceAnalysis,
        tags: [],
        creationStatus: 'created',
        transcriptsCount: voiceTranscripts.length,
        videoMeta: voiceVideoMeta
      }

      console.log('[BrandHub] Submitting persona payload', {
        transcripts: voiceTranscripts.length,
        videoMeta: voiceVideoMeta.length,
        platform: voiceContext.platform,
        username: voiceContext.displayHandle
      })

      const response = await fetch('/api/personas/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      let result: any = null
      try {
        result = await response.json()
      } catch (parseError) {
        console.error('[BrandHub] Failed to parse persona creation response', parseError)
        throw new Error('Server returned an invalid response')
      }

      if (!response.ok || !result?.success) {
        console.error('[BrandHub] Persona creation failed', {
          status: response.status,
          ok: response.ok,
          result
        })
        throw new Error(result?.error || `API returned ${response.status}`)
      }

      console.log('[BrandHub] Persona created successfully', result)

      setVoiceWorkflow((prev) => ({
        ...prev,
        step5: { status: 'success', data: result }
      }))

      refresh()
    } catch (error) {
      console.error('[BrandHub] handleCreatePersona error', error)
      const message = error instanceof Error ? error.message : String(error)
      setVoiceWorkflow((prev) => ({ ...prev, step5: { status: 'error', message } }))
      throw error
    }
  }, [voiceAnalysis, voiceContext, refresh])

  const voiceVideosForDisplay = useMemo(() => {
    return voiceVideos.map((video: any) => {
      const title: string =
        (typeof video?.description === 'string' && video.description.trim()) ||
        (typeof video?.title === 'string' && video.title.trim()) ||
        'Untitled video'

      const durationSource =
        typeof video?.duration === 'number'
          ? video.duration
          : typeof video?.meta?.duration === 'number'
          ? video.meta.duration
          : undefined

      const stats = video?.stats || {}
      const performanceParts: string[] = []
      if (typeof stats?.playCount === 'number') {
        performanceParts.push(`Views: ${stats.playCount}`)
      }
      if (typeof stats?.diggCount === 'number') {
        performanceParts.push(`Likes: ${stats.diggCount}`)
      }
      if (typeof stats?.commentCount === 'number') {
        performanceParts.push(`Comments: ${stats.commentCount}`)
      }

      return {
        id: String(video?.id ?? video?.meta?.id ?? Math.random().toString(36).slice(2)),
        title,
        duration: formatDuration(durationSource),
        performance: performanceParts.length ? performanceParts.join(' · ') : 'Performance data unavailable',
        postedAt: formatPostedAt(video?.createTime)
      }
    })
  }, [voiceVideos])

  const firstIncompleteIndex = useMemo(
    () =>
      onboardingPrompts.findIndex((prompt) => (responses[prompt.id] ?? '').trim().length === 0),
    [responses]
  )

  const handleOpenOnboardingModal = () => {
    if (firstIncompleteIndex >= 0) {
      setActiveQuestionIndex(firstIncompleteIndex)
    } else {
      setActiveQuestionIndex(0)
    }
    setIsOnboardingModalOpen(true)
  }

  const handleCompleteOnboarding = () => {
    setCompleted(true)
    setIsOnboardingModalOpen(false)
    setActiveTab('blueprint')
  }

  const handleCloseOnboardingModal = () => {
    setIsOnboardingModalOpen(false)
  }

  return (
    <div css={pageContainerStyles}>
      <header css={headerStyles}>
        <div className="header-text">
          <h1>Brand Hub</h1>
          <p>
            Choose the voice you want to write in, spin up new voices from your favorite creators, and
            shape onboarding inputs that unlock strategy-ready content pillars.
          </p>
        </div>
        <div className="header-actions">
          <Button variant="secondary" onClick={() => setIsWorkflowSpotlightOpen(true)}>
            How voice creation works
          </Button>
          <Button
            variant="primary"
            iconBefore={<AddIcon label="New" />}
            onClick={handleOpenCreateVoiceModal}
          >
            New brand voice
          </Button>
        </div>
      </header>

      <nav css={tabListStyles} aria-label="Brand hub sections">
        {tabConfig.map((tab) => (
          <button
            key={tab.id}
            type="button"
            css={tabTriggerStyles(activeTab === tab.id)}
            onClick={() => handleTabChange(tab.id)}
          >
            <span>{tab.label}</span>
            <span className="tab-hint">{tab.hint}</span>
          </button>
        ))}
      </nav>

      {activeTab === 'voices' && (
        <div css={voicesLayoutStyles}>
          <VoiceLibrary
            brandVoices={brandVoices}
            isLoading={isLoading}
            error={error}
            onRefresh={refresh}
            onCreateVoice={handleOpenCreateVoiceModal}
          />
        </div>
      )}

      {activeTab === 'onboarding' && (
        <OnboardingSection
          hasCompleted={hasCompleted}
          completedCount={completedCount}
          totalQuestions={totalQuestions}
          onStartInterview={handleOpenOnboardingModal}
          onViewBlueprint={() => setActiveTab('blueprint')}
          selectedIntents={selectedIntents}
          onToggleIntent={handleIntentToggle}
          intentOptions={intentOptions}
        />
      )}

      {activeTab === 'blueprint' && (
        <ContentBlueprint
          isComplete={isQuestionnaireComplete}
          responses={responses}
          selectedIntents={selectedIntents}
          onReturnToOnboarding={() => setActiveTab('onboarding')}
        />
      )}

      <OnboardingModal
        open={isOnboardingModalOpen}
        onClose={handleCloseOnboardingModal}
        activeQuestionIndex={activeQuestionIndex}
        setActiveQuestionIndex={setActiveQuestionIndex}
        responses={responses}
        setResponse={setResponse}
        completedCount={completedCount}
        onComplete={handleCompleteOnboarding}
      />

      <CreateVoiceModal
        open={isCreateVoiceModalOpen}
        onClose={handleCloseCreateVoiceModal}
        workflow={voiceWorkflow}
        videos={voiceVideosForDisplay}
        displayHandle={voiceWorkflow.step1.status === 'success' ? voiceContext?.displayHandle ?? '' : ''}
        onFetchVideos={handleFetchCreatorVideos}
        onAnalyzeVideos={handleAnalyzeCreator}
        onCreatePersona={handleCreatePersona}
      />

      <WorkflowSpotlightModal
        open={isWorkflowSpotlightOpen}
        onClose={() => setIsWorkflowSpotlightOpen(false)}
      />
    </div>
  )
}

export default BrandHub
