import type { Request, Response } from 'express';
import { Router } from 'express';

import { loadSharedModule } from '../services/shared-service-proxy.js';

const voiceModule = loadSharedModule<any>(
  '../../../../src/services/voice/voice-service.js',
);
const getVoiceService = voiceModule?.getVoiceService as (() => any) | undefined;
const VoiceServiceError = voiceModule?.VoiceServiceError as
  | (new (message?: string, statusCode?: number) => Error & { statusCode: number })
  | undefined;
import { registerAllMethods } from './utils/register-all-methods';

function handleVoiceError(res: Response, error: unknown) {
  if (VoiceServiceError && error instanceof VoiceServiceError) {
    const err = error as any;
    res.status(err.statusCode).json({ success: false, error: err.message });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  console.error('[backend][voice] unexpected error:', message);
  res.status(500).json({ success: false, error: 'Failed to analyze voice patterns' });
}

export const voiceRouter = Router();

async function analyzePatterns(req: Request, res: Response) {
  try {
    const source = (req.method.toUpperCase() === 'GET' ? req.query : req.body) ?? {};
    const { creator = {}, ...options } = source as Record<string, unknown>;
    if (!getVoiceService) {
      throw new Error('Voice service unavailable');
    }
    const service = getVoiceService();
    const result = await service.generate(options);
    res.json({ success: true, creator, ...result });
  } catch (error) {
    handleVoiceError(res, error);
  }
}

registerAllMethods(voiceRouter, '/analyze-patterns', analyzePatterns);
