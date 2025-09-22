import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../src/api-routes/utils/firebase-admin.js';
import {
  CreatorAnalysisServiceError,
  getCreatorAnalysisService,
} from '../../src/services/creator/creator-analysis-service.js';

export function resolveCreatorAnalysisService() {
  const db = getDb();
  return getCreatorAnalysisService(db || null);
}

export function sendCreatorAnalysisError(
  res: VercelResponse,
  error: unknown,
  fallbackMessage: string,
  logPrefix: string,
) {
  if (error instanceof CreatorAnalysisServiceError) {
    console.warn(logPrefix, error.message);
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }

  const details = error instanceof Error ? error.message : String(error);
  console.error(logPrefix, error);
  return res.status(500).json({ success: false, error: fallbackMessage, details });
}
