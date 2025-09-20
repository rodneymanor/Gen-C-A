// Load Gemini service compatibly in dev (TS) and prod (bundled JS)
async function loadGeminiService() {
  try {
    // In production on Vercel, the TS will be transpiled to JS
    const mod = await import('../lib/gemini.js');
    return mod.GeminiService;
  } catch (e) {
    // In local dev (tsx), import directly from TS
    const mod = await import('../lib/gemini.ts');
    return mod.GeminiService;
  }
}

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
 *   responseType?: 'text' | 'json', // default: 'text'
 *   enableBatching?: boolean,       // default: false - enables batched processing
 *   batchSize?: number,             // default: 10 - number of transcripts per batch
 *   creator?: object                // optional creator info
 * }
 */
export async function handleVoiceAnalyzePatterns(req, res) {
  try {
    const GeminiService = await loadGeminiService();
    const {
      prompt,
      transcripts,
      systemPrompt,
      model = 'gemini-1.5-flash',
      temperature = 0.2,
      maxTokens = 6000,
      header = 'Context: Transcripts',
      responseType = 'text',
      enableBatching = false,
      batchSize = 10,
      creator = {}
    } = req.body || {};

    if (!prompt && (!transcripts || !Array.isArray(transcripts) || transcripts.length === 0)) {
      return res.status(400).json({
        success: false,
        error: "Provide 'prompt' and/or 'transcripts' to generate output.",
      });
    }

    // Handle batched processing if enabled
    console.log(`🔍 [Voice] Batching check - enableBatching: ${enableBatching}, isArray: ${Array.isArray(transcripts)}, length: ${transcripts?.length}`);
    if (enableBatching && Array.isArray(transcripts) && transcripts.length > 1) {
      console.log(`🧩 [Voice] Batching enabled: ${transcripts.length} transcripts in batches of ${batchSize}`);
      
      // Simple batching test - just concatenate results for now
      const chunks = [];
      for (let i = 0; i < transcripts.length; i += batchSize) {
        chunks.push(transcripts.slice(i, i + batchSize));
      }

      const batchResults = [];
      for (let b = 0; b < chunks.length; b++) {
        const chunk = chunks[b];
        console.log(`🧩 [Voice] Processing batch ${b + 1}/${chunks.length} (${chunk.length} transcripts)`);
        
        const batchPrompt = prompt || `Analyze these ${chunk.length} transcripts for voice patterns:
${chunk.map((t, i) => `--- Transcript ${i + 1} ---\n${t}`).join('\n\n')}

Return JSON with voice analysis.`;

        const batchResult = await GeminiService.generateContent({
          prompt: batchPrompt,
          responseType: responseType,
          temperature,
          maxTokens,
          model,
          systemPrompt,
        });

        if (!batchResult?.success) {
          return res.status(500).json({
            success: false,
            error: `Batch ${b + 1} failed: ${batchResult?.error || 'Generation failed'}`,
          });
        }

        batchResults.push(batchResult.content);
      }

      return res.json({
        success: true,
        model,
        temperature,
        maxTokens,
        systemPrompt,
        responseType,
        enableBatching: true,
        batchSize,
        batchCount: chunks.length,
        creator,
        content: batchResults,
        summary: `Processed ${transcripts.length} transcripts in ${chunks.length} batches`
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
