"use client";

import { useCallback, useMemo, useState } from "react";

import { buildAuthHeaders } from "@/lib/http/auth-headers";
// Use server API for model calls to avoid exposing keys client-side

type VoiceTemplates = {
  hooks: Array<{ id: string; pattern: string; variables?: string[] }>;
  bridges: Array<{ id: string; pattern: string; variables?: string[] }>;
  ctas: Array<{ id: string; pattern: string; variables?: string[] }>;
  nuggets: Array<{ id: string; pattern: string; structure?: string; variables?: string[] }>;
};

type VoiceStyle = {
  powerWords?: string[];
  fillerPhrases?: string[];
  transitionPhrases?: string[];
  avgWordsPerSentence?: number;
  tone?: string;
} | null;

const EMOJI_REGEX = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu;

function stripEmojis(input: string): string {
  if (!input) return "";
  const withoutEmojis = input.replace(EMOJI_REGEX, "");
  return withoutEmojis
    .split("\n")
    .map((line) => line.replace(/\s{2,}/g, " ").trim())
    .join("\n")
    .trim();
}

function nextIndex(key: string, length: number): number {
  if (!length) return 0;
  try {
    const raw = localStorage.getItem(key);
    const i = raw ? parseInt(raw, 10) : -1;
    const next = (isNaN(i) ? -1 : i) + 1;
    const idx = next % length;
    localStorage.setItem(key, String(idx));
    return idx;
  } catch { return 0; }
}

async function fetchVoiceTemplates(
  brandVoiceId: string,
  creatorId?: string
): Promise<{ templates: VoiceTemplates; style: VoiceStyle }> {
  if (!creatorId) {
    console.warn('⚠️ [useScriptGeneration] Missing creatorId for brand voice', { brandVoiceId });
    return { templates: { hooks: [], bridges: [], ctas: [], nuggets: [] }, style: null };
  }

  const buildParams = (includeBrandVoiceId: boolean) => {
    const params = new URLSearchParams({ creatorId });
    if (includeBrandVoiceId && brandVoiceId) {
      params.set('brandVoiceId', brandVoiceId);
    }
    return params.toString();
  };

  let response = await fetch(`/api/brand-voices/templates?${buildParams(true)}`);

  if (!response.ok && response.status === 404 && brandVoiceId) {
    console.warn('⚠️ [useScriptGeneration] Templates not found for brandVoiceId, retrying with creatorId only', {
      brandVoiceId,
      creatorId,
    });
    response = await fetch(`/api/brand-voices/templates?${buildParams(false)}`);
  }

  let data: any = null;
  try {
    data = await response.json();
  } catch (_) {
    data = null;
  }

  if (!response.ok || !data?.success) {
    return { templates: { hooks: [], bridges: [], ctas: [], nuggets: [] }, style: null };
  }

  return { templates: data.templates as VoiceTemplates, style: (data.styleSignature as VoiceStyle) ?? null };
}

type GeneratedScript = {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
};

type GenerateScriptResponse = {
  success: boolean;
  script?: GeneratedScript;
  error?: string;
};

export type GenerateScriptParams = {
  idea: string;
  length?: "15" | "20" | "30" | "45" | "60" | "90";
  brandVoiceId?: string;
  brandVoiceCreatorId?: string;
};

