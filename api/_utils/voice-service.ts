import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getVoiceService, VoiceServiceError } from '../../src/services/voice/voice-service.js';

export function resolveVoiceService() {
  return getVoiceService();
}

export function parseVoiceRequest(req: VercelRequest) {
  return (req.body || {}) as Record<string, unknown>;
}

export function sendVoiceError(
  res: VercelResponse,
  error: unknown,
  fallbackMessage: string,
  logPrefix: string
) {
  if (error instanceof VoiceServiceError) {
    console.warn(logPrefix, error.message);
    return res.status(error.statusCode).json({ success: false, error: error.message });
  }

  const details = error instanceof Error ? error.message : String(error);
  console.error(logPrefix, error);
  return res.status(500).json({ success: false, error: fallbackMessage, details });
}
