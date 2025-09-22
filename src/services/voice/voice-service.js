import { GeminiService } from '../../lib/gemini.js';

class VoiceServiceError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.name = 'VoiceServiceError';
    this.statusCode = statusCode;
  }
}

class VoiceService {
  constructor(geminiService) {
    this.gemini = geminiService || new GeminiService();
  }

  buildPrompt({ prompt, transcripts, header }) {
    const appendTranscripts = (arr) =>
      `\n\n${header}:\n${arr.map((t, i) => `--- Transcript ${i + 1} ---\n${t}`).join('\n\n')}`;

    if (prompt && transcripts?.length) return `${prompt}${appendTranscripts(transcripts)}`;
    if (prompt) return prompt;
    return `Summarize the common voice patterns found across these transcripts as concise JSON with keys: tone, style, hooks, transitions.${appendTranscripts(transcripts)}`;
  }

  async generate({
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
  }) {
    if (!prompt && (!Array.isArray(transcripts) || transcripts.length === 0)) {
      throw new VoiceServiceError("Provide 'prompt' and/or 'transcripts' to generate output.", 400);
    }

    if (enableBatching && Array.isArray(transcripts) && transcripts.length > 1) {
      const chunks = [];
      for (let i = 0; i < transcripts.length; i += batchSize) {
        chunks.push(transcripts.slice(i, i + batchSize));
      }

      const results = [];
      for (const chunk of chunks) {
        const batchPrompt = prompt || `Analyze these ${chunk.length} transcripts for voice patterns:\n${chunk
          .map((t, i) => `--- Transcript ${i + 1} ---\n${t}`)
          .join('\n\n')}\n\nReturn JSON with voice analysis.`;

        const batchResult = await this.gemini.generateContent({
          prompt: batchPrompt,
          responseType,
          temperature,
          maxTokens,
          model,
          systemPrompt,
        });

        if (!batchResult?.success) {
          throw new VoiceServiceError(
            `Batch generation failed: ${batchResult?.error || 'Generation failed'}`,
            500,
          );
        }

        results.push(batchResult.content);
      }

      return {
        type: 'batch',
        model,
        temperature,
        maxTokens,
        responseType,
        systemPrompt,
        batchSize,
        batchCount: chunks.length,
        content: results,
      };
    }

    const finalPrompt = this.buildPrompt({ prompt, transcripts, header });

    const result = await this.gemini.generateContent({
      prompt: finalPrompt,
      responseType,
      temperature,
      maxTokens,
      model,
      systemPrompt,
    });

    if (!result?.success) {
      throw new VoiceServiceError(result?.error || 'Generation failed', 500);
    }

    return {
      type: 'single',
      model,
      temperature,
      maxTokens,
      responseType,
      systemPrompt,
      prompt: finalPrompt,
      content: result.content,
    };
  }
}

const SERVICE_INSTANCE_KEY = '__voiceService__';

function getVoiceService() {
  if (!globalThis[SERVICE_INSTANCE_KEY]) {
    globalThis[SERVICE_INSTANCE_KEY] = new VoiceService();
  }
  return globalThis[SERVICE_INSTANCE_KEY];
}

export { VoiceService, VoiceServiceError, getVoiceService };
