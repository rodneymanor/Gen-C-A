/**
 * Service Interfaces for New UI Components
 * Clean, framework-agnostic interfaces for consuming AI and content analysis services
 */

import type { 
  ContentAnalysisService, 
  ContentAnalysisRequest, 
  ContentAnalysisResult,
  ScriptComponents,
  ContentMetrics,
  VoicePersona 
} from './content-analysis-service';

import type { 
  AIServiceClientManager, 
  ContentGenerationRequest, 
  AIResponse 
} from './ai-service-clients';

import type { ForensicVoiceAnalysis, GeneratedScript } from './types/voice-analysis';
import type { ScriptElements } from './script-analysis';

// Event types for reactive UI updates
export type ServiceEventType = 
  | 'analysis_started'
  | 'analysis_progress' 
  | 'analysis_completed'
  | 'analysis_failed'
  | 'generation_started'
  | 'generation_completed'
  | 'generation_failed'
  | 'service_configured'
  | 'service_error';

export interface ServiceEvent<T = any> {
  type: ServiceEventType;
  data?: T;
  error?: string;
  timestamp: number;
  serviceId?: string;
}

export type ServiceEventHandler<T = any> = (event: ServiceEvent<T>) => void;

// UI-friendly analysis results
export interface UIAnalysisResult {
  id: string;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  type: 'script' | 'voice' | 'content' | 'complete';
  content: string;
  result?: ContentAnalysisResult;
  error?: string;
  startTime: number;
  endTime?: number;
  metadata?: {
    wordCount: number;
    duration?: number;
    source?: string;
  };
}

export interface UIGenerationRequest {
  id: string;
  type: 'script' | 'content' | 'voice_replication';
  prompt: string;
  options?: {
    length?: 'short' | 'medium' | 'long';
    tone?: string;
    style?: string;
    voicePattern?: string;
  };
  voiceAnalysis?: ForensicVoiceAnalysis;
}

export interface UIGenerationResult {
  id: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  request: UIGenerationRequest;
  result?: GeneratedScript | string;
  error?: string;
  startTime: number;
  endTime?: number;
  metadata?: {
    model: string;
    tokensUsed?: number;
    quality?: number;
  };
}

// Service status for UI display
export interface ServiceStatus {
  name: string;
  configured: boolean;
  available: boolean;
  model?: string;
  lastUsed?: number;
  usage?: {
    requests: number;
    errors: number;
    avgResponseTime: number;
  };
}

/**
 * Main interface for UI components to interact with AI services
 */
export interface AIServicesInterface {
  // Analysis methods
  analyzeContent(content: string, type?: 'script' | 'voice' | 'general'): Promise<UIAnalysisResult>;
  analyzeScriptComponents(content: string): Promise<ScriptComponents | null>;
  analyzeVoicePatterns(content: string): Promise<ForensicVoiceAnalysis | null>;
  
  // Generation methods
  generateContent(request: UIGenerationRequest): Promise<UIGenerationResult>;
  generateScript(topic: string, options?: UIGenerationRequest['options']): Promise<UIGenerationResult>;
  generateWithVoice(prompt: string, voiceAnalysis: ForensicVoiceAnalysis): Promise<UIGenerationResult>;
  
  // Batch operations
  analyzeBatch(contents: Array<{ id: string; content: string; type?: string }>): Promise<UIAnalysisResult[]>;
  
  // Service management
  getServiceStatus(): ServiceStatus[];
  configureService(name: string, config: { apiKey: string; model?: string }): boolean;
  testConnection(serviceName?: string): Promise<boolean>;
  
  // Event handling
  addEventListener(eventType: ServiceEventType, handler: ServiceEventHandler): void;
  removeEventListener(eventType: ServiceEventType, handler: ServiceEventHandler): void;
  
  // Utility methods
  estimateCost(content: string, operation: 'analyze' | 'generate'): { tokens: number; estimatedCost: number };
  exportAnalysisResults(format: 'json' | 'csv'): Promise<string>;
  
  // Cache management
  clearCache(): void;
  getCacheStats(): { size: number; hits: number; misses: number };
}

/**
 * Implementation of AIServicesInterface
 */
export class AIServicesManager implements AIServicesInterface {
  private contentAnalysisService: ContentAnalysisService;
  private aiClientManager: AIServiceClientManager;
  private eventHandlers: Map<ServiceEventType, ServiceEventHandler[]> = new Map();
  private results: Map<string, UIAnalysisResult | UIGenerationResult> = new Map();
  private usageStats: Map<string, { requests: number; errors: number; totalTime: number }> = new Map();

  constructor(
    contentAnalysisService: ContentAnalysisService,
    aiClientManager: AIServiceClientManager
  ) {
    this.contentAnalysisService = contentAnalysisService;
    this.aiClientManager = aiClientManager;
  }

