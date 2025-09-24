import { GoogleGenerativeAI } from '@google/generative-ai';

const DEFAULT_MODEL = 'gemini-1.5-pro';
const MAX_TRANSCRIPT_LENGTH = 40_000; // characters safeguard
const DEFAULT_MIN_OVERALL = 70;
const DEFAULT_MAX_IDEAS = 12;
const DEFAULT_AUDIENCE_LEVEL = 'intermediate';
const VALID_ANGLES = new Set(['question', 'contrarian', 'stat_shock', 'mistake', 'myth', 'story']);
const VALID_PROOF_TYPES = new Set(['stat', 'example', 'quote', 'demo']);
const VALID_CTA_TYPES = new Set(['comment', 'watch_full', 'subscribe', 'download', 'signup', 'follow', 'buy']);
const VALID_AUDIENCE_LEVELS = new Set(['beginner', 'intermediate', 'advanced']);

const SAFETY_SETTINGS = [
  { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
  { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
];

class YouTubeIdeaSeedsServiceError extends Error {
  constructor(message, statusCode = 500, debug) {
    super(message);
    this.name = 'YouTubeIdeaSeedsServiceError';
    this.statusCode = statusCode;
    this.debug = debug;
  }
}

function sanitizeAudienceLevel(level) {
  if (typeof level === 'string' && VALID_AUDIENCE_LEVELS.has(level)) {
    return level;
  }
  return DEFAULT_AUDIENCE_LEVEL;
}

function clampNumber(value, fallback, { min, max }) {
  const num = Number(value);
  if (Number.isFinite(num)) {
    if (typeof min === 'number' && num < min) return min;
    if (typeof max === 'number' && num > max) return max;
    return num;
  }
  return fallback;
}

function buildSystemInstruction({ minOverall, maxIdeas }) {
  return `You are an expert content analyst. Your task is to read a YouTube transcript and extract as many HIGH-QUALITY short-form video idea seeds as possible, each containing only the fields required to later generate a Hook, Bridge, Golden Nugget, and CTA.

**Rules**
- Base every field strictly on the transcript. Do not invent facts, names, or numbers.
- Time-bound each idea to the span in the transcript where it’s supported. Use {startSec,endSec} in seconds.
- Prefer ideas that contain a concrete claim, clear payoff, and at least one piece of supporting proof (stat, example, quote, or mini-demo).
- Deduplicate: if two ideas express the same core claim, keep the clearest/specific one only.
- Keep each idea usable for a 60-second short (≤ ~160 words when later scripted).
- Output must be valid JSON (UTF-8), with no commentary or markdown.

**Quality filter**
Score each candidate on: hookPotential, specificity, actionability, novelty (0–1 each). Compute overall = round(100*(0.35*hookPotential + 0.25*specificity + 0.25*actionability + 0.15*novelty)).
Only include ideas with overall ≥ ${minOverall}. Then return the top ${maxIdeas} by overall.

**IdeaSeed shape (REQUIRED)**
Return an array of objects with exactly these keys:

{
  "coreClaim": string,
  "payoff": string,
  "proof": { "type": "stat"|"example"|"quote"|"demo", "text": string, "numbers"?: string },
  "mechanismOrSteps"?: string[],

  "angle": "question"|"contrarian"|"stat_shock"|"mistake"|"myth"|"story",
  "painPoint"?: string,
  "reasonToBelieve"?: string,

  "context"?: string,
  "promise"?: string,

  "cta": { "type": "comment"|"watch_full"|"subscribe"|"download"|"signup"|"follow"|"buy",
           "prompt": string, "target"?: string | { "videoTs": number } },

  "entities"?: string[],
  "audienceLevel"?: "beginner"|"intermediate"|"advanced",

  "provenance": { "startSec": number, "endSec": number },

  "scores": { "hookPotential": number, "specificity": number, "actionability": number, "novelty": number, "overall": number }
}

**Extraction steps (follow, but do not output)**
1) Scan the transcript for candidate spans with any of: a surprising claim, a number, a step list, a caution/warning, a myth-bust, a side-by-side comparison, or a concrete example.
2) Merge adjacent lines only if they form one coherent, actionable nugget (target span length: ~20–120 sec).
3) For each span, distill:
   - coreClaim (plain English, no hedging),
   - payoff (practical benefit),
   - proof (pick the single strongest support from the span; quote or paraphrase faithfully),
   - mechanismOrSteps (max 3 bullets).
4) Choose a hook angle that best fits the span (question/contrarian/stat_shock/mistake/myth/story).
5) Create a CTA that matches the content (e.g., comment for opinions; watch_full with a timestamp for deep dives).
6) Score, deduplicate, threshold (overall ≥ ${minOverall}), then return top ${maxIdeas}.

**Output**
Return ONLY a JSON array of IdeaSeed objects. No prose.`;
}

function buildTranscriptText({ transcript, chunks }) {
  if (Array.isArray(chunks) && chunks.length > 0) {
    return chunks
      .map((chunk, index) => {
        if (!chunk || typeof chunk !== 'object') return null;
        const text = typeof chunk.text === 'string' ? chunk.text.trim() : '';
        if (!text) return null;
        const start = Number.isFinite(chunk.start) ? chunk.start : Number.isFinite(chunk.timestamp?.[0]) ? chunk.timestamp[0] : null;
        const end = Number.isFinite(chunk.end) ? chunk.end : Number.isFinite(chunk.timestamp?.[1]) ? chunk.timestamp[1] : null;
        const prefixParts = [];
        if (Number.isFinite(start)) prefixParts.push(start.toFixed(3));
        if (Number.isFinite(end)) prefixParts.push(end.toFixed(3));
        const prefix = prefixParts.length ? `[${prefixParts.join('-')}]` : `[#${index + 1}]`;
        return `${prefix} ${text}`;
      })
      .filter(Boolean)
      .join('\n');
  }

  if (typeof transcript === 'string' && transcript.trim()) {
    return transcript.trim();
  }

  throw new YouTubeIdeaSeedsServiceError('Transcript text or chunks are required', 400);
}

function buildUserPrompt({ lang, videoId, transcriptText, maxIdeas, minOverall, audienceLevel }) {
  return `Transcript (language=${lang}, videoId=${videoId || 'unknown'}):\n${transcriptText}\n\nParameters:\nmax_ideas=${maxIdeas}\nmin_overall=${minOverall}\naudienceLevel=${audienceLevel}`;
}

function isScore(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 1;
}

function isOverall(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= 100;
}

function validateIdeaSeed(seed, index) {
  const errors = [];
  const path = `ideas[${index}]`;

  if (!seed || typeof seed !== 'object' || Array.isArray(seed)) {
    errors.push({ path, message: 'Idea must be an object' });
    return errors;
  }

  const requireString = (key) => {
    if (typeof seed[key] !== 'string' || !seed[key].trim()) {
      errors.push({ path: `${path}.${key}`, message: 'Must be a non-empty string' });
    }
  };

  requireString('coreClaim');
  requireString('payoff');

  if (!seed.proof || typeof seed.proof !== 'object' || Array.isArray(seed.proof)) {
    errors.push({ path: `${path}.proof`, message: 'Proof must be an object' });
  } else {
    if (!VALID_PROOF_TYPES.has(seed.proof.type)) {
      errors.push({ path: `${path}.proof.type`, message: 'Invalid proof type' });
    }
    if (typeof seed.proof.text !== 'string' || !seed.proof.text.trim()) {
      errors.push({ path: `${path}.proof.text`, message: 'Proof text is required' });
    }
    if (seed.proof.numbers !== undefined && (typeof seed.proof.numbers !== 'string' || !seed.proof.numbers.trim())) {
      errors.push({ path: `${path}.proof.numbers`, message: 'numbers must be a string when provided' });
    }
  }

  if (!VALID_ANGLES.has(seed.angle)) {
    errors.push({ path: `${path}.angle`, message: 'Invalid angle value' });
  }

  if (seed.mechanismOrSteps !== undefined) {
    if (!Array.isArray(seed.mechanismOrSteps)) {
      errors.push({ path: `${path}.mechanismOrSteps`, message: 'Must be an array when provided' });
    } else if (seed.mechanismOrSteps.length > 3) {
      errors.push({ path: `${path}.mechanismOrSteps`, message: 'Must not exceed 3 items' });
    } else if (!seed.mechanismOrSteps.every((entry) => typeof entry === 'string' && entry.trim())) {
      errors.push({ path: `${path}.mechanismOrSteps`, message: 'Entries must be non-empty strings' });
    }
  }

  if (!seed.cta || typeof seed.cta !== 'object' || Array.isArray(seed.cta)) {
    errors.push({ path: `${path}.cta`, message: 'CTA must be an object' });
  } else {
    if (!VALID_CTA_TYPES.has(seed.cta.type)) {
      errors.push({ path: `${path}.cta.type`, message: 'Invalid CTA type' });
    }
    if (typeof seed.cta.prompt !== 'string' || !seed.cta.prompt.trim()) {
      errors.push({ path: `${path}.cta.prompt`, message: 'CTA prompt is required' });
    }
    if (seed.cta.target !== undefined) {
      const target = seed.cta.target;
      const isValidString = typeof target === 'string' && target.trim().length > 0;
      const isValidObject = target && typeof target === 'object' && !Array.isArray(target) && Number.isFinite(target.videoTs);
      if (!isValidString && !isValidObject) {
        errors.push({ path: `${path}.cta.target`, message: 'Target must be string or { videoTs: number }' });
      }
    }
  }

  if (!seed.provenance || typeof seed.provenance !== 'object' || Array.isArray(seed.provenance)) {
    errors.push({ path: `${path}.provenance`, message: 'Provenance is required' });
  } else {
    if (!Number.isFinite(seed.provenance.startSec)) {
      errors.push({ path: `${path}.provenance.startSec`, message: 'startSec must be a number' });
    }
    if (!Number.isFinite(seed.provenance.endSec)) {
      errors.push({ path: `${path}.provenance.endSec`, message: 'endSec must be a number' });
    }
  }

  if (!seed.scores || typeof seed.scores !== 'object' || Array.isArray(seed.scores)) {
    errors.push({ path: `${path}.scores`, message: 'Scores are required' });
  } else {
    const { hookPotential, specificity, actionability, novelty, overall } = seed.scores;
    if (!isScore(hookPotential)) errors.push({ path: `${path}.scores.hookPotential`, message: 'Must be 0-1' });
    if (!isScore(specificity)) errors.push({ path: `${path}.scores.specificity`, message: 'Must be 0-1' });
    if (!isScore(actionability)) errors.push({ path: `${path}.scores.actionability`, message: 'Must be 0-1' });
    if (!isScore(novelty)) errors.push({ path: `${path}.scores.novelty`, message: 'Must be 0-1' });
    if (!isOverall(overall)) errors.push({ path: `${path}.scores.overall`, message: 'Must be 0-100' });
  }

  if (seed.entities !== undefined && (!Array.isArray(seed.entities) || !seed.entities.every((entry) => typeof entry === 'string'))) {
    errors.push({ path: `${path}.entities`, message: 'Entities must be an array of strings when provided' });
  }

  if (seed.audienceLevel !== undefined && !VALID_AUDIENCE_LEVELS.has(seed.audienceLevel)) {
    errors.push({ path: `${path}.audienceLevel`, message: 'Invalid audienceLevel' });
  }

  return errors;
}

function validateIdeaSeedsArray(ideas) {
  if (!Array.isArray(ideas)) {
    return [{ path: 'ideas', message: 'Expected an array response' }];
  }
  const errors = [];
  ideas.forEach((idea, index) => {
    errors.push(...validateIdeaSeed(idea, index));
  });
  return errors;
}

function sanitizeIdeaSeed(seed) {
  if (!seed || typeof seed !== 'object' || Array.isArray(seed)) {
    return seed;
  }

  const clone = { ...seed };

  if (clone.proof && typeof clone.proof === 'object' && !Array.isArray(clone.proof)) {
    clone.proof = { ...clone.proof };
    if (clone.proof.numbers == null || (typeof clone.proof.numbers === 'string' && !clone.proof.numbers.trim())) {
      delete clone.proof.numbers;
    } else if (clone.proof.numbers !== undefined && typeof clone.proof.numbers !== 'string') {
      clone.proof.numbers = String(clone.proof.numbers);
    }
  }

  if (clone.mechanismOrSteps == null) {
    delete clone.mechanismOrSteps;
  } else if (Array.isArray(clone.mechanismOrSteps)) {
    const cleaned = clone.mechanismOrSteps
      .filter((entry) => typeof entry === 'string' && entry.trim())
      .map((entry) => entry.trim())
      .slice(0, 3);
    if (cleaned.length) {
      clone.mechanismOrSteps = cleaned;
    } else {
      delete clone.mechanismOrSteps;
    }
  } else if (typeof clone.mechanismOrSteps === 'string') {
    const trimmed = clone.mechanismOrSteps.trim();
    clone.mechanismOrSteps = trimmed ? [trimmed] : undefined;
    if (!clone.mechanismOrSteps) delete clone.mechanismOrSteps;
  } else if (clone.mechanismOrSteps != null) {
    delete clone.mechanismOrSteps;
  }

  if (clone.provenance && typeof clone.provenance === 'object' && !Array.isArray(clone.provenance)) {
    const start = Number(clone.provenance.startSec);
    const end = Number(clone.provenance.endSec);
    clone.provenance = {
      startSec: Number.isFinite(start) ? start : clone.provenance.startSec,
      endSec: Number.isFinite(end) ? end : clone.provenance.endSec,
    };
  }

  if (clone.scores && typeof clone.scores === 'object' && !Array.isArray(clone.scores)) {
    const { hookPotential, specificity, actionability, novelty, overall } = clone.scores;
    clone.scores = {
      hookPotential: Number(hookPotential),
      specificity: Number(specificity),
      actionability: Number(actionability),
      novelty: Number(novelty),
      overall: Number(overall),
    };
  }

  if (clone.entities && Array.isArray(clone.entities)) {
    clone.entities = clone.entities.filter((entry) => typeof entry === 'string' && entry.trim());
    if (clone.entities.length === 0) {
      delete clone.entities;
    }
  }

  if (clone.cta && typeof clone.cta === 'object' && !Array.isArray(clone.cta)) {
    clone.cta = { ...clone.cta };
    const target = clone.cta.target;
    if (target == null) {
      delete clone.cta.target;
    } else if (typeof target === 'string') {
      const trimmed = target.trim();
      if (trimmed) {
        clone.cta.target = trimmed;
      } else {
        delete clone.cta.target;
      }
    } else if (target && typeof target === 'object' && !Array.isArray(target)) {
      const ts = Number(target.videoTs);
      if (Number.isFinite(ts)) {
        clone.cta.target = { videoTs: ts };
      } else {
        delete clone.cta.target;
      }
    }
  }

  if (typeof clone.angle === 'string' && !VALID_ANGLES.has(clone.angle)) {
    const normalized = clone.angle.toLowerCase();
    const fallbackMap = new Map([
      ['novelty', 'stat_shock'],
      ['surprise', 'stat_shock'],
      ['mistakes', 'mistake'],
      ['questioning', 'question'],
    ]);
    const mapped = fallbackMap.get(normalized);
    clone.angle = VALID_ANGLES.has(mapped) ? mapped : 'story';
  }

  return clone;
}

function normalizeRequestPayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new YouTubeIdeaSeedsServiceError('Request body must be an object', 400);
  }

  const url = typeof payload.url === 'string' ? payload.url.trim() : undefined;
  const lang = typeof payload.lang === 'string' && payload.lang.trim() ? payload.lang.trim() : 'en';
  const videoId = typeof payload.videoId === 'string' && payload.videoId.trim() ? payload.videoId.trim() : undefined;
  const maxIdeas = clampNumber(payload.maxIdeas, DEFAULT_MAX_IDEAS, { min: 1, max: 25 });
  const minOverall = clampNumber(payload.minOverall, DEFAULT_MIN_OVERALL, { min: 0, max: 100 });
  const audienceLevel = sanitizeAudienceLevel(payload.audienceLevel);

  const chunks = Array.isArray(payload.chunks) ? payload.chunks : undefined;
  const transcript = typeof payload.transcript === 'string' ? payload.transcript : undefined;

  if (!transcript && !chunks) {
    throw new YouTubeIdeaSeedsServiceError('transcript or chunks is required', 400);
  }

  return {
    url,
    lang,
    videoId,
    transcript,
    chunks,
    maxIdeas,
    minOverall,
    audienceLevel,
  };
}

