import { NextRequest, NextResponse } from "next/server";

// No external library imports needed - using RapidAPI directly

import { authenticateApiKey } from "@/lib/api-key-auth";
import { notesService } from "@/lib/services/notes-service";
import { generateYouTubeTitleFromTranscript } from "@/lib/transcript-title-generator";

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

interface YouTubeMetadata {
  videoId: string;
  title?: string;
  channelName?: string;
  channelId?: string;
  duration?: number;
  publishedAt?: string;
  description?: string;
  thumbnailUrl?: string;
  viewCount?: number;
}

interface TranscriptResponse {
  success: boolean;
  transcript?: string;
  segments?: TranscriptSegment[];
  metadata?: YouTubeMetadata;
  note?: {
    id: string;
    title: string;
    content: string;
    url: string;
    type: "youtube";
    metadata: YouTubeMetadata;
    createdAt: string;
    updatedAt: string;
    userId: string;
  };
  error?: string;
}

interface TranscriptRequest {
  url: string;
  saveAsNote?: boolean;
  includeTimestamps?: boolean;
  language?: string;
}

/**
 * Extracts YouTube video ID from various URL formats
 */
function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);

    // Standard YouTube URLs
    if (urlObj.hostname === "www.youtube.com" || urlObj.hostname === "youtube.com") {
      return urlObj.searchParams.get("v");
    }

    // YouTube short URLs
    if (urlObj.hostname === "youtu.be") {
      return urlObj.pathname.slice(1);
    }

    // YouTube embed URLs
    if (urlObj.hostname === "www.youtube.com" && urlObj.pathname.startsWith("/embed/")) {
      return urlObj.pathname.split("/embed/")[1];
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetches basic YouTube video metadata using oEmbed API
 */
async function fetchYouTubeMetadata(videoId: string): Promise<Partial<YouTubeMetadata>> {
  try {
    // Use YouTube oEmbed API for basic metadata
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);

    if (!response.ok) {
      console.warn(`Failed to fetch oEmbed data for video ${videoId}`);
      return {};
    }

    const data = await response.json();

    return {
      title: data.title,
      channelName: data.author_name,
      thumbnailUrl: data.thumbnail_url,
    };
  } catch (error) {
    console.error(`Error fetching YouTube metadata for ${videoId}:`, error);
    return {};
  }
}

/**
 * Fetches transcript from RapidAPI YouTube Transcript service
 */
async function fetchTranscriptFromRapidAPI(videoId: string): Promise<TranscriptSegment[]> {
  const rapidApiKey = process.env.RAPIDAPI_KEY;
  if (!rapidApiKey) {
    throw new Error("RapidAPI key not configured");
  }

  const url = `https://youtube-transcript3.p.rapidapi.com/api/transcript?videoId=${videoId}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-rapidapi-host": "youtube-transcript3.p.rapidapi.com",
      "x-rapidapi-key": rapidApiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`RapidAPI request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Handle RapidAPI response format
  if (!data.success) {
    throw new Error(data.error || "Failed to fetch transcript from RapidAPI");
  }

  const segments = data.transcript;

  if (!Array.isArray(segments)) {
    throw new Error("Invalid transcript format from RapidAPI");
  }

  // Convert RapidAPI format to our format
  // RapidAPI uses: text, offset (as string), duration (as string)
  return segments.map((segment: any) => ({
    text: segment.text || "",
    start: parseFloat(segment.offset || 0),
    duration: parseFloat(segment.duration || 0),
  }));
}

/**
 * Formats transcript segments into readable text
 */
function formatTranscript(segments: TranscriptSegment[], includeTimestamps: boolean = false): string {
  if (!segments || segments.length === 0) {
    return "";
  }

  return segments
    .map((segment) => {
      const text = segment.text.trim();
      if (includeTimestamps) {
        const minutes = Math.floor(segment.start / 60);
        const seconds = Math.floor(segment.start % 60);
        const timestamp = `${minutes}:${seconds.toString().padStart(2, "0")}`;
        return `[${timestamp}] ${text}`;
      }
      return text;
    })
    .join(" ");
}

