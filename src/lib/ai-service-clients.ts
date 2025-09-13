/**
 * AI Service Client Abstractions
 * Unified interfaces for different AI providers (Gemini, OpenAI, Claude)
 */

export interface AIServiceConfig {
  apiKey: string;
  model?: string;
  timeout?: number;
  retries?: number;
  temperature?: number;
  maxTokens?: number;
}

export interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  model?: string;
  tokensUsed?: number;
  responseTime?: number;
  retryCount?: number;
}

export interface ContentGenerationRequest {
  prompt: string;
  systemInstruction?: string;
  responseFormat?: 'text' | 'json';
  temperature?: number;
  maxTokens?: number;
}

export interface AudioTranscriptionRequest {
  audioData: Buffer;
  mimeType: string;
  language?: string;
}

export interface VisionAnalysisRequest {
  imageData?: Buffer;
  imageUrl?: string;
  prompt: string;
  detail?: 'low' | 'high';
}

/**
 * Base AI Service Client interface
 * All AI providers must implement this interface
 */
export interface AIServiceClient {
  // Configuration
  configure(config: AIServiceConfig): void;
  isConfigured(): boolean;
  getProviderName(): string;
  getModel(): string;
  
  // Core generation methods
  generateContent<T = string>(request: ContentGenerationRequest): Promise<AIResponse<T>>;
  generateStructuredContent<T = any>(request: ContentGenerationRequest & { schema?: any }): Promise<AIResponse<T>>;
  
  // Specialized methods
  transcribeAudio?(request: AudioTranscriptionRequest): Promise<AIResponse<string>>;
  analyzeImage?(request: VisionAnalysisRequest): Promise<AIResponse<string>>;
  
  // Batch operations
  generateBatch<T = string>(requests: ContentGenerationRequest[]): Promise<AIResponse<T>[]>;
  
  // Utility methods
  estimateTokens(text: string): number;
  validateResponse<T>(response: any, validator?: (data: any) => boolean): T | null;
}

/**
 * Gemini AI Service Client
 */
export class GeminiServiceClient implements AIServiceClient {
  private config: AIServiceConfig | null = null;
  private geminiService: any; // Will be injected from existing GeminiService

  constructor(geminiService?: any) {
    this.geminiService = geminiService;
  }

  configure(config: AIServiceConfig): void {
    this.config = config;
    console.log('🤖 [Gemini] Client configured');
  }

  isConfigured(): boolean {
    return !!(this.config?.apiKey || process.env.GEMINI_API_KEY);
  }

  getProviderName(): string {
    return 'Gemini';
  }

  getModel(): string {
    return this.config?.model || 'gemini-1.5-flash';
  }

