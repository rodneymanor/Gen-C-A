import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getVideoOrchestratorService,
  VideoOrchestratorServiceError,
} from '../../src/services/video/video-orchestrator-service.js';

export function resolveVideoOrchestratorService() {
  return getVideoOrchestratorService();
}

export function parseOrchestratorRequest(req: VercelRequest) {
  return (req.body || {}) as Record<string, unknown>;
}

export function sendOrchestratorError(
  res: VercelResponse,
  error: unknown,
  fallbackMessage: string,
  logPrefix: string,
) {
  if (error instanceof VideoOrchestratorServiceError) {
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
