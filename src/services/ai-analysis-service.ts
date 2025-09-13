/**
 * AIAnalysisService - AI-powered video content analysis
 * Extracted from script analysis and visual analysis implementations
 */

export interface ScriptComponents {
  hook: string;
  bridge: string;
  nugget: string;
  wta: string;
}

export interface ContentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  topics: string[];
  keywords: string[];
  contentType: 'educational' | 'entertainment' | 'promotional' | 'informational';
  engagement: 'high' | 'medium' | 'low';
}

export interface VisualAnalysis {
  sceneDescription: string;
  textOverlays: string[];
  visualTransitions: string[];
  keyElements: string[];
  colorScheme: string;
  technicalAspects: string;
  visualStyle: string;
}

export interface AIAnalysisResult {
  success: boolean;
  components?: ScriptComponents;
  contentAnalysis?: ContentAnalysis;
  visualAnalysis?: VisualAnalysis;
  visualContext?: string;
  metadata: {
    method: string;
    processedAt: string;
    inputLength?: number;
    model?: string;
  };
  error?: string;
}

export interface AIProvider {
  /**
   * Analyze script components (Hook, Bridge, Nugget, WTA)
   */
  analyzeScript(transcript: string): Promise<ScriptComponents | null>;
  
  /**
   * Analyze visual content from video URL
   */
  analyzeVisuals(videoUrl: string): Promise<string | null>;
  
  /**
   * Analyze content for topics, sentiment, etc.
   */
  analyzeContent(transcript: string): Promise<ContentAnalysis | null>;
  
  /**
   * Check if provider is available
   */
  isAvailable(): boolean;
  
  /**
   * Get provider name
   */
  getName(): string;
  
  /**
   * Get model information
   */
  getModel(): string;
}

/**
 * AI-powered content analysis service
 */
export class AIAnalysisService {
  private providers: AIProvider[] = [];

  constructor() {
    // Initialize AI providers in order of preference
    this.providers = [
      new GeminiAIProvider(),
      new OpenAIProvider(),
      new ClaudeProvider()
    ];
  }

  /**
   * Analyze script components using best available provider
   */
  async analyzeScriptComponents(transcript: string): Promise<ScriptComponents | null> {
    console.log('📝 [AI_ANALYSIS] Starting script component analysis...');
    console.log('📊 [AI_ANALYSIS] Transcript length:', transcript.length, 'characters');
    console.log('📋 [AI_ANALYSIS] Full transcript content:', transcript);

    for (const provider of this.providers) {
      console.log(`🔍 [AI_ANALYSIS] Checking provider: ${provider.getName()}`);
      console.log(`🔑 [AI_ANALYSIS] Provider available: ${provider.isAvailable()}`);
      
      if (!provider.isAvailable()) {
        console.log(`⚠️ [AI_ANALYSIS] Provider ${provider.getName()} not available, skipping`);
        console.log(`🔍 [AI_ANALYSIS] Availability check details for ${provider.getName()}:`);
        continue;
      }

      try {
        console.log(`🤖 [AI_ANALYSIS] Attempting analysis with ${provider.getName()} (${provider.getModel()})`);
        console.log(`📤 [AI_ANALYSIS] Sending transcript to ${provider.getName()}...`);
        
        const components = await provider.analyzeScript(transcript);
        
        console.log(`📥 [AI_ANALYSIS] Received response from ${provider.getName()}:`, components);
        
        if (components && this.validateComponents(components)) {
          console.log(`✅ [AI_ANALYSIS] Script analysis successful with ${provider.getName()}`);
          console.log(`🧩 [AI_ANALYSIS] Final validated components:`, components);
          return components;
        } else {
          console.log(`⚠️ [AI_ANALYSIS] ${provider.getName()} returned invalid components`);
          console.log(`🔍 [AI_ANALYSIS] Validation details:`, {
            hasHook: !!(components?.hook && components.hook.length > 5),
            hasBridge: !!(components?.bridge && components.bridge.length > 5),
            hasNugget: !!(components?.nugget && components.nugget.length > 5),
            hasWta: !!(components?.wta && components.wta.length > 5)
          });
        }
      } catch (error) {
        console.error(`❌ [AI_ANALYSIS] ${provider.getName()} script analysis failed:`, error);
        console.error(`🔍 [AI_ANALYSIS] Error details:`, error.message);
      }
    }

    // All providers failed, return fallback
    console.log('🔄 [AI_ANALYSIS] All providers failed, using fallback components');
    const fallback = this.createFallbackComponents();
    console.log('📋 [AI_ANALYSIS] Fallback components:', fallback);
    return fallback;
  }

