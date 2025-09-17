import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";

// Lazy initialization function for Gemini client
function getGeminiClient() {
  console.log("🔧 [DEBUG Enhanced] GEMINI_API_KEY exists:", !!process.env.GEMINI_API_KEY);
  console.log("🔧 [DEBUG Enhanced] GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length || 0);
  console.log("🔧 [DEBUG Enhanced] GEMINI_API_KEY first 10 chars:", process.env.GEMINI_API_KEY?.substring(0, 10) || 'undefined');

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Supported Gemini models
export const GEMINI_MODELS = {
  FLASH: "gemini-1.5-flash",
  PRO: "gemini-1.5-pro",
  FLASH_8B: "gemini-1.5-flash-8b",
} as const;

export type GeminiModel = (typeof GEMINI_MODELS)[keyof typeof GEMINI_MODELS];

// Request configuration interface
export interface GeminiRequestConfig {
  model?: GeminiModel;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
  responseType?: "text" | "json";
  jsonSchema?: any; // JSON schema for structured responses
  systemInstruction?: string;
  timeout?: number;
  retries?: number;
}

// Request interface
export interface GeminiRequest extends GeminiRequestConfig {
  prompt: string;
}

// Response interface
export interface GeminiResponse<T = string> {
  success: boolean;
  content?: T;
  error?: string;
  tokensUsed?: number;
  responseTime?: number;
  model?: string;
  retryCount?: number;
}

// Audio data interface
export interface AudioData {
  mimeType: string;
  data: Buffer;
}

// Configuration defaults
const DEFAULT_CONFIG: Required<Omit<GeminiRequestConfig, "systemInstruction">> = {
  model: GEMINI_MODELS.FLASH,
  maxTokens: 1000,
  temperature: 0.7,
  topP: 0.9,
  topK: 40,
  responseType: "text",
  timeout: 30000, // 30 seconds
  retries: 2,
};

/**
 * Enhanced Gemini Service with modular architecture
 * Supports dynamic model selection, comprehensive error handling, and retry logic
 */
export class GeminiService {
  private static instance: GeminiService;
  private models: Map<string, GenerativeModel> = new Map();

  // Singleton pattern for service instance
  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Get or create a Gemini model instance with caching
   */
  private getModel(modelName: GeminiModel, config: GeminiRequestConfig): GenerativeModel {
    const cacheKey = `${modelName}-${JSON.stringify(config)}`;

    if (!this.models.has(cacheKey)) {
      const generationConfig: any = {
        maxOutputTokens: config.maxTokens ?? DEFAULT_CONFIG.maxTokens,
        temperature: config.temperature ?? DEFAULT_CONFIG.temperature,
        topP: config.topP ?? DEFAULT_CONFIG.topP,
        topK: config.topK ?? DEFAULT_CONFIG.topK,
      };

      // Add JSON response type if requested
      if (config.responseType === "json") {
        generationConfig.responseMimeType = "application/json";

        // Add JSON schema if provided
        // NOTE: Temporarily disabled due to compatibility issues
        // if (config.jsonSchema) {
        //   generationConfig.responseSchema = config.jsonSchema;
        // }
      }

      // Safety settings to allow more content types
      const safetySettings = [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
          threshold: "BLOCK_NONE",
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_NONE",
        },
      ];

      const modelInstance = getGeminiClient().getGenerativeModel({
        model: modelName,
        generationConfig,
        systemInstruction: config.systemInstruction,
        safetySettings,
      });

      this.models.set(cacheKey, modelInstance);
    }

    return this.models.get(cacheKey)!;
  }

  /**
   * Generate content with comprehensive error handling and retry logic
   */
  async generateContent<T = string>(request: GeminiRequest): Promise<GeminiResponse<T>> {
    const config = { ...DEFAULT_CONFIG, ...request };
    const startTime = Date.now();
    let lastError: Error | null = null;
    let retryCount = 0;

    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        console.log(`🤖 [Gemini] Attempt ${attempt + 1}/${config.retries + 1} with model ${config.model}`);
        console.log(`🤖 [Gemini] Response type: ${config.responseType}, Has JSON schema: ${!!config.jsonSchema}`);

        const model = this.getModel(config.model, config);
        const result = await Promise.resolve(
          this.withTimeout(model.generateContent(request.prompt), config.timeout),
        );

        const response = result.response;
        const content = response.text();
        const responseTime = Date.now() - startTime;

        // Estimate tokens used (rough calculation)
        const tokensUsed = Math.ceil((request.prompt.length + content.length) / 4);

        console.log(`✅ [Gemini] Generation successful in ${responseTime}ms (attempt ${attempt + 1})`);

        // Parse JSON if requested
        let parsedContent: any = content;
        if (config.responseType === "json") {
          try {
            parsedContent = JSON.parse(content);
          } catch (parseError) {
            console.warn("⚠️ [Gemini] JSON parsing failed, returning raw content");
          }
        }

        return {
          success: true,
          content: parsedContent,
          tokensUsed,
          responseTime,
          model: config.model,
          retryCount: attempt,
        };
      } catch (error) {
        lastError = error as Error;
        retryCount = attempt;

        console.error(`❌ [Gemini] Attempt ${attempt + 1} failed:`, error);

        // Don't retry on certain errors
        if (this.isNonRetryableError(lastError)) {
          break;
        }

        // Apply exponential backoff for retries
        if (attempt < config.retries) {
          const delay = Math.min(Math.pow(2, attempt) * 1000, 10000); // Cap at 10s
          console.log(`⏳ [Gemini] Retrying in ${delay}ms...`);
          await this.sleep(delay);
        }
      }
    }

    const responseTime = Date.now() - startTime;
    return {
      success: false,
      error: this.getErrorMessage(lastError),
      responseTime,
      model: config.model,
      retryCount,
    };
  }

  /**
   * Transcribe audio using Gemini
   */
  async transcribeAudio(audioData: AudioData, config?: GeminiRequestConfig): Promise<GeminiResponse<string>> {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    const startTime = Date.now();

    try {
      console.log("🎤 [Gemini] Starting audio transcription...");

      const model = this.getModel(mergedConfig.model, mergedConfig);
      const result = await Promise.resolve(
        this.withTimeout(
          model.generateContent([
          {
            inlineData: {
              mimeType: audioData.mimeType,
              data: audioData.data.toString("base64"),
            },
          },
          {
            text: "Please transcribe this audio file. Return only the transcribed text without any additional commentary.",
          },
          ]),
          mergedConfig.timeout,
        ),
      );

      const response = result.response;
      const transcription = response.text();
      const responseTime = Date.now() - startTime;

      console.log(`✅ [Gemini] Audio transcription successful in ${responseTime}ms`);

      return {
        success: true,
        content: transcription,
        responseTime,
        model: mergedConfig.model,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ [Gemini] Audio transcription failed after ${responseTime}ms:`, error);

      return {
        success: false,
        error: this.getErrorMessage(error as Error),
        responseTime,
        model: mergedConfig.model,
      };
    }
  }

  /**
   * Batch generation with configurable concurrency
   */
  async generateBatch<T = string>(
    requests: GeminiRequest[],
    options?: { concurrency?: number; failFast?: boolean },
  ): Promise<GeminiResponse<T>[]> {
    const { concurrency = 3, failFast = false } = options || {};

    console.log(`🔥 [Gemini] Starting batch generation: ${requests.length} requests, concurrency: ${concurrency}`);

    const results: GeminiResponse<T>[] = [];

    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);

      try {
        const batchResults = await Promise.all(batch.map((request) => this.generateContent<T>(request)));

        results.push(...batchResults);

        // Check for failures if failFast is enabled
        if (failFast && batchResults.some((result) => !result.success)) {
          console.warn("⚠️ [Gemini] Batch generation stopped due to failure (failFast enabled)");
          break;
        }
      } catch (error) {
        console.error("❌ [Gemini] Batch generation error:", error);
        if (failFast) {
          throw error;
        }
      }
    }

    const successCount = results.filter((r) => r.success).length;
    console.log(`✅ [Gemini] Batch generation completed: ${successCount}/${results.length} successful`);

    return results;
  }

  /**
   * Clear model cache (useful for testing or memory management)
   */
  clearCache(): void {
    this.models.clear();
    console.log("🧹 [Gemini] Model cache cleared");
  }

  // Utility methods
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Request timeout")), timeoutMs)),
    ]);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private isNonRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();
    return (
      message.includes("invalid") ||
      message.includes("unauthorized") ||
      message.includes("forbidden") ||
      message.includes("not found") ||
      message.includes("malformed")
    );
  }

  private getErrorMessage(error: Error | null): string {
    if (!error) return "Unknown error occurred";

    const message = error.message.toLowerCase();

    if (message.includes("timeout")) {
      return "Request timed out. Please try again.";
    }
    if (message.includes("quota") || message.includes("rate limit")) {
      return "API quota exceeded. Please try again later.";
    }
    if (message.includes("invalid")) {
      return "Invalid request. Please check your input.";
    }
    if (message.includes("unauthorized") || message.includes("forbidden")) {
      return "Authentication failed. Please check your API key.";
    }
    if (message.includes("network") || message.includes("connection")) {
      return "Network error. Please check your connection.";
    }

    return error.message || "An unexpected error occurred.";
  }
}

// Static convenience methods for backward compatibility
export const geminiService = GeminiService.getInstance();

// Helper functions
export async function generateContent<T = string>(request: GeminiRequest): Promise<GeminiResponse<T>> {
  return geminiService.generateContent<T>(request);
}

export async function generateWithModel<T = string>(
  prompt: string,
  model: GeminiModel,
  config?: Omit<GeminiRequestConfig, "model">,
): Promise<GeminiResponse<T>> {
  return geminiService.generateContent<T>({ prompt, model, ...config });
}

export async function generateJSON<T = any>(prompt: string, config?: GeminiRequestConfig): Promise<GeminiResponse<T>> {
  return geminiService.generateContent<T>({
    prompt,
    responseType: "json",
    ...config,
  });
}

// Export the existing generateScript function for backward compatibility
export async function generateScript(prompt: string, options?: Partial<GeminiRequest>): Promise<GeminiResponse> {
  return generateContent({
    prompt,
    maxTokens: 800,
    temperature: 0.8,
    ...options,
  });
}
