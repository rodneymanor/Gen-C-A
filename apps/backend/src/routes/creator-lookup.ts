import type { Request, Response } from 'express';
import { Router } from 'express';

import { getDb } from '../lib/firebase-admin.js';
import { loadSharedModule } from '../services/shared-service-proxy.js';

type CreatorLookupError = Error & { statusCode: number };

const creatorLookupModule = loadSharedModule<any>(
  '../../../../src/services/creator/creator-lookup-service.js',
);
const CreatorLookupServiceError = creatorLookupModule?.CreatorLookupServiceError as
  | (new (message?: string, statusCode?: number) => CreatorLookupError)
  | undefined;
const getCreatorLookupService = creatorLookupModule?.getCreatorLookupService as
  | ((db: ReturnType<typeof getDb> | null) => any)
  | undefined;

const isCreatorLookupError = (error: unknown): error is CreatorLookupError =>
  typeof CreatorLookupServiceError === 'function' && error instanceof CreatorLookupServiceError;

export const creatorLookupRouter = Router();

function sendLookupError(res: Response, error: unknown, fallback: string) {
  if (isCreatorLookupError(error)) {
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error('[backend][creator-lookup] unexpected error:', message);
  res.status(500).json({ success: false, error: fallback });
}

async function handleAnalyzedVideoIds(req: Request, res: Response) {
  const db = getDb();
  if (!getCreatorLookupService) {
    res.status(503).json({ success: false, error: 'Creator lookup service unavailable' });
    return;
  }
  const service = getCreatorLookupService(db || null);
  const source = (req.method.toUpperCase() === 'GET' ? req.query : req.body) as Record<string, unknown>;
  const handle = source?.handle ?? source?.creator ?? source?.username;
  const creatorId = source?.creatorId ?? source?.id;

  try {
    const videoIds = await service.listAnalyzedVideoIds({
      handle: handle != null ? String(handle) : undefined,
      creatorId: creatorId != null ? String(creatorId) : undefined,
    });
    res.json({ success: true, videoIds });
  } catch (error) {
    sendLookupError(res, error, 'Failed to list analyzed videos');
  }
}

creatorLookupRouter.get('/analyzed-video-ids', handleAnalyzedVideoIds);
creatorLookupRouter.post('/analyzed-video-ids', handleAnalyzedVideoIds);
