/**
 * Collections API Routes
 * Manage collections using extracted services with proper authentication and authorization
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/services/api-middleware';
import { getServices } from '@/services/service-container';
import { getAdminDb } from "@/lib/firebase-admin";
import { COLLECTION_LIMITS } from "@/lib/collections";
import { serverTimestamp, addDoc, collection } from 'firebase-admin/firestore';

/**
 * Validate collection creation request data
 */
function validateCreateCollectionRequest(body: { title?: string; description?: string }) {
  const { title, description = "" } = body;

  if (!title) {
    return {
      isValid: false,
      error: "Title is required"
    };
  }

  if (title.trim().length === 0) {
    return {
      isValid: false,
      error: "Title cannot be empty"
    };
  }

  if (title.trim().length > COLLECTION_LIMITS.MAX_TITLE_LENGTH) {
    return {
      isValid: false,
      error: `Collection title must be ${COLLECTION_LIMITS.MAX_TITLE_LENGTH} characters or less`
    };
  }

  if (description.trim().length > COLLECTION_LIMITS.MAX_DESCRIPTION_LENGTH) {
    return {
      isValid: false,
      error: `Collection description must be ${COLLECTION_LIMITS.MAX_DESCRIPTION_LENGTH} characters or less`
    };
  }

  return {
    isValid: true,
    data: { 
      title: title.trim(), 
      description: description.trim() 
    }
  };
}

/**
 * GET /api/collections
 * Get all collections accessible to the current user
 */
export const GET = requireAuth(async (request, context) => {
  try {
    const { userId, rbacContext } = context;
    const { rbacService } = getServices();

    console.log("📚 [Collections API] GET request received for user:", userId);

    // Get collections using the extracted RBAC service
    const result = await rbacService.getUserCollections(userId);

    // Format collections for API response
    const formattedCollections = result.collections.map((collection) => ({
      id: collection.id,
      title: collection.title,
      description: collection.description || '',
      userId: collection.userId,
      videoCount: 0, // TODO: Add video count calculation
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    }));

    console.log("✅ [Collections API] Successfully fetched", formattedCollections.length, "collections");

    return createSuccessResponse({
      user: {
        id: userId,
        role: rbacContext?.role || 'creator',
        isSuperAdmin: rbacContext?.isSuperAdmin || false
      },
      collections: formattedCollections,
      accessibleCoaches: result.accessibleCoaches,
      total: formattedCollections.length
    });
    
  } catch (error: any) {
    console.error("❌ [Collections API] Error fetching collections:", error);
    return createErrorResponse(
      "Failed to fetch collections",
      500,
      "collections/fetch-error",
      error.message
    );
  }
});

/**
 * POST /api/collections
 * Create a new collection
 */
export const POST = requireAuth(async (request, context) => {
  try {
    const { userId, rbacContext } = context;
    const { rbacService } = getServices();

    console.log("📚 [Collections API] POST request received for user:", userId);

    // Check if user has permission to create collections
    const canCreate = await rbacService.canPerformAction(userId, 'write', 'collection');
    if (!canCreate) {
      return createErrorResponse(
        "Insufficient permissions to create collections",
        403,
        "collections/create-forbidden"
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validation = validateCreateCollectionRequest(body);

    if (!validation.isValid) {
      return createErrorResponse(
        validation.error,
        400,
        "collections/validation-error"
      );
    }

    const { title, description } = validation.data;

    console.log("🆕 [Collections API] Creating collection:", title, "for user:", userId);

    // Get Firestore Admin instance
    const db = getAdminDb();
    if (!db) {
      return createErrorResponse(
        "Database not available",
        500,
        "collections/database-error"
      );
    }

    // Create collection data
    const collectionData = {
      title,
      description,
      userId,
      videoCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Add collection to Firestore
    const collectionsRef = collection(db, 'collections');
    const docRef = await addDoc(collectionsRef, collectionData);

    console.log("✅ [Collections API] Collection created successfully:", docRef.id);

    // Return success response
    return createSuccessResponse({
      message: "Collection created successfully",
      collection: {
        id: docRef.id,
        title,
        description,
        userId,
        videoCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }, 201);
    
  } catch (error: any) {
    console.error("❌ [Collections API] Error creating collection:", error);
    return createErrorResponse(
      "Failed to create collection",
      500,
      "collections/create-error",
      error.message
    );
  }
});
