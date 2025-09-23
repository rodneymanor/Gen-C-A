import { BrandProfileResult, BrandProfileRequestPayload } from '../types/brandHub'

interface BrandProfileApiResponse {
  success: boolean
  profile?: BrandProfileResult['profile']
  tokensUsed?: number
  responseTime?: number
  error?: string
  raw?: unknown
  storage?: {
    latestDocPath: string
    historyDocPath: string
    historyDocId: string
  }
}

const HEADERS: HeadersInit = {
  'Content-Type': 'application/json'
}

const DEFAULT_ERROR_MESSAGE = 'Failed to generate brand profile. Please try again.'

export const generateBrandProfile = async (
  payload: BrandProfileRequestPayload
): Promise<BrandProfileResult> => {
  const response = await fetch('/api/brand', {
    method: 'POST',
    headers: HEADERS,
    credentials: 'include',
    body: JSON.stringify(payload)
  })

  let data: BrandProfileApiResponse | null = null
  try {
    data = (await response.json()) as BrandProfileApiResponse
  } catch (error) {
    throw new Error(DEFAULT_ERROR_MESSAGE)
  }

  if (!response.ok || !data?.success || !data.profile) {
    const message = data?.error || DEFAULT_ERROR_MESSAGE
    throw new Error(message)
  }

  return {
    profile: data.profile,
    tokensUsed: data.tokensUsed,
    responseTime: data.responseTime,
    storage: data.storage
  }
}
