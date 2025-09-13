/**
 * Super Admin Check API Route
 * Check if user has super admin privileges using extracted services
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/services/api-middleware';
import { getServices } from '@/services/service-container';

/**
 * POST /api/auth/rbac/is-super-admin
 * Check if current user or specified user is super admin
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
        // Only super admins can check other users' status
        if (currentContext?.isSuperAdmin) {
          targetUserId = body.userId;
        } else {
          return createErrorResponse(
            'Insufficient permissions to check other users',
            403,
            'auth/insufficient-permission'
          );
        }
      }
    } catch {
      // No body or invalid JSON, use current user
    }

    // Check super admin status using the extracted service
    const isSuperAdmin = await rbacService.isSuperAdmin(targetUserId);

    return createSuccessResponse({
      userId: targetUserId,
      isSuperAdmin
    });
    
  } catch (error: any) {
    console.error("❌ [RBAC API] Error checking super admin status:", error);
    return NextResponse.json({ isSuperAdmin: false }, { status: 200 });
  }
});
