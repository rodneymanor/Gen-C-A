/**
 * TranscriptionService - Video transcription abstraction
 * Extracted from video transcription implementations
 */

export interface TranscriptionResult {
  success: boolean;
  transcript: string;
  platform: string;
  components?: {
    hook: string;
    bridge: string;
    nugget: string;
    wta: string;
  };
  contentMetadata?: {
    platform: string;
    author: string;
    description: string;
    source: string;
    hashtags: string[];
  };
  visualContext?: string;
  transcriptionMetadata: {
    method: string;
    processedAt: string;
    fileSize?: number;
    fileName?: string;
    duration?: number;
    fallbackUsed?: boolean;
  };
  error?: string;
}

export interface TranscriptionProvider {
  /**
   * Transcribe video from URL
   */
  transcribeFromUrl(url: string, platform: string): Promise<TranscriptionResult | null>;
  
  /**
   * Transcribe video from file buffer
   */
  transcribeFromBuffer(buffer: ArrayBuffer, filename: string, platform: string): Promise<TranscriptionResult | null>;
  
  /**
   * Check if provider is available/configured
   */
  isAvailable(): boolean;
  
  /**
   * Get provider name
   */
  getName(): string;
}

/**
 * Video transcription service with multiple provider support
 */
export class TranscriptionService {
  private providers: TranscriptionProvider[] = [];
  private fallbackProvider: FallbackTranscriptionProvider;

  constructor() {
    // Initialize transcription providers
    this.providers = [
      new GeminiTranscriptionProvider(),
      new OpenAITranscriptionProvider(),
      new RapidAPITranscriptionProvider()
    ];
    
    this.fallbackProvider = new FallbackTranscriptionProvider();
  }

  /**
   * Transcribe video from URL using best available provider
   */
  async transcribeFromUrl(url: string, platform: string): Promise<TranscriptionResult | null> {
    console.log('🎙️ [TRANSCRIPTION] Starting URL-based transcription...');
    console.log('🔗 [TRANSCRIPTION] URL:', url.substring(0, 100) + '...');
    console.log('🎯 [TRANSCRIPTION] Platform:', platform);

    // Try each provider in order of preference
    for (const provider of this.providers) {
      if (!provider.isAvailable()) {
        console.log(`⚠️ [TRANSCRIPTION] Provider ${provider.getName()} not available, skipping`);
        continue;
      }

      try {
        console.log(`🤖 [TRANSCRIPTION] Attempting transcription with ${provider.getName()}...`);
        const result = await provider.transcribeFromUrl(url, platform);
        
        if (result?.success && result.transcript && !this.isFallbackTranscript(result.transcript)) {
          console.log(`✅ [TRANSCRIPTION] Successfully transcribed with ${provider.getName()}`);
          return result;
        } else {
          console.log(`⚠️ [TRANSCRIPTION] ${provider.getName()} returned fallback/empty result`);
        }
      } catch (error) {
        console.error(`❌ [TRANSCRIPTION] ${provider.getName()} failed:`, error);
      }
    }

    // All providers failed, use fallback
    console.log('🔄 [TRANSCRIPTION] All providers failed, using fallback');
    return this.fallbackProvider.transcribeFromUrl(url, platform);
  }

  /**
   * Transcribe video from buffer using best available provider
   */
  async transcribeFromBuffer(
    buffer: ArrayBuffer, 
    filename: string, 
    platform: string
  ): Promise<TranscriptionResult | null> {
    console.log('🎙️ [TRANSCRIPTION] Starting buffer-based transcription...');
    console.log('📁 [TRANSCRIPTION] Filename:', filename);
    console.log('📊 [TRANSCRIPTION] Buffer size:', buffer.byteLength, 'bytes');

    for (const provider of this.providers) {
      if (!provider.isAvailable()) {
        console.log(`⚠️ [TRANSCRIPTION] Provider ${provider.getName()} not available, skipping`);
        continue;
      }

      try {
        console.log(`🤖 [TRANSCRIPTION] Attempting transcription with ${provider.getName()}...`);
        const result = await provider.transcribeFromBuffer(buffer, filename, platform);
        
        if (result?.success && result.transcript && !this.isFallbackTranscript(result.transcript)) {
          console.log(`✅ [TRANSCRIPTION] Successfully transcribed with ${provider.getName()}`);
          return result;
        }
      } catch (error) {
        console.error(`❌ [TRANSCRIPTION] ${provider.getName()} failed:`, error);
      }
    }

    // All providers failed, use fallback
    console.log('🔄 [TRANSCRIPTION] All providers failed, using fallback');
    return this.fallbackProvider.transcribeFromBuffer(buffer, filename, platform);
  }

