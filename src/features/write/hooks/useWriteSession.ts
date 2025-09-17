import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'

import {
  DEFAULT_BRAND_VOICE_ID,
  DEFAULT_BRAND_VOICE_NAME,
  resolveDefaultBrandVoiceId
} from '@/constants/brand-voices'
import { auth } from '@/config/firebase'
import { useScriptGeneration } from '@/hooks/use-script-generation'
import type { AIGenerationRequest, BrandPersona, Script } from '@/types'

import type {
  GenerationState,
  PersistGeneratedScriptParams,
  WriteSessionState,
  WriteView
} from '../types'
import { composeScriptContent } from '../utils/script-format'

const initialGenerationState: GenerationState = {
  isGenerating: false,
  progress: 0,
  stage: '',
  estimatedTimeRemaining: undefined
}

type GeneratedScriptResponse = {
  hook?: string
  bridge?: string
  goldenNugget?: string
  wta?: string
}

const mapGeneratedScriptToComponents = (script: GeneratedScriptResponse | null | undefined) => ({
  hook: script?.hook ?? '',
  bridge: script?.bridge ?? '',
  goldenNugget: script?.goldenNugget ?? '',
  wta: script?.wta ?? ''
})

const createScriptRecord = ({
  request,
  title,
  scriptContent,
  mappedLength,
  savedScriptId
}: {
  request: AIGenerationRequest
  title: string
  scriptContent: string
  mappedLength: PersistGeneratedScriptParams['mappedLength']
  savedScriptId?: string
}): Script => {
  const estimatedDuration = (() => {
    switch (mappedLength) {
      case '15':
        return 15
      case '20':
        return 20
      case '30':
        return 30
      case '45':
        return 45
      case '60':
        return 60
      case '90':
        return 90
      default:
        return 60
    }
  })()

  const wordCount = scriptContent
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean).length

  return {
    id: savedScriptId ?? Date.now().toString(),
    title,
    content: scriptContent,
    platform: request.platform,
    length: request.length,
    style: request.style as Script['style'],
    aiModel: request.aiModel,
    persona: request.persona,
    wordCount,
    estimatedDuration,
    insights: [],
    created: new Date(),
    updated: new Date()
  }
}

export interface WriteSessionHandlers {
  handleGenerate: (request: AIGenerationRequest) => Promise<void>
  handleUseIdea: (idea: { id: string; title: string }) => void
  handleExploreMore: () => void
  handleSaveScript: (script: Script) => void
  handleExportScript: (script: Script) => void
  handleRegenerateScript: () => void
  handleVoicePreview: (script: Script) => void
  handleBackToGenerate: () => void
  setView: (view: WriteView) => void
}

export type UseWriteSessionReturn = WriteSessionState &
  WriteSessionHandlers & {
    isLoading: boolean
    error?: string | null
    personas: BrandPersona[]
    defaultPersonaId: string
  }

