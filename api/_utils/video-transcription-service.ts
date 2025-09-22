import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getVideoTranscriptionService,
  VideoTranscriptionServiceError,
} from '../../src/services/video/video-transcription-service.js';

export function resolveVideoTranscriptionService() {
  return getVideoTranscriptionService();
}

export function parseTranscriptionRequest(req: VercelRequest) {
  return (req.body || {}) as Record<string, unknown>;
}

export function sendTranscriptionError(
  res: VercelResponse,
  error: unknown,
  fallbackMessage: string,
  logPrefix: string,
) {
  if (error instanceof VideoTranscriptionServiceError) {
    console.warn(logPrefix, error.message);
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      ...(error.debug ? { debug: error.debug } : {}),
    });
  }

  const details = error instanceof Error ? error.message : String(error);
  console.error(logPrefix, error);
  return res.status(500).json({ success: false, error: fallbackMessage, details });
}