  async analyzeContent(content: string, type: 'script' | 'voice' | 'general' = 'general'): Promise<UIAnalysisResult> {
    const id = this.generateId();
    const startTime = Date.now();

    const analysisResult: UIAnalysisResult = {
      id,
      status: 'analyzing',
      type: type === 'general' ? 'content' : type,
      content,
      startTime,
      metadata: {
        wordCount: content.split(/\s+/).length,
        source: 'user_input'
      }
    };

    this.results.set(id, analysisResult);
    this.emitEvent('analysis_started', analysisResult);

    try {
      const request: ContentAnalysisRequest = {
        content,
        type: type as 'script' | 'voice' | 'general',
        metadata: {
          wordCount: analysisResult.metadata!.wordCount,
          timestamp: new Date().toISOString()
        }
      };

      const result = await this.contentAnalysisService.performCompleteAnalysis(request);
      
      analysisResult.status = result.success ? 'completed' : 'failed';
      analysisResult.result = result;
      analysisResult.endTime = Date.now();
      analysisResult.error = result.error;

      this.results.set(id, analysisResult);
      this.updateUsageStats(this.contentAnalysisService.getServiceStatus().gemini.model, result.success);
      
      this.emitEvent(result.success ? 'analysis_completed' : 'analysis_failed', analysisResult);

      return analysisResult;

    } catch (error) {
      analysisResult.status = 'failed';
      analysisResult.error = error instanceof Error ? error.message : 'Unknown analysis error';
      analysisResult.endTime = Date.now();

      this.results.set(id, analysisResult);
      this.emitEvent('analysis_failed', analysisResult);

      return analysisResult;
    }
  }

  async analyzeScriptComponents(content: string): Promise<ScriptComponents | null> {
    const request: ContentAnalysisRequest = {
      content,
      type: 'script',
      metadata: {
        wordCount: content.split(/\s+/).length,
        timestamp: new Date().toISOString()
      }
    };

    return this.contentAnalysisService.analyzeScriptComponents(request);
  }

  async analyzeVoicePatterns(content: string): Promise<ForensicVoiceAnalysis | null> {
    const request: ContentAnalysisRequest = {
      content,
      type: 'voice',
      metadata: {
        wordCount: content.split(/\s+/).length,
        timestamp: new Date().toISOString()
      }
    };

    return this.contentAnalysisService.analyzeVoice(request);
  }

  async generateContent(request: UIGenerationRequest): Promise<UIGenerationResult> {
    const startTime = Date.now();

    const generationResult: UIGenerationResult = {
      id: request.id,
      status: 'generating',
      request,
      startTime
    };

    this.results.set(request.id, generationResult);
    this.emitEvent('generation_started', generationResult);

    try {
      let result: any = null;

      if (request.type === 'script' && request.voiceAnalysis) {
        // Generate script with voice patterns
        const targetLength = request.options?.length || 'medium';
        result = await this.contentAnalysisService.generateScriptWithVoice(
          request.prompt,
          request.voiceAnalysis,
          targetLength
        );
      } else {
        // Generate generic content
        const aiRequest: ContentGenerationRequest = {
          prompt: request.prompt,
          temperature: 0.7,
          maxTokens: this.getMaxTokensForLength(request.options?.length)
        };

        const aiResponse = await this.aiClientManager.generateContent(aiRequest);
        result = aiResponse.success ? aiResponse.data : null;
      }

      generationResult.status = result ? 'completed' : 'failed';
      generationResult.result = result;
      generationResult.endTime = Date.now();

      if (!result) {
        generationResult.error = 'Generation failed - no result returned';
      }

      this.results.set(request.id, generationResult);
      this.emitEvent(result ? 'generation_completed' : 'generation_failed', generationResult);

      return generationResult;

    } catch (error) {
      generationResult.status = 'failed';
      generationResult.error = error instanceof Error ? error.message : 'Unknown generation error';
      generationResult.endTime = Date.now();

      this.results.set(request.id, generationResult);
      this.emitEvent('generation_failed', generationResult);

      return generationResult;
    }
  }

  async generateScript(topic: string, options?: UIGenerationRequest['options']): Promise<UIGenerationResult> {
    const request: UIGenerationRequest = {
      id: this.generateId(),
      type: 'script',
      prompt: `Create a social media script about: ${topic}`,
      options
    };

    return this.generateContent(request);
  }

  async generateWithVoice(prompt: string, voiceAnalysis: ForensicVoiceAnalysis): Promise<UIGenerationResult> {
    const request: UIGenerationRequest = {
      id: this.generateId(),
      type: 'voice_replication',
      prompt,
      voiceAnalysis
    };

    return this.generateContent(request);
  }