  async generateContent<T = string>(request: ContentGenerationRequest): Promise<AIResponse<T>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Gemini client not configured - API key required'
      };
    }

    try {
      const startTime = Date.now();
      
      // Use existing GeminiService if available
      if (this.geminiService) {
        const response = await this.geminiService.generateContent({
          prompt: request.prompt,
          model: this.getModel(),
          systemInstruction: request.systemInstruction,
          responseType: request.responseFormat || 'text',
          temperature: request.temperature || 0.7,
          maxTokens: request.maxTokens || 1000
        });

        return {
          success: response.success,
          data: response.content as T,
          error: response.error,
          model: response.model,
          tokensUsed: response.tokensUsed,
          responseTime: Date.now() - startTime,
          retryCount: response.retryCount
        };
      }

      // Fallback implementation
      console.warn('⚠️ [Gemini] No GeminiService instance provided, using fallback');
      return {
        success: false,
        error: 'GeminiService instance required'
      };

    } catch (error) {
      console.error('❌ [Gemini] Content generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Gemini error',
        responseTime: Date.now()
      };
    }
  }

  async generateStructuredContent<T = any>(request: ContentGenerationRequest & { schema?: any }): Promise<AIResponse<T>> {
    return this.generateContent<T>({
      ...request,
      responseFormat: 'json'
    });
  }

  async transcribeAudio(request: AudioTranscriptionRequest): Promise<AIResponse<string>> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Gemini client not configured' };
    }

    try {
      if (this.geminiService) {
        const response = await this.geminiService.transcribeAudio({
          mimeType: request.mimeType,
          data: request.audioData
        });

        return {
          success: response.success,
          data: response.content,
          error: response.error,
          model: response.model,
          responseTime: response.responseTime
        };
      }

      return { success: false, error: 'GeminiService instance required' };

    } catch (error) {
      console.error('❌ [Gemini] Audio transcription failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Audio transcription failed'
      };
    }
  }

  async analyzeImage(request: VisionAnalysisRequest): Promise<AIResponse<string>> {
    if (!this.isConfigured()) {
      return { success: false, error: 'Gemini client not configured' };
    }

    try {
      // Gemini supports vision analysis
      const visionPrompt = `${request.prompt}\n\nPlease analyze this image in detail.`;
      
      return this.generateContent<string>({
        prompt: visionPrompt,
        temperature: 0.3
      });

    } catch (error) {
      console.error('❌ [Gemini] Image analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Image analysis failed'
      };
    }
  }

  async generateBatch<T = string>(requests: ContentGenerationRequest[]): Promise<AIResponse<T>[]> {
    if (this.geminiService?.generateBatch) {
      try {
        const geminiRequests = requests.map(req => ({
          prompt: req.prompt,
          model: this.getModel(),
          systemInstruction: req.systemInstruction,
          responseType: req.responseFormat || 'text',
          temperature: req.temperature || 0.7,
          maxTokens: req.maxTokens || 1000
        }));

        const responses = await this.geminiService.generateBatch(geminiRequests);
        
        return responses.map((response: any) => ({
          success: response.success,
          data: response.content as T,
          error: response.error,
          model: response.model,
          tokensUsed: response.tokensUsed,
          responseTime: response.responseTime,
          retryCount: response.retryCount
        }));

      } catch (error) {
        console.error('❌ [Gemini] Batch generation failed:', error);
        return requests.map(() => ({
          success: false,
          error: error instanceof Error ? error.message : 'Batch operation failed'
        }));
      }
    }

    // Fallback to sequential processing
    const results: AIResponse<T>[] = [];
    for (const request of requests) {
      const result = await this.generateContent<T>(request);
      results.push(result);
    }
    return results;
  }

  estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  validateResponse<T>(response: any, validator?: (data: any) => boolean): T | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    if (validator && !validator(response)) {
      return null;
    }

    return response as T;
  }
}

/**
 * OpenAI Service Client
 */
export class OpenAIServiceClient implements AIServiceClient {
  private config: AIServiceConfig | null = null;

  configure(config: AIServiceConfig): void {
    this.config = config;
    console.log('🤖 [OpenAI] Client configured');
  }

  isConfigured(): boolean {
    return !!(this.config?.apiKey || process.env.OPENAI_API_KEY);
  }

  getProviderName(): string {
    return 'OpenAI';
  }

  getModel(): string {
    return this.config?.model || 'gpt-4o-mini';
  }

