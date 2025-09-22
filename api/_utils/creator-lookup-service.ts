import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../src/api-routes/utils/firebase-admin.js';
import {
  CreatorLookupServiceError,
  getCreatorLookupService,
} from '../../src/services/creator/creator-lookup-service.js';

export function resolveCreatorLookupService() {
  const db = getDb();
  return getCreatorLookupService(db || null);
}

export function sendCreatorLookupError(
  res: VercelResponse,
  error: unknown,
  fallbackMessage: string,
  logPrefix: string,
) {
  if (error instanceof CreatorLookupServiceError) {
    console.warn(logPrefix, error.message);
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }

  const details = error instanceof Error ? error.message : String(error);
  console.error(logPrefix, error);
  return res.status(500).json({ success: false, error: fallbackMessage, details });
}