class YouTubeIdeaSeedsService {
  constructor({ model } = {}) {
    this.modelName = model || DEFAULT_MODEL;
    this.client = null;
  }

  ensureClient() {
    if (!this.client) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new YouTubeIdeaSeedsServiceError('GEMINI_API_KEY is not configured', 500);
      }
      this.client = new GoogleGenerativeAI(apiKey);
    }
    return this.client;
  }

  async generateIdeaSeeds(rawPayload) {
    const payload = normalizeRequestPayload(rawPayload);

    const transcriptText = buildTranscriptText({ transcript: payload.transcript, chunks: payload.chunks });
    if (transcriptText.length > MAX_TRANSCRIPT_LENGTH) {
      throw new YouTubeIdeaSeedsServiceError(
        `Transcript is too long (${transcriptText.length} characters). Try trimming or summarizing first.`,
        400,
      );
    }

    const systemInstruction = buildSystemInstruction({
      minOverall: payload.minOverall,
      maxIdeas: payload.maxIdeas,
    });

    const prompt = buildUserPrompt({
      lang: payload.lang,
      videoId: payload.videoId,
      transcriptText,
      maxIdeas: payload.maxIdeas,
      minOverall: payload.minOverall,
      audienceLevel: payload.audienceLevel,
    });

    const client = this.ensureClient();
    const generationConfig = {
      temperature: 0.2,
      topP: 0.9,
      topK: 32,
      maxOutputTokens: 4096,
      responseMimeType: 'application/json',
    };

    const start = Date.now();

    try {
      const model = client.getGenerativeModel({
        model: this.modelName,
        generationConfig,
        safetySettings: SAFETY_SETTINGS,
        systemInstruction,
      });

      const result = await model.generateContent(prompt);
      const text = result?.response?.text?.() ?? '';

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch (error) {
        throw new YouTubeIdeaSeedsServiceError('Model returned invalid JSON', 502, { raw: text, error: error?.message });
      }

      let ideas = parsed;
      if (!Array.isArray(ideas) && parsed && typeof parsed === 'object' && Array.isArray(parsed.ideas)) {
        ideas = parsed.ideas;
      }

      ideas = ideas.map((idea) => sanitizeIdeaSeed(idea));

      const validationErrors = validateIdeaSeedsArray(ideas);
      if (validationErrors.length > 0) {
        throw new YouTubeIdeaSeedsServiceError('Idea seed validation failed', 502, {
          errors: validationErrors,
          raw: parsed,
          rawText: text,
        });
      }

      const elapsedMs = Date.now() - start;

      return {
        ideas,
        meta: {
          model: this.modelName,
          durationMs: elapsedMs,
          maxIdeas: payload.maxIdeas,
          minOverall: payload.minOverall,
          audienceLevel: payload.audienceLevel,
          transcriptChars: transcriptText.length,
        },
      };
    } catch (error) {
      if (error instanceof YouTubeIdeaSeedsServiceError) {
        throw error;
      }

      const message = error instanceof Error ? error.message : 'Failed to generate idea seeds';
      throw new YouTubeIdeaSeedsServiceError(message, 500, {
        originalError: error instanceof Error ? error.stack || error.message : error,
      });
    }
  }
}

const SERVICE_INSTANCE_KEY = '__youtubeIdeaSeedsService__';

function getYouTubeIdeaSeedsService() {
  if (!globalThis[SERVICE_INSTANCE_KEY]) {
    globalThis[SERVICE_INSTANCE_KEY] = new YouTubeIdeaSeedsService({});
  }
  return globalThis[SERVICE_INSTANCE_KEY];
}

export { YouTubeIdeaSeedsService, YouTubeIdeaSeedsServiceError, getYouTubeIdeaSeedsService };
