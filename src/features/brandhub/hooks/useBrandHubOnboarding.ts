import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createEmptyOnboardingResponses, onboardingPrompts } from '../constants/onboarding'
import { persistOnboardingResponses, fetchOnboardingDocument } from '../services/onboardingService'
import {
  OnboardingFormState,
  OnboardingSessionBoundary,
  OnboardingSessionMeta,
  OnboardingSessionStatus
} from '../types/brandHub'

const SAVE_DEBOUNCE_MS = 1000

const createInitialSessionMeta = (): OnboardingSessionMeta => ({
  startedAt: null,
  status: 'idle',
  boundaries: [],
  transcript: ''
})

interface UseBrandHubOnboardingArgs {
  userId?: string
}

interface UseBrandHubOnboardingResult {
  responses: OnboardingFormState
  setResponse: (id: keyof OnboardingFormState, value: string) => void
  hasCompleted: boolean
  setCompleted: (state: boolean) => void
  activeQuestionIndex: number
  setActiveQuestionIndex: (index: number) => void
  resetInterview: () => void
  isLoading: boolean
  completedCount: number
  isQuestionnaireComplete: boolean
  sessionMeta: OnboardingSessionMeta
  ensureSessionStarted: () => void
  registerBoundary: (boundary: OnboardingSessionBoundary) => void
  finalizeSession: (status: OnboardingSessionStatus) => void
  updateSessionTranscript: (transcript: string) => void
  flushPendingSaves: () => void
  restartOnboarding: () => Promise<void>
}

