/**
 * Content Analysis Service - Pure TypeScript business logic
 * Extracted from React components for reusability across platforms
 */

import { GeminiService, type GeminiRequest, type GeminiResponse } from './services/gemini-service';
import { ForensicVoiceAnalysis, GeneratedScript } from './types/voice-analysis';

// Core interfaces for content analysis
export interface ContentAnalysisRequest {
  content: string;
  type: 'script' | 'transcript' | 'voice' | 'general';
  metadata?: {
    duration?: number;
    wordCount?: number;
    source?: string;
    timestamp?: string;
  };
}

export interface ScriptComponents {
  hook: string;
  bridge: string;
  goldenNugget: string;
  wta: string;
}

export interface ContentMetrics {
  engagement: 'low' | 'medium' | 'high';
  sentiment: 'negative' | 'neutral' | 'positive';
  readability: number; // 0-100 scale
  keyTopics: string[];
  keywords: string[];
  hashtags: string[];
}

export interface VoicePersona {
  name: string;
  style: string;
  tone: string;
  vocabulary: string[];
  patterns: string[];
  confidence: number;
}

export interface ContentAnalysisResult {
  success: boolean;
  components?: ScriptComponents;
  metrics?: ContentMetrics;
  voicePersona?: VoicePersona;
  suggestions: string[];
  confidence: number;
  processingTime: number;
  model: string;
  error?: string;
}

export interface AIClientConfig {
  apiKey: string;
  model?: string;
  timeout?: number;
  retries?: number;
  temperature?: number;
}

// AI Client abstraction interface
export interface AIClient {
  analyzeScript(content: string, config?: AIClientConfig): Promise<ScriptComponents | null>;
  analyzeVoice(content: string, config?: AIClientConfig): Promise<ForensicVoiceAnalysis | null>;
  generateScript(prompt: string, voiceAnalysis?: ForensicVoiceAnalysis, config?: AIClientConfig): Promise<GeneratedScript | null>;
  analyzeContent(content: string, config?: AIClientConfig): Promise<ContentMetrics | null>;
  isConfigured(): boolean;
  getName(): string;
  getModel(): string;
}

/**
 * Content Analysis Service
 * Orchestrates AI-powered analysis workflows without React dependencies
 */
export class ContentAnalysisService {
  private geminiService: GeminiService;
  private clients: Map<string, AIClient> = new Map();

  constructor() {
    this.geminiService = GeminiService.getInstance();
    this.initializeClients();
  }

  /**
   * Analyze script components (Hook, Bridge, Golden Nugget, WTA)
   */
  async analyzeScriptComponents(request: ContentAnalysisRequest): Promise<ScriptComponents | null> {
    console.log('📝 [ContentAnalysis] Analyzing script components...');
    console.log('📊 [ContentAnalysis] Content length:', request.content.length, 'characters');

    const prompt = this.buildScriptAnalysisPrompt(request.content);
    
    try {
      const response = await this.geminiService.generateContent<ScriptComponents>({
        prompt,
        model: "gemini-1.5-flash",
        responseType: "json",
        temperature: 0.3,
        maxTokens: 1000,
        systemInstruction: `You are an expert at analyzing social media content and identifying its structural components. 
        Return a JSON object with exactly these keys: hook, bridge, goldenNugget, wta. 
        Each value should be a direct quote from the content when possible, or a synthesized version that captures the essence.`
      });

      if (response.success && response.content) {
        console.log('✅ [ContentAnalysis] Script analysis successful');
        return this.validateScriptComponents(response.content) ? response.content : null;
      }

      console.warn('⚠️ [ContentAnalysis] Script analysis failed or returned invalid data');
      return null;

    } catch (error) {
      console.error('❌ [ContentAnalysis] Script analysis error:', error);
      return null;
    }
  }

