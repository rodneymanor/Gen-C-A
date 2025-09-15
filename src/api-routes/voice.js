import { GeminiService } from '../lib/gemini.ts';

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
 *   responseType?: 'text' | 'json'  // default: 'text'
 * }
 */
export async function handleVoiceAnalyzePatterns(req, res) {
  try {
    const {
      prompt,
      transcripts,
      systemPrompt,
      model = 'gemini-1.5-flash',
      temperature = 0.2,
      maxTokens = 6000,
      header = 'Context: Transcripts',
      responseType = 'text',
    } = req.body || {};

    if (!prompt && (!transcripts || !Array.isArray(transcripts) || transcripts.length === 0)) {
      return res.status(400).json({
        success: false,
        error: "Provide 'prompt' and/or 'transcripts' to generate output.",
      });
    }

    // Build a minimal final prompt for flexibility
    const appendTranscripts = (arr) =>
      `\n\n${header}:\n${arr.map((t, i) => `--- Transcript ${i + 1} ---\n${t}`).join('\n\n')}`;

    const finalPrompt = (() => {
      if (prompt && transcripts?.length) return `${prompt}${appendTranscripts(transcripts)}`;
      if (prompt) return prompt;
      // No prompt provided, fall back to a tiny generic instruction
      return `Summarize the common voice patterns found across these transcripts as concise JSON with keys: tone, style, hooks, transitions.${appendTranscripts(transcripts)}`;
    })();

    const result = await GeminiService.generateContent({
      prompt: finalPrompt,
      responseType,
      temperature,
      maxTokens,
      model,
      systemPrompt,
    });

    if (!result?.success) {
      return res.status(500).json({
        success: false,
        error: result?.error || 'Generation failed',
      });
    }

    // Return raw model text so you can iterate on prompts freely
    return res.json({
      success: true,
      model,
      temperature,
      maxTokens,
      systemPrompt,
      responseType,
      prompt: finalPrompt,
      content: result.content,
    });
  } catch (error) {
    console.error('Voice analyze (simplified) error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    });
  }
}
