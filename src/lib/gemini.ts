import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
  type SafetySetting,
} from "@google/generative-ai";

export interface GeminiRequest {
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
  responseType?: "text" | "json";
}

export interface GeminiResponse {
  success: boolean;
  content?: string;
  error?: string;
  tokensUsed?: number;
  responseTime?: number;
}

export interface AudioData {
  mimeType: string;
  data: Buffer;
}

// Gemini service with production error handling
export class GeminiService {
  private static readonly DEFAULT_MODEL = "gemini-1.5-flash";
  private static readonly TIMEOUT_MS = 120000; // 120 seconds for large JSON responses
  private static readonly MAX_RETRIES = 3;

  // Instance methods for newer API patterns
  async generateContent(request: GeminiRequest): Promise<GeminiResponse> {
    const startTime = Date.now();

    try {
      console.log("🤖 [Gemini] Starting content generation...");

      const modelName = request.model ?? GeminiService.DEFAULT_MODEL;
      const generationConfig: any = {
        maxOutputTokens: request.maxTokens ?? 4000,
        temperature: request.temperature ?? 0.7,
      };

      console.log(
        `🔧 [Gemini] Config - Model: ${modelName}, MaxTokens: ${generationConfig.maxOutputTokens}, Temp: ${generationConfig.temperature}`,
      );

      // Add JSON response type if requested
      if (request.responseType === "json") {
        generationConfig.responseMimeType = "application/json";
        console.log(`🔧 [Gemini] Response type set to JSON`);
      }

      // Safety settings to allow more content types
      const safetySettings: SafetySetting[] = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ];

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }

      const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
        model: modelName,
        generationConfig,
        systemInstruction: request.systemPrompt,
        safetySettings,
      });

      const result = await Promise.resolve(
        GeminiService.withTimeout(model.generateContent(request.prompt), GeminiService.TIMEOUT_MS),
      );

      const response = result.response;
      const content = response.text();
      const responseTime = Date.now() - startTime;

      // Estimate tokens used (rough calculation)
      const tokensUsed = Math.ceil((request.prompt.length + content.length) / 4);

      console.log(`✅ [Gemini] Generation successful in ${responseTime}ms`);

      return {
        success: true,
        content,
        tokensUsed,
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`❌ [Gemini] Generation failed after ${responseTime}ms:`, error);

      return {
        success: false,
        error: GeminiService.getErrorMessage(error),
        responseTime,
      };
    }
  }

  async transcribeAudio(audioData: AudioData): Promise<string> {
    try {
      console.log("🎤 [Gemini] Starting audio transcription...");

      // Safety settings to allow more content types
      const safetySettings: SafetySetting[] = [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ];

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
      }

      const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
        model: "gemini-1.5-flash",
        safetySettings,
      });

      const result = await Promise.resolve(
        GeminiService.withTimeout(
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
          GeminiService.TIMEOUT_MS,
        ),
      );

      const response = result.response;
      const transcription = response.text();

      console.log("✅ [Gemini] Audio transcription successful");
      return transcription;
    } catch (error) {
      console.error("❌ [Gemini] Audio transcription failed:", error);
      throw error;
    }
  }

  // Static methods for backward compatibility
  static async generateContent(request: GeminiRequest): Promise<GeminiResponse> {
    const service = new GeminiService();
    return service.generateContent(request);
  }

  static async generateWithRetry(request: GeminiRequest): Promise<GeminiResponse> {
    let lastError: GeminiResponse | null = null;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      console.log(`🔄 [Gemini] Attempt ${attempt}/${this.MAX_RETRIES}`);

      const result = await this.generateContent(request);

      if (result.success) {
        return result;
      }

      lastError = result;

      if (attempt < this.MAX_RETRIES) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏳ [Gemini] Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return lastError!;
  }

  private static withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Request timeout")), timeoutMs)),
    ]);
  }

  private static getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        return "Request timed out. Please try again.";
      }
      if (error.message.includes("quota")) {
        return "API quota exceeded. Please try again later.";
      }
      if (error.message.includes("invalid")) {
        return "Invalid request. Please check your input.";
      }
      return error.message;
    }
    return "An unexpected error occurred. Please try again.";
  }
}

// Helper for script generation
export async function generateScript(prompt: string, options?: Partial<GeminiRequest>): Promise<GeminiResponse> {
  return GeminiService.generateWithRetry({
    prompt,
    maxTokens: 800,
    temperature: 0.8,
    ...options,
  });
}
