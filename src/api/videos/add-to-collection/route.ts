/**
 * Add Video to Collection API Route
 * Add videos to collections using extracted services with proper authorization
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/services/api-middleware';
import { getServices } from '@/services/service-container';
import { getAdminDb } from "@/lib/firebase-admin";
import type { Video } from "@/lib/collections";

// Define the request body type
interface AddVideoRequest {
  userId: string;
  collectionId: string;
  videoData: {
    originalUrl: string;
    platform: string;
    addedAt: string;
    processing?: {
      scrapeAttempted: boolean;
      transcriptAttempted: boolean;
      components: {
        hook: string;
        bridge: string;
        nugget: string;
        wta: string;
      };
    };
    metrics?: {
      views: number;
      likes: number;
      comments: number;
      saves: number;
    };
  };
}

// Helper function to generate title from URL
function generateTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes("tiktok")) {
      return `TikTok Video - ${new Date().toLocaleDateString()}`;
    }

    if (hostname.includes("instagram")) {
      return `Instagram Video - ${new Date().toLocaleDateString()}`;
    }

    return `Video - ${new Date().toLocaleDateString()}`;
  } catch {
    return `Video - ${new Date().toLocaleDateString()}`;
  }
}

// Helper function to get default thumbnail
function getDefaultThumbnail(platform: string): string {
  const platformLower = platform.toLowerCase();

  if (platformLower.includes("tiktok")) {
    return "/images/placeholder.svg";
  }

  if (platformLower.includes("instagram")) {
    return "/images/instagram-placeholder.jpg";
  }

  return "/images/video-placeholder.jpg";
}

// Helper function to extract hashtags from title
function extractHashtagsFromTitle(title: string): string[] {
  const hashtagRegex = /#[\w-]+/g;
  const matches = title.match(hashtagRegex);
  return matches ? matches.map((tag) => tag.substring(1)) : [];
}

// Helper function to infer content type
function inferContentType(platform: string): string {
  const platformLower = platform.toLowerCase();

  if (platformLower.includes("tiktok")) {
    return "short-form";
  }

  if (platformLower.includes("instagram")) {
    return "social-media";
  }

  return "general";
}

// Create the video object with all required fields
function createVideoObject(
  userId: string,
  collectionId: string,
  videoData: AddVideoRequest["videoData"],
): Omit<Video, "id"> {
  const title = generateTitleFromUrl(videoData.originalUrl);

  return {
    url: videoData.originalUrl,
    title,
    platform: videoData.platform,
    thumbnailUrl: getDefaultThumbnail(videoData.platform),
    author: "Unknown Creator",
    transcript: "Transcript not available",
    visualContext: "Basic video import",
    fileSize: 0,
    duration: 0,
    userId,
    collectionId,
    addedAt: videoData.addedAt ?? new Date().toISOString(),
    components: videoData.processing?.components ?? {
      hook: "Auto-generated hook",
      bridge: "Auto-generated bridge",
      nugget: "Auto-generated nugget",
      wta: "Auto-generated why to act",
    },
    contentMetadata: {
      hashtags: extractHashtagsFromTitle(title),
      mentions: [],
      description: title,
    },
    insights: {
      engagementRate: 0,
      contentType: inferContentType(videoData.platform),
      keyTopics: [],
      sentiment: "neutral" as const,
      difficulty: "beginner" as const,
    },
  };
}

// Update collection video count
async function updateCollectionCount(
  adminDb: FirebaseFirestore.Firestore,
  collectionId: string,
  userId: string,
  increment: number,
): Promise<void> {
  if (collectionId !== "all-videos") {
    const collectionRef = adminDb.collection("collections").doc(collectionId);
    const collectionDoc = await collectionRef.get();

    if (collectionDoc.exists && collectionDoc.data()?.userId === userId) {
      const currentCount = collectionDoc.data()?.videoCount ?? 0;
      await collectionRef.update({
        videoCount: Math.max(0, currentCount + increment),
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

/**
 * POST /api/videos/add-to-collection
 * Add a video to a collection with proper authorization
 */
export const POST = requireAuth(async (request, context) => {
  try {
    const { userId: authenticatedUserId, rbacContext } = context;
    const { rbacService } = getServices();

    // Parse request body
    const body = await request.json();
    const { userId: requestedUserId, collectionId, videoData } = body;

    // Validate required fields
    if (!collectionId || !videoData) {
      return createErrorResponse(
        "Missing required fields: collectionId and videoData are required",
        400,
        "videos/missing-fields"
      );
    }

    if (!videoData.originalUrl) {
      return createErrorResponse(
        "Video URL is required",
        400,
        "videos/missing-url"
      );
    }

    // Validate URL format
    try {
      new URL(videoData.originalUrl);
    } catch {
      return createErrorResponse(
        "Invalid video URL format",
        400,
        "videos/invalid-url"
      );
    }

    // Determine target user ID - only super admins can add videos for other users
    let targetUserId = authenticatedUserId;
    if (requestedUserId && requestedUserId !== authenticatedUserId) {
      if (rbacContext?.isSuperAdmin) {
        targetUserId = requestedUserId;
      } else {
        return createErrorResponse(
          "Insufficient permissions to add videos for other users",
          403,
          "videos/add-forbidden"
        );
      }
    }

    // Check if user has permission to write to the collection
    const canWrite = await rbacService.canPerformAction(targetUserId, 'write', 'collection', collectionId);
    if (!canWrite) {
      return createErrorResponse(
        "Insufficient permissions to add videos to this collection",
        403,
        "videos/collection-write-forbidden"
      );
    }

    // Get database instance
    const adminDb = getAdminDb();
    if (!adminDb) {
      return createErrorResponse(
        "Database not available",
        500,
        "videos/database-error"
      );
    }

    // Create video object
    const video = createVideoObject(targetUserId, collectionId, videoData);

    // Add video to Firestore
    const videoRef = adminDb.collection("videos").doc();
    await videoRef.set(video);
    const videoId = videoRef.id;

    // Update collection video count
    await updateCollectionCount(adminDb, collectionId, targetUserId, 1);

    console.log("✅ [Add Video] Successfully added video:", videoId, "to collection:", collectionId);

    return createSuccessResponse({
      videoId,
      message: "Video added successfully to collection",
      video: {
        id: videoId,
        ...video
      }
    }, 201);
    
  } catch (error: any) {
    console.error("❌ [Add Video] Failed to add video to collection:", error);
    return createErrorResponse(
      "Failed to add video to collection",
      500,
      "videos/add-error",
      error.message
    );
  }
});
