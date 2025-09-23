import type { VercelRequest, VercelResponse } from '@vercel/node';

function safeJsonParse(payload: string | undefined | null) {
  if (!payload) return {};
  try {
    return JSON.parse(payload);
  } catch {
    return {};
  }
}

function extractUrlAndLang(req: VercelRequest) {
  const method = (req.method || 'GET').toUpperCase();

  if (method === 'GET') {
    const { url, lang } = req.query || {};
    return {
      url: Array.isArray(url) ? url[0] : url,
      lang: Array.isArray(lang) ? lang[0] : lang,
    };
  }

  const body = typeof req.body === 'string' ? safeJsonParse(req.body) : req.body || {};
  return {
    url: body?.url,
    lang: body?.lang,
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const method = (req.method || 'GET').toUpperCase();
  if (!['GET', 'POST'].includes(method)) {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' });
  }

  const { getYouTubeTranscriptService, YouTubeTranscriptServiceError } = await import(
    '../../src/services/video/youtube-transcript-service.js'
  );

  try {
    const { url, lang } = extractUrlAndLang(req);
    const service = getYouTubeTranscriptService();
    const transcript = await service.fetchTranscript({ url, lang });

    return res.status(200).json({ success: true, transcript });
  } catch (error) {
    if (error instanceof YouTubeTranscriptServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        ...(error.debug ? { debug: error.debug } : {}),
      });
    }

    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch YouTube transcript',
    });
  }
}
