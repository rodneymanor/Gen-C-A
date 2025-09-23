const RAPIDAPI_HOST = process.env.RAPIDAPI_YOUTUBE_HOST || 'youtube-transcribe-fastest-youtube-transcriber.p.rapidapi.com';
const RAPIDAPI_BASE_URL = `https://${RAPIDAPI_HOST}`;

class YouTubeTranscriptServiceError extends Error {
  constructor(message, statusCode = 500, debug) {
    super(message);
    this.name = 'YouTubeTranscriptServiceError';
    this.statusCode = statusCode;
    this.debug = debug;
  }
}

function normalizeUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    if (!url.hostname.includes('youtube.com') && !url.hostname.includes('youtu.be')) {
      throw new Error('Only YouTube URLs are supported');
    }
    return url.toString();
  } catch (error) {
    throw new YouTubeTranscriptServiceError(
      error instanceof Error ? error.message : 'Invalid YouTube URL',
      400,
    );
  }
}

class YouTubeTranscriptService {
  constructor({ apiKey } = {}) {
    this.apiKey = apiKey || process.env.RAPIDAPI_KEY || process.env.RapidAPI;
  }

  ensureCredentials() {
    if (!this.apiKey) {
      throw new YouTubeTranscriptServiceError('RAPIDAPI_KEY is not configured', 500);
    }
  }

  buildChunks(rawChunks) {
    if (!Array.isArray(rawChunks)) return [];
    return rawChunks
      .map((chunk) => {
        if (!chunk || typeof chunk !== 'object') return null;
        const text = typeof chunk.text === 'string' ? chunk.text : '';
        const [start, end] = Array.isArray(chunk.timestamp) ? chunk.timestamp : [];
        return {
          text,
          start: Number.isFinite(start) ? start : null,
          end: Number.isFinite(end) ? end : null,
        };
      })
      .filter(Boolean);
  }

  buildTranscriptResponse(sourceUrl, lang, payload) {
    const data = payload?.data;
    if (!data) {
      throw new YouTubeTranscriptServiceError('Transcript API returned an unexpected response', 502, payload);
    }

    const availableLanguages = Array.isArray(data.available_langs) ? data.available_langs : [];
    const chunks = this.buildChunks(data.chunks);

    if (!chunks.length) {
      throw new YouTubeTranscriptServiceError('Transcript not available for this video', 404, payload);
    }

    const fullText = chunks
      .map((chunk) => chunk.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      url: sourceUrl,
      language: lang,
      availableLanguages,
      chunks,
      text: fullText,
    };
  }

  async fetchTranscript({ url, lang = 'en' }) {
    this.ensureCredentials();
    const normalizedUrl = normalizeUrl(url);

    const requestUrl = new URL('/transcript', RAPIDAPI_BASE_URL);
    requestUrl.searchParams.set('url', normalizedUrl);
    if (lang) requestUrl.searchParams.set('lang', lang);

    const response = await fetch(requestUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': this.apiKey,
      },
    });

    const payload = await response.json().catch(async () => {
      const text = await response.text().catch(() => '');
      return { raw: text };
    });

    if (!response.ok) {
      const message =
        payload?.message || payload?.error || `Transcript API request failed with status ${response.status}`;
      throw new YouTubeTranscriptServiceError(message, response.status, payload);
    }

    return this.buildTranscriptResponse(normalizedUrl, lang, payload);
  }
}

const SERVICE_INSTANCE_KEY = '__youTubeTranscriptService__';

function getYouTubeTranscriptService() {
  if (!globalThis[SERVICE_INSTANCE_KEY]) {
    globalThis[SERVICE_INSTANCE_KEY] = new YouTubeTranscriptService();
  }
  return globalThis[SERVICE_INSTANCE_KEY];
}

export { YouTubeTranscriptService, YouTubeTranscriptServiceError, getYouTubeTranscriptService };
