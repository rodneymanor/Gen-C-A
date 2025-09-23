import type { VercelRequest, VercelResponse } from '@vercel/node';

function parseBody(req: VercelRequest) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      throw Object.assign(new Error('Request body must be valid JSON'), { statusCode: 400 });
    }
  }

  return req.body ?? {};
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method?.toUpperCase() !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const payload = parseBody(req);

  try {
    const { getYouTubeIdeaSeedsService, YouTubeIdeaSeedsServiceError } = await import(
      '../../src/services/scripts/youtube-idea-seeds-service.js'
    );

    const service = getYouTubeIdeaSeedsService();
    const result = await service.generateIdeaSeeds(payload);

    return res.status(200).json({ success: true, ...result });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error && 'message' in error) {
      const { statusCode, message, debug } = error as { statusCode?: number; message?: string; debug?: unknown };
      return res.status(statusCode ?? 500).json({
        success: false,
        error: message || 'Failed to generate idea seeds',
        ...(debug ? { debug } : {}),
      });
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate idea seeds',
    });
  }
}
