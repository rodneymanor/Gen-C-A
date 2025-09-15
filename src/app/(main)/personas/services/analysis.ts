// Analysis service for persona creation

import type { AnalysisProgress, AnalysisMode } from "../types";
import { extractUsername } from "../utils";

import { PersonaApiService } from "./api";

export class PersonaAnalysisService {
  // Run complete analysis for profile mode
  static async analyzeFromProfile(input: string, onProgress: (progress: AnalysisProgress) => void) {
    const cleanUsername = extractUsername(input);
    if (!cleanUsername) {
      throw new Error(
        "Could not extract username from the provided input. Please enter a valid TikTok username or profile URL.",
      );
    }

    // Step 1: Fetch user feed
    onProgress({ step: "Fetching videos from TikTok", current: 1, total: 4 });
    const videos = await PersonaApiService.fetchUserFeed(cleanUsername, 20);

    // Step 2: Transcribe videos
    onProgress({ step: "Transcribing videos (this may take a minute)", current: 2, total: 4 });
    const videoUrls = videos
      .slice(0, 10)
      .map((video: any) => video.playUrl ?? video.downloadUrl)
      .filter(Boolean);

    const transcripts = await PersonaApiService.transcribeVideos(videoUrls, 10);

    // Step 3: Analyze voice patterns
    onProgress({ step: "Analyzing voice patterns and style", current: 3, total: 4 });
    const voiceAnalysis = await PersonaApiService.analyzeVoicePatterns(transcripts);

    // Step 4: Create persona with metadata
    onProgress({ step: "Creating persona profile", current: 4, total: 4 });
    const metadata = await PersonaApiService.generateMetadata(voiceAnalysis);

    const personaData = {
      name: metadata.name ?? `${cleanUsername} Voice`,
      description: metadata.description ?? `Voice persona based on @${cleanUsername}'s content style`,
      platform: "tiktok",
      username: cleanUsername,
      analysis: voiceAnalysis,
      tags: metadata.tags,
    };

    return await PersonaApiService.createPersona(personaData);
  }

  // Run complete analysis for videos mode
  static async analyzeFromVideos(videoUrls: string[], onProgress: (progress: AnalysisProgress) => void) {
    const validUrls = videoUrls.filter((url) => url && url.trim());

    if (validUrls.length === 0) {
      throw new Error("Please provide at least one video URL");
    }

    // Step 1: Fetch video data using UnifiedVideoScraper to get CDN URLs
    onProgress({ step: "Fetching video data", current: 1, total: 5 });
    const cdnUrls = await PersonaApiService.fetchVideoCdnUrls(validUrls);

    // Step 2: Transcribe videos using CDN URLs
    onProgress({ step: "Transcribing videos (this may take a minute)", current: 2, total: 5 });
    const transcripts = await PersonaApiService.transcribeVideos(cdnUrls, 10);

    // Step 3: Analyze voice patterns
    onProgress({ step: "Analyzing voice patterns and style", current: 3, total: 5 });
    const voiceAnalysis = await PersonaApiService.analyzeVoicePatterns(transcripts);

    // Step 4: Create persona with metadata
    onProgress({ step: "Creating persona profile", current: 4, total: 5 });
    const metadata = await PersonaApiService.generateMetadata(voiceAnalysis);

    const personaData = {
      name: metadata.name ?? "Custom Voice Collection",
      description: metadata.description ?? "Voice persona created from custom video collection",
      platform: "custom",
      username: "Custom Collection",
      analysis: voiceAnalysis,
      tags: metadata.tags,
    };

    return await PersonaApiService.createPersona(personaData);
  }

  // Main analysis orchestrator
  static async runCompleteAnalysis(
    input: string | string[],
    mode: AnalysisMode,
    onProgress: (progress: AnalysisProgress) => void,
  ) {
    if (mode === "profile") {
      const rawInput = typeof input === "string" ? input : input[0];
      if (!rawInput) {
        throw new Error("Please enter a username or TikTok URL");
      }
      return await this.analyzeFromProfile(rawInput, onProgress);
    }

    // mode === 'videos'
    const videoUrls = Array.isArray(input) ? input : [input];
    return await this.analyzeFromVideos(videoUrls, onProgress);
  }
}
