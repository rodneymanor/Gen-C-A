import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleAIFileManager } from '@google/generative-ai/server';

const MAX_DOWNLOAD_SIZE = (() => {
  const env = Number(process.env.VIDEO_TRANSCRIBE_MAX_BYTES);
  return Number.isFinite(env) && env > 0 ? env : 80 * 1024 * 1024; // default 80MB
})();

const GEMINI_SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

const GEMINI_MODEL = 'gemini-1.5-flash';
const DEFAULT_VIDEO_MIME = 'video/mp4';
const GEMINI_FILE_POLL_INTERVAL_MS = 1000;
const GEMINI_FILE_MAX_POLL_ATTEMPTS = 10;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout(promise, timeoutMs, operation) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Operation '${operation}' timed out after ${timeoutMs / 1000} seconds`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

class VideoTranscriptionServiceError extends Error {
  constructor(message, statusCode = 500, debug) {
    super(message);
    this.name = 'VideoTranscriptionServiceError';
    this.statusCode = statusCode;
    this.debug = debug;
  }
}

class VideoTranscriptionService {
  constructor() {
    this.fileManager = null;
    this.gemini = null;
  }

  ensureGemini(apiKey) {
    if (!apiKey) {
      throw new VideoTranscriptionServiceError('GEMINI_API_KEY not configured', 500);
    }
    if (!this.gemini) {
      this.gemini = new GoogleGenerativeAI(apiKey).getGenerativeModel({
        model: GEMINI_MODEL,
        safetySettings: GEMINI_SAFETY_SETTINGS,
      });
    }
    if (!this.fileManager) {
      this.fileManager = new GoogleAIFileManager(apiKey);
    }
  }

  buildCookieHeader(input) {
    if (!input) return undefined;
    if (typeof input === 'string') return input.trim() || undefined;
    if (Array.isArray(input)) {
      const parts = input.map((c) => (c && c.name ? `${c.name}=${c.value ?? ''}` : '')).filter(Boolean);
      return parts.length ? parts.join('; ') : undefined;
    }
    if (typeof input === 'object') {
      const parts = Object.entries(input)
        .filter(([k]) => !!k)
        .map(([k, v]) => `${k}=${v ?? ''}`);
      return parts.length ? parts.join('; ') : undefined;
    }
    return undefined;
  }

  async downloadVideo(url, cookieHeader) {
    const parsed = new URL(url);
    const isTikTok = parsed.hostname.includes('tiktok');
    const isInstagram =
      parsed.hostname.includes('instagram.com') || parsed.hostname.includes('cdninstagram.com');

    const baseHeaders = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0 Safari/537.36',
      Accept: 'video/mp4,video/*;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      Connection: 'keep-alive',
    };
    if (isTikTok) {
      baseHeaders['Referer'] = 'https://www.tiktok.com/';
      baseHeaders['Origin'] = 'https://www.tiktok.com';
    }
    if (isInstagram) {
      baseHeaders['Referer'] = 'https://www.instagram.com/';
      baseHeaders['Origin'] = 'https://www.instagram.com';
    }
    if (cookieHeader) baseHeaders['Cookie'] = cookieHeader;

    const cookieNames = cookieHeader
      ? String(cookieHeader)
          .split(/;\s*/)
          .map((p) => p.split('=')[0])
          .filter(Boolean)
      : [];

    const MAX_ATTEMPTS = 4;
    let lastError = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const headers = { ...baseHeaders };
      const backoffMs = Math.min(4000, 500 * Math.pow(2, attempt - 1)) + Math.floor(Math.random() * 250);
      try {
        try {
          const headRes = await fetch(url, { method: 'HEAD', headers, redirect: 'follow', cache: 'no-store' });
          if (!headRes.ok) {
            console.warn(`⚠️ [DOWNLOAD] Attempt ${attempt} HEAD ${headRes.status} ${headRes.statusText}`);
          }
          const lengthHeader = headRes.headers.get('content-length');
          const contentLength = Number(lengthHeader);
          if (Number.isFinite(contentLength) && contentLength > MAX_DOWNLOAD_SIZE) {
            throw new VideoTranscriptionServiceError(
              `Video file too large: ${contentLength} bytes (max ${MAX_DOWNLOAD_SIZE})`,
              400,
              { headersUsed: Object.keys(headers), cookieNames, status: headRes.status },
            );
          }
        } catch (headError) {
          console.warn(`⚠️ [DOWNLOAD] Attempt ${attempt} HEAD error:`, headError?.message || headError);
        }

        const response = await fetch(url, { headers, redirect: 'follow', cache: 'no-store' });
        if (!response.ok) {
          const text = await response.text().catch(() => '');
          lastError = `GET failed: ${response.status} ${response.statusText}`;
          console.warn(`⚠️ [DOWNLOAD] Attempt ${attempt} ${lastError}. Snippet:`, text.slice(0, 180));
        } else {
          const buffer = await response.arrayBuffer();
          const mimeType = response.headers.get('content-type') || DEFAULT_VIDEO_MIME;
          console.log(`✅ Video downloaded (attempt ${attempt}): ${buffer.byteLength} bytes`);
          if (buffer.byteLength > MAX_DOWNLOAD_SIZE) {
            throw new VideoTranscriptionServiceError(
              `Video file too large: ${buffer.byteLength} bytes (max ${MAX_DOWNLOAD_SIZE})`,
              400,
              { headersUsed: Object.keys(headers), cookieNames, status: response.status },
            );
          }
          return { buffer, mimeType, headersUsed: Object.keys(headers), cookieNames };
        }
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        if (err instanceof VideoTranscriptionServiceError) {
          throw err;
        }
        console.warn(`⚠️ [DOWNLOAD] Attempt ${attempt} error:`, lastError);
      }

      if (attempt < MAX_ATTEMPTS) {
        console.log(`⏳ [DOWNLOAD] Retrying in ${backoffMs}ms...`);
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
      }
    }

    throw new VideoTranscriptionServiceError(lastError || 'Failed to download video', 400, {
      headersUsed: Object.keys(baseHeaders),
      cookieNames,
    });
  }

  async generateTranscriptFromBuffer(buffer, mimeType, requestId) {
    const apiKey = process.env.GEMINI_API_KEY;
    this.ensureGemini(apiKey);

    const effectiveMimeType = mimeType || DEFAULT_VIDEO_MIME;
    const genAI = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: GEMINI_MODEL,
      safetySettings: GEMINI_SAFETY_SETTINGS,
    });
    const fileManager = new GoogleAIFileManager(apiKey);

    const displayName = `transcription-${requestId}-${Date.now()}`;
    const uploadResponse = await fileManager.uploadFile(Buffer.from(buffer), {
      mimeType: effectiveMimeType,
      displayName,
    });

    const uploadedFile = uploadResponse?.file;
    if (!uploadedFile?.name) {
      throw new Error('Gemini upload did not return a file reference');
    }

    const readyFile = await this.waitForGeminiFileReady(fileManager, uploadedFile, requestId);

    const prompt =
      'Transcribe every spoken word from this video. Return ONLY the verbatim transcript with no additional commentary.';

    try {
      const result = await withTimeout(
        genAI.generateContent([
          { text: prompt },
          {
            fileData: {
              fileUri: readyFile.uri,
              mimeType: readyFile.mimeType || effectiveMimeType,
            },
          },
        ]),
        120000,
        `Gemini transcription ${requestId}`,
      );

      const transcript = result.response.text().trim();
      if (!transcript) {
        throw new Error('Gemini returned an empty transcript');
      }

      return transcript;
    } finally {
      await fileManager.deleteFile(readyFile.name).catch((error) => {
        console.warn(`⚠️ [${requestId}] Failed to delete Gemini file ${readyFile.name}:`, error?.message || error);
      });
    }
  }

  async waitForGeminiFileReady(fileManager, file, requestId) {
    let current = file;
    for (let attempt = 0; attempt < GEMINI_FILE_MAX_POLL_ATTEMPTS; attempt++) {
      const state = current?.state;
      if (state === 'ACTIVE' && current?.uri) {
        return current;
      }

      if (state === 'FAILED' || current?.error) {
        const message = current?.error?.message || 'Gemini reported the upload failed';
        throw new Error(`Gemini upload failed for ${requestId}: ${message}`);
      }

      await sleep(GEMINI_FILE_POLL_INTERVAL_MS * Math.max(1, attempt + 1));
      current = await fileManager.getFile(current?.name || file?.name);
    }

    throw new Error(`Gemini upload did not become ready in time for ${requestId}`);
  }

  async analyzeTranscriptComponents(transcript, requestId) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `Analyze the following transcript and return JSON with keys hook, bridge, nugget, wta. Each field should contain a concise string summarizing that element. Transcript:\n${transcript}`;

    const analysis = await withTimeout(
      model.generateContent([{ text: prompt }]),
      60000,
      `Gemini component analysis ${requestId}`,
    );

    const text = analysis.response.text();
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)```/);
      const payload = JSON.parse(jsonMatch ? jsonMatch[1] : text);
      return {
        hook: String(payload.hook ?? ''),
        bridge: String(payload.bridge ?? ''),
        nugget: String(payload.nugget ?? ''),
        wta: String(payload.wta ?? ''),
      };
    } catch (error) {
      console.warn(`⚠️ [${requestId}] Failed to parse component JSON, returning empty components`, text);
      return { hook: '', bridge: '', nugget: '', wta: '' };
    }
  }

  async transcribeVideo(buffer, mimeType, requestId, sourceUrl) {
    const transcript = await this.generateTranscriptFromBuffer(buffer, mimeType, requestId);
    const components = await this.analyzeTranscriptComponents(transcript, requestId);

    return {
      transcript,
      components,
      contentMetadata: {
        platform: sourceUrl && sourceUrl.includes('instagram') ? 'instagram' : 'tiktok',
        author: 'Unknown',
        description: 'Video transcribed successfully',
        hashtags: [],
      },
      visualContext: '',
    };
  }

  async transcribeFromUrl({ videoUrl, cookies }) {
    const requestId = Math.random().toString(36).substring(7);
    const cookieHeader = this.buildCookieHeader(cookies);

    if (!videoUrl) {
      throw new VideoTranscriptionServiceError('Video URL is required', 400);
    }

    this.ensureGemini(process.env.GEMINI_API_KEY);

    const downloadInfo = await this.downloadVideo(videoUrl, cookieHeader);
    const nodeBuffer = Buffer.from(downloadInfo.buffer);
    const mimeType = downloadInfo.mimeType || DEFAULT_VIDEO_MIME;

    const transcription = await this.transcribeVideo(nodeBuffer, mimeType, requestId, videoUrl);

    const transcript = transcription.transcript;
    const wordCount = transcript ? transcript.trim().split(/\s+/).length : 0;
    const characterCount = transcript ? transcript.length : 0;

    return {
      success: true,
      transcript,
      wordCount,
      characterCount,
      components: transcription.components,
      contentMetadata: transcription.contentMetadata,
      visualContext: transcription.visualContext,
      videoUrl,
      requestId,
      headersUsed: downloadInfo.headersUsed,
      cookieNames: downloadInfo.cookieNames,
    };
  }
}

const SERVICE_INSTANCE_KEY = '__videoTranscriptionService__';

function getVideoTranscriptionService() {
  if (!globalThis[SERVICE_INSTANCE_KEY]) {
    globalThis[SERVICE_INSTANCE_KEY] = new VideoTranscriptionService();
  }
  return globalThis[SERVICE_INSTANCE_KEY];
}

export { VideoTranscriptionService, VideoTranscriptionServiceError, getVideoTranscriptionService };
