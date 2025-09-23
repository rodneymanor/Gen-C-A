/**
 * Video Reprocess API Route
 * Reprocess videos with proper authorization using extracted services
 */

import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin, createSuccessResponse, createErrorResponse } from '@/services/api-middleware';
import { getServices } from '@/services/service-container';
import { getAdminDb } from "@/lib/firebase-admin";

type StoredVideo = {
  originalUrl?: string;
  collectionId?: string;
  userId?: string;
  title?: string;
};

/**
 * Get the base URL for internal API calls
 */
function getBaseUrl(request: NextRequest): string {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  const host = request.headers.get("host");
  return host ? `http://${host}` : `http://localhost:${process.env.PORT ?? 3001}`;
}

/**
 * POST /api/videos/reprocess
 * Reprocess a video (super admin only)
 */
export const POST = requireSuperAdmin(async (request, context) => {
  try {
    const { userId } = context;
    
    // Get database instance
    const adminDb = getAdminDb();
    if (!adminDb) {
      return createErrorResponse(
        "Database not available",
        500,
        "videos/database-error"
      );
    }

    const { videoId } = await request.json();
    if (!videoId) {
      return createErrorResponse(
        "videoId is required",
        400,
        "videos/missing-video-id"
      );
    }

    console.log("🔄 [Reprocess] Super admin", userId, "reprocessing video:", videoId);

    // Load the video
    const videoRef = adminDb.collection("videos").doc(videoId);
    const videoDoc = await videoRef.get();
    if (!videoDoc.exists) {
      return createErrorResponse(
        "Video not found",
        404,
        "videos/not-found"
      );
    }

    const videoData = videoDoc.data() as StoredVideo | undefined;
    if (!videoData?.originalUrl || !videoData.collectionId || !videoData.userId) {
      return createErrorResponse(
        "Video missing required fields",
        400,
        "videos/invalid-video-data"
      );
    }

    const { originalUrl, collectionId, userId: videoUserId, title } = videoData;

    // Delete existing video to force a clean re-run
    await videoRef.delete();

    // Decrement collection count if not all-videos
    if (collectionId !== "all-videos") {
      const collectionRef = adminDb.collection("collections").doc(collectionId);
      await adminDb.runTransaction(async (tx: any) => {
        const cDoc = await tx.get(collectionRef);
        if (cDoc.exists) {
          const currentCount = cDoc.data()?.videoCount ?? 0;
          tx.update(collectionRef, { 
            videoCount: Math.max(0, currentCount - 1), 
            updatedAt: new Date().toISOString() 
          });
        }
      });
    }

    // Re-run processing via internal orchestrator to keep same collection/user
    const baseUrl = getBaseUrl(request);
    
    try {
      const res = await fetch(`${baseUrl}/api/internal/video/process-and-add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-secret": process.env.INTERNAL_API_SECRET ?? "",
        },
        body: JSON.stringify({ 
          videoUrl: originalUrl, 
          collectionId, 
          userId: videoUserId, 
          title 
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        console.error("❌ [Reprocess] Internal API failed:", errText);
        return createErrorResponse(
          "Reprocess failed",
          500,
          "videos/reprocess-failed",
          errText
        );
      }

      const data = await res.json();
      
      console.log("✅ [Reprocess] Video reprocessed successfully:", data.videoId);

      return createSuccessResponse({
        message: "Video reprocessed successfully",
        newVideoId: data.videoId,
        collectionId,
        originalVideoId: videoId
      });
      
    } catch (fetchError: any) {
      console.error("❌ [Reprocess] Network error calling internal API:", fetchError);
      return createErrorResponse(
        "Failed to communicate with processing service",
        500,
        "videos/processing-service-error",
        fetchError.message
      );
    }
    
  } catch (error: any) {
    console.error("❌ [Reprocess] Error reprocessing video:", error);
    return createErrorResponse(
      "Reprocess error",
      500,
      "videos/reprocess-error",
      error.message
    );
  }
});
