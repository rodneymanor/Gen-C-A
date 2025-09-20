// Load Gemini service compatibly in dev (TS) and prod (bundled JS)
async function loadGeminiService() {
  try {
    // In production on Vercel, the TS will be transpiled to JS
    const mod = await import('../../lib/gemini.js');
    return mod.GeminiService;
  } catch (e) {
    // In local dev (tsx), import directly from TS
    const mod = await import('../../lib/gemini.ts');
    return mod.GeminiService;
  }
}

/**
 * Batched voice analysis route - processes multiple transcripts in batches
 * to create comprehensive voice templates and style signatures.
 *
 * POST /api/voice/analyze-batch
 * Body:
 * {
 *   transcripts: string[],              // required: array of transcript texts
 *   creator?: { name?: string, handle?: string }, // optional creator info
 *   batchSize?: number,                 // default: 10
 *   model?: string,                     // default: "gemini-1.5-flash"
 *   temperature?: number,               // default: 0.2
 *   maxTokens?: number                  // default: 6000
 * }
 */
export async function handleBatchVoiceAnalysis(req, res) {
  const requestId = Math.random().toString(36).slice(2, 8);
  console.log(`🎯 [${requestId}] Starting batched voice analysis`);

  try {
    const GeminiService = await loadGeminiService();
    const geminiService = new GeminiService();
    const {
      transcripts = [],
      creator = {},
      batchSize = 10,
      model = 'gemini-1.5-flash',
      temperature = 0.2,
      maxTokens = 6000
    } = req.body || {};

    // Validate input
    if (!Array.isArray(transcripts) || transcripts.length === 0) {
      return res.status(400).json({
        success: false,
        error: "transcripts array is required and must not be empty"
      });
    }

    console.log(`📊 [${requestId}] Processing ${transcripts.length} transcripts in batches of ${batchSize}`);

    // Helper function to chunk array into batches
    const chunk = (arr, size) => {
      const out = [];
      for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
      return out;
    };

    const batches = chunk(transcripts, batchSize);

    const buildAnalysisPrompt = (batchTranscripts) => {
      const tCount = batchTranscripts.length;
      const analysisInstruction = `Analyze these ${tCount} video transcripts and create reusable templates. For each transcript:

1. EXTRACT THE SECTIONS:
- Hook (first 3-5 seconds that grabs attention)
- Bridge (transition that sets up the main content)
- Golden Nugget (the main value/lesson/information)
- Why to Act (the closing reason to take action)

2. CREATE TEMPLATES from the hooks by replacing specific details with [VARIABLES]:
Example: "I made $5000 in 2 days" → "I [achievement] in [timeframe]"

3. DOCUMENT THE CREATOR'S STYLE:
- Common words/phrases they repeat
- Sentence length (short/long/mixed)
- Transition words between sections
- Speaking pace indicators (pauses, emphasis)

${Array.from({ length: tCount }, (_, i) => `[INSERT TRANSCRIPT ${i + 1}]`).join('\n')}

OUTPUT FORMAT:

## HOOK TEMPLATES
1. [Template with variables]
2. [Template with variables]
3. [Template with variables]

## BRIDGE TEMPLATES
1. [Template with variables]
2. [Template with variables]

## GOLDEN NUGGET STRUCTURE
- How they present main points
- Common frameworks used

## WHY TO ACT TEMPLATES
1. [Template with variables]
2. [Template with variables]

## STYLE SIGNATURE
- Power words: [list]
- Filler phrases: [list]
- Transition phrases: [list]
- Average words per sentence: [number]
- Tone: [description]`;

      const transcriptsBlock = batchTranscripts
        .map((content, i) => `\n[INSERT TRANSCRIPT ${i + 1}]\n${content ?? ''}`)
        .join('\n');

      const jsonHeader = `Return ONLY valid JSON with this schema and no markdown/code fences.\n\n{
  "templates": {
    "hooks": [{ "pattern": "string", "variables": ["string"], "sourceIndex": 1 }],
    "bridges": [{ "pattern": "string", "variables": ["string"], "sourceIndex": 1 }],
    "ctas": [{ "pattern": "string", "variables": ["string"], "sourceIndex": 1 }],
    "nuggets": [{ "pattern": "string", "structure": "string", "variables": ["string"], "sourceIndex": 1 }]
  },
  "styleSignature": {
    "powerWords": ["string"],
    "fillerPhrases": ["string"],
    "transitionPhrases": ["string"],
    "avgWordsPerSentence": 0,
    "tone": "string"
  },
  "transcripts": [{
    "index": 1,
    "hook": {"text": "string", "duration": 0, "type": "string", "emotionalTrigger": "string", "template": "string", "variables": {}},
    "bridge": {"text": "string", "transitionType": "string", "duration": 0, "template": "string", "variables": {}},
    "goldenNugget": {"text": "string", "valueType": "string", "deliveryMethod": "string", "duration": 0, "structure": "string", "keyPoints": ["string"], "template": "string", "variables": {}},
    "cta": {"text": "string", "type": "string", "placement": "string", "urgency": "string", "template": "string", "variables": {}},
    "microHooks": [{"text": "string", "position": 0, "purpose": "string", "template": "string", "variables": {}}]
  }]
}`;

      const densityRequirement = `\n\nTEMPLATE DENSITY REQUIREMENTS:\n- Produce exactly ${tCount} items in each of templates.hooks, templates.bridges, templates.nuggets, templates.ctas.\n- Map one item per transcript and set sourceIndex to that transcript's index (1-based).\n- Do NOT deduplicate or merge similar templates across transcripts — include them separately even if identical.\n- Keep patterns generalized with [VARIABLES], but preserve distinct phrasing per transcript.`;

      return `${jsonHeader}\n\n${analysisInstruction}${densityRequirement}\n${transcriptsBlock}`;
    };

    const analyzeBatch = async (batchTranscripts, batchIndex) => {
      console.log(`🧩 [${requestId}] Analyzing batch ${batchIndex + 1}/${batches.length} (${batchTranscripts.length} transcripts)`);

      // Helper: robust JSON parse with fallback extraction
      const tryParseJson = (text) => {
        if (!text) return null;
        try {
          return JSON.parse(text);
        } catch {}
        // Strip markdown code fences if present
        const cleaned = text.replace(/```[\s\S]*?```/g, '').trim();
        try {
          return JSON.parse(cleaned);
        } catch {}
        // Extract first to last brace block as a last resort
        const first = cleaned.indexOf('{');
        const last = cleaned.lastIndexOf('}');
        if (first !== -1 && last !== -1 && last > first) {
          const slice = cleaned.substring(first, last + 1);
          try {
            return JSON.parse(slice);
          } catch {}
        }
        return null;
      };

      const composedPrompt = buildAnalysisPrompt(batchTranscripts);
      
      const result = await geminiService.generateContent({
        prompt: composedPrompt,
        responseType: 'json',
        temperature,
        maxTokens,
        model,
        systemPrompt: 'You are a strict JSON generator. Return ONLY valid JSON matching the schema. No markdown, no commentary, no code fences.'
      });

      if (!result?.success) {
        throw new Error(`Batch ${batchIndex + 1} analysis failed: ${result?.error || 'Generation failed'}`);
      }

      const parsed = tryParseJson(result.content || '');
      if (!parsed) {
        console.warn(`⚠️ [${requestId}] Failed to parse JSON content for batch ${batchIndex + 1}`);
        throw new Error(`Failed to parse JSON content for batch ${batchIndex + 1}`);
      }

      return parsed;
    };

    // Process all batches
    const batchResults = [];
    for (let b = 0; b < batches.length; b++) {
      try {
        const result = await analyzeBatch(batches[b], b);
        batchResults.push(result);
      } catch (error) {
        console.error(`❌ [${requestId}] Batch ${b + 1} failed:`, error);
        return res.status(500).json({
          success: false,
          error: `Batch ${b + 1} analysis failed: ${error.message}`,
          requestId,
          batchIndex: b + 1,
          totalBatches: batches.length
        });
      }
    }

    console.log(`✅ [${requestId}] All ${batches.length} batches completed, combining results`);

    // Combine all batch results
    const combined = {
      templates: { hooks: [], bridges: [], ctas: [], nuggets: [] },
      styleSignature: { 
        powerWords: [], 
        fillerPhrases: [], 
        transitionPhrases: [], 
        avgWordsPerSentence: undefined, 
        tone: 'Varied' 
      },
      transcripts: [],
    };

    const uniqPush = (arr, items) => {
      const set = new Set(arr.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))));
      for (const it of items) {
        const key = typeof it === 'string' ? it : JSON.stringify(it);
        if (!set.has(key)) {
          set.add(key);
          arr.push(it);
        }
      }
    };

    let globalOffset = 0;
    for (let b = 0; b < batchResults.length; b++) {
      const r = batchResults[b];
      const bt = batches[b];
      const localCount = bt.length;

      // Adjust sourceIndex to be global across all batches
      const adjustTemplates = (list = []) =>
        list.map((t, idx) => ({
          ...t,
          sourceIndex: globalOffset + (t?.sourceIndex ?? idx + 1),
        }));

      combined.templates.hooks.push(...adjustTemplates(r?.templates?.hooks));
      combined.templates.bridges.push(...adjustTemplates(r?.templates?.bridges));
      combined.templates.ctas.push(...adjustTemplates(r?.templates?.ctas));
      combined.templates.nuggets.push(...adjustTemplates(r?.templates?.nuggets));

      if (Array.isArray(r?.transcripts)) {
        combined.transcripts.push(
          ...r.transcripts.map((t, i) => ({ ...t, index: globalOffset + (t?.index ?? i + 1) }))
        );
      }

      // Merge style signatures
      uniqPush(combined.styleSignature.powerWords, r?.styleSignature?.powerWords || []);
      uniqPush(combined.styleSignature.fillerPhrases, r?.styleSignature?.fillerPhrases || []);
      uniqPush(combined.styleSignature.transitionPhrases, r?.styleSignature?.transitionPhrases || []);
      
      const avg = r?.styleSignature?.avgWordsPerSentence;
      if (typeof avg === 'number') {
        const current = combined.styleSignature.avgWordsPerSentence;
        combined.styleSignature.avgWordsPerSentence = typeof current === 'number' ? (current + avg) / 2 : avg;
      }
      
      if (r?.styleSignature?.tone && combined.styleSignature.tone === 'Varied') {
        combined.styleSignature.tone = r.styleSignature.tone;
      }

      globalOffset += localCount;
    }

    console.log(`🎉 [${requestId}] Voice analysis completed successfully`);
    console.log(`📊 [${requestId}] Generated ${combined.templates.hooks.length} hooks, ${combined.templates.bridges.length} bridges, ${combined.templates.ctas.length} CTAs, ${combined.templates.nuggets.length} nuggets`);

    return res.json({
      success: true,
      requestId,
      creator,
      analysis: combined,
      meta: {
        totalTranscripts: transcripts.length,
        batchesProcessed: batches.length,
        batchSize,
        model,
        temperature,
        maxTokens
      }
    });

  } catch (error) {
    console.error(`❌ [${requestId}] Batched voice analysis failed:`, error);
    return res.status(500).json({
      success: false,
      requestId,
      error: error instanceof Error ? error.message : 'Batched voice analysis failed'
    });
  }
}