export function useScriptGeneration() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateScript = useCallback(
    async ({
      idea,
      length = "60",
      brandVoiceId,
      brandVoiceCreatorId
    }: GenerateScriptParams) => {
      console.log("🚀 [useScriptGeneration] Starting script generation:", {
        idea,
        length,
        brandVoiceId,
        brandVoiceCreatorId
      });
      setIsLoading(true);
      setError(null);
      
      try {
        console.log("🤖 [useScriptGeneration] Using server API for Gemini generation");
        
        // If a brand voice is provided, fetch templates + choose next templates in rotation
        let voiceBlock = '';
        if (brandVoiceId && typeof brandVoiceId === 'string') {
          if (!brandVoiceCreatorId) {
            console.warn('⚠️ [useScriptGeneration] brandVoiceCreatorId missing; skipping template fetch', {
              brandVoiceId
            });
          } else {
            const { templates, style } = await fetchVoiceTemplates(brandVoiceId, brandVoiceCreatorId);

            const hookIdx = nextIndex(`genC.templateIndex.${brandVoiceId}.hook`, templates.hooks.length);
            const bridgeIdx = nextIndex(`genC.templateIndex.${brandVoiceId}.bridge`, templates.bridges.length);
            const ctaIdx = nextIndex(`genC.templateIndex.${brandVoiceId}.cta`, templates.ctas.length);
            const nuggetIdx = nextIndex(`genC.templateIndex.${brandVoiceId}.nugget`, templates.nuggets.length);

            const hook = templates.hooks[hookIdx]?.pattern;
            const bridge = templates.bridges[bridgeIdx]?.pattern;
            const cta = templates.ctas[ctaIdx]?.pattern;
            const nugget = templates.nuggets[nuggetIdx]?.pattern;

            const styleHints = [
              style?.tone ? `Tone: ${style.tone}` : '',
              style?.powerWords?.length ? `Power words to prefer: ${style.powerWords.slice(0, 10).join(', ')}` : '',
              style?.transitionPhrases?.length
                ? `Use transitions like: ${style.transitionPhrases.slice(0, 8).join(', ')}`
                : '',
              style?.avgWordsPerSentence ? `Average sentence length: ${style.avgWordsPerSentence}` : '',
            ]
              .filter(Boolean)
              .join('\n');

            const parts = [
              '',
              'BRAND VOICE TEMPLATES (use these as strict patterns, replacing [VARIABLES] from the idea):',
              `- Hook pattern: ${hook || 'n/a'}`,
              `- Bridge pattern: ${bridge || 'n/a'}`,
              `- Golden Nugget pattern: ${nugget || 'n/a'}`,
              `- Why to Act pattern: ${cta || 'n/a'}`,
            ];

            if (styleHints) {
              parts.push('', 'STYLE SIGNATURE:', styleHints, '');
            }

            voiceBlock = parts.join('\n');
          }
        }

        // Create a strict JSON prompt for Gemini
        const jsonSchemaLines = [
          '{',
          '  "hook": "string",',
          '  "bridge": "string",',
          '  "nugget": "string",',
          '  "wta": "string"',
          '}',
        ];

        const scriptPrompt = `Return ONLY valid JSON with this exact schema and no extra text.

${jsonSchemaLines.join('\n')}

Task: Generate a ${length}-second short-form video script for the idea: "${idea}"
Rules:
- Use concise sentences and platform-native tone.
- Do not include emojis or emoticons in any part of the script. Rely on words only.
- Follow the brand voice patterns if provided, replacing [VARIABLES] from the idea/context.
${voiceBlock}`.trim();
        
        console.log("📝 [useScriptGeneration] Sending to server API (Gemini)...");
        console.log("📊 [useScriptGeneration] Prompt length:", scriptPrompt.length, "characters");
        
        // JSON-only with guarded retries via /api/voice/analyze-patterns
        const validate = (obj: any) =>
          !!(
            obj &&
            typeof obj.hook === 'string' &&
            typeof obj.bridge === 'string' &&
            typeof obj.nugget === 'string' &&
            typeof obj.wta === 'string' &&
            stripEmojis(obj.hook).trim() &&
            stripEmojis(obj.bridge).trim() &&
            stripEmojis(obj.nugget).trim() &&
            stripEmojis(obj.wta).trim()
          );

        const maxRetries = 2;
        let parsed: any = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          const attemptPrompt = attempt === 1
            ? scriptPrompt
            : `${scriptPrompt}\n\nSTRICT RETRY ${attempt - 1}: Return ONLY the JSON object that matches the schema. No markdown, no code fences, no commentary.`;

          const res = await fetch('/api/voice/analyze-patterns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: attemptPrompt,
              responseType: 'json',
              temperature: attempt === 1 ? 0.6 : 0.2,
              maxTokens: 800,
              model: 'gemini-1.5-flash',
            })
          });

          let data: any = null;
          try { data = await res.json(); } catch { data = null; }
          if (!res.ok || !data?.success || !data?.content) {
            if (attempt === maxRetries) {
              throw new Error(data?.error || `Generation failed (HTTP ${res.status})`);
            }
            continue;
          }

          try { parsed = JSON.parse(data.content); } catch { parsed = null; }
          if (!parsed) {
            if (attempt === maxRetries) throw new Error('Model did not return valid JSON');
            continue;
          }

          if (!validate(parsed)) {
            if (attempt === maxRetries) {
              throw new Error("Gemini returned JSON but missing required fields");
            }
            parsed = null;
            continue;
          }
          break; // success
        }

        console.log("📝 [useScriptGeneration] Generated script components:", parsed);

        const script: GeneratedScript = {
          hook: stripEmojis(parsed.hook),
          bridge: stripEmojis(parsed.bridge),
          goldenNugget: stripEmojis(parsed.nugget),
          wta: stripEmojis(parsed.wta),
        };
        
        const response: GenerateScriptResponse = {
          success: true,
          script
        };
        
        console.log("✅ [useScriptGeneration] Script generation successful");
        return response;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        console.error("❌ [useScriptGeneration] Exception:", err);
        setError(message);
        return { success: false, error: message } as GenerateScriptResponse;
      } finally {
        console.log("🏁 [useScriptGeneration] Setting loading to false");
        setIsLoading(false);
      }
    },
    [],
  );

  return useMemo(() => ({ generateScript, isLoading, error }), [generateScript, isLoading, error]);
}