  /**
   * Get status of all transcription providers
   */
  getProviderStatus(): Array<{
    name: string;
    available: boolean;
    configured: boolean;
  }> {
    return this.providers.map(provider => ({
      name: provider.getName(),
      available: provider.isAvailable(),
      configured: this.isProviderConfigured(provider.getName())
    }));
  }

  /**
   * Validate file for transcription
   */
  validateFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime'];
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: 'Only MP4, WebM, MOV, and AVI video files are supported'
      };
    }

    // Check file size (20MB limit for most providers)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'Video file must be smaller than 20MB'
      };
    }

    return { valid: true };
  }

  /**
   * Private helper methods
   */

  private isFallbackTranscript(transcript: string): boolean {
    return transcript.includes('temporarily unavailable') ||
           transcript.includes('transcription pending') ||
           transcript.includes('service configuration');
  }

  private isProviderConfigured(providerName: string): boolean {
    switch (providerName.toLowerCase()) {
      case 'gemini':
        return !!process.env.GEMINI_API_KEY;
      case 'openai':
        return !!process.env.OPENAI_API_KEY;
      case 'rapidapi':
        return !!process.env.RAPIDAPI_KEY;
      default:
        return false;
    }
  }
}

/**
 * Gemini-based transcription provider
 */
class GeminiTranscriptionProvider implements TranscriptionProvider {
  async transcribeFromUrl(url: string, platform: string): Promise<TranscriptionResult | null> {
    try {
      console.log('🤖 [GEMINI] Starting Gemini URL transcription...');

      // This would integrate with Gemini API
      // Implementation would fetch video and process with Gemini
      
      const response = await this.callGeminiAPI(url, 'url');
      
      return {
        success: true,
        transcript: response.transcript,
        platform,
        components: response.components,
        contentMetadata: response.contentMetadata,
        visualContext: response.visualContext,
        transcriptionMetadata: {
          method: 'gemini-url',
          processedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ [GEMINI] URL transcription failed:', error);
      return null;
    }
  }

  async transcribeFromBuffer(
    buffer: ArrayBuffer, 
    filename: string, 
    platform: string
  ): Promise<TranscriptionResult | null> {
    try {
      console.log('🤖 [GEMINI] Starting Gemini buffer transcription...');

      const response = await this.callGeminiAPI(buffer, 'buffer');
      
      return {
        success: true,
        transcript: response.transcript,
        platform,
        components: response.components,
        contentMetadata: response.contentMetadata,
        visualContext: response.visualContext,
        transcriptionMetadata: {
          method: 'gemini-buffer',
          processedAt: new Date().toISOString(),
          fileSize: buffer.byteLength,
          fileName: filename
        }
      };
    } catch (error) {
      console.error('❌ [GEMINI] Buffer transcription failed:', error);
      return null;
    }
  }

  isAvailable(): boolean {
    return !!process.env.GEMINI_API_KEY;
  }

  getName(): string {
    return 'Gemini';
  }

  private async callGeminiAPI(input: string | ArrayBuffer, type: 'url' | 'buffer'): Promise<any> {
    // Mock implementation - actual would use GoogleGenerativeAI
    console.log(`🤖 [GEMINI] Processing ${type}:`, type === 'url' ? input : 'buffer data');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      transcript: 'This is a mock transcript from Gemini API',
      components: {
        hook: 'Mock hook',
        bridge: 'Mock bridge', 
        nugget: 'Mock nugget',
        wta: 'Mock why to act'
      },
      contentMetadata: {
        platform: 'mock',
        author: 'Mock Author',
        description: 'Mock description',
        source: 'gemini',
        hashtags: ['mock', 'gemini']
      },
      visualContext: 'Mock visual context from Gemini'
    };
  }
}

/**
 * OpenAI-based transcription provider
 */
class OpenAITranscriptionProvider implements TranscriptionProvider {
  async transcribeFromUrl(url: string, platform: string): Promise<TranscriptionResult | null> {
    try {
      console.log('🤖 [OPENAI] Starting OpenAI URL transcription...');

      // Download video first
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      
      return this.transcribeFromBuffer(buffer, 'video.mp4', platform);
    } catch (error) {
      console.error('❌ [OPENAI] URL transcription failed:', error);
      return null;
    }
  }

