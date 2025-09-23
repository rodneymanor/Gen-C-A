import { NextRequest, NextResponse } from "next/server";

import { verifyRequestAuth } from "@/app/api/utils/auth";
import { GeminiService } from "@/lib/gemini";

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

const MODEL = "gemini-1.5-flash";

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

const REQUIRED_FIELDS: Array<keyof BrandProfileRequestBody> = [
  "profession",
  "brandPersonality",
  "universalProblem",
  "initialHurdle",
  "persistentStruggle",
  "visibleTriumph",
  "ultimateTransformation",
  "immediateImpact",
  "ultimateImpact",
];

export async function POST(request: NextRequest) {
  let body: unknown;

  try {
    body = await request.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON payload";
    return NextResponse.json({ success: false, error: message }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ success: false, error: "Request body must be an object" }, { status: 400 });
  }

  const auth = await verifyRequestAuth(request);
  if (!auth) {
    return NextResponse.json(
      { success: false, error: "Authentication required to generate brand profile." },
      { status: 401 },
    );
  }

  const payload = sanitizePayload(body as Record<string, unknown>);
  const missingFields = REQUIRED_FIELDS.filter((field) => !payload[field]);

  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      },
      { status: 400 },
    );
  }

  try {
    const prompt = createUserPrompt(payload as BrandProfileRequestBody);

    const result = await GeminiService.generateContent({
      systemPrompt: SYSTEM_PROMPT,
      prompt,
      responseType: "json",
      temperature: 0.65,
      maxTokens: 2600,
      model: MODEL,
    });

    if (!result.success || !result.content) {
      return NextResponse.json(
        {
          success: false,
          error: result.error ?? "Failed to generate brand profile",
        },
        { status: 502 },
      );
    }

    let profileJson: unknown;
    try {
      profileJson = JSON.parse(result.content);
    } catch (parseError) {
      console.error("[brand-profile] Failed to parse Gemini response", parseError);
      return NextResponse.json(
        {
          success: false,
          error: "Generated content was not valid JSON",
          raw: result.content,
        },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      profile: profileJson,
      tokensUsed: result.tokensUsed,
      responseTime: result.responseTime,
    });
  } catch (error) {
    console.error("[brand-profile] Unexpected error", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      },
      { status: 500 },
    );
  }
}

function sanitizePayload(payload: Record<string, unknown>): Partial<BrandProfileRequestBody> {
  const sanitized: Partial<BrandProfileRequestBody> = {};

  for (const key of REQUIRED_FIELDS) {
    const value = payload[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0) {
        sanitized[key] = trimmed;
      }
    }
  }

  return sanitized;
}

function createUserPrompt(data: BrandProfileRequestBody): string {
  const value = (input: string) => (input && input.trim().length > 0 ? input : "Not provided");

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
