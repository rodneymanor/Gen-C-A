/**
 * Collections API Routes
 * Manage collections using extracted services with proper authentication and authorization
 */

import { requireAuth, createSuccessResponse, createErrorResponse } from '@/services/api-middleware';
import { getAdminDb } from "@/lib/firebase-admin";
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
 * GET /api/collections
 * Get all collections accessible to the current user
 */
export const GET = requireAuth(async (request, context) => {
  try {
    const { userId, rbacContext } = context;

    console.log("📚 [Collections API] GET request received for user:", userId);

    const service = getCollectionsService();
    const result = await service.listCollections(userId);

    console.log("✅ [Collections API] Successfully fetched", result.total, "collections");

    return createSuccessResponse({
      user: {
        id: userId,
        role: rbacContext?.role || 'creator',
        isSuperAdmin: rbacContext?.isSuperAdmin || false
      },
      collections: result.collections,
      accessibleCoaches: result.accessibleCoaches,
      total: result.total
    });
  } catch (error) {
    console.error("❌ [Collections API] Error fetching collections:", error);
    return handleCollectionsError(error, 'collections/fetch-error', 'Failed to fetch collections');
  }
});

/**
 * POST /api/collections
 * Create a new collection
 */
export const POST = requireAuth(async (request, context) => {
  try {
    const { userId } = context;
    console.log("📚 [Collections API] POST request received for user:", userId);

    const body = await request.json();
    const service = getCollectionsService();
    const collection = await service.createCollection(userId, body);

    console.log("✅ [Collections API] Collection created successfully:", collection.id);

    return createSuccessResponse({
      message: "Collection created successfully",
      collection
    }, 201);
  } catch (error) {
    console.error("❌ [Collections API] Error creating collection:", error);
    return handleCollectionsError(error, 'collections/create-error', 'Failed to create collection');
  }
});
