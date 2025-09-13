/**
 * RBAC Context API Route
 * Get RBAC context for a user using extracted services
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/services/api-middleware';
import { getServices } from '@/services/service-container';

/**
 * POST /api/auth/rbac/context
 * Get RBAC context for current user or specified user ID
 */
export const POST = requireAuth(async (request, context) => {
  try {
    const { userId: currentUserId, rbacContext: currentContext } = context;
    const { rbacService } = getServices();
    
    let targetUserId = currentUserId;
    
    // Parse request body to see if a different user ID is requested
    try {
      const body = await request.json();
      if (body.userId) {
        // Only super admins can query other users' contexts
        if (currentContext?.isSuperAdmin) {
          targetUserId = body.userId;
        } else {
          return createErrorResponse(
            'Insufficient permissions to query other users',
            403,
            'auth/insufficient-permission'
          );
        }
      }
    } catch {
      // No body or invalid JSON, use current user
    }

    // Get RBAC context using the extracted service
    const rbacContext = await rbacService.getRBACContext(targetUserId);

    return createSuccessResponse({
      userId: targetUserId,
      role: rbacContext.role,
      accessibleCoaches: rbacContext.accessibleCoaches,
      isSuperAdmin: rbacContext.isSuperAdmin
    });
    
  } catch (error: any) {
    console.error("❌ [RBAC API] Error getting RBAC context:", error);
    
    // Return default creator context to prevent UI breaking
    return NextResponse.json({
      userId: context.userId,
      role: "creator",
      accessibleCoaches: [],
      isSuperAdmin: false,
    }, { status: 200 });
  }
});
