import type { Request, Response } from 'express';
import { Router } from 'express';

import { getDb } from '../lib/firebase-admin.js';
import {
  CreatorAnalysisServiceError,
  getCreatorAnalysisService,
} from '../../../../src/services/creator/creator-analysis-service.js';

export const creatorRouter = Router();

function handleServiceError(res: Response, error: unknown, fallback: string) {
  if (error instanceof CreatorAnalysisServiceError) {
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }

  const message = error instanceof Error ? error.message : String(error);
  console.error('[backend][creator-analysis] unexpected error:', message);
  res.status(500).json({ success: false, error: fallback });
}

creatorRouter.post('/save-analysis', async (req: Request, res: Response) => {
  const db = getDb();
  const service = getCreatorAnalysisService(db || null);

  try {
    const result = await service.saveAnalysis((req.body ?? {}) as Record<string, unknown>);
    res.json({ success: true, ...result });
  } catch (error) {
    handleServiceError(res, error, 'Failed to save creator analysis');
  }
});