  async analyzeBatch(contents: Array<{ id: string; content: string; type?: string }>): Promise<UIAnalysisResult[]> {
    console.log(`🔄 [AIServices] Starting batch analysis of ${contents.length} items`);

    const results: UIAnalysisResult[] = [];
    
    // Process in parallel batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < contents.length; i += batchSize) {
      const batch = contents.slice(i, i + batchSize);
      const batchPromises = batch.map(item => 
        this.analyzeContent(item.content, item.type as any)
      );
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          // Create failed result
          const failedResult: UIAnalysisResult = {
            id: batch[index].id,
            status: 'failed',
            type: 'content',
            content: batch[index].content,
            startTime: Date.now(),
            endTime: Date.now(),
            error: result.reason?.message || 'Unknown error',
            metadata: {
              wordCount: batch[index].content.split(/\s+/).length
            }
          };
          results.push(failedResult);
        }
      });
    }

    return results;
  }

  getServiceStatus(): ServiceStatus[] {
    const aiStatus = this.aiClientManager.getClientStatus();
    const contentStatus = this.contentAnalysisService.getServiceStatus();

    return [
      ...aiStatus.map(client => ({
        name: client.name,
        configured: client.configured,
        available: client.configured,
        model: client.model,
        lastUsed: 0,
        usage: this.usageStats.get(client.name) || { requests: 0, errors: 0, avgResponseTime: 0 }
      })),
      {
        name: 'Content Analysis',
        configured: contentStatus.gemini.configured,
        available: contentStatus.gemini.available,
        model: contentStatus.gemini.model,
        usage: this.usageStats.get('ContentAnalysis') || { requests: 0, errors: 0, avgResponseTime: 0 }
      }
    ];
  }

  configureService(name: string, config: { apiKey: string; model?: string }): boolean {
    const success = this.aiClientManager.configureClient(name, {
      apiKey: config.apiKey,
      model: config.model
    });

    if (success) {
      this.emitEvent('service_configured', { serviceName: name, model: config.model });
    }

    return success;
  }

  async testConnection(serviceName?: string): Promise<boolean> {
    try {
      const testRequest: ContentGenerationRequest = {
        prompt: 'Test connection - respond with "OK"',
        maxTokens: 10
      };

      const response = serviceName 
        ? await this.aiClientManager.getClient(serviceName)?.generateContent(testRequest)
        : await this.aiClientManager.generateContent(testRequest);

      return response?.success || false;

    } catch (error) {
      console.error('❌ [AIServices] Connection test failed:', error);
      return false;
    }
  }

  addEventListener(eventType: ServiceEventType, handler: ServiceEventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  removeEventListener(eventType: ServiceEventType, handler: ServiceEventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  estimateCost(content: string, operation: 'analyze' | 'generate'): { tokens: number; estimatedCost: number } {
    const tokens = Math.ceil(content.length / 4);
    
    // Rough cost estimation (adjust based on actual pricing)
    const costPerThousandTokens = operation === 'analyze' ? 0.0015 : 0.002; // Example pricing
    const estimatedCost = (tokens / 1000) * costPerThousandTokens;

    return {
      tokens,
      estimatedCost: Math.round(estimatedCost * 10000) / 10000 // Round to 4 decimal places
    };
  }

  async exportAnalysisResults(format: 'json' | 'csv'): Promise<string> {
    const results = Array.from(this.results.values())
      .filter(result => result.status === 'completed');

    if (format === 'json') {
      return JSON.stringify(results, null, 2);
    }

    // CSV export
    const headers = ['ID', 'Type', 'Status', 'Word Count', 'Processing Time', 'Model'];
    const rows = results.map(result => [
      result.id,
      'type' in result ? result.type : 'generation',
      result.status,
      'metadata' in result ? result.metadata?.wordCount || 0 : 0,
      result.endTime && result.startTime ? result.endTime - result.startTime : 0,
      'result' in result ? result.result?.model || 'unknown' : 'unknown'
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  clearCache(): void {
    this.results.clear();
    console.log('🧹 [AIServices] Cache cleared');
  }

  getCacheStats(): { size: number; hits: number; misses: number } {
    return {
      size: this.results.size,
      hits: 0, // Would implement proper cache hit tracking
      misses: 0
    };
  }

  // Private helper methods

  private generateId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private emitEvent<T>(type: ServiceEventType, data?: T): void {
    const event: ServiceEvent<T> = {
      type,
      data,
      timestamp: Date.now()
    };

    const handlers = this.eventHandlers.get(type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`❌ [AIServices] Event handler error for ${type}:`, error);
      }
    });
  }

  private updateUsageStats(serviceName: string, success: boolean): void {
    if (!this.usageStats.has(serviceName)) {
      this.usageStats.set(serviceName, { requests: 0, errors: 0, totalTime: 0 });
    }

    const stats = this.usageStats.get(serviceName)!;
    stats.requests++;
    if (!success) {
      stats.errors++;
    }
  }

  private getMaxTokensForLength(length?: string): number {
    switch (length) {
      case 'short': return 300;
      case 'medium': return 800;
      case 'long': return 1500;
      default: return 800;
    }
  }
}

// Factory function to create configured services manager
export function createAIServicesManager(): AIServicesManager {
  // This would be injected with actual service instances
  const contentAnalysisService = null as any; // Placeholder
  const aiClientManager = null as any; // Placeholder
  
  return new AIServicesManager(contentAnalysisService, aiClientManager);
}

// Export utility types for UI components
export type {
  ContentAnalysisRequest,
  ContentAnalysisResult,
  ScriptComponents,
  ContentMetrics,
  VoicePersona,
  ForensicVoiceAnalysis,
  GeneratedScript,
  ScriptElements
};

// Export commonly used interfaces
export type {
  UIAnalysisResult,
  UIGenerationRequest,
  UIGenerationResult,
  ServiceStatus,
  ServiceEvent,
  ServiceEventHandler
};