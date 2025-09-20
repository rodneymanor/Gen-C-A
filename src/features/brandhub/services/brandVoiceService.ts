import { BrandVoice } from '../types/brandHub'
import { mapApiBrandVoice } from '../utils/brandVoiceMapping'

interface BrandVoiceResponse {
  success?: boolean
  voices?: unknown
}

const parseVoicesPayload = (payload: unknown): BrandVoice[] => {
  if (!payload || !Array.isArray(payload)) {
    return []
  }

  const seenIds = new Set<string>()

  return payload
    .map((voice) => mapApiBrandVoice(voice))
    .sort((a, b) => b.sortTime - a.sortTime)
    .reduce<BrandVoice[]>((acc, { voice }) => {
      const key = typeof voice.id === 'string' && voice.id.length > 0 ? voice.id : null
      if (key) {
        if (seenIds.has(key)) {
          return acc
        }
        seenIds.add(key)
      }
      acc.push(voice)
      return acc
    }, [])
}

export const listBrandVoices = async (): Promise<BrandVoice[]> => {
  const response = await fetch('/api/brand-voices/list')

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  const data: BrandVoiceResponse | null = await response
    .json()
    .catch(() => null)

  if (!data?.success) {
    return []
  }

  return parseVoicesPayload(data.voices)
}
