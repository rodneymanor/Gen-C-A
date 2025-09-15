/**
 * Voice Analysis Orchestrator
 * Main orchestrator that coordinates the complete voice persona analysis workflow
 */

import { extractSpeechPatterns, extractPatternMatrix } from "../analyzers/pattern-extractor";
import { createVoiceProfile, createVoiceProfiler } from "../analyzers/voice-profiler";
import { generatePersonaScript } from "../generators/script-generator";
import {
  UserIdentifier,
  PersonaProfile,
  PersonaAnalysisResult,
  ScriptGenerationInput,
  ScriptGenerationResult,
  PersonaAnalysisConfig,
  PersonaAnalysisError,
} from "../types";

import { analyzeUserFeed } from "./user-feed-orchestrator";

/**
 * Default configuration for voice analysis
 */
const DEFAULT_ANALYSIS_CONFIG: PersonaAnalysisConfig = {
  batchSize: 5,
  maxVideos: 25,
  cacheTTL: 604800, // 7 days
  rateLimit: {
    requestsPerMinute: 8,
    burstLimit: 3,
  },
  analysis: {
    minTranscriptLength: 50,
    patternSensitivity: "medium",
    enableEmotionalAnalysis: true,
  },
};

/**
 * Voice Analysis Orchestrator Class
 */
export class VoiceAnalysisOrchestrator {
  private config: PersonaAnalysisConfig;

  constructor(config: Partial<PersonaAnalysisConfig> = {}) {
    this.config = { ...DEFAULT_ANALYSIS_CONFIG, ...config };
  }

  /**
   * Complete voice persona analysis workflow
   * Retrieves user feed → Transcribes videos → Analyzes patterns → Creates persona profile
   */
  async analyzeVoicePersona(userIdentifier: UserIdentifier): Promise<PersonaAnalysisResult> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    console.log(
      `🎭 [VOICE_ANALYSIS] Starting complete persona analysis for ${userIdentifier.handle} on ${userIdentifier.platform}`,
    );

