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

export interface OnboardingDocument {
  onboarding?: {
    responses?: Partial<OnboardingFormState>
    status?: string
    updatedAt?: unknown
    completedAt?: unknown
  }
}
