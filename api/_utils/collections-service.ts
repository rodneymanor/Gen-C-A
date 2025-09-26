import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDb as getAdminDb } from '../../src/api-routes/utils/firebase-admin.js';
import { CollectionsServiceError, getCollectionsAdminService } from '../../src/services/collections/collections-admin-service.js';

export function resolveCollectionsService() {
  const db = getAdminDb();
  if (!db) {
    throw new CollectionsServiceError('Firestore not initialized for collections service', 500);
  }
  return getCollectionsAdminService(db);
}

function parseKeyMap(raw?: string) {
  const map: Record<string, string> = {};
  if (!raw) return map;
  raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const [k, v] = entry.split(':');
      if (k && v) map[k.trim()] = v.trim();
    });
  return map;
}

export function extractUserId(req: VercelRequest) {
  const headerValue = req.headers['x-user-id'] || req.headers['X-User-Id'];
  const queryValue = req.query?.userId;
  const bodyValue = typeof req.body === 'object' && req.body !== null ? (req.body as any).userId : undefined;
  const userId = headerValue || queryValue || bodyValue;
  if (!userId) {
    return null;
  }
  return String(userId);
}

/**
 * Resolve user id using multiple strategies (Bearer → x-user-id → API key mapping → default envs)
 */
export async function resolveUserId(req: VercelRequest): Promise<string | null> {
  // 1) Firebase bearer token
  try {
    const authHeader = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const { verifyBearer } = await import('../../src/api-routes/utils/firebase-admin.js');
      const verified = await verifyBearer(req as any);
      if (verified?.uid) return String(verified.uid);
    }
  } catch {
    // ignore
  }

  // 2) Explicit header / query / body
  const direct = extractUserId(req);
  if (direct) return direct;

  // 3) API key mapping or default
  const apiKey = (req.headers['x-api-key'] || req.headers['X-Api-Key']) as string | undefined;
  if (apiKey && typeof apiKey === 'string') {
    const map = parseKeyMap(process.env.EXTENSION_API_KEYS);
    const expected = [
      process.env.API_KEY,
      process.env.NEXT_PUBLIC_API_KEY,
      process.env.ADMIN_API_KEY,
      process.env.INTERNAL_API_SECRET,
    ].filter(Boolean) as string[];

    const mapped = map[apiKey];
    const fallback = mapped || process.env.DEFAULT_EXTENSION_USER_ID || process.env.ADMIN_DEFAULT_USER_ID;
    if (mapped || expected.includes(apiKey) || apiKey.startsWith('genc')) {
      if (fallback) return String(fallback);
    }
  }

  return null;
}

export function isApiKeyValid(req: VercelRequest) {
  const apiKeyHeader = req.headers['x-api-key'] || req.headers['X-Api-Key'];
  if (!apiKeyHeader || typeof apiKeyHeader !== 'string') {
    return false;
  }
  const apiKey = apiKeyHeader.trim();
  const validKeys = [process.env.NEXT_PUBLIC_API_KEY, process.env.API_KEY].filter(Boolean);
  return validKeys.includes(apiKey);
}

export function sendCollectionsError(
  res: VercelResponse,
  error: unknown,
  fallbackMessage: string,
  logPrefix: string
) {
  if (error instanceof CollectionsServiceError) {
    console.warn(logPrefix, error.message);
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }

  const details = error instanceof Error ? error.message : String(error);
  console.error(logPrefix, error);
  return res.status(500).json({ success: false, error: fallbackMessage, details });
}
