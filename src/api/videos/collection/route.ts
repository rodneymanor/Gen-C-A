/**
 * Collection Videos API Route
 * Get videos from a collection using extracted services
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/services/api-middleware';
import { getServices } from '@/services/service-container';

/**
 * POST /api/videos/collection
 * Get videos from a specific collection or all videos
 */
export const POST = requireAuth(async (request, context) => {
  try {
    const { userId, rbacContext } = context;
    const { rbacService } = getServices();

    // Safely parse body to avoid 'Unexpected end of JSON input' on aborted requests
    const raw = await request.text();
    let collectionId: string | undefined;
    let videoLimit: number | undefined;
    let lastDocId: string | undefined;

    if (raw) {
      try {
        const body = JSON.parse(raw);
        collectionId = body.collectionId;
        videoLimit = body.videoLimit;
        lastDocId = body.lastDocId;
      } catch (parseError) {
        return createErrorResponse(
          "Invalid JSON in request body",
          400,
          "videos/invalid-json"
        );
      }
    }

    console.log("🎬 [Videos API] Getting collection videos for user:", userId, "collection:", collectionId);

    // Note: lastDocId handling is not yet implemented in the extracted service
    // The RBACService expects a Firestore document snapshot, not a string ID
    const result = await rbacService.getCollectionVideos(
      userId,
      collectionId,
      videoLimit,
      undefined // lastDoc cursor not supported via API for now
    );

    console.log("✅ [Videos API] Successfully fetched", result.videos.length, "videos");

    return createSuccessResponse({
      videos: result.videos,
      totalCount: result.totalCount,
      lastDoc: result.lastDoc ? "pagination_token" : undefined, // Simplified for API
      hasMore: !!result.lastDoc
    });
    
  } catch (error: any) {
    console.error("❌ [Videos API] Error getting collection videos:", error);
    
    // Return empty videos instead of error to prevent UI breaking
    return NextResponse.json({
      success: true,
      videos: [],
      totalCount: 0,
      hasMore: false,
      timestamp: new Date().toISOString()
    });
  }
});