  /**
   * Analyze visual content using best available provider
   */
  async analyzeVisuals(videoUrl: string): Promise<string | null> {
    console.log('👁️ [AI_ANALYSIS] Starting visual content analysis...');
    console.log('🔗 [AI_ANALYSIS] Video URL:', videoUrl.substring(0, 100) + '...');

    for (const provider of this.providers) {
      if (!provider.isAvailable()) {
        console.log(`⚠️ [AI_ANALYSIS] Provider ${provider.getName()} not available, skipping`);
        continue;
      }

      try {
        console.log(`🤖 [AI_ANALYSIS] Attempting visual analysis with ${provider.getName()}`);
        const visualContext = await provider.analyzeVisuals(videoUrl);
        
        if (visualContext && visualContext.length > 50) { // Ensure meaningful response
          console.log(`✅ [AI_ANALYSIS] Visual analysis successful with ${provider.getName()}`);
          console.log('📊 [AI_ANALYSIS] Analysis length:', visualContext.length, 'characters');
          return visualContext;
        } else {
          console.log(`⚠️ [AI_ANALYSIS] ${provider.getName()} returned insufficient visual analysis`);
        }
      } catch (error) {
        console.error(`❌ [AI_ANALYSIS] ${provider.getName()} visual analysis failed:`, error);
      }
    }

    console.log('🔄 [AI_ANALYSIS] All visual analysis providers failed');
    return 'Visual analysis temporarily unavailable. Please configure AI service for visual content analysis.';
  }

  /**
   * Analyze content for sentiment, topics, etc.
   */
  async analyzeContent(transcript: string): Promise<ContentAnalysis | null> {
    console.log('🔍 [AI_ANALYSIS] Starting content analysis...');

    for (const provider of this.providers) {
      if (!provider.isAvailable()) continue;

      try {
        const analysis = await provider.analyzeContent(transcript);
        if (analysis) {
          console.log(`✅ [AI_ANALYSIS] Content analysis successful with ${provider.getName()}`);
          return analysis;
        }
      } catch (error) {
        console.error(`❌ [AI_ANALYSIS] ${provider.getName()} content analysis failed:`, error);
      }
    }

    return null;
  }

  /**
   * Perform complete analysis (script + visuals + content)
   */
  async performCompleteAnalysis(
    transcript: string, 
    videoUrl?: string
  ): Promise<AIAnalysisResult> {
    try {
      console.log('🚀 [AI_ANALYSIS] Starting complete analysis...');

      const startTime = Date.now();

      // Run analyses in parallel where possible
      const [components, visualContext, contentAnalysis] = await Promise.allSettled([
        this.analyzeScriptComponents(transcript),
        videoUrl ? this.analyzeVisuals(videoUrl) : Promise.resolve(null),
        this.analyzeContent(transcript)
      ]);

      const processingTime = Date.now() - startTime;
      console.log(`⏱️ [AI_ANALYSIS] Complete analysis took ${processingTime}ms`);

      return {
        success: true,
        components: components.status === 'fulfilled' ? components.value : undefined,
        visualContext: visualContext.status === 'fulfilled' ? visualContext.value : undefined,
        contentAnalysis: contentAnalysis.status === 'fulfilled' ? contentAnalysis.value : undefined,
        metadata: {
          method: 'complete_analysis',
          processedAt: new Date().toISOString(),
          inputLength: transcript.length
        }
      };
    } catch (error) {
      console.error('❌ [AI_ANALYSIS] Complete analysis failed:', error);
      return {
        success: false,
        metadata: {
          method: 'complete_analysis',
          processedAt: new Date().toISOString(),
          inputLength: transcript.length
        },
        error: error instanceof Error ? error.message : 'Unknown analysis error'
      };
    }
  }

  /**
   * Get status of all AI providers
   */
  getProviderStatus(): Array<{
    name: string;
    model: string;
    available: boolean;
    configured: boolean;
  }> {
    return this.providers.map(provider => ({
      name: provider.getName(),
      model: provider.getModel(),
      available: provider.isAvailable(),
      configured: this.isProviderConfigured(provider.getName())
    }));
  }

  /**
   * Extract hashtags from text
   */
  extractHashtags(text: string): string[] {
    const hashtagRegex = /#[\w\u0590-\u05ff]+/g;
    const matches = text.match(hashtagRegex);
    return matches ? matches.map(tag => tag.substring(1)) : [];
  }

  /**
   * Private helper methods
   */

  private validateComponents(components: ScriptComponents): boolean {
    return !!(
      components.hook && components.hook.length > 5 &&
      components.bridge && components.bridge.length > 5 &&
      components.nugget && components.nugget.length > 5 &&
      components.wta && components.wta.length > 5
    );
  }

