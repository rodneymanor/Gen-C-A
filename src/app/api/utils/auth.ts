import type { NextRequest } from 'next/server';

import { verifyBearer } from '@/api-routes/utils/firebase-admin.js';

function buildHeaderMap(request: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });
  if (headers.authorization && !headers.Authorization) {
    headers.Authorization = headers.authorization;
  }
  return headers;
}

export interface VerifiedAuth {
  uid: string;
  token: unknown;
}

export async function verifyRequestAuth(request: NextRequest): Promise<VerifiedAuth | null> {
  const headers = buildHeaderMap(request);
  const result = await verifyBearer({ headers } as { headers: Record<string, string> });
  if (result && typeof result.uid === 'string') {
    return result as VerifiedAuth;
  }
  return null;
}

export { buildHeaderMap };
