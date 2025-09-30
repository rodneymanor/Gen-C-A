import type { Request, Response } from 'express';
import { Router } from 'express';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';

import { getDb, verifyBearer } from '../lib/firebase-admin.js';
import { loadSharedModule } from '../services/shared-service-proxy.js';

const { GeminiService } = loadSharedModule<any>(
  '../../../../src/lib/gemini.ts',
);

const SYSTEM_PROMPT = `You are an expert brand and content strategist. Your task is to analyze a user's business profile and generate a foundational brand strategy profile in a valid JSON format. This profile will include core keywords and a set of personalized content pillar themes.

Your expertise includes:
- Distilling core business challenges into strategic content themes.
- Keyword research based on audience psychology.
- Structuring brand messaging around customer pain points and aspirations.

CRITICAL: You must output a valid JSON object. The content_pillars array in your response must contain exactly the five pillars listed below. Do not create new pillars. Your main job is to populate the suggested_themes array for each pillar with 3-4 unique, personalized content themes that are directly derived from the user's information. A "theme" is a recurring topic or angle the user can create many pieces of content about.

Your JSON output must follow this EXACT structure:
{
  "core_keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"],
  "audience_keywords": ["audience-term1", "audience-term2", "audience-term3", "audience-term4"],
  "problem_aware_keywords": ["problem1", "problem2", "problem3", "problem4"],
  "solution_aware_keywords": ["solution1", "solution2", "solution3", "solution4"],
  "content_pillars": [
    {
      "pillar_name": "Hyper-Focused Value",
      "description": "Provide an in-depth look at a specific topic in your niche, delivering actionable advice.",
      "suggested_themes": [
        "Personalized Theme 1 based on user's profile",
        "Personalized Theme 2 based on user's profile",
        "Personalized Theme 3 based on user's profile"
      ]
    },
    {
      "pillar_name": "Quick-Hit Value",
      "description": "Share quick, high-impact tips that provide immediate value to the audience.",
      "suggested_themes": [
        "Personalized Theme 1 based on user's profile",
        "Personalized Theme 2 based on user's profile",
        "Personalized Theme 3 based on user's profile"
      ]
    },
    {
      "pillar_name": "Major Perspective",
      "description": "Educate and convince your audience about the value of your entire industry or niche.",
      "suggested_themes": [
        "Personalized Theme 1 based on user's profile",
        "Personalized Theme 2 based on user's profile",
        "Personalized Theme 3 based on user's profile"
      ]
    },
    {
      "pillar_name": "The Trend",
      "description": "Cover trending topics in artificial intelligence and emerging tech that impact your industry.",
      "suggested_themes": [
        "Personalized Theme 1 based on user's profile",
        "Personalized Theme 2 based on user's profile",
        "Personalized Theme 3 based on user's profile"
      ]
    },
    {
      "pillar_name": "Inspiration Bomb",
      "description": "Change perspectives and inspire people to take action. The ending should feel like a mic-drop.",
      "suggested_themes": [
        "Personalized Theme 1 based on user's profile",
        "Personalized Theme 2 based on user's profile",
        "Personalized Theme 3 based on user's profile"
      ]
    }
  ],
  "suggested_hashtags": {
    "broad": ["hashtag1", "hashtag2", "hashtag3"],
    "niche": ["niche1", "niche2", "niche3"],
    "community": ["community1", "community2", "community3"]
  }
}

Return ONLY the JSON object, no additional text or formatting.
`;

const MODEL = 'gemini-1.5-flash';

interface BrandProfileRequestBody {
  profession: string;
  brandPersonality: string;
  universalProblem: string;
  initialHurdle: string;
  persistentStruggle: string;
  visibleTriumph: string;
  ultimateTransformation: string;
  immediateImpact: string;
  ultimateImpact: string;
}

type SanitizedPayload = Partial<BrandProfileRequestBody>;

const REQUIRED_FIELDS: Array<keyof BrandProfileRequestBody> = [
  'profession',
  'brandPersonality',
  'universalProblem',
  'initialHurdle',
  'persistentStruggle',
  'visibleTriumph',
  'ultimateTransformation',
  'immediateImpact',
  'ultimateImpact'
];

interface BrandProfileStorageMeta {
  latestDocPath: string;
  historyDocPath: string;
  historyDocId: string;
}

export const brandRouter = Router();