  async transcribeFromBuffer(
    buffer: ArrayBuffer, 
    filename: string, 
    platform: string
  ): Promise<TranscriptionResult | null> {
    try {
      console.log('🤖 [OPENAI] Starting OpenAI Whisper transcription...');

      const transcript = await this.callWhisperAPI(buffer, filename);
      
      return {
        success: true,
        transcript,
        platform,
        transcriptionMetadata: {
          method: 'openai-whisper',
          processedAt: new Date().toISOString(),
          fileSize: buffer.byteLength,
          fileName: filename
        }
      };
    } catch (error) {
      console.error('❌ [OPENAI] Buffer transcription failed:', error);
      return null;
    }
  }

  isAvailable(): boolean {
    return !!process.env.OPENAI_API_KEY;
  }

  getName(): string {
    return 'OpenAI';
  }

  private async callWhisperAPI(buffer: ArrayBuffer, filename: string): Promise<string> {
    // Mock implementation - actual would use OpenAI Whisper API
    console.log('🤖 [OPENAI] Processing with Whisper:', filename, buffer.byteLength, 'bytes');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return 'This is a mock transcript from OpenAI Whisper API';
  }
}

/**
 * RapidAPI-based transcription provider
 */
class RapidAPITranscriptionProvider implements TranscriptionProvider {
  async transcribeFromUrl(url: string, platform: string): Promise<TranscriptionResult | null> {
    try {
      console.log('🤖 [RAPIDAPI] Starting RapidAPI transcription...');

      // Use platform-specific RapidAPI endpoint
      const transcript = await this.callRapidAPI(url, platform);
      
      return {
        success: true,
        transcript,
        platform,
        transcriptionMetadata: {
          method: 'rapidapi',
          processedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('❌ [RAPIDAPI] URL transcription failed:', error);
      return null;
    }
  }

  async transcribeFromBuffer(
    buffer: ArrayBuffer, 
    filename: string, 
    platform: string
  ): Promise<TranscriptionResult | null> {
    // RapidAPI typically works with URLs, not buffers
    console.log('⚠️ [RAPIDAPI] Buffer transcription not supported, skipping');
    return null;
  }

  isAvailable(): boolean {
    return !!process.env.RAPIDAPI_KEY;
  }

  getName(): string {
    return 'RapidAPI';
  }

  private async callRapidAPI(url: string, platform: string): Promise<string> {
    // Mock implementation - actual would call RapidAPI transcription services
    console.log('🤖 [RAPIDAPI] Processing URL for platform:', platform, url.substring(0, 50) + '...');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return `This is a mock transcript from RapidAPI for ${platform}`;
  }
}

/**
 * Fallback transcription provider when all others fail
 */
class FallbackTranscriptionProvider implements TranscriptionProvider {
  async transcribeFromUrl(url: string, platform: string): Promise<TranscriptionResult | null> {
    return this.createFallbackResult(platform, 'url');
  }

  async transcribeFromBuffer(
    buffer: ArrayBuffer, 
    filename: string, 
    platform: string
  ): Promise<TranscriptionResult | null> {
    return this.createFallbackResult(platform, 'buffer', buffer.byteLength, filename);
  }

  isAvailable(): boolean {
    return true; // Fallback is always available
  }

  getName(): string {
    return 'Fallback';
  }

  private createFallbackResult(
    platform: string, 
    method: string,
    fileSize?: number,
    fileName?: string
  ): TranscriptionResult {
    return {
      success: true,
      transcript: 'Transcription temporarily unavailable. Video content analysis will be available once transcription service is configured.',
      platform,
      components: {
        hook: 'Video content analysis pending',
        bridge: 'Transcription service configuration needed',
        nugget: 'Main content insights will be available after transcription',
        wta: 'Configure transcription API keys to enable full video analysis'
      },
      contentMetadata: {
        platform,
        author: 'Unknown',
        description: 'Video added successfully - transcription pending service configuration',
        source: 'other',
        hashtags: []
      },
      visualContext: 'Visual analysis will be available once transcription service is configured',
      transcriptionMetadata: {
        method: `fallback-${method}`,
        processedAt: new Date().toISOString(),
        fileSize,
        fileName,
        fallbackUsed: true
      }
    };
  }
}