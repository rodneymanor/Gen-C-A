import { getVoiceService, VoiceServiceError } from '../services/voice/voice-service.js';

/**
 * Simplified voice analysis route.
 * Lets you test arbitrary prompts with optional transcripts/context.
 *
 * POST /api/voice/analyze-patterns
 * Body:
 * {
 *   prompt?: string,                // custom prompt to send as-is
 *   transcripts?: string[],         // optional context to append
 *   systemPrompt?: string,          // optional system instruction
 *   model?: string,                 // default: "gemini-1.5-flash"
 *   temperature?: number,           // default: 0.2
 *   maxTokens?: number,             // default: 2048
 *   header?: string,                // optional header before transcripts
 *   responseType?: 'text' | 'json', // default: 'text'
 *   enableBatching?: boolean,       // default: false - enables batched processing
 *   batchSize?: number,             // default: 10 - number of transcripts per batch
 *   creator?: object                // optional creator info
 * }
 */
export async function handleVoiceAnalyzePatterns(req, res) {
  try {
    const service = getVoiceService();
    const {
      creator = {},
      ...options
    } = req.body || {};

    const result = await service.generate(options);

    return res.json({ success: true, creator, ...result });
  } catch (error) {
    if (error instanceof VoiceServiceError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error('Voice analyze (simplified) error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    });
  }
}
