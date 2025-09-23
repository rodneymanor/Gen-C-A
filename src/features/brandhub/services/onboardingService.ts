import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { OnboardingRecord, OnboardingFormState } from '../types/brandHub'

const getOnboardingDocRef = (userId: string) => doc(db, 'users', userId, 'onboarding', 'current')

export const fetchOnboardingDocument = async (userId: string): Promise<OnboardingRecord | null> => {
  const snapshot = await getDoc(getOnboardingDocRef(userId))
  if (!snapshot.exists()) {
    return null
  }
  return snapshot.data() as OnboardingRecord
}

export const persistOnboardingResponses = async (
  userId: string,
  responses: OnboardingFormState,
  completed: boolean
): Promise<void> => {
  const basePayload = {
    responses,
    status: completed ? 'completed' : 'in-progress',
    updatedAt: serverTimestamp()
  }

  const onboardingPayload = completed
    ? { ...basePayload, completedAt: serverTimestamp() }
    : basePayload

  await setDoc(getOnboardingDocRef(userId), onboardingPayload, { merge: true })
}