brandRouter.post('/', async (req: Request, res: Response) => {
  const body = req.body;

  if (!body || typeof body !== 'object') {
    res.status(400).json({ success: false, error: 'Request body must be an object' });
    return;
  }

  const auth = await verifyBearer({ headers: req.headers });
  if (!auth || !auth.uid) {
    res.status(401).json({ success: false, error: 'Authentication required to generate brand profile.' });
    return;
  }

  const db = getDb();
  if (!db) {
    res.status(503).json({ success: false, error: 'Content service is unavailable. Please try again later.' });
    return;
  }

  const payload = sanitizePayload(body as Record<string, unknown>);
  const missing = REQUIRED_FIELDS.filter((field) => !payload[field]);
  if (missing.length) {
    res.status(400).json({ success: false, error: `Missing required fields: ${missing.join(', ')}` });
    return;
  }

  const structuredPayload = payload as BrandProfileRequestBody;

  try {
    const prompt = createUserPrompt(structuredPayload);
    const generation = await GeminiService.generateContent({
      systemPrompt: SYSTEM_PROMPT,
      prompt,
      responseType: 'json',
      temperature: 0.65,
      maxTokens: 2600,
      model: MODEL
    });

    if (!generation.success || !generation.content) {
      res.status(502).json({
        success: false,
        error: generation.error ?? 'Failed to generate brand profile'
      });
      return;
    }

    let profileJson: unknown;
    try {
      profileJson = JSON.parse(generation.content);
    } catch (error) {
      console.error('[brand-profile] Failed to parse Gemini response', error);
      res.status(502).json({
        success: false,
        error: 'Generated content was not valid JSON',
        raw: generation.content
      });
      return;
    }

    let storage: BrandProfileStorageMeta | null = null;
    try {
      storage = await persistBrandProfile(
        db,
        auth.uid,
        structuredPayload,
        profileJson,
        generation.tokensUsed,
        generation.responseTime
      );
    } catch (persistError) {
      console.error('[brand-profile] Failed to persist profile', persistError);
      res.status(500).json({
        success: false,
        error: 'Brand profile generated but could not be saved. Please try again.'
      });
      return;
    }

    res.json({
      success: true,
      profile: profileJson,
      tokensUsed: generation.tokensUsed,
      responseTime: generation.responseTime,
      storage
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    console.error('[brand-profile] Unexpected error', error);
    res.status(500).json({ success: false, error: message });
  }
});

function sanitizePayload(payload: Record<string, unknown>): SanitizedPayload {
  const sanitized: SanitizedPayload = {};
  for (const key of REQUIRED_FIELDS) {
    const value = payload[key];
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        sanitized[key] = trimmed;
      }
    }
  }
  return sanitized;
}

function createUserPrompt(data: BrandProfileRequestBody): string {
  const value = (input: string) => (input && input.trim().length > 0 ? input : 'Not provided');

  return `Analyze the following customer profile and generate a comprehensive brand strategy profile.

**Customer Context:**
PROFESSION/BUSINESS: ${value(data.profession)}
BRAND PERSONALITY: ${value(data.brandPersonality)}

**Customer's Landscape (Based on Onboarding Questionnaire):**

1. **THE UNIVERSAL PROBLEM (Common challenge for a broad audience):**
   ${value(data.universalProblem)}

2. **THE INITIAL HURDLE (Biggest obstacle to getting started):**
   ${value(data.initialHurdle)}

3. **THE PERSISTENT STRUGGLE (Ongoing problem for existing clients):**
   ${value(data.persistentStruggle)}

4. **THE VISIBLE TRIUMPH (Public-facing result the client desires):**
   ${value(data.visibleTriumph)}

5. **THE ULTIMATE TRANSFORMATION (Life-altering impact the client wants):**
   ${value(data.ultimateTransformation)}

6. **THE IMMEDIATE IMPACT (Direct outcome you want viewers to experience right away):**
   ${value(data.immediateImpact)}

7. **THE ULTIMATE IMPACT (Long-term change you want to create):**
   ${value(data.ultimateImpact)}

Based on this information, generate the required JSON. Reflect the immediate and ultimate impact clearly within the suggested themes and keywords.`;
}

async function persistBrandProfile(
  db: Firestore,
  uid: string,
  payload: BrandProfileRequestBody,
  profile: unknown,
  tokensUsed?: number,
  responseTime?: number
): Promise<BrandProfileStorageMeta> {
  const userRef = db.collection('users').doc(uid);
  const collectionRef = userRef.collection('brandProfiles');
  const latestRef = collectionRef.doc('current');

  const baseRecord = {
    profile,
    promptData: payload,
    tokensUsed: tokensUsed ?? null,
    responseTime: responseTime ?? null,
    generatedBy: uid
  };

  const latestSnapshot = await latestRef.get();
  const latestPayload: Record<string, unknown> = {
    ...baseRecord,
    updatedAt: FieldValue.serverTimestamp()
  };

  if (!latestSnapshot.exists) {
    latestPayload.createdAt = FieldValue.serverTimestamp();
  }

  await latestRef.set(latestPayload, { merge: true });

  const historyRef = collectionRef.doc();
  await historyRef.set({
    ...baseRecord,
    createdAt: FieldValue.serverTimestamp()
  });

  return {
    latestDocPath: latestRef.path,
    historyDocPath: historyRef.path,
    historyDocId: historyRef.id
  };
}

export type { BrandProfileRequestBody };
