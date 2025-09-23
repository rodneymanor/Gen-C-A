import {
  getYouTubeTranscriptService,
  YouTubeTranscriptServiceError,
} from '../../services/video/youtube-transcript-service.js';

function extractUrlAndLang(req) {
  if (req.method === 'GET') {
    const { url, lang } = req.query || {};
    return {
      url: Array.isArray(url) ? url[0] : url,
      lang: Array.isArray(lang) ? lang[0] : lang,
    };
  }

  const body = req.body || {};
  return {
    url: body.url,
    lang: body.lang,
  };
}

export async function handleYouTubeTranscript(req, res) {
  try {
    const { url, lang } = extractUrlAndLang(req);
    const service = getYouTubeTranscriptService();
    const result = await service.fetchTranscript({ url, lang });

    return res.status(200).json({ success: true, transcript: result });
  } catch (error) {
    if (error instanceof YouTubeTranscriptServiceError) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
        ...(error.debug ? { debug: error.debug } : {}),
      });
    }

    console.error('[video/youtube-transcript] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch YouTube transcript',
      details: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
}
