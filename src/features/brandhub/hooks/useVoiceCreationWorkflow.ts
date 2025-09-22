import { useCallback, useMemo, useState } from 'react'
import {
  VoiceWorkflowState,
  VoiceWorkflowContext,
  PlatformType,
  VoiceDisplayVideo,
  VoiceAnalysisResult,
  TranscribedVideoMeta
} from '../types/voiceWorkflow'
import {
  analyzeTranscripts,
  buildInitialWorkflowState,
  fetchCreatorVideos,
  initialStepState,
  saveVoiceTemplates,
  transcribeVideos,
  videoDisplayMapper,
  constants
} from '../services/voiceCreationService'

interface UseVoiceCreationWorkflowOptions {
  onVoiceSaved?: () => void
}

interface UseVoiceCreationWorkflowResult {
  workflow: VoiceWorkflowState
  videosForDisplay: VoiceDisplayVideo[]
  displayHandle: string
  fetchVideos: (input: string, platform: PlatformType) => Promise<void>
  analyzeVideos: () => Promise<void>
  createPersona: () => Promise<void>
  reset: () => void
  context: VoiceWorkflowContext | null
}

export const useVoiceCreationWorkflow = (
  options: UseVoiceCreationWorkflowOptions = {}
): UseVoiceCreationWorkflowResult => {
  const [workflow, setWorkflow] = useState<VoiceWorkflowState>(buildInitialWorkflowState)
  const [context, setContext] = useState<VoiceWorkflowContext | null>(null)
  const [videos, setVideos] = useState<any[]>([])
  const [baseResult, setBaseResult] = useState<any>(null)
  const [transcripts, setTranscripts] = useState<string[]>([])
  const [videoMeta, setVideoMeta] = useState<TranscribedVideoMeta[]>([])
  const [analysis, setAnalysis] = useState<VoiceAnalysisResult | null>(null)

  const reset = useCallback(() => {
    setWorkflow(buildInitialWorkflowState())
    setContext(null)
    setVideos([])
    setBaseResult(null)
    setTranscripts([])
    setVideoMeta([])
    setAnalysis(null)
  }, [])

  const fetchVideos = useCallback(
    async (input: string, platform: PlatformType) => {
      setWorkflow({
        step1: { status: 'running' },
        step2: initialStepState(),
        step3: initialStepState(),
        step5: initialStepState()
      })
      setContext(null)
      setVideos([])
      setBaseResult(null)
      setTranscripts([])
      setVideoMeta([])
      setAnalysis(null)

      try {
        const result = await fetchCreatorVideos(input, platform)
        setContext(result.context)
        setVideos(result.videos)
        setBaseResult(result.baseResult)
        setWorkflow({
          step1: {
            status: 'success',
            data: {
              videoCount: result.videos.length,
              displayHandle: result.context.displayHandle,
              platform: result.context.platform
            }
          },
          step2: initialStepState(),
          step3: initialStepState(),
          step5: initialStepState()
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        setWorkflow({
          step1: { status: 'error', message },
          step2: initialStepState(),
          step3: initialStepState(),
          step5: initialStepState()
        })
        setContext(null)
        throw error
      }
    },
    []
  )

  const analyzeVideos = useCallback(async () => {
    if (!context || !videos.length) {
      throw new Error('Fetch creator videos before analyzing.')
    }

    setWorkflow((prev) => ({
      ...prev,
      step2: { status: 'running' },
      step3: initialStepState(),
      step5: initialStepState()
    }))

    try {
      const { transcripts: generatedTranscripts, videoMeta: generatedVideoMeta } = await transcribeVideos({
        videos,
        context,
        baseResult
      })

      setTranscripts(generatedTranscripts)
      setVideoMeta(generatedVideoMeta)
      setWorkflow((prev) => ({
        ...prev,
        step2: {
          status: 'success',
          data: {
            transcripts: generatedTranscripts.length,
            videosProcessed: Math.min(videos.length, constants.VIDEO_LIMIT)
          }
        }
      }))

      setWorkflow((prev) => ({ ...prev, step3: { status: 'running' } }))

      const analysisResult = await analyzeTranscripts(generatedTranscripts)
      setAnalysis(analysisResult)

      const summary = (analysisResult.json ?? {}) as any
      const hooks = summary?.templates?.hooks?.length ?? 0
      const bridges = summary?.templates?.bridges?.length ?? 0
      const ctas = summary?.templates?.ctas?.length ?? 0
      const nuggets = summary?.templates?.nuggets?.length ?? 0

      setWorkflow((prev) => ({
        ...prev,
        step3: {
          status: 'success',
          data: {
            transcripts: generatedTranscripts.length,
            hooks,
            bridges,
            ctas,
            nuggets
          }
        }
      }))
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      setWorkflow((prev) => ({
        ...prev,
        step2: prev.step2.status === 'running' ? { status: 'error', message } : prev.step2,
        step3: { status: 'error', message }
      }))
      throw error
    }
  }, [context, videos, baseResult])

  const createPersonaHandler = useCallback(async () => {
    if (!context || !analysis) {
      throw new Error('Complete the analysis before creating a brand voice.')
    }

    setWorkflow((prev) => ({ ...prev, step5: { status: 'running' } }))

    try {
      const saveResult = await saveVoiceTemplates({
        context,
        analysis,
        transcripts,
        videoMeta
      })

      setWorkflow((prev) => ({
        ...prev,
        step5: { status: 'success', data: saveResult }
      }))

      options.onVoiceSaved?.()
    } catch (error) {
      console.error('[BrandHub] handleCreatePersona error', error)
      const message = error instanceof Error ? error.message : String(error)
      setWorkflow((prev) => ({ ...prev, step5: { status: 'error', message } }))
      throw error
    }
  }, [analysis, context, transcripts, videoMeta, options])

  const videosForDisplay = useMemo<VoiceDisplayVideo[]>(() => videoDisplayMapper(videos), [videos])

  const displayHandle = useMemo(() => {
    return workflow.step1.status === 'success' ? context?.displayHandle ?? '' : ''
  }, [workflow.step1.status, context?.displayHandle])

  return {
    workflow,
    videosForDisplay,
    displayHandle,
    fetchVideos,
    analyzeVideos,
    createPersona: createPersonaHandler,
    reset,
    context
  }
}
