import {
  NormalizedHandleResult,
  PlatformType,
  VoiceWorkflowContext,
  VoiceWorkflowState,
  WorkflowStepState
} from '../types/voiceWorkflow'
import { normalizeHandleInput } from '../utils/handleNormalization'
import { mapVideosForDisplay } from '../utils/voiceCreationFormatting'
import { voiceCreationConstants } from './voiceCreationConfig'
import { fetchTikTokFeed } from './tiktokVoiceService'
import { fetchInstagramStepData } from './instagramVoiceService'
import { transcribeVideos } from './videoTranscriptionService'
import { analyzeTranscripts } from './voiceAnalysisService'
import { createVoicePersona, saveVoiceTemplates } from './voicePersonaService'

export { transcribeVideos, analyzeTranscripts, createVoicePersona, saveVoiceTemplates }
export const videoDisplayMapper = mapVideosForDisplay
export const constants = voiceCreationConstants

export const initialStepState = (): WorkflowStepState => ({ status: 'pending' })

export const buildInitialWorkflowState = (): VoiceWorkflowState => ({
  step1: initialStepState(),
  step2: initialStepState(),
  step3: initialStepState(),
  step5: initialStepState()
})

const filterAnalyzedVideoIds = async (identifier: string, videos: any[]): Promise<any[]> => {
  try {
    const lookup = await fetch(`/api/creator/analyzed-video-ids?handle=${encodeURIComponent(identifier)}`)
    const idsRes = await lookup.json().catch(() => null)
    if (lookup.ok && idsRes?.success && Array.isArray(idsRes.videoIds) && idsRes.videoIds.length) {
      const existing = new Set(idsRes.videoIds.map(String))
      return videos.filter((video: any) => !existing.has(String(video?.id)))
    }
  } catch (filterError) {
    console.warn('Skipping analyzed video filter', filterError)
  }
  return videos
}

type FetchCreatorVideosResult = {
  context: VoiceWorkflowContext
  videos: any[]
  baseResult: any
}

export const fetchCreatorVideos = async (
  input: string,
  platform: PlatformType
): Promise<FetchCreatorVideosResult> => {
  const normalized: NormalizedHandleResult = normalizeHandleInput(input, platform)
  let baseResult: any

  if (platform === 'tiktok') {
    baseResult = await fetchTikTokFeed(normalized.identifier)
  } else {
    baseResult = await fetchInstagramStepData(normalized.identifier, normalized.displayHandle)
  }

  const filtered = await filterAnalyzedVideoIds(normalized.identifier, baseResult?.videos || [])

  if (!filtered.length) {
    throw new Error('No new videos found to analyze for this creator.')
  }

  return {
    context: { ...normalized, platform },
    videos: filtered,
    baseResult
  }
}