  private createFallbackComponents(): ScriptComponents {
    return {
      hook: 'Hook analysis pending - configure AI service',
      bridge: 'Bridge analysis pending - configure AI service', 
      nugget: 'Main content analysis pending - configure AI service',
      wta: 'Call-to-action analysis pending - configure AI service'
    };
  }

  private isProviderConfigured(providerName: string): boolean {
    const getEnvVar = (key: string) => {
      return import.meta.env?.[`VITE_${key}`] || 
             (typeof process !== 'undefined' && process.env?.[key]);
    };

    switch (providerName.toLowerCase()) {
      case 'gemini':
        return !!getEnvVar('GEMINI_API_KEY');
      case 'openai':
        return !!getEnvVar('OPENAI_API_KEY');
      case 'claude':
        return !!getEnvVar('ANTHROPIC_API_KEY');
      default:
        return false;
    }
  }
}

/**
 * Gemini AI Provider
 */
class GeminiAIProvider implements AIProvider {
  async analyzeScript(transcript: string): Promise<ScriptComponents | null> {
    try {
      console.log('🤖 [GEMINI] Analyzing script with Gemini...');
      console.log('📋 [GEMINI] Input transcript:', transcript.substring(0, 200) + '...');

      // Mock implementation - actual would use GoogleGenerativeAI
      const result = await this.callGeminiAPI('script_analysis', { transcript });
      
      console.log('📥 [GEMINI] Raw API response:', result);
      
      const parsedComponents = this.parseScriptResponse(result);
      console.log('🧩 [GEMINI] Parsed components:', parsedComponents);
      
      return parsedComponents;
    } catch (error) {
      console.error('❌ [GEMINI] Script analysis failed:', error);
      console.error('🔍 [GEMINI] Error details:', error.message);
      return null;
    }
  }