  /**
   * Perform voice analysis using forensic prompt
   */
  async analyzeVoice(request: ContentAnalysisRequest): Promise<ForensicVoiceAnalysis | null> {
    console.log('🎤 [ContentAnalysis] Starting voice analysis...');

    if (request.content.length < 500) {
      console.warn('⚠️ [ContentAnalysis] Content too short for reliable voice analysis');
      return null;
    }

    const prompt = this.buildVoiceAnalysisPrompt(request.content);

    try {
      const response = await this.geminiService.generateContent<ForensicVoiceAnalysis>({
        prompt,
        model: "gemini-1.5-pro",
        responseType: "json",
        temperature: 0.1,
        maxTokens: 4000,
        systemInstruction: `You are a forensic voice analysis expert. Analyze the writing patterns, linguistic fingerprints, and structural formulas in the provided content. Return comprehensive analysis as structured JSON.`
      });

      if (response.success && response.content) {
        console.log('✅ [ContentAnalysis] Voice analysis successful');
        return response.content;
      }

      return null;

    } catch (error) {
      console.error('❌ [ContentAnalysis] Voice analysis error:', error);
      return null;
    }
  }

  /**
   * Generate content metrics and insights
   */
  async analyzeContentMetrics(request: ContentAnalysisRequest): Promise<ContentMetrics | null> {
    console.log('📊 [ContentAnalysis] Analyzing content metrics...');

    const prompt = this.buildMetricsAnalysisPrompt(request.content);

    try {
      const response = await this.geminiService.generateContent<ContentMetrics>({
        prompt,
        model: "gemini-1.5-flash",
        responseType: "json",
        temperature: 0.2,
        maxTokens: 800,
        systemInstruction: `Analyze content for engagement potential, sentiment, readability, topics, and keywords. Return structured metrics as JSON.`
      });

      if (response.success && response.content) {
        // Ensure hashtags are extracted
        if (response.content.hashtags) {
          response.content.hashtags = this.extractHashtags(request.content);
        }

        console.log('✅ [ContentAnalysis] Metrics analysis successful');
        return response.content;
      }

      return null;

    } catch (error) {
      console.error('❌ [ContentAnalysis] Metrics analysis error:', error);
      return null;
    }
  }

