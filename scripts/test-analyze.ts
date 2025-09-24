import { config as loadEnv } from 'dotenv';

loadEnv();
loadEnv({ path: '.env.local' });

import { createUnifiedVideoScraper } from '@/lib/unified-video-scraper';
import { TranscriptionService } from '@/services/transcription-service';
import { getYouTubeTranscriptService } from '@/services/video/youtube-transcript-service.js';
import { getYouTubeIdeaSeedsService } from '@/services/scripts/youtube-idea-seeds-service.js';

interface AnalyzeResult {
  platform: 'youtube' | 'instagram' | 'tiktok';
  transcript: string;
  transcriptPreview: string;
  ideasCount: number;
  stageLogs: string[];
}

function detectPlatform(url: string): AnalyzeResult['platform'] | 'unknown' {
  const normalized = url.toLowerCase();
  if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) return 'youtube';
  if (normalized.includes('tiktok.com')) return 'tiktok';
  if (normalized.includes('instagram.com')) return 'instagram';
  return 'unknown';
}

async function analyzeClip(url: string): Promise<AnalyzeResult> {
  const platform = detectPlatform(url);
  if (platform === 'unknown') {
    throw new Error(`Unsupported platform for URL: ${url}`);
  }

  const stageLogs: string[] = [];

  const ideaService = getYouTubeIdeaSeedsService();
  let transcript = '';
  let transcriptPreview = '';
  let ideasCount = 0;

  if (platform === 'youtube') {
    stageLogs.push('Fetching YouTube transcript via RapidAPI');
    const transcriptService = getYouTubeTranscriptService();
    const response = await transcriptService.fetchTranscript({ url, lang: 'en' });
    transcript = response.text ?? '';
    transcriptPreview = transcript.slice(0, 200);

    stageLogs.push('Generating idea seeds with GEMINI');
    try {
      const ideaResult = await ideaService.generateIdeaSeeds({
        url,
        transcript,
        chunks: response.chunks ?? [],
        videoId: undefined,
        lang: response.language ?? 'en',
        maxIdeas: 8,
        minOverall: 70,
        audienceLevel: 'intermediate',
      });

      ideasCount = Array.isArray(ideaResult?.ideas) ? ideaResult.ideas.length : 0;
      stageLogs.push(`Idea seeds generated: ${ideasCount}`);
    } catch (error: any) {
      stageLogs.push('Idea generation failed');
      if (error?.debug) {
        stageLogs.push(`Debug: ${JSON.stringify(error.debug).slice(0, 500)}...`);
      }
      throw error;
    }
  } else {
    stageLogs.push('Scraping media via UnifiedVideoScraper');
    const scraper = createUnifiedVideoScraper();
    const scrapeResult = await scraper.scrapeUrl(url, {});
    const downloadUrl = scrapeResult.audioUrl ?? scrapeResult.downloadUrl;
    if (!downloadUrl) {
      throw new Error('No download URL returned from scraper.');
    }

    stageLogs.push('Transcribing media via TranscriptionService');
    const transcriptionService = new TranscriptionService();
    const transcription = await transcriptionService.transcribeFromUrl(downloadUrl, platform);
    if (!transcription || !transcription.success) {
      throw new Error('Transcription failed or returned no transcript.');
    }
    transcript = transcription.transcript;
    transcriptPreview = transcript.slice(0, 200);

    stageLogs.push('Generating idea seeds with GEMINI');
    try {
      const ideaResult = await ideaService.generateIdeaSeeds({
        url,
        transcript,
        sourcePlatform: platform,
        maxIdeas: 6,
        minOverall: 65,
        audienceLevel: 'intermediate',
      });

      ideasCount = Array.isArray(ideaResult?.ideas) ? ideaResult.ideas.length : 0;
      stageLogs.push(`Idea seeds generated: ${ideasCount}`);
    } catch (error: any) {
      stageLogs.push('Idea generation failed');
      if (error?.debug) {
        stageLogs.push(`Debug: ${JSON.stringify(error.debug).slice(0, 500)}...`);
      }
      throw error;
    }
  }

  return {
    platform,
    transcript,
    transcriptPreview,
    ideasCount,
    stageLogs,
  };
}

async function run() {
  const urls = process.argv.slice(2);
  if (!urls.length) {
    console.error('Usage: npx tsx scripts/test-analyze.ts <url1> <url2> ...');
    process.exitCode = 1;
    return;
  }

  for (const url of urls) {
    console.log('========================================');
    console.log('Analyzing:', url);
    try {
      const result = await analyzeClip(url);
      console.log('Platform:', result.platform);
      console.log('Transcript preview:', result.transcriptPreview.replace(/\s+/g, ' '));
      console.log('Transcript length:', result.transcript.length);
      console.log('Ideas generated:', result.ideasCount);
      console.log('Stage logs:');
      result.stageLogs.forEach((log) => console.log(' -', log));
    } catch (error: any) {
      console.error('Error analyzing clip:', error instanceof Error ? error.message : error);
      if (error?.debug) {
        console.error('Debug info:', JSON.stringify(error.debug, null, 2));
      }
    }
  }
}

run().catch((error) => {
  console.error('Fatal error:', error);
  process.exitCode = 1;
});