  async generateContent<T = string>(request: ContentGenerationRequest): Promise<AIResponse<T>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'OpenAI client not configured - API key required'
      };
    }

    try {
      console.log('🤖 [OpenAI] Generating content with', this.getModel());
      
      // Mock implementation - replace with actual OpenAI API call
      const mockResponse = await this.mockOpenAICall(request);
      
      return {
        success: true,
        data: mockResponse as T,
        model: this.getModel(),
        tokensUsed: this.estimateTokens(request.prompt + (mockResponse as string)),
        responseTime: 1500
      };

    } catch (error) {
      console.error('❌ [OpenAI] Content generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown OpenAI error'
      };
    }
  }

  async generateStructuredContent<T = any>(request: ContentGenerationRequest & { schema?: any }): Promise<AIResponse<T>> {
    const enhancedRequest = {
      ...request,
      prompt: request.responseFormat === 'json' 
        ? `${request.prompt}\n\nRespond with valid JSON only.`
        : request.prompt
    };

    const response = await this.generateContent<string>(enhancedRequest);
    
    if (response.success && request.responseFormat === 'json') {
      try {
        const parsedData = JSON.parse(response.data as string);
        return {
          ...response,
          data: parsedData as T
        };
      } catch (parseError) {
        return {
          success: false,
          error: 'Failed to parse JSON response'
        };
      }
    }

    return response as AIResponse<T>;
  }

  async generateBatch<T = string>(requests: ContentGenerationRequest[]): Promise<AIResponse<T>[]> {
    // OpenAI doesn't have native batch support for chat completions
    // Process sequentially with rate limiting
    const results: AIResponse<T>[] = [];
    
    for (let i = 0; i < requests.length; i++) {
      const result = await this.generateContent<T>(requests[i]);
      results.push(result);
      
      // Add delay to respect rate limits
      if (i < requests.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  estimateTokens(text: string): number {
    // More accurate OpenAI token estimation
    return Math.ceil(text.length / 4);
  }

  validateResponse<T>(response: any, validator?: (data: any) => boolean): T | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    if (validator && !validator(response)) {
      return null;
    }

    return response as T;
  }

  private async mockOpenAICall(request: ContentGenerationRequest): Promise<string> {
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (request.responseFormat === 'json') {
      return JSON.stringify({
        hook: "OpenAI-generated attention grabber",
        bridge: "OpenAI-crafted transition",
        goldenNugget: "OpenAI-identified core value",
        wta: "OpenAI-optimized call to action"
      });
    }
    
    return `OpenAI response to: ${request.prompt.substring(0, 100)}...`;
  }
}

/**
 * Claude Service Client (Anthropic)
 */
export class ClaudeServiceClient implements AIServiceClient {
  private config: AIServiceConfig | null = null;

  configure(config: AIServiceConfig): void {
    this.config = config;
    console.log('🤖 [Claude] Client configured');
  }

  isConfigured(): boolean {
    return !!(this.config?.apiKey || process.env.ANTHROPIC_API_KEY);
  }

  getProviderName(): string {
    return 'Claude';
  }

  getModel(): string {
    return this.config?.model || 'claude-3-5-sonnet-20241022';
  }

  async generateContent<T = string>(request: ContentGenerationRequest): Promise<AIResponse<T>> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Claude client not configured - API key required'
      };
    }

    try {
      console.log('🤖 [Claude] Generating content with', this.getModel());
      
      // Mock implementation - replace with actual Anthropic API call
      const mockResponse = await this.mockClaudeCall(request);
      
      return {
        success: true,
        data: mockResponse as T,
        model: this.getModel(),
        tokensUsed: this.estimateTokens(request.prompt + (mockResponse as string)),
        responseTime: 2000
      };

    } catch (error) {
      console.error('❌ [Claude] Content generation failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown Claude error'
      };
    }
  }

  async generateStructuredContent<T = any>(request: ContentGenerationRequest & { schema?: any }): Promise<AIResponse<T>> {
    const enhancedRequest = {
      ...request,
      prompt: request.responseFormat === 'json' 
        ? `${request.prompt}\n\nPlease respond with valid JSON only.`
        : request.prompt
    };

    const response = await this.generateContent<string>(enhancedRequest);
    
    if (response.success && request.responseFormat === 'json') {
      try {
        const parsedData = JSON.parse(response.data as string);
        return {
          ...response,
          data: parsedData as T
        };
      } catch (parseError) {
        return {
          success: false,
          error: 'Failed to parse JSON response from Claude'
        };
      }
    }

    return response as AIResponse<T>;
  }

  async generateBatch<T = string>(requests: ContentGenerationRequest[]): Promise<AIResponse<T>[]> {
    // Process requests sequentially
    const results: AIResponse<T>[] = [];
    
    for (const request of requests) {
      const result = await this.generateContent<T>(request);
      results.push(result);
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return results;
  }

  estimateTokens(text: string): number {
    // Claude token estimation
    return Math.ceil(text.length / 3.5);
  }

  validateResponse<T>(response: any, validator?: (data: any) => boolean): T | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    if (validator && !validator(response)) {
      return null;
    }

    return response as T;
  }

  private async mockClaudeCall(request: ContentGenerationRequest): Promise<string> {
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    if (request.responseFormat === 'json') {
      return JSON.stringify({
        hook: "Claude-analyzed hook with deep reasoning",
        bridge: "Claude-crafted logical transition",
        goldenNugget: "Claude-extracted nuanced insight",
        wta: "Claude-refined actionable step"
      });
    }
    
    return `Claude's thoughtful response to: ${request.prompt.substring(0, 100)}...`;
  }
}

