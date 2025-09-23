import { NextResponse } from 'next/server';

import { verifyBearer } from '@/api-routes/utils/firebase-admin.js';

interface AuthenticatedUser {
  user: {
    uid: string;
    email: string | null;
  };
  token: unknown;
}

export async function authenticateWithFirebaseToken(
  token: string,
): Promise<AuthenticatedUser | NextResponse> {
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized - No token provided' }, { status: 401 });
  }

  const result = await verifyBearer({ headers: { authorization: `Bearer ${token}` } });
  if (!result || typeof result.uid !== 'string') {
    return NextResponse.json({ error: 'Unauthorized - Invalid token' }, { status: 401 });
  }

  const email =
    typeof result.token === 'object' && result.token !== null && 'email' in result.token
      ? ((result.token as Record<string, unknown>).email as string | undefined) ?? null
      : null;

  return {
    user: {
      uid: result.uid,
      email,
    },
    token: result.token,
  };
}