export const useWriteSession = (): UseWriteSessionReturn => {
  const navigate = useNavigate()
  const { generateScript, isLoading, error } = useScriptGeneration()

  const [view, setView] = useState<WriteView>('generate')
  const [generatedScript, setGeneratedScript] = useState<Script | null>(null)
  const [personas, setPersonas] = useState<BrandPersona[]>([])
  const [defaultPersonaId, setDefaultPersonaId] = useState<string>(DEFAULT_BRAND_VOICE_ID)
  const [generationState, setGenerationState] = useState<GenerationState>(initialGenerationState)

  const writeState: WriteSessionState = useMemo(
    () => ({
      view,
      generatedScript,
      personas,
      defaultPersonaId,
      generationState
    }),
    [view, generatedScript, personas, defaultPersonaId, generationState]
  )

  const persistGeneratedScript = useCallback(
    async ({
      request,
      scriptContent,
      mappedLength,
      components,
      title
    }: PersistGeneratedScriptParams) => {
      const personaDetails = request.persona
        ? personas.find((p) => p.id === request.persona)
        : undefined

      const payload = {
        title,
        content: scriptContent,
        summary: scriptContent.slice(0, 200),
        approach: 'speed-write' as const,
        voice: personaDetails
          ? {
              id: personaDetails.id,
              name: personaDetails.name,
              badges: Array.isArray(personaDetails.keywords)
                ? personaDetails.keywords.slice(0, 3)
                : []
            }
          : undefined,
        originalIdea: request.prompt,
        targetLength: mappedLength,
        source: 'scripting' as const,
        platform: request.platform,
        status: 'draft' as const,
        tags: ['ai-generated', request.platform].filter(Boolean),
        isThread: false,
        elements: components
      }

      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'X-Client': 'write-page'
        }

        const resolveAuthToken = async (): Promise<string | null> => {
          if (!auth) return null

          try {
            const maybeAuthStateReady = (
              auth as unknown as { authStateReady?: () => Promise<void> }
            ).authStateReady
            if (typeof maybeAuthStateReady === 'function') {
              try {
                await maybeAuthStateReady.call(auth)
              } catch (readyError) {
                console.warn('⚠️ [Write] authStateReady check failed', readyError)
              }
            }

            if (auth.currentUser) {
              return await auth.currentUser.getIdToken()
            }

            return await new Promise<string | null>((resolve) => {
              let resolved = false
              let unsubscribe: (() => void) | null = null

              const finalize = (token: string | null) => {
                if (resolved) return
                resolved = true
                if (unsubscribe) unsubscribe()
                resolve(token)
              }

              const timeoutId = setTimeout(() => finalize(null), 5000)

              unsubscribe = onAuthStateChanged(
                auth,
                async (user) => {
                  clearTimeout(timeoutId)
                  const token = user ? await user.getIdToken().catch(() => null) : null
                  finalize(token)
                },
                (listenerError) => {
                  clearTimeout(timeoutId)
                  console.warn(
                    '⚠️ [Write] Auth listener error while resolving token',
                    listenerError
                  )
                  finalize(null)
                }
              )
            })
          } catch (tokenError) {
            console.warn('⚠️ [Write] Unexpected error resolving auth token', tokenError)
            return null
          }
        }

        try {
          const token = await resolveAuthToken()
          if (token) {
            headers.Authorization = `Bearer ${token}`
            console.log('🔐 [Write] Attached auth token for script persistence')
          } else {
            console.warn('⚠️ [Write] No auth token available; script will be stored locally')
          }
        } catch (tokenError) {
          console.warn(
            '⚠️ [Write] Failed to retrieve auth token for script persistence',
            tokenError
          )
        }

        const response = await fetch('/api/scripts', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload)
        })

        const data = await response.json().catch(() => null)

        if (!response.ok || !data?.success) {
          console.warn('⚠️ [Write] Failed to persist generated script', {
            status: response.status,
            data
          })
          return null
        }

        console.log('💾 [Write] Generated script saved', data.script?.id)
        return data.script ?? null
      } catch (err) {
        console.error('❌ [Write] Persisting script failed', err)
        return null
      }
    },
    [personas]
  )

  const handleGenerate = useCallback(
    async (request: AIGenerationRequest) => {
      console.log('🎬 [Write] handleGenerate called with request:', request)

      try {
        setGenerationState({
          isGenerating: true,
          progress: 10,
          stage: 'Preparing generation...',
          estimatedTimeRemaining: undefined
        })

        const lengthMapping = {
          short: '15',
          medium: '30',
          long: '60'
        } as const

        const mappedLength = lengthMapping[request.length]
        console.log('📏 [Write] Length mapping:', {
          original: request.length,
          mapped: mappedLength
        })

        console.log('🔄 [Write] Calling generateScript...')
        const result = await generateScript(request.prompt, mappedLength, request.persona)

        console.log('📋 [Write] Generate script result:', result)

        if (result.success && result.script) {
          console.log('✅ [Write] Script generation successful, creating content...')
          const title = `Generated Script: ${request.prompt.slice(0, 50)}...`

          const components = mapGeneratedScriptToComponents(result.script)
          const scriptContent = composeScriptContent(components)

          const savedScript = await persistGeneratedScript({
            request,
            scriptContent,
            mappedLength,
            components,
            title
          })

          const scriptRecord = createScriptRecord({
            request,
            title,
            scriptContent,
            mappedLength,
            savedScriptId: savedScript?.id
          })

          const params = new URLSearchParams({
            content: scriptContent,
            title,
            platform: request.platform,
            length: request.length,
            style: request.style
          })

          if (savedScript?.id) {
            params.set('scriptId', savedScript.id)
          }

          const editorUrl = `/editor?${params.toString()}`
          console.log('🧭 [Write] Navigating to:', editorUrl)

          setGeneratedScript(scriptRecord)
          setView('edit')
          navigate(editorUrl)
          console.log('✅ [Write] Navigation completed')
        } else {
          console.error('❌ [Write] Script generation failed or incomplete:', result)
        }
        setGenerationState({
          isGenerating: false,
          progress: 100,
          stage: 'Completed',
          estimatedTimeRemaining: 0
        })
      } catch (generationError) {
        console.error('❌ [Write] Generation failed with exception:', generationError)
        setGenerationState({
          isGenerating: false,
          progress: 0,
          stage: 'Failed',
          estimatedTimeRemaining: undefined
        })
      }
    },
    [generateScript, navigate, persistGeneratedScript]
  )

  useEffect(() => {
    let isMounted = true
    ;(async () => {
      try {
        const res = await fetch('/api/brand-voices/list')
        const data = await res.json().catch(() => null)
        if (isMounted && res.ok && data?.success && Array.isArray(data.voices)) {
          const mapped: BrandPersona[] = data.voices.map((v: any) => {
            const isDefault = v.isDefault === true || v.id === DEFAULT_BRAND_VOICE_ID
            return {
              id: v.id,
              name: isDefault ? DEFAULT_BRAND_VOICE_NAME : v.name || v.id || '',
              description: v.description || '',
              tone: v.tone || 'Varied',
              voice: v.voice || 'Derived from analysis',
              targetAudience: v.targetAudience || 'General',
              keywords: v.keywords || [],
              platforms: v.platforms || ['tiktok'],
              created: v.created
                ? new Date(v.created._seconds ? v.created._seconds * 1000 : v.created)
                : new Date(),
              isDefault
            }
          })
          setPersonas(mapped)
          setDefaultPersonaId(resolveDefaultBrandVoiceId(mapped))
        }
      } catch (personaError) {
        console.warn('⚠️ [Write] Failed to load brand voices', personaError)
      }
    })()

    return () => {
      isMounted = false
    }
  }, [])

  const handleUseIdea = useCallback((idea: { id: string; title: string }) => {
    console.log('Using trending idea:', idea.title)
  }, [])

  const handleExploreMore = useCallback(() => {
    console.log('Explore more trends')
  }, [])

  const handleSaveScript = useCallback((script: Script) => {
    console.log('Saving script:', script.title)
  }, [])

  const handleExportScript = useCallback((script: Script) => {
    console.log('Exporting script:', script.title)
  }, [])

  const handleRegenerateScript = useCallback(() => {
    setView('generate')
    setGeneratedScript(null)
  }, [])

  const handleVoicePreview = useCallback((script: Script) => {
    console.log('Voice preview for:', script.title)
  }, [])

  const handleBackToGenerate = useCallback(() => {
    setView('generate')
  }, [])

  return {
    ...writeState,
    isLoading,
    error,
    personas,
    defaultPersonaId,
    handleGenerate,
    handleUseIdea,
    handleExploreMore,
    handleSaveScript,
    handleExportScript,
    handleRegenerateScript,
    handleVoicePreview,
    handleBackToGenerate,
    setView
  }
}