/**
 * AI Service Client Manager
 * Manages multiple AI service clients with fallback support
 */
export class AIServiceClientManager {
  private clients: Map<string, AIServiceClient> = new Map();
  private defaultProvider: string = 'gemini';

  constructor() {
    this.initializeClients();
  }

  private initializeClients(): void {
    // Initialize all available clients
    this.clients.set('gemini', new GeminiServiceClient());
    this.clients.set('openai', new OpenAIServiceClient());
    this.clients.set('claude', new ClaudeServiceClient());
  }

  /**
   * Get a specific client by provider name
   */
  getClient(providerName: string): AIServiceClient | null {
    return this.clients.get(providerName.toLowerCase()) || null;
  }

  /**
   * Get the first available configured client
   */
  getAvailableClient(): AIServiceClient | null {
    // Try default provider first
    const defaultClient = this.clients.get(this.defaultProvider);
    if (defaultClient?.isConfigured()) {
      return defaultClient;
    }

    // Fall back to any configured client
    for (const client of this.clients.values()) {
      if (client.isConfigured()) {
        return client;
      }
    }

    return null;
  }

  /**
   * Get all clients with their configuration status
   */
  getClientStatus(): Array<{
    name: string;
    configured: boolean;
    model: string;
  }> {
    return Array.from(this.clients.values()).map(client => ({
      name: client.getProviderName(),
      configured: client.isConfigured(),
      model: client.getModel()
    }));
  }

  /**
   * Configure a specific client
   */
  configureClient(providerName: string, config: AIServiceConfig): boolean {
    const client = this.clients.get(providerName.toLowerCase());
    if (client) {
      client.configure(config);
      return true;
    }
    return false;
  }

  /**
   * Set the default provider
   */
  setDefaultProvider(providerName: string): boolean {
    if (this.clients.has(providerName.toLowerCase())) {
      this.defaultProvider = providerName.toLowerCase();
      return true;
    }
    return false;
  }

  /**
   * Generate content using the best available client
   */
  async generateContent<T = string>(request: ContentGenerationRequest): Promise<AIResponse<T>> {
    const client = this.getAvailableClient();
    
    if (!client) {
      return {
        success: false,
        error: 'No configured AI service clients available'
      };
    }

    console.log(`🤖 [AIManager] Using ${client.getProviderName()} for content generation`);
    return client.generateContent<T>(request);
  }

  /**
   * Generate structured content using the best available client
   */
  async generateStructuredContent<T = any>(
    request: ContentGenerationRequest & { schema?: any }
  ): Promise<AIResponse<T>> {
    const client = this.getAvailableClient();
    
    if (!client) {
      return {
        success: false,
        error: 'No configured AI service clients available'
      };
    }

    console.log(`🤖 [AIManager] Using ${client.getProviderName()} for structured generation`);
    return client.generateStructuredContent<T>(request);
  }
}

// Export singleton instance
export const aiServiceManager = new AIServiceClientManager();

// Export factory functions
export function createGeminiClient(geminiService?: any): GeminiServiceClient {
  return new GeminiServiceClient(geminiService);
}

export function createOpenAIClient(): OpenAIServiceClient {
  return new OpenAIServiceClient();
}

export function createClaudeClient(): ClaudeServiceClient {
  return new ClaudeServiceClient();
}