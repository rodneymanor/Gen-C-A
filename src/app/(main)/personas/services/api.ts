// API service for persona operations

import { auth } from "@/lib/firebase";
import { scrapeVideoUrl } from "@/lib/unified-video-scraper";

import type { FirestorePersona } from "../types";

export class PersonaApiService {
  // Load personas from Firestore
  static async loadPersonas(): Promise<FirestorePersona[]> {
    if (!auth || !auth.currentUser) {
      console.log("No authenticated user, skipping personas load");
      return [];
    }

    const token = await auth.currentUser.getIdToken();

    // Fetch personas from API
    const response = await fetch("/api/personas/list", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return data.personas ?? [];
    }

    console.warn("Could not fetch personas:", data.error);
    return [];
  }

  // Fetch user feed from TikTok
  static async fetchUserFeed(username: string, count: number = 20) {
    const response = await fetch("/api/tiktok/user-feed", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, count }),
    });

    const data = await response.json();
    if (!data.success || !data.videos || data.videos.length === 0) {
      throw new Error(data.error ?? "No videos found for this user");
    }

    return data.videos;
  }

  // Transcribe video from URL
  static async transcribeVideo(videoUrl: string) {
    const response = await fetch("/api/video/transcribe-from-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoUrl }),
    });

    const data = await response.json();
    if (data.success && data.transcript) {
      return data.transcript;
    }
    return null;
  }

  // Transcribe multiple videos
  static async transcribeVideos(videoUrls: string[], maxTranscripts: number = 10): Promise<string[]> {
    const transcriptResults: string[] = [];

    for (let i = 0; i < videoUrls.length; i++) {
      try {
        const transcript = await this.transcribeVideo(videoUrls[i]);
        if (transcript) {
          transcriptResults.push(transcript);
        }

        // Stop after reaching max transcriptions
        if (transcriptResults.length >= maxTranscripts) break;
      } catch (error) {
        console.error(`Failed to transcribe video ${i + 1}:`, error);
      }
    }

    if (transcriptResults.length < 3) {
      throw new Error("Not enough videos could be transcribed. Please try another creator or provide more videos.");
    }

    return transcriptResults;
  }

  // Analyze voice patterns from transcripts
  static async analyzeVoicePatterns(transcripts: string[]) {
    const response = await fetch("/api/voice/analyze-patterns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transcripts }),
    });

    if (!response.ok) {
      throw new Error("Failed to analyze voice patterns");
    }

    return await response.json();
  }

  // Generate persona metadata
  static async generateMetadata(voiceAnalysis: any) {
    if (!auth || !auth.currentUser) {
      throw new Error("Please sign in to create personas");
    }

    const token = await auth.currentUser.getIdToken();

    const response = await fetch("/api/personas/generate-metadata", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ voiceAnalysis }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.success) {
        return {
          name: data.title,
          description: data.description,
          tags: data.suggestedTags,
        };
      }
    }

    return {
      name: "",
      description: "",
      tags: [],
    };
  }

  // Create a new persona
  static async createPersona(personaData: {
    name: string;
    description: string;
    platform: string;
    username: string;
    analysis?: any; // optional to allow draft saves
    tags: string[];
    creationStatus?: "pending" | "videos_collected" | "analyzed" | "created";
    videoUrls?: string[];
  }) {
    if (!auth || !auth.currentUser) {
      throw new Error("Please sign in to create personas");
    }

    const token = await auth.currentUser.getIdToken();

    const response = await fetch("/api/personas/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(personaData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error ?? "Failed to create persona");
    }

    return await response.json();
  }

  // Fetch video CDN URLs using UnifiedVideoScraper
  static async fetchVideoCdnUrls(videoUrls: string[]): Promise<string[]> {
    const cdnUrls: string[] = [];

    for (const videoUrl of videoUrls.slice(0, 10)) {
      try {
        // Use UnifiedVideoScraper to get video data with CDN URLs
        const videoData = await scrapeVideoUrl(videoUrl);

        // Get the CDN URL from the scraped data
        const cdnUrl = videoData.videoUrl;
        if (cdnUrl) {
          cdnUrls.push(cdnUrl);
        }
      } catch (error) {
        console.error(`Failed to fetch video data for ${videoUrl}:`, error);
        // Continue with next video instead of failing completely
      }
    }

    if (cdnUrls.length === 0) {
      throw new Error("Could not fetch video data. Please check the URLs and try again.");
    }

    return cdnUrls;
  }

  // Update persona metadata
  static async updatePersona(personaId: string, updates: Partial<{
    name: string;
    description: string;
    tags: string[];
    status: "active" | "draft";
    creationStatus: "pending" | "videos_collected" | "analyzed" | "created";
  }>) {
    if (!auth || !auth.currentUser) {
      throw new Error("Please sign in to update personas");
    }
    const token = await auth.currentUser.getIdToken();
    const res = await fetch("/api/personas/update", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ personaId, ...updates }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Failed to update persona");
    }
    return await res.json();
  }

  // Delete persona
  static async deletePersona(personaId: string) {
    if (!auth || !auth.currentUser) {
      throw new Error("Please sign in to delete personas");
    }
    const token = await auth.currentUser.getIdToken();
    const res = await fetch("/api/personas/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ personaId }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data?.error || "Failed to delete persona");
    }
    return await res.json();
  }
}
