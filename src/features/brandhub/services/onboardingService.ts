import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { OnboardingDocument, OnboardingFormState } from '../types/brandHub'

const getOnboardingDocRef = (userId: string) => doc(db, 'users', userId)

export const fetchOnboardingDocument = async (userId: string): Promise<OnboardingDocument | null> => {
  const snapshot = await getDoc(getOnboardingDocRef(userId))
  if (!snapshot.exists()) {
    return null
  }
  return snapshot.data() as OnboardingDocument
}

export const persistOnboardingResponses = async (
  userId: string,
  responses: OnboardingFormState,
  completed: boolean
): Promise<void> => {
  const onboardingPayload = {
    responses,
    status: completed ? 'completed' : 'in-progress',
    updatedAt: serverTimestamp()
  }

  const dataToWrite = {
    onboarding: completed
      ? { ...onboardingPayload, completedAt: serverTimestamp() }
      : onboardingPayload
  }

  await setDoc(getOnboardingDocRef(userId), dataToWrite, { merge: true })
}