    try {
      // Step 1: Retrieve and analyze user feed
      console.log(`📱 [VOICE_ANALYSIS] Step 1: Retrieving user feed...`);
      const feedAnalysis = await analyzeUserFeed(userIdentifier, this.config);

      if (feedAnalysis.status === "failed" || feedAnalysis.processedVideos === 0) {
        throw new Error(`Feed analysis failed: ${feedAnalysis.processedVideos} videos processed`);
      }

      console.log(`✅ [VOICE_ANALYSIS] Feed analysis completed: ${feedAnalysis.processedVideos} videos processed`);

      // Step 2: Extract speech patterns from transcripts
      console.log(`🔍 [VOICE_ANALYSIS] Step 2: Extracting speech patterns...`);
      const speechPatterns = extractSpeechPatterns(feedAnalysis.videos, {
        sensitivity: this.config.analysis.patternSensitivity,
        enableEmotionalAnalysis: this.config.analysis.enableEmotionalAnalysis,
      });

      // Step 3: Create pattern mapping matrix
      console.log(`📊 [VOICE_ANALYSIS] Step 3: Creating pattern mapping matrix...`);
      const patternMatrix = extractPatternMatrix(feedAnalysis.videos);

      // Step 4: Generate voice profile
      console.log(`🎯 [VOICE_ANALYSIS] Step 4: Generating voice profile...`);
      const voiceProfile = createVoiceProfile(feedAnalysis.videos, speechPatterns, patternMatrix);

      // Step 5: Create generation parameters
      console.log(`⚙️ [VOICE_ANALYSIS] Step 5: Creating generation parameters...`);
      const profiler = createVoiceProfiler();
      const generationParameters = profiler.createGenerationParameters(
        voiceProfile,
        speechPatterns,
        feedAnalysis.videos,
      );

      // Step 6: Assemble complete persona profile
      const personaId = this.generatePersonaId(userIdentifier);
      const personaProfile: PersonaProfile = {
        personaId,
        userIdentifier,
        analysisDate: new Date().toISOString(),
        voiceProfile,
        speechPatterns,
        patternMapping: patternMatrix,
        generationParameters,
        metadata: {
          videosAnalyzed: feedAnalysis.processedVideos,
          totalTranscriptLength: feedAnalysis.videos.reduce((sum, v) => sum + v.transcript.length, 0),
          analysisVersion: "1.0.0",
          lastUpdated: new Date().toISOString(),
        },
      };

      const processingTime = Date.now() - startTime;

      console.log(`🎉 [VOICE_ANALYSIS] Voice persona analysis completed successfully in ${processingTime}ms`);
      console.log(`📈 [VOICE_ANALYSIS] Profile created with:`);
      console.log(`   - ${voiceProfile.hooks.length} hooks identified`);
      console.log(`   - ${Object.keys(voiceProfile.bridges).length} bridge patterns`);
      console.log(`   - ${voiceProfile.signatureElements.length} signature elements`);
      console.log(`   - ${voiceProfile.vocabularyFingerprint.length} vocabulary words`);

      return {
        success: true,
        personaProfile,
        metadata: {
          processingTime,
          videosProcessed: feedAnalysis.processedVideos,
          requestId,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error(`❌ [VOICE_ANALYSIS] Analysis failed after ${processingTime}ms:`, error);

      // Classify error type
      let errorCode = PersonaAnalysisError.ANALYSIS_TIMEOUT;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (errorMessage.includes("not found") || errorMessage.includes("user")) {
        errorCode = PersonaAnalysisError.USER_NOT_FOUND;
      } else if (errorMessage.includes("content") || errorMessage.includes("videos")) {
        errorCode = PersonaAnalysisError.INSUFFICIENT_CONTENT;
      } else if (errorMessage.includes("transcription") || errorMessage.includes("transcript")) {
        errorCode = PersonaAnalysisError.TRANSCRIPTION_FAILED;
      } else if (errorMessage.includes("rate limit")) {
        errorCode = PersonaAnalysisError.RATE_LIMIT_EXCEEDED;
      } else if (errorMessage.includes("platform")) {
        errorCode = PersonaAnalysisError.INVALID_PLATFORM;
      }

      return {
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          details: error,
        },
        metadata: {
          processingTime,
          videosProcessed: 0,
          requestId,
        },
      };
    }
  }

  /**
   * Generate script using existing persona profile
   */
  async generateScript(input: ScriptGenerationInput, personaProfile: PersonaProfile): Promise<ScriptGenerationResult> {
    console.log(`📝 [VOICE_ANALYSIS] Generating script for persona ${input.personaId} on topic: ${input.topic}`);

    try {
      const result = await generatePersonaScript(input, personaProfile, {
        enableRuleValidation: true,
        enableAuthenticityScoring: true,
        minAcceptableScore: personaProfile.generationParameters.authenticityThreshold,
      });

      if (result.success) {
        console.log(
          `✅ [VOICE_ANALYSIS] Script generated successfully with ${result.script?.authenticity.overallScore}% authenticity`,
        );
      }

      return result;
    } catch (error) {
      console.error(`❌ [VOICE_ANALYSIS] Script generation failed:`, error);
      return {
        success: false,
        error: {
          code: "SCRIPT_GENERATION_FAILED",
          message: error instanceof Error ? error.message : "Unknown script generation error",
        },
        metadata: {
          generationTime: 0,
          requestId: this.generateRequestId(),
        },
      };
    }
  }

