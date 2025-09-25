import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { OnboardingRecord, OnboardingFormState, OnboardingSessionMeta } from '../types/brandHub'

const getOnboardingDocRef = (userId: string) => doc(db, 'users', userId, 'onboarding', 'current')

export const fetchOnboardingDocument = async (userId: string): Promise<OnboardingRecord | null> => {
  const snapshot = await getDoc(getOnboardingDocRef(userId))
  if (!snapshot.exists()) {
    return null
  }
  return snapshot.data() as OnboardingRecord
}

const sanitizeResponses = (input: OnboardingFormState): OnboardingFormState => {
  return Object.entries(input).reduce<OnboardingFormState>((acc, [key, value]) => {
    acc[key as keyof OnboardingFormState] = typeof value === 'string' ? value : ''
    return acc
  }, {} as OnboardingFormState)
}

const sanitizeSessionMeta = (meta: OnboardingSessionMeta | undefined) => {
  if (!meta) return undefined

  const boundaries = Array.isArray(meta.boundaries)
    ? meta.boundaries.map((boundary) => ({
        questionId: boundary.questionId,
        questionIndex: boundary.questionIndex ?? 0,
        elapsedSeconds: boundary.elapsedSeconds ?? 0,
        timestamp: boundary.timestamp ?? Date.now(),
        type: boundary.type
      }))
    : []

  return {
    startedAt: meta.startedAt ?? null,
    stoppedAt: meta.stoppedAt ?? null,
    status: meta.status ?? 'idle',
    boundaries,
    transcript: meta.transcript ?? ''
  }
}

export const persistOnboardingResponses = async (
  userId: string,
  responses: OnboardingFormState,
  completed: boolean,
  sessionMeta?: OnboardingSessionMeta
): Promise<void> => {
  const normalizedResponses = sanitizeResponses(responses)
  const normalizedSessionMeta = sanitizeSessionMeta(sessionMeta)

  const basePayload = {
    responses: normalizedResponses,
    status: completed ? 'completed' : 'in-progress',
    updatedAt: serverTimestamp()
  }

  const onboardingPayload = completed
    ? { ...basePayload, completedAt: serverTimestamp() }
    : basePayload

  const payloadWithMeta = normalizedSessionMeta
    ? {
        ...onboardingPayload,
        sessionMeta: normalizedSessionMeta
      }
    : onboardingPayload

  await setDoc(getOnboardingDocRef(userId), payloadWithMeta, { merge: true })
}
