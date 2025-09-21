import { VoiceAnalysisResult, VoiceWorkflowContext, TranscribedVideoMeta } from '../types/voiceWorkflow'

interface SaveVoiceTemplatesOptions {
  context: VoiceWorkflowContext
  analysis: VoiceAnalysisResult
  transcripts: string[]
  videoMeta: TranscribedVideoMeta[]
}

export const saveVoiceTemplates = async ({
  context,
  analysis,
  transcripts,
  videoMeta
}: SaveVoiceTemplatesOptions) => {
  const analysisJson = analysis.json ?? null
  const analysisText =
    typeof analysis.raw === 'string' && analysis.raw.trim().length
      ? analysis.raw
      : analysisJson
      ? JSON.stringify(analysisJson)
      : ''

  if (!analysisJson && !analysisText) {
    throw new Error('Voice analysis is required before saving templates.')
  }

  const payload = {
    creator: {
      name: context.displayHandle.replace(/^@/, ''),
      handle: context.displayHandle
    },
    analysisJson,
    analysisText,
    transcriptsCount: transcripts.length,
    videoMeta
  }

  const response = await fetch('/api/creator/save-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })

  let result: any = null
  try {
    result = await response.json()
  } catch (parseError) {
    console.error('[BrandHub] Failed to parse save-analysis response', parseError)
    throw new Error('Server returned an invalid response while saving templates')
  }

  if (!response.ok || !result?.success) {
    console.error('[BrandHub] save-analysis request failed', {
      status: response.status,
      ok: response.ok,
      result
    })
    throw new Error(result?.error || `Template save failed with status ${response.status}`)
  }

  return result
}

interface CreatePersonaOptions {
  context: VoiceWorkflowContext
  analysis: VoiceAnalysisResult
  transcripts: string[]
  videoMeta: TranscribedVideoMeta[]
  token: string | null
}

export const createVoicePersona = async ({
  context,
  analysis,
  transcripts,
  videoMeta,
  token
}: CreatePersonaOptions) => {
  if (!token) {
    console.error('[BrandHub] Missing auth token, aborting persona save')
    throw new Error('Authentication token not found. Please log in again.')
  }

  const payload = {
    name: `${context.displayHandle} Persona`,
    description: `Auto-generated voice persona for ${context.displayHandle}.`,
    platform: context.platform,
    username: context.displayHandle,
    analysis,
    tags: [],
    creationStatus: 'created',
    transcriptsCount: transcripts.length,
    videoMeta
  }

  console.log('[BrandHub] Submitting persona payload', {
    transcripts: transcripts.length,
    videoMeta: videoMeta.length,
    platform: context.platform,
    username: context.displayHandle
  })

  const response = await fetch('/api/personas/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  })

  let result: any = null
  try {
    result = await response.json()
  } catch (parseError) {
    console.error('[BrandHub] Failed to parse persona creation response', parseError)
    throw new Error('Server returned an invalid response')
  }

  if (!response.ok || !result?.success) {
    console.error('[BrandHub] Persona creation failed', {
      status: response.status,
      ok: response.ok,
      result
    })
    throw new Error(result?.error || `API returned ${response.status}`)
  }

  console.log('[BrandHub] Persona created successfully', result)

  return result
}