  async analyzeVisuals(videoUrl: string): Promise<string | null> {
    try {
      console.log('🤖 [GEMINI] Analyzing visuals with Gemini...');

      // Download video first for Gemini processing
      const response = await fetch(videoUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      const result = await this.callGeminiAPI('visual_analysis', { 
        video: arrayBuffer,
        url: videoUrl 
      });
      
      return result.visualContext || null;
    } catch (error) {
      console.error('❌ [GEMINI] Visual analysis failed:', error);
      return null;
    }
  }

  async analyzeContent(transcript: string): Promise<ContentAnalysis | null> {
    try {
      console.log('🤖 [GEMINI] Analyzing content with Gemini...');

      const result = await this.callGeminiAPI('content_analysis', { transcript });
      
      return {
        sentiment: result.sentiment || 'neutral',
        topics: result.topics || [],
        keywords: result.keywords || [],
        contentType: result.contentType || 'informational',
        engagement: result.engagement || 'medium'
      };
    } catch (error) {
      console.error('❌ [GEMINI] Content analysis failed:', error);
      return null;
    }
  }

  isAvailable(): boolean {
    return !!(import.meta.env?.VITE_GEMINI_API_KEY || 
             (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY));
  }

  getName(): string {
    return 'Gemini';
  }

  getModel(): string {
    return 'gemini-2.5-flash-lite';
  }

  private async callGeminiAPI(endpoint: string, data: any): Promise<any> {
    // Mock implementation
    console.log(`🤖 [GEMINI] Calling ${endpoint} with data keys:`, Object.keys(data));
    console.log(`📋 [GEMINI] Data content:`, data);
    
    // Simulate API delay
    const delay = 1000 + Math.random() * 2000;
    console.log(`⏳ [GEMINI] Simulating API delay: ${Math.round(delay)}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Mock responses based on endpoint
    let response;
    switch (endpoint) {
      case 'script_analysis':
        console.log(`🧠 [GEMINI] Generating script analysis for input...`);
        
        // Extract idea from the transcript for more dynamic responses
        const transcript = data.transcript || '';
        const ideaMatch = transcript.match(/idea: "([^"]+)"/i);
        const idea = ideaMatch ? ideaMatch[1] : 'general topic';
        
        response = {
          components: {
            hook: `🔥 Want to know the secret about ${idea.toLowerCase()}? This will change everything!`,
            bridge: `Here's what most people don't understand about ${idea.toLowerCase()}...`,
            nugget: `The key to success with ${idea.toLowerCase()} is this simple 3-step process: 1) Start with the basics, 2) Apply consistently, 3) Scale strategically`,
            wta: `Try this approach and let me know your results! Follow for more tips about ${idea.toLowerCase()}! 🚀`
          }
        };
        break;
      case 'visual_analysis':
        response = {
          visualContext: 'Comprehensive visual analysis from Gemini: The video features dynamic scene transitions with vibrant colors and engaging visual elements that support the narrative structure.'
        };
        break;
      case 'content_analysis':
        response = {
          sentiment: 'positive',
          topics: ['social media', 'content creation', 'engagement'],
          keywords: ['viral', 'trending', 'creative'],
          contentType: 'educational',
          engagement: 'high'
        };
        break;
      default:
        response = {};
    }
    
    console.log(`✅ [GEMINI] Mock API response for ${endpoint}:`, response);
    return response;
  }

  private parseScriptResponse(result: any): ScriptComponents | null {
    try {
      const components = result.components;
      if (this.validateScriptComponents(components)) {
        return components;
      }
      return null;
    } catch {
      return null;
    }
  }

  private validateScriptComponents(components: any): boolean {
    return !!(
      components &&
      typeof components.hook === 'string' &&
      typeof components.bridge === 'string' &&
      typeof components.nugget === 'string' &&
      typeof components.wta === 'string'
    );
  }
}

/**
 * OpenAI Provider
 */
class OpenAIProvider implements AIProvider {
  async analyzeScript(transcript: string): Promise<ScriptComponents | null> {
    try {
      console.log('🤖 [OPENAI] Analyzing script with GPT-4...');

      const result = await this.callOpenAIAPI('chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Analyze video transcripts and extract Hook, Bridge, Nugget, and WTA components.'
          },
          {
            role: 'user',
            content: `Analyze this transcript: ${transcript}`
          }
        ]
      });

      return this.parseOpenAIResponse(result);
    } catch (error) {
      console.error('❌ [OPENAI] Script analysis failed:', error);
      return null;
    }
  }

  async analyzeVisuals(videoUrl: string): Promise<string | null> {
    console.log('⚠️ [OPENAI] Visual analysis not supported with current OpenAI models');
    return null;
  }

  async analyzeContent(transcript: string): Promise<ContentAnalysis | null> {
    try {
      console.log('🤖 [OPENAI] Analyzing content with GPT-4...');

      const result = await this.callOpenAIAPI('chat/completions', {
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'Analyze content for sentiment, topics, keywords, type, and engagement level.'
          },
          {
            role: 'user',
            content: `Analyze this content: ${transcript}`
          }
        ]
      });

      return this.parseContentResponse(result);
    } catch (error) {
      console.error('❌ [OPENAI] Content analysis failed:', error);
      return null;
    }
  }

  isAvailable(): boolean {
    return !!(import.meta.env?.VITE_OPENAI_API_KEY || 
             (typeof process !== 'undefined' && process.env?.OPENAI_API_KEY));
  }

  getName(): string {
    return 'OpenAI';
  }

  getModel(): string {
    return 'gpt-4';
  }

  private async callOpenAIAPI(endpoint: string, data: any): Promise<any> {
    // Mock implementation
    console.log(`🤖 [OPENAI] Calling ${endpoint}`);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      choices: [{
        message: {
          content: JSON.stringify({
            hook: 'OpenAI-analyzed attention grabber',
            bridge: 'OpenAI-identified transition',
            nugget: 'OpenAI-extracted core value',
            wta: 'OpenAI-determined call to action',
            sentiment: 'positive',
            topics: ['AI', 'analysis', 'content'],
            contentType: 'educational'
          })
        }
      }]
    };
  }

  private parseOpenAIResponse(result: any): ScriptComponents | null {
    try {
      const content = JSON.parse(result.choices[0].message.content);
      return {
        hook: content.hook,
        bridge: content.bridge,
        nugget: content.nugget,
        wta: content.wta
      };
    } catch {
      return null;
    }
  }

  private parseContentResponse(result: any): ContentAnalysis | null {
    try {
      const content = JSON.parse(result.choices[0].message.content);
      return {
        sentiment: content.sentiment || 'neutral',
        topics: content.topics || [],
        keywords: content.keywords || [],
        contentType: content.contentType || 'informational',
        engagement: content.engagement || 'medium'
      };
    } catch {
      return null;
    }
  }
}

/**
 * Claude Provider (placeholder)
 */
class ClaudeProvider implements AIProvider {
  async analyzeScript(transcript: string): Promise<ScriptComponents | null> {
    console.log('🤖 [CLAUDE] Claude script analysis not implemented yet');
    return null;
  }

  async analyzeVisuals(videoUrl: string): Promise<string | null> {
    console.log('🤖 [CLAUDE] Claude visual analysis not implemented yet');
    return null;
  }

  async analyzeContent(transcript: string): Promise<ContentAnalysis | null> {
    console.log('🤖 [CLAUDE] Claude content analysis not implemented yet');
    return null;
  }

  isAvailable(): boolean {
    return !!(import.meta.env?.VITE_ANTHROPIC_API_KEY || 
             (typeof process !== 'undefined' && process.env?.ANTHROPIC_API_KEY));
  }

  getName(): string {
    return 'Claude';
  }

  getModel(): string {
    return 'claude-3-sonnet';
  }
}