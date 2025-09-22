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
