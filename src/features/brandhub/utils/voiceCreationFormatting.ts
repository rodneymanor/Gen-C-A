import { PlatformType, VoiceDisplayVideo } from '../types/voiceWorkflow'

export const formatDuration = (seconds?: number): string => {
  if (typeof seconds !== 'number' || Number.isNaN(seconds) || seconds <= 0) {
    return '—'
  }
  const totalSeconds = Math.round(seconds)
  const minutes = Math.floor(totalSeconds / 60)
  const remaining = totalSeconds % 60
  return `${minutes}:${remaining.toString().padStart(2, '0')}`
}

export const formatPostedAt = (createTime?: number): string => {
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

interface VoiceVideoLike {
  id?: string | number
  meta?: { id?: string; duration?: number }
  description?: string
  title?: string
  duration?: number
  stats?: {
    playCount?: number
    diggCount?: number
    commentCount?: number
  }
  createTime?: number
}

export const mapVideosForDisplay = (videos: VoiceVideoLike[]): VoiceDisplayVideo[] => {
  return videos.map((video) => {
    const titleCandidate =
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
      id:
        typeof video?.id === 'string'
          ? video.id
          : typeof video?.id === 'number'
          ? String(video.id)
          : (video?.meta?.id ?? Math.random().toString(36).slice(2)),
      title: titleCandidate,
      duration: formatDuration(durationSource),
      performance: performanceParts.length
        ? performanceParts.join(' · ')
        : 'Performance data unavailable',
      postedAt: formatPostedAt(video?.createTime)
    }
  })
}

export const resolvePlatformFromVideo = (video: { platform?: PlatformType }, fallback: PlatformType) => {
  return (video?.platform as PlatformType | undefined) ?? fallback
}
