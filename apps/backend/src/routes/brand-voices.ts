import type { Request, Response } from 'express';
import { Router } from 'express';

import { getDb } from '../lib/firebase-admin.js';
import {
  BrandVoicesServiceError,
  getBrandVoicesService,
} from '../../../../src/services/brand-voices/brand-voices-service.js';

export const brandVoicesRouter = Router();

function resolveService(res: Response) {
  const db = getDb();
  if (!db) {
    res.status(503).json({ success: false, error: 'Brand voices unavailable. Firestore not initialized.' });
    return null;
  }

  try {
    return getBrandVoicesService(db);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[backend][brand-voices] failed to initialise service:', message);
    res.status(500).json({ success: false, error: 'Failed to initialise brand voices service.' });
    return null;
  }
}

function sendServiceError(res: Response, error: unknown, fallback: string) {
  if (error instanceof BrandVoicesServiceError) {
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error('[backend][brand-voices] unexpected error:', message);
  res.status(500).json({ success: false, error: fallback });
}

function requireInternalSecret(req: Request, res: Response) {
  const secret = req.headers['x-internal-secret'] || req.body?.secret;
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return false;
  }
  return true;
}

brandVoicesRouter.get('/list', async (_req: Request, res: Response) => {
  const service = resolveService(res);
  if (!service) return;

  try {
    const voices = await service.listBrandVoices();
    res.json({ success: true, voices });
  } catch (error) {
    sendServiceError(res, error, 'Failed to load brand voices');
  }
});

async function fetchTemplates(req: Request, res: Response) {
  const service = resolveService(res);
  if (!service) return;

  const source = (req.method.toUpperCase() === 'GET' ? req.query : req.body) as Record<string, unknown>;
  const creatorCandidate = source?.creatorId ?? source?.creator ?? source?.id;
  const brandVoiceCandidate = source?.brandVoiceId ?? source?.voiceId;

  try {
    const result = await service.getTemplates({
      creatorId: creatorCandidate !== undefined && creatorCandidate !== null ? String(creatorCandidate) : undefined,
      brandVoiceId:
        brandVoiceCandidate !== undefined && brandVoiceCandidate !== null
          ? String(brandVoiceCandidate)
          : undefined,
    });
    res.json({ success: true, ...result });
  } catch (error) {
    sendServiceError(res, error, 'Failed to load brand voice templates');
  }
}

brandVoicesRouter.get('/templates', fetchTemplates);
brandVoicesRouter.post('/templates', fetchTemplates);

brandVoicesRouter.post('/delete', async (req: Request, res: Response) => {
  if (!requireInternalSecret(req, res)) return;

  const service = resolveService(res);
  if (!service) return;

  const creatorSource = (req.body?.creatorId ?? req.query?.creatorId) as unknown;
  const brandSource =
    (req.body?.brandVoiceId ?? req.body?.voiceId ?? req.query?.brandVoiceId ?? req.query?.voiceId) as unknown;
  const creatorId = creatorSource !== undefined && creatorSource !== null ? String(creatorSource) : undefined;
  const brandVoiceId = brandSource !== undefined && brandSource !== null ? String(brandSource) : undefined;

  try {
    const deleted = await service.deleteBrandVoice({ creatorId, brandVoiceId });
    res.json({ success: true, deleted });
  } catch (error) {
    sendServiceError(res, error, 'Failed to delete brand voice');
  }
});

brandVoicesRouter.post('/update-meta', async (req: Request, res: Response) => {
  if (!requireInternalSecret(req, res)) return;

  const service = resolveService(res);
  if (!service) return;

  const {
    creatorId,
    displayName,
    isShared,
    isDefault,
    brandVoiceId,
    voiceId,
    templates,
    styleSignature,
    perTranscript,
    videoMeta,
  } = (req.body ?? {}) as Record<string, unknown>;

  const normalizedCreatorId = creatorId != null ? String(creatorId) : undefined;
  const normalizedBrandVoiceId = (brandVoiceId ?? voiceId) != null ? String(brandVoiceId ?? voiceId) : undefined;

  try {
    await service.updateBrandVoiceMeta({
      creatorId: normalizedCreatorId,
      brandVoiceId: normalizedBrandVoiceId,
      displayName,
      isShared,
      isDefault,
      templates,
      styleSignature,
      perTranscript,
      videoMeta,
    });
    res.json({ success: true });
  } catch (error) {
    sendServiceError(res, error, 'Failed to update brand voice meta');
  }
});
