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
    setResponses(createEmptyOnboardingResponses())
    setHasCompleted(false)
    setActiveQuestionIndex(0)
    setIsLoading(false)
    setSessionMeta(createInitialSessionMeta())
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
          setResponses((prev) => ({ ...prev, ...record.responses }))
        }

        if (record.status === 'completed') {
          setHasCompleted(true)
        }

        if (record.sessionMeta) {
          setSessionMeta({
            startedAt: record.sessionMeta.startedAt ?? null,
            stoppedAt: record.sessionMeta.stoppedAt ?? null,
            status: record.sessionMeta.status ?? 'idle',
            boundaries: record.sessionMeta.boundaries ?? [],
            transcript: record.sessionMeta.transcript ?? ''
          })
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
        void persistOnboardingResponses(
          userId,
          latestResponsesRef.current,
          latestCompletionRef.current,
          latestSessionMetaRef.current
        )
      }
    }
  }, [userId])

  const setResponse = useCallback((id: keyof OnboardingFormState, value: string) => {
    setResponses((prev) => ({ ...prev, [id]: value }))
  }, [])

  const setCompleted = useCallback((state: boolean) => {
    setHasCompleted(state)
  }, [])

  const ensureSessionStarted = useCallback(() => {
    setSessionMeta((prev) => {
      if (prev.startedAt) {
        return prev.status === 'idle' ? { ...prev, status: 'in-progress' } : prev
      }
      return {
        ...prev,
        startedAt: Date.now(),
        status: 'in-progress'
      }
    })
  }, [])

  const registerBoundary = useCallback((boundary: OnboardingSessionBoundary) => {
    setSessionMeta((prev) => ({
      ...prev,
      boundaries: [...prev.boundaries, boundary]
    }))
  }, [])

  const finalizeSession = useCallback(
    (status: OnboardingSessionStatus) => {
      setSessionMeta((prev) => ({
        ...prev,
        status,
        stoppedAt: Date.now(),
        startedAt: prev.startedAt ?? Date.now()
      }))
    },
  [])

  const updateSessionTranscript = useCallback((transcript: string) => {
    setSessionMeta((prev) => ({
      ...prev,
      transcript
    }))
  }, [])

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
    updateSessionTranscript
  }
}
