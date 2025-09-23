import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createEmptyOnboardingResponses, onboardingPrompts } from '../constants/onboarding'
import { persistOnboardingResponses, fetchOnboardingDocument } from '../services/onboardingService'
import { OnboardingFormState } from '../types/brandHub'

const SAVE_DEBOUNCE_MS = 1000

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
}

export const useBrandHubOnboarding = (
  { userId }: UseBrandHubOnboardingArgs
): UseBrandHubOnboardingResult => {
  const [responses, setResponses] = useState<OnboardingFormState>(createEmptyOnboardingResponses)
  const [hasCompleted, setHasCompleted] = useState(false)
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const saveTimerRef = useRef<number | null>(null)
  const latestResponsesRef = useRef(responses)
  const latestCompletionRef = useRef(hasCompleted)
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
  }, [])

  useEffect(() => {
    latestResponsesRef.current = responses
  }, [responses])

  useEffect(() => {
    latestCompletionRef.current = hasCompleted
  }, [hasCompleted])

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
      void persistOnboardingResponses(userId, latestResponsesRef.current, latestCompletionRef.current)
      return
    }

    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current)
    }

    saveTimerRef.current = window.setTimeout(() => {
      void persistOnboardingResponses(
        userId,
        latestResponsesRef.current,
        latestCompletionRef.current
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
  }, [responses, hasCompleted, enqueueSave])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) {
        if (typeof window !== 'undefined') {
          window.clearTimeout(saveTimerRef.current)
        }
        saveTimerRef.current = null
      }
      if (userId) {
        void persistOnboardingResponses(userId, latestResponsesRef.current, latestCompletionRef.current)
      }
    }
  }, [userId])

  const setResponse = useCallback((id: keyof OnboardingFormState, value: string) => {
    setResponses((prev) => ({ ...prev, [id]: value }))
  }, [])

  const setCompleted = useCallback((state: boolean) => {
    setHasCompleted(state)
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
    isQuestionnaireComplete
  }
}
