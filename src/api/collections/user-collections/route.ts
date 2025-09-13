/**
 * User Collections API Route
 * Get collections for the authenticated user using extracted services
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/services/api-middleware';
import { getServices } from '@/services/service-container';

/**
 * GET /api/collections/user-collections
 * Get collections accessible to the current user (same as /api/collections but different route)
 */
export const GET = requireAuth(async (request, context) => {
  try {
    const { userId, rbacContext } = context;
    const { rbacService } = getServices();

    console.log("📚 [User Collections API] GET request received for user:", userId);

    // Get collections using the extracted RBAC service
    const result = await rbacService.getUserCollections(userId);

    console.log("✅ [User Collections API] Successfully fetched", result.collections.length, "collections");

    return createSuccessResponse({
      user: {
        id: userId,
        role: rbacContext?.role || 'creator',
        isSuperAdmin: rbacContext?.isSuperAdmin || false,
        accessibleCoaches: result.accessibleCoaches
      },
      collections: result.collections,
      total: result.collections.length
    });
    
  } catch (error: any) {
    console.error("❌ [User Collections API] Error fetching collections:", error);
    return createErrorResponse(
      "Failed to fetch user collections",
      500,
      "collections/user-fetch-error",
      error.message
    );
  }
});
