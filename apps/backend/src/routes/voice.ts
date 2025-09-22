import type { Request, Response } from 'express';
import { Router } from 'express';

import { getVoiceService, VoiceServiceError } from '../../../../src/services/voice/voice-service.js';

function handleVoiceError(res: Response, error: unknown) {
  if (error instanceof VoiceServiceError) {
    res.status(error.statusCode).json({ success: false, error: error.message });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  console.error('[backend][voice] unexpected error:', message);
  res.status(500).json({ success: false, error: 'Failed to analyze voice patterns' });
}

export const voiceRouter = Router();

voiceRouter.post('/analyze-patterns', async (req: Request, res: Response) => {
  try {
    const { creator = {}, ...options } = (req.body ?? {}) as Record<string, unknown>;
    const service = getVoiceService();
    const result = await service.generate(options);
    res.json({ success: true, creator, ...result });
  } catch (error) {
    handleVoiceError(res, error);
  }
});