  /**
   * Analyze multiple users in batch
   */
  async analyzeBatch(userIdentifiers: UserIdentifier[]): Promise<PersonaAnalysisResult[]> {
    console.log(`📦 [VOICE_ANALYSIS] Starting batch analysis for ${userIdentifiers.length} users`);

    const results: PersonaAnalysisResult[] = [];

    for (const identifier of userIdentifiers) {
      try {
        const result = await this.analyzeVoicePersona(identifier);
        results.push(result);

        // Rate limiting between users
        if (results.length < userIdentifiers.length) {
          const delayMs = (60 / this.config.rateLimit.requestsPerMinute) * 1000;
          console.log(`⏳ [VOICE_ANALYSIS] Rate limiting delay: ${delayMs}ms`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      } catch (error) {
        console.error(`❌ [VOICE_ANALYSIS] Batch analysis failed for ${identifier.handle}:`, error);
        results.push({
          success: false,
          error: {
            code: PersonaAnalysisError.ANALYSIS_TIMEOUT,
            message: error instanceof Error ? error.message : "Batch analysis error",
          },
          metadata: {
            processingTime: 0,
            videosProcessed: 0,
            requestId: this.generateRequestId(),
          },
        });
      }
    }

    const successful = results.filter((r) => r.success).length;
    console.log(`📊 [VOICE_ANALYSIS] Batch analysis completed: ${successful}/${userIdentifiers.length} successful`);

    return results;
  }

  /**
   * Get persona analysis summary
   */
  getAnalysisSummary(personaProfile: PersonaProfile): {
    overview: string;
    keyCharacteristics: string[];
    strengths: string[];
    recommendations: string[];
  } {
    const profile = personaProfile.voiceProfile;
    const patterns = personaProfile.speechPatterns;

    const overview = `Voice persona for @${personaProfile.userIdentifier.handle} analyzed from ${personaProfile.metadata.videosAnalyzed} videos. ${patterns.baseline.energyDescription} with ${patterns.baseline.sentenceStructure} sentence structure.`;

    const keyCharacteristics = [
      `${profile.hooks.length} signature hooks identified`,
      `${Object.keys(profile.bridges).length} bridge patterns`,
      `${patterns.baseline.typicalEnergy} energy baseline`,
      `${profile.vocabularyFingerprint.length} word vocabulary fingerprint`,
      `${profile.signatureElements.length} signature elements`,
    ];

    const strengths = [];
    if (profile.hooks.length > 10) strengths.push("Rich hook variety");
    if (Object.keys(profile.bridges).length > 8) strengths.push("Strong transition patterns");
    if (profile.signatureElements.length > 6) strengths.push("Distinctive signature elements");
    if (patterns.baseline.typicalEnergy === "high") strengths.push("High-energy engagement");

    const recommendations = [];
    if (personaProfile.generationParameters.authenticityThreshold > 90) {
      recommendations.push("Highly authentic persona - maintain current patterns");
    } else if (personaProfile.generationParameters.authenticityThreshold < 80) {
      recommendations.push("Consider analyzing more content for better pattern consistency");
    }

    if (patterns.baseline.sentenceStructure === "varied") {
      recommendations.push("Leverage sentence variety for dynamic content");
    }

    return {
      overview,
      keyCharacteristics,
      strengths: strengths.length > 0 ? strengths : ["Consistent voice patterns"],
      recommendations: recommendations.length > 0 ? recommendations : ["Profile ready for script generation"],
    };
  }

  /**
   * Utility methods
   */
  private generatePersonaId(userIdentifier: UserIdentifier): string {
    return `${userIdentifier.handle}_${userIdentifier.platform}_${Date.now()}`;
  }

  private generateRequestId(): string {
    return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PersonaAnalysisConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): PersonaAnalysisConfig {
    return { ...this.config };
  }
}

/**
 * Factory function for easy usage
 */
export function createVoiceAnalysisOrchestrator(config?: Partial<PersonaAnalysisConfig>): VoiceAnalysisOrchestrator {
  return new VoiceAnalysisOrchestrator(config);
}

/**
 * Convenience function for single persona analysis
 */
export async function analyzeVoicePersona(
  userIdentifier: UserIdentifier,
  config?: Partial<PersonaAnalysisConfig>,
): Promise<PersonaAnalysisResult> {
  const orchestrator = createVoiceAnalysisOrchestrator(config);
  return await orchestrator.analyzeVoicePersona(userIdentifier);
}

/**
 * Convenience function for script generation with persona
 */
export async function generateScriptWithPersona(
  input: ScriptGenerationInput,
  personaProfile: PersonaProfile,
): Promise<ScriptGenerationResult> {
  const orchestrator = createVoiceAnalysisOrchestrator();
  return await orchestrator.generateScript(input, personaProfile);
}
