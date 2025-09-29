import { PlatformType } from '../types/voiceWorkflow'
import { parseJsonResponse } from '../utils/responseParsing'
import { createApiClient } from '@/api/client'

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

export const fetchInstagramStepData = async (identifier: string, displayHandle: string) => {
  console.log('Resolving Instagram user ID for', displayHandle)
  const client = createApiClient('')
  const userIdRes = await client.GET('/api/instagram/user-id', {
    params: { query: { username: identifier } },
  })
  if (userIdRes.error || !userIdRes.data?.success || !userIdRes.data?.user_id) {
    const code = (userIdRes.error as any)?.status ?? 500
    const payload: any = userIdRes.error || userIdRes.data
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof (payload as any).error === 'string'
      ? String((payload as any).error)
      : `Failed to resolve Instagram user ID (HTTP ${code})`
    throw new Error(message)
  }

  const userId = String(userIdRes.data.user_id)
  console.log(`Fetching Instagram reels for user ID: ${userId}`)

  const reelsQuery = new URLSearchParams({
    user_id: userId,
    include_feed_video: 'true',
    username: identifier
  })
  const reelsRes = await client.GET('/api/instagram/user-reels', {
    params: {
      query: {
        user_id: userId,
        include_feed_video: true as any,
        username: identifier,
      },
    },
  })
  const reelsResult = reelsRes.data as InstagramReelsApiResponse | any
  if (reelsRes.error || !reelsResult?.success) {
    const code = (reelsRes.error as any)?.status ?? 500
    const payload: any = reelsRes.error || reelsRes.data
    const message = payload && typeof payload === 'object' && 'error' in payload && typeof (payload as any).error === 'string'
      ? String((payload as any).error)
      : `Failed to fetch Instagram reels (HTTP ${code})`
    throw new Error(message)
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
    platform: 'instagram' as PlatformType,
    platformUserId: userId,
    raw: { userId: userIdRes.data, reels: reelsResult }
  }
}
