/**
 * User Collections API Route
 * Get collections for the authenticated user using extracted services
 */

import { requireAuth, createSuccessResponse, createErrorResponse } from '@/services/api-middleware';
import { getAdminDb } from '@/lib/firebase-admin';
import { CollectionsServiceError, getCollectionsAdminService } from '@/services/collections/collections-admin-service.js';

function getCollectionsService() {
  const db = getAdminDb();
  if (!db) {
    throw new CollectionsServiceError('Database not available', 500);
  }
  return getCollectionsAdminService(db);
}

function handleCollectionsError(error: unknown, code: string, fallbackMessage: string) {
  if (error instanceof CollectionsServiceError) {
    return createErrorResponse(error.message, error.statusCode, code);
  }
  const message = error instanceof Error ? error.message : String(error);
  return createErrorResponse(fallbackMessage, 500, code, message);
}

/**
 * GET /api/collections/user-collections
 * Get collections accessible to the current user (same as /api/collections but different route)
 */
export const GET = requireAuth(async (request, context) => {
  try {
    const { userId, rbacContext } = context;

    console.log("📚 [User Collections API] GET request received for user:", userId);

    const service = getCollectionsService();
    const result = await service.listCollections(userId);

    console.log("✅ [User Collections API] Successfully fetched", result.total, "collections");

    return createSuccessResponse({
      user: {
        id: userId,
        role: rbacContext?.role || 'creator',
        isSuperAdmin: rbacContext?.isSuperAdmin || false,
        accessibleCoaches: result.accessibleCoaches
      },
      collections: result.collections,
      total: result.total
    });
  } catch (error) {
    console.error("❌ [User Collections API] Error fetching collections:", error);
    return handleCollectionsError(error, 'collections/user-fetch-error', 'Failed to fetch user collections');
  }
});