export const useBrandHubOnboarding = (
  { userId }: UseBrandHubOnboardingArgs
): UseBrandHubOnboardingResult => {
  const [responses, setResponses] = useState<OnboardingFormState>(createEmptyOnboardingResponses)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [sessionMeta, setSessionMeta] = useState<OnboardingSessionMeta>(createInitialSessionMeta)

  const saveTimerRef = useRef<number | null>(null)
  const isFlushingRef = useRef(false)
  const latestResponsesRef = useRef(responses)
  const latestCompletionRef = useRef(hasCompleted)
  const latestSessionMetaRef = useRef(sessionMeta)
  const isMountedRef = useRef(true)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const resetInterview = useCallback(() => {
    const initialResponses = createEmptyOnboardingResponses()
    setResponses(initialResponses)
    latestResponsesRef.current = initialResponses

    setHasCompleted(false)
    latestCompletionRef.current = false

    setActiveQuestionIndex(0)
    setIsLoading(false)

    const initialMeta = createInitialSessionMeta()
    setSessionMeta(initialMeta)
    latestSessionMetaRef.current = initialMeta
  }, [])

  useEffect(() => {
    latestResponsesRef.current = responses
  }, [responses])

  useEffect(() => {
    latestCompletionRef.current = hasCompleted
  }, [hasCompleted])

  useEffect(() => {
    latestSessionMetaRef.current = sessionMeta
  }, [sessionMeta])

  useEffect(() => {
    if (!userId) {
      resetInterview()
      return
    }

    let cancelled = false

    const loadOnboarding = async () => {
      setIsLoading(true)
      try {
        const record = await fetchOnboardingDocument(userId)
        if (cancelled || !record) {
          return
        }

        if (record.responses) {
          setResponses((prev) => {
            const next = { ...prev, ...record.responses }
            latestResponsesRef.current = next
            return next
          })
        }

        if (record.status === 'completed') {
          setHasCompleted(true)
          latestCompletionRef.current = true
        }

        if (record.sessionMeta) {
          const normalizedSessionMeta: OnboardingSessionMeta = {
            startedAt: record.sessionMeta.startedAt ?? null,
            stoppedAt: record.sessionMeta.stoppedAt ?? null,
            status: record.sessionMeta.status ?? 'idle',
            boundaries: record.sessionMeta.boundaries ?? [],
            transcript: record.sessionMeta.transcript ?? ''
          }
          setSessionMeta(normalizedSessionMeta)
          latestSessionMetaRef.current = normalizedSessionMeta
        }
      } catch (error) {
        console.error('Failed to load onboarding responses:', error)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadOnboarding()

    return () => {
      cancelled = true
    }
  }, [resetInterview, userId])

  const enqueueSave = useCallback(() => {
    if (!userId) {
      return
    }

    if (typeof window === 'undefined') {
      void persistOnboardingResponses(
        userId,
        latestResponsesRef.current,
        latestCompletionRef.current,
        latestSessionMetaRef.current
      )
      return
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = window.setTimeout(() => {
      void persistOnboardingResponses(
        userId,
        latestResponsesRef.current,
        latestCompletionRef.current,
        latestSessionMetaRef.current
      )
    }, SAVE_DEBOUNCE_MS)
  }, [userId])

  const flushPendingSaves = useCallback(() => {
    if (!userId) {
      return
    }

    if (typeof window !== 'undefined' && saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }

    if (isFlushingRef.current) {
      return
    }

    isFlushingRef.current = true

    const flushPromise = persistOnboardingResponses(
      userId,
      latestResponsesRef.current,
      latestCompletionRef.current,
      latestSessionMetaRef.current
    )
      .catch((error) => {
        console.error('Failed to persist onboarding responses during flush:', error)
      })
      .finally(() => {
        isFlushingRef.current = false
      })

    void flushPromise
  }, [userId])

  useEffect(() => {
    enqueueSave()

    return () => {
      if (saveTimerRef.current) {
        if (typeof window !== 'undefined') {
          window.clearTimeout(saveTimerRef.current)
        }
        saveTimerRef.current = null
      }
    }
  }, [responses, hasCompleted, sessionMeta, enqueueSave])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        if (typeof window !== 'undefined') {
          window.clearTimeout(saveTimerRef.current)
        }
        saveTimerRef.current = null
      }
      if (userId) {
        flushPendingSaves()
      }
    }
  }, [flushPendingSaves, userId])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingSaves()
      }
    }

    const handlePageHide = () => {
      flushPendingSaves()
    }

    const handleBeforeUnload = () => {
      flushPendingSaves()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', handlePageHide)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', handlePageHide)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [flushPendingSaves])

  const setResponse = useCallback((id: keyof OnboardingFormState, value: string) => {
    setResponses((prev) => {
      const next = { ...prev, [id]: value }
      latestResponsesRef.current = next
      return next
    })
  }, [])

  const setCompleted = useCallback((state: boolean) => {
    setHasCompleted(state)
    latestCompletionRef.current = state
  }, [])

  const updateSessionMetaState = useCallback(
    (updater: (previous: OnboardingSessionMeta) => OnboardingSessionMeta) => {
      setSessionMeta((prev) => {
        const next = updater(prev)
        latestSessionMetaRef.current = next
        return next
      })
    },
    []
  )

  const ensureSessionStarted = useCallback(() => {
    updateSessionMetaState((prev) => {
      if (prev.startedAt) {
        return prev.status === 'idle' ? { ...prev, status: 'in-progress' } : prev
      }
      return {
        ...prev,
        startedAt: Date.now(),
        status: 'in-progress'
      }
    })
  }, [updateSessionMetaState])

  const registerBoundary = useCallback(
    (boundary: OnboardingSessionBoundary) => {
      updateSessionMetaState((prev) => ({
        ...prev,
        boundaries: [...prev.boundaries, boundary]
      }))
    },
    [updateSessionMetaState]
  )

  const finalizeSession = useCallback(
    (status: OnboardingSessionStatus) => {
      updateSessionMetaState((prev) => ({
        ...prev,
        status,
        stoppedAt: Date.now(),
        startedAt: prev.startedAt ?? Date.now()
      }))
    },
    [updateSessionMetaState]
  )

  const updateSessionTranscript = useCallback(
    (transcript: string) => {
      updateSessionMetaState((prev) => ({
        ...prev,
        transcript
      }))
    },
    [updateSessionMetaState]
  )

  const restartOnboarding = useCallback(async () => {
    const resetMeta = createInitialSessionMeta()
    const emptyResponses = createEmptyOnboardingResponses()

    resetInterview()

    if (!userId) {
      return
    }

    try {
      await persistOnboardingResponses(userId, emptyResponses, false, resetMeta)
    } catch (error) {
      console.error('Failed to reset onboarding responses:', error)
    }
  }, [resetInterview, userId])

  const completedCount = useMemo(
    () =>
      onboardingPrompts.filter((prompt) => (responses[prompt.id] ?? '').trim().length > 0).length,
    [responses]
  )

  const isQuestionnaireComplete = useMemo(
    () => completedCount === onboardingPrompts.length,
    [completedCount]
  )

  return {
    responses,
    setResponse,
    hasCompleted,
    setCompleted,
    activeQuestionIndex,
    setActiveQuestionIndex,
    resetInterview,
    isLoading,
    completedCount,
    isQuestionnaireComplete,
    sessionMeta,
    ensureSessionStarted,
    registerBoundary,
    finalizeSession,
    updateSessionTranscript,
    flushPendingSaves,
    restartOnboarding
  }
}
