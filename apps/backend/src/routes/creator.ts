import type { Request, Response } from 'express';
import { Router } from 'express';

import { getDb } from '../lib/firebase-admin.js';
import { loadSharedModule } from '../services/shared-service-proxy.js';

type CreatorAnalysisError = Error & { statusCode: number };

const creatorAnalysisModule = loadSharedModule<any>(
  '../../../../src/services/creator/creator-analysis-service.js',
);
const CreatorAnalysisServiceError = creatorAnalysisModule?.CreatorAnalysisServiceError as
  | (new (message?: string, statusCode?: number) => CreatorAnalysisError)
  | undefined;
const getCreatorAnalysisService = creatorAnalysisModule?.getCreatorAnalysisService as
  | ((db: ReturnType<typeof getDb> | null) => any)
  | undefined;

const isCreatorAnalysisError = (error: unknown): error is CreatorAnalysisError =>
  typeof CreatorAnalysisServiceError === 'function' && error instanceof CreatorAnalysisServiceError;

export const creatorRouter = Router();

function handleServiceError(res: Response, error: unknown, fallback: string) {
  if (isCreatorAnalysisError(error)) {
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error('[backend][creator-analysis] unexpected error:', message);
  res.status(500).json({ success: false, error: fallback });
}

creatorRouter.post('/save-analysis', async (req: Request, res: Response) => {
  const db = getDb();
  if (!getCreatorAnalysisService) {
    res.status(503).json({ success: false, error: 'Creator analysis service unavailable' });
    return;
  }
  const service = getCreatorAnalysisService(db || null);

  try {
    const result = await service.saveAnalysis((req.body ?? {}) as Record<string, unknown>);
    res.json({ success: true, ...result });
  } catch (error) {
    handleServiceError(res, error, 'Failed to save creator analysis');
  }
});