/**
 * POST /api/chrome-extension/youtube-transcript
 * Extracts transcript from YouTube video and optionally saves as note
 */
export async function POST(request: NextRequest): Promise<NextResponse<TranscriptResponse>> {
  try {
    console.log("🎥 [YouTube Transcript] Starting transcript extraction");

    // Authenticate user
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<TranscriptResponse>;
    }

    const { user } = authResult;
    const userId = user.uid;

    // Parse request body
    const body: TranscriptRequest = await request.json();
    const { url, saveAsNote = false, includeTimestamps = false, language = "en" } = body;

    if (!url?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "YouTube URL is required",
        },
        { status: 400 },
      );
    }

    // Extract video ID
    const videoId = extractVideoId(url.trim());
    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid YouTube URL format",
        },
        { status: 400 },
      );
    }

    console.log(`👤 [YouTube Transcript] Processing video ${videoId} for user: ${userId}`, {
      saveAsNote,
      includeTimestamps,
      language,
    });

    // Fetch transcript using RapidAPI
    let segments: TranscriptSegment[];
    console.log(`🔍 [YouTube Transcript] Attempting to fetch transcript for videoId: ${videoId} using RapidAPI`);

    try {
      segments = await fetchTranscriptFromRapidAPI(videoId);
      console.log(`✅ [YouTube Transcript] Segments fetched from RapidAPI:`, segments.length, "segments");
      console.log(`🔍 [YouTube Transcript] First few segments:`, segments.slice(0, 3));
    } catch (transcriptError) {
      console.error(`❌ [YouTube Transcript] Failed to fetch transcript for ${videoId}:`, transcriptError);

      const errorMessage = transcriptError instanceof Error ? transcriptError.message : "Unknown error";

      return NextResponse.json(
        {
          success: false,
          error: `Transcript extraction failed: ${errorMessage}. Please verify the video has captions enabled and is publicly accessible.`,
        },
        { status: 404 },
      );
    }

    if (!segments || segments.length === 0) {
      console.log(
        `⚠️ [YouTube Transcript] No segments found - this may be due to YouTube API changes or video lacking captions`,
      );
      return NextResponse.json(
        {
          success: false,
          error:
            "Transcript not available. This could be due to: (1) Video has no captions/subtitles enabled, (2) YouTube API changes affecting transcript access, or (3) Video is private/restricted. Please try a different video or contact support if this persists.",
        },
        { status: 404 },
      );
    }

    // Format transcript
    const transcript = formatTranscript(segments, includeTimestamps);

    // Fetch video metadata
    const metadata: YouTubeMetadata = {
      videoId,
      ...(await fetchYouTubeMetadata(videoId)),
    };

    console.log(
      `✅ [YouTube Transcript] Transcript extracted: ${segments.length} segments, ${transcript.length} characters`,
    );

    let savedNote;

    // Save as note if requested
    if (saveAsNote) {
      try {
        // Store only the transcript in the content field
        // Clean up any HTML entities in the transcript
        const cleanTranscript = transcript
          .replace(/&#39;/g, "'")
          .replace(/&quot;/g, '"')
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">");

        const noteTitle = generateYouTubeTitleFromTranscript(cleanTranscript, metadata.title);

        const noteId = await notesService.createNote(userId, {
          title: noteTitle,
          content: cleanTranscript, // Only the transcript, no metadata
          tags: ["youtube", "transcript", "video"],
          type: "text", // Use the standard note type
          source: "import", // Mark as imported from external source
          starred: false,
          metadata: {
            videoId: metadata.videoId,
            channelName: metadata.channelName,
            channelId: metadata.channelId,
            videoUrl: url,
            thumbnailUrl: metadata.thumbnailUrl,
            duration: metadata.duration,
            viewCount: metadata.viewCount,
            publishedAt: metadata.publishedAt,
          },
        });

        // Get the created note to return
        const createdNote = await notesService.getNote(noteId, userId);

        if (createdNote) {
          savedNote = {
            id: createdNote.id,
            title: createdNote.title,
            content: createdNote.content,
            url: url.trim(),
            type: "youtube" as const,
            metadata: {
              ...metadata,
              domain: "youtube.com",
              transcriptLength: transcript.length,
              segmentCount: segments.length,
            },
            createdAt: createdNote.createdAt.toISOString(),
            updatedAt: createdNote.updatedAt.toISOString(),
            userId,
          };
        }

        console.log(`✅ [YouTube Transcript] Note saved successfully: ${noteId}`);
      } catch (saveError) {
        console.error("❌ [YouTube Transcript] Error saving note:", saveError);
        // Continue without failing the entire request
      }
    }

    return NextResponse.json({
      success: true,
      transcript,
      segments,
      metadata,
      ...(savedNote && {
        note: savedNote,
        editUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/capture/notes/new?noteId=${savedNote.id}`,
      }),
    });
  } catch (error) {
    console.error("❌ [YouTube Transcript] Error extracting transcript:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to extract transcript",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/chrome-extension/youtube-transcript
 * Quick transcript extraction without saving
 * Query parameters:
 * - url: YouTube video URL (required)
 * - includeTimestamps: boolean (optional)
 * - language: language code (optional, default: 'en')
 */
export async function GET(request: NextRequest): Promise<NextResponse<TranscriptResponse>> {
  try {
    console.log("🎥 [YouTube Transcript] Starting quick transcript extraction");

    // Authenticate user
    const authResult = await authenticateApiKey(request);
    if (authResult instanceof NextResponse) {
      return authResult as NextResponse<TranscriptResponse>;
    }

    const { user } = authResult;
    const userId = user.uid;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const includeTimestamps = searchParams.get("includeTimestamps") === "true";

    if (!url?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "YouTube URL is required",
        },
        { status: 400 },
      );
    }

    // Extract video ID
    const videoId = extractVideoId(url.trim());
    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid YouTube URL format",
        },
        { status: 400 },
      );
    }

    console.log(`👤 [YouTube Transcript] Quick processing video ${videoId} for user: ${userId}`);

    // Fetch transcript using RapidAPI
    let segments: TranscriptSegment[];
    console.log(`🔍 [YouTube Transcript GET] Attempting to fetch transcript for videoId: ${videoId} using RapidAPI`);

    try {
      segments = await fetchTranscriptFromRapidAPI(videoId);
      console.log(`✅ [YouTube Transcript GET] Segments fetched from RapidAPI:`, segments.length, "segments");
      console.log(`🔍 [YouTube Transcript GET] First few segments:`, segments.slice(0, 3));
    } catch (transcriptError) {
      console.error(`❌ [YouTube Transcript GET] Failed to fetch transcript for ${videoId}:`, transcriptError);

      const errorMessage = transcriptError instanceof Error ? transcriptError.message : "Unknown error";

      return NextResponse.json(
        {
          success: false,
          error: `Transcript extraction failed: ${errorMessage}. Please verify the video has captions enabled and is publicly accessible.`,
        },
        { status: 404 },
      );
    }

    // Format transcript
    const transcript = formatTranscript(segments, includeTimestamps);

    // Fetch basic metadata
    const metadata: YouTubeMetadata = {
      videoId,
      ...(await fetchYouTubeMetadata(videoId)),
    };

    console.log(`✅ [YouTube Transcript] Quick transcript extracted: ${segments.length} segments`);

    return NextResponse.json({
      success: true,
      transcript,
      segments,
      metadata,
    });
  } catch (error) {
    console.error("❌ [YouTube Transcript] Error extracting transcript:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to extract transcript",
      },
      { status: 500 },
    );
  }
}
