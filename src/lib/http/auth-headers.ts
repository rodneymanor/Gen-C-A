import { auth } from '@/config/firebase';

export async function buildAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  const currentUser = auth.currentUser;
  if (!currentUser) {
    return headers;
  }

  try {
    const token = await currentUser.getIdToken(true);
    headers.Authorization = `Bearer ${token}`;
  } catch (error) {
    console.warn('[auth-headers] Failed to retrieve ID token', error);
  }

  return headers;
}