  /**
   * Generate script using voice analysis patterns
   */
  async generateScriptWithVoice(
    topic: string,
    voiceAnalysis: ForensicVoiceAnalysis,
    length: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<GeneratedScript | null> {
    console.log('✨ [ContentAnalysis] Generating script with voice patterns...');

    const prompt = this.buildScriptGenerationPrompt(topic, voiceAnalysis, length);

    try {
      const response = await this.geminiService.generateContent<GeneratedScript>({
        prompt,
        model: "gemini-1.5-pro",
        responseType: "json",
        temperature: 0.7,
        maxTokens: 2000,
        systemInstruction: `Generate a social media script that perfectly replicates the voice patterns and structural formulas from the provided analysis. Follow all frequency guides and pattern distributions precisely.`
      });

      if (response.success && response.content) {
        console.log('✅ [ContentAnalysis] Script generation successful');
        return response.content;
      }

      return null;

    } catch (error) {
      console.error('❌ [ContentAnalysis] Script generation error:', error);
      return null;
    }
  }

  /**
   * Perform comprehensive content analysis
   */
  async performCompleteAnalysis(request: ContentAnalysisRequest): Promise<ContentAnalysisResult> {
    const startTime = Date.now();
    
    console.log('🚀 [ContentAnalysis] Starting complete analysis pipeline...');

    try {
      // Run analyses in parallel where possible
      const [components, voiceAnalysis, metrics] = await Promise.allSettled([
        this.analyzeScriptComponents(request),
        request.type === 'voice' || request.content.length > 500 ? this.analyzeVoice(request) : Promise.resolve(null),
        this.analyzeContentMetrics(request)
      ]);

      const processingTime = Date.now() - startTime;

      // Extract successful results
      const scriptComponents = components.status === 'fulfilled' ? components.value : undefined;
      const voiceResult = voiceAnalysis.status === 'fulfilled' ? voiceAnalysis.value : undefined;
      const metricsResult = metrics.status === 'fulfilled' ? metrics.value : undefined;

      // Generate suggestions based on analysis
      const suggestions = this.generateSuggestions(scriptComponents, metricsResult);

      // Calculate overall confidence
      const confidence = this.calculateConfidence(scriptComponents, voiceResult, metricsResult);

      console.log(`⏱️ [ContentAnalysis] Complete analysis finished in ${processingTime}ms`);

      return {
        success: true,
        components: scriptComponents || undefined,
        metrics: metricsResult || undefined,
        voicePersona: voiceResult ? this.extractVoicePersona(voiceResult) : undefined,
        suggestions,
        confidence,
        processingTime,
        model: 'gemini-1.5-flash'
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ [ContentAnalysis] Complete analysis failed:', error);

      return {
        success: false,
        suggestions: ['Analysis failed - please try again'],
        confidence: 0,
        processingTime,
        model: 'gemini-1.5-flash',
        error: error instanceof Error ? error.message : 'Unknown analysis error'
      };
    }
  }

  /**
   * Extract hashtags from content
   */
  extractHashtags(content: string): string[] {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    const matches = content.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  /**
   * Get service configuration status
   */
  getServiceStatus(): {
    gemini: { configured: boolean; available: boolean; model: string };
    clients: Array<{ name: string; configured: boolean; model: string }>;
  } {
    return {
      gemini: {
        configured: !!process.env.GEMINI_API_KEY,
        available: !!process.env.GEMINI_API_KEY,
        model: 'gemini-1.5-flash'
      },
      clients: Array.from(this.clients.values()).map(client => ({
        name: client.getName(),
        configured: client.isConfigured(),
        model: client.getModel()
      }))
    };
  }

  // Private helper methods

  private initializeClients(): void {
    // Initialize AI clients (can be extended with OpenAI, Claude, etc.)
    this.clients.set('gemini', new GeminiAIClient());
  }

  private buildScriptAnalysisPrompt(content: string): string {
    return `Analyze this social media content and identify the four key components:

CONTENT TO ANALYZE:
${content}

Instructions:
1. HOOK: The attention-grabbing opening (first 1-2 sentences)
2. BRIDGE: The transition that connects hook to main content
3. GOLDEN NUGGET: The core value/insight/teaching moment
4. WTA (What To Action): The call-to-action or next step

Extract these components as direct quotes when possible. If components blend together, synthesize them while maintaining the original voice and style.

Return as JSON with keys: hook, bridge, goldenNugget, wta`;
  }

  private buildVoiceAnalysisPrompt(content: string): string {
    return `Perform forensic voice analysis on this content. Extract all linguistic patterns, structural formulas, and unconscious writing habits that make this voice unique and replicatable.

CONTENT TO ANALYZE:
${content}

Focus on:
- Hook engineering patterns and formulas
- Sentence architecture and flow patterns
- Micro-language fingerprints (adjective stacking, emphasis patterns, verbal tics)
- Content rhythm and energy wave patterns
- Frequency patterns for consistent replication

Provide comprehensive analysis suitable for generating new content in this exact voice.`;
  }

  private buildMetricsAnalysisPrompt(content: string): string {
    return `Analyze this content for engagement potential, sentiment, and key characteristics:

CONTENT:
${content}

Provide analysis including:
- Engagement level (low/medium/high) based on hook strength, emotional appeal, call-to-action clarity
- Sentiment (negative/neutral/positive)
- Readability score (0-100, where 100 is most accessible)
- Key topics (3-5 main subjects)
- Important keywords (5-10 most relevant terms)
- Extracted hashtags if present

Return as structured JSON.`;
  }

  private buildScriptGenerationPrompt(topic: string, voiceAnalysis: ForensicVoiceAnalysis, length: string): string {
    const wordTargets = { short: 150, medium: 300, long: 500 };
    const targetWords = wordTargets[length as keyof typeof wordTargets];

    return `Generate a ${length} social media script about "${topic}" using the exact voice patterns and formulas from this analysis.

VOICE ANALYSIS PATTERNS:
${JSON.stringify(voiceAnalysis, null, 2)}

REQUIREMENTS:
- Target length: ~${targetWords} words
- Use the primary hook formula identified in the analysis
- Follow the sentence flow patterns exactly
- Include unconscious verbal tics at correct frequencies
- Match the energy wave pattern progression
- Use identified adjective combinations and emphasis patterns

Generate authentic content that sounds like it was written by the same person as the analyzed content.`;
  }

  private validateScriptComponents(components: any): boolean {
    return !!(
      components &&
      typeof components.hook === 'string' &&
      typeof components.bridge === 'string' &&
      typeof components.goldenNugget === 'string' &&
      typeof components.wta === 'string' &&
      components.hook.length > 5 &&
      components.bridge.length > 5 &&
      components.goldenNugget.length > 5 &&
      components.wta.length > 5
    );
  }

  private generateSuggestions(components?: ScriptComponents, metrics?: ContentMetrics): string[] {
    const suggestions: string[] = [];

    if (components) {
      if (components.hook.length < 20) {
        suggestions.push('Hook could be more detailed and engaging');
      }
      if (!components.hook.includes('?') && !components.hook.includes('!')) {
        suggestions.push('Consider adding a question or exclamation to the hook');
      }
      if (components.wta.length < 15) {
        suggestions.push('Call-to-action could be more specific and compelling');
      }
    }

    if (metrics) {
      if (metrics.engagement === 'low') {
        suggestions.push('Content lacks engaging elements - consider stronger hooks or emotional appeal');
      }
      if (metrics.readability < 60) {
        suggestions.push('Content may be too complex - consider simplifying language');
      }
      if (metrics.keyTopics.length < 2) {
        suggestions.push('Content could benefit from additional relevant topics');
      }
    }

    if (suggestions.length === 0) {
      suggestions.push('Content analysis looks good - consider A/B testing different versions');
    }

    return suggestions;
  }

  private calculateConfidence(components?: ScriptComponents, voice?: ForensicVoiceAnalysis, metrics?: ContentMetrics): number {
    let score = 0;
    let factors = 0;

    if (components) {
      factors += 4;
      score += components.hook.length > 20 ? 1 : 0.5;
      score += components.bridge.length > 15 ? 1 : 0.5;
      score += components.goldenNugget.length > 25 ? 1 : 0.5;
      score += components.wta.length > 15 ? 1 : 0.5;
    }

    if (voice?.metadata.confidenceScore) {
      factors += 1;
      score += voice.metadata.confidenceScore;
    }

    if (metrics) {
      factors += 2;
      score += metrics.engagement === 'high' ? 1 : metrics.engagement === 'medium' ? 0.7 : 0.3;
      score += metrics.readability > 70 ? 1 : metrics.readability > 50 ? 0.7 : 0.3;
    }

    return factors > 0 ? Math.round((score / factors) * 100) / 100 : 0;
  }

  private extractVoicePersona(analysis: ForensicVoiceAnalysis): VoicePersona {
    const primaryHook = analysis.hookEngineering?.primaryHookFormula;
    const emphasisPatterns = analysis.microLanguageFingerprint?.emphasisEscalationLadder;
    const unconsciousTics = analysis.microLanguageFingerprint?.unconsciousVerbalTics;

    return {
      name: analysis.metadata?.creatorName || 'Unknown Creator',
      style: primaryHook?.signature || 'Mixed style',
      tone: this.inferTone(analysis),
      vocabulary: this.extractVocabulary(analysis),
      patterns: this.extractPatterns(analysis),
      confidence: analysis.metadata?.confidenceScore || 0
    };
  }

  private inferTone(analysis: ForensicVoiceAnalysis): string {
    const toneIndicators = [];
    
    if (analysis.microLanguageFingerprint?.excitementMarkers?.frequency === 'high') {
      toneIndicators.push('energetic');
    }
    if (analysis.microLanguageFingerprint?.uncertaintyMarkers?.frequency === 'low') {
      toneIndicators.push('confident');
    }
    if (analysis.hookEngineering?.primaryHookFormula?.type === 'question') {
      toneIndicators.push('inquisitive');
    }

    return toneIndicators.length > 0 ? toneIndicators.join(', ') : 'neutral';
  }

  private extractVocabulary(analysis: ForensicVoiceAnalysis): string[] {
    const vocab: string[] = [];
    
    // Extract from adjective patterns
    if (analysis.microLanguageFingerprint?.adjectiveStackingPatterns?.single?.topAdjectives) {
      vocab.push(...analysis.microLanguageFingerprint.adjectiveStackingPatterns.single.topAdjectives);
    }

    // Extract from emphasis ladder
    if (analysis.microLanguageFingerprint?.emphasisEscalationLadder?.strong?.words) {
      vocab.push(...analysis.microLanguageFingerprint.emphasisEscalationLadder.strong.words);
    }

    return [...new Set(vocab)].slice(0, 10); // Remove duplicates, limit to 10
  }

  private extractPatterns(analysis: ForensicVoiceAnalysis): string[] {
    const patterns: string[] = [];

    if (analysis.hookEngineering?.primaryHookFormula?.signature) {
      patterns.push(`Primary hook: ${analysis.hookEngineering.primaryHookFormula.signature}`);
    }

    if (analysis.sentenceArchitecturePatterns?.sentenceFlowFormulas) {
      patterns.push(...analysis.sentenceArchitecturePatterns.sentenceFlowFormulas.map(f => f.patternName));
    }

    if (analysis.microLanguageFingerprint?.unconsciousVerbalTics?.thinkingPauses?.exactFiller) {
      patterns.push(`Uses "${analysis.microLanguageFingerprint.unconsciousVerbalTics.thinkingPauses.exactFiller}" for thinking pauses`);
    }

    return patterns.slice(0, 5); // Limit to 5 most important patterns
  }
}

/**
 * Gemini AI Client implementation
 */
class GeminiAIClient implements AIClient {
  private geminiService = GeminiService.getInstance();

  async analyzeScript(content: string, config?: AIClientConfig): Promise<ScriptComponents | null> {
    const response = await this.geminiService.generateContent<ScriptComponents>({
      prompt: `Analyze this content for script components: ${content}`,
      responseType: 'json',
      temperature: config?.temperature || 0.3,
      maxTokens: config?.timeout || 1000
    });

    return response.success ? response.content : null;
  }

  async analyzeVoice(content: string, config?: AIClientConfig): Promise<ForensicVoiceAnalysis | null> {
    const response = await this.geminiService.generateContent<ForensicVoiceAnalysis>({
      prompt: `Perform forensic voice analysis: ${content}`,
      responseType: 'json',
      temperature: config?.temperature || 0.1,
      maxTokens: config?.timeout || 4000
    });

    return response.success ? response.content : null;
  }

  async generateScript(prompt: string, voiceAnalysis?: ForensicVoiceAnalysis, config?: AIClientConfig): Promise<GeneratedScript | null> {
    let fullPrompt = prompt;
    if (voiceAnalysis) {
      fullPrompt += `\n\nUse voice patterns: ${JSON.stringify(voiceAnalysis)}`;
    }

    const response = await this.geminiService.generateContent<GeneratedScript>({
      prompt: fullPrompt,
      responseType: 'json',
      temperature: config?.temperature || 0.7,
      maxTokens: config?.timeout || 2000
    });

    return response.success ? response.content : null;
  }

  async analyzeContent(content: string, config?: AIClientConfig): Promise<ContentMetrics | null> {
    const response = await this.geminiService.generateContent<ContentMetrics>({
      prompt: `Analyze content metrics: ${content}`,
      responseType: 'json',
      temperature: config?.temperature || 0.2,
      maxTokens: config?.timeout || 800
    });

    return response.success ? response.content : null;
  }

  isConfigured(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  getName(): string {
    return 'Gemini';
  }

  getModel(): string {
    return 'gemini-1.5-flash';
  }
}

// Export factory function for easy instantiation
export function createContentAnalysisService(): ContentAnalysisService {
  return new ContentAnalysisService();
}

// Export singleton instance
export const contentAnalysisService = new ContentAnalysisService();