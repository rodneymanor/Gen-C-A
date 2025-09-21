import { VIDEO_LIMIT } from './voiceCreationConfig'

export const fetchTikTokFeed = async (identifier: string) => {
  const response = await fetch('/api/tiktok/user-feed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: identifier, count: VIDEO_LIMIT })
  })

  const result = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(result?.error || `API returned ${response.status}`)
  }

  if (!result?.success) {
    throw new Error(result?.error || 'Failed to fetch videos')
  }

  return {
    ...result,
    platform: 'tiktok' as const,
    platformUserId: result?.userInfo?.id ?? identifier
  }
}
