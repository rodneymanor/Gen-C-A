export type BrandVoiceStatus = 'Live' | 'Draft' | 'Exploring'

export interface BrandVoice {
  id: string
  name: string
  status: BrandVoiceStatus
  persona: string
  summary: string
  platform: string
  audience: string
  lastUpdated: string
  pillars: string[]
}

export interface CreatorVideo {
  id: string
  title: string
  duration: string
  performance: string
  postedAt: string
}

export interface OnboardingFormState {
  whoAndWhat: string
  audienceProblem: string
  quickWin: string
  bigDream: string
  voiceStyle: string
  contentFocus: string
}

export type TabKey = 'voices' | 'onboarding' | 'blueprint'

export interface OnboardingPrompt {
  id: keyof OnboardingFormState
  title: string
  prompt: string
  helper?: string
}

export interface BrandProfilePillar {
  pillar_name: string
  description: string
  suggested_themes: string[]
}

export interface BrandProfileHashtags {
  broad: string[]
  niche: string[]
  community: string[]
}

export interface BrandProfile {
  core_keywords: string[]
  audience_keywords: string[]
  problem_aware_keywords: string[]
  solution_aware_keywords: string[]
  content_pillars: BrandProfilePillar[]
  suggested_hashtags: BrandProfileHashtags
}

export interface BrandProfileRequestPayload {
  profession: string
  brandPersonality: string
  universalProblem: string
  initialHurdle: string
  persistentStruggle: string
  visibleTriumph: string
  ultimateTransformation: string
  immediateImpact: string
  ultimateImpact: string
}

export interface BrandProfileResult {
  profile: BrandProfile
  tokensUsed?: number
  responseTime?: number
}

export interface ApiBrandVoice {
  id: string
  creatorId?: string
  name?: string
  description?: string
  tone?: string
  voice?: string
  targetAudience?: string
  keywords?: unknown
  platforms?: unknown
  created?: unknown
  isDefault?: boolean
  isShared?: boolean
}

export interface ResolvedBrandVoice {
  voice: BrandVoice
  sortTime: number
}

export interface OnboardingRecord {
  responses?: Partial<OnboardingFormState>
  status?: 'in-progress' | 'completed'
  updatedAt?: unknown
  completedAt?: unknown
}
