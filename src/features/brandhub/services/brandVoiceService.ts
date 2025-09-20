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

  return payload
    .map((voice) => mapApiBrandVoice(voice))
    .sort((a, b) => b.sortTime - a.sortTime)
    .map(({ voice }) => voice)
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
