import { VIDEO_LIMIT } from './voiceCreationConfig'
import { createApiClient } from '@/api/client'

export const fetchTikTokFeed = async (identifier: string) => {
  const client = createApiClient('')
  const { data, error } = await client.POST('/api/tiktok/user-feed', {
    body: { username: identifier, count: VIDEO_LIMIT },
  })

  if (error || !data?.success) {
    const code = (error as any)?.status ?? 500
    const msg = (error as any)?.error || (data as any)?.error || `Failed to fetch videos (HTTP ${code})`
    throw new Error(msg)
  }

  return {
    ...data,
    platform: 'tiktok' as const,
    platformUserId: (data as any)?.userInfo?.id ?? identifier,
  }
}
