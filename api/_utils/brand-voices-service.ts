import type { VercelResponse } from '@vercel/node';
import { getDb } from '../../src/api-routes/utils/firebase-admin.js';
import {
  BrandVoicesServiceError,
  getBrandVoicesService,
} from '../../src/services/brand-voices/brand-voices-service.js';

export function resolveBrandVoicesService(res: VercelResponse) {
  const db = getDb();
  if (!db) {
    res
      .status(503)
      .json({ success: false, error: 'Brand voices unavailable. Firestore not initialized.' });
    return null;
  }

  try {
    return getBrandVoicesService(db);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[api/brand-voices] failed to initialise service:', message);
    res.status(500).json({ success: false, error: 'Failed to initialise brand voices service.' });
    return null;
  }
}

export function sendBrandVoicesError(
  res: VercelResponse,
  error: unknown,
  fallbackMessage: string,
  logPrefix: string,
) {
  if (error instanceof BrandVoicesServiceError) {
    console.warn(logPrefix, error.message);
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }

  const details = error instanceof Error ? error.message : String(error);
  console.error(logPrefix, error);
  return res.status(500).json({ success: false, error: fallbackMessage, details });
}
