export type PlatformType = 'tiktok' | 'instagram'

export type WorkflowStatus = 'pending' | 'running' | 'success' | 'error'

export interface WorkflowStepState<TData = unknown> {
  status: WorkflowStatus
  message?: string
  data?: TData
}

export interface VoiceWorkflowState {
  step1: WorkflowStepState<{ videoCount: number; displayHandle: string; platform: PlatformType }>
  step2: WorkflowStepState<{ transcripts: number; videosProcessed: number }>
  step3: WorkflowStepState<{
    transcripts: number
    hooks: number
    bridges: number
    ctas: number
    nuggets: number
  }>
  step5: WorkflowStepState
}

export interface VoiceWorkflowContext {
  identifier: string
  displayHandle: string
  platform: PlatformType
}

export interface NormalizedHandleResult {
  identifier: string
  displayHandle: string
}

export interface TranscribedVideoMeta {
  id: string
  url?: string
  title?: string
  sourceUrl?: string
  platform?: PlatformType
  thumbnailUrl?: string | null
}

export interface VoiceAnalysisResult {
  raw: string | null
  json: unknown
}

export interface VoiceDisplayVideo {
  id: string
  title: string
  duration: string
  performance: string
  postedAt: string
}
