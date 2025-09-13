/**
 * Permission Check API Route
 * Check if user can perform specific actions using extracted services
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createSuccessResponse, createErrorResponse } from '@/services/api-middleware';
import { getServices } from '@/services/service-container';

/**
 * POST /api/auth/rbac/can-perform
 * Check if user can perform a specific action on a resource
 */
export const POST = requireAuth(async (request, context) => {
  try {
    const { userId: currentUserId, rbacContext: currentContext } = context;
    const { rbacService } = getServices();
    
    const body = await request.json();
    const { userId, action, resourceType, resourceId } = body;

    if (!action || !resourceType) {
      return createErrorResponse(
        'Missing required parameters: action and resourceType are required',
        400,
        'auth/missing-parameters'
      );
    }

    let targetUserId = currentUserId;
    
    // Allow checking permissions for other users only if current user is super admin
    if (userId && userId !== currentUserId) {
      if (currentContext?.isSuperAdmin) {
        targetUserId = userId;
      } else {
        return createErrorResponse(
          'Insufficient permissions to check other users',
          403,
          'auth/insufficient-permission'
        );
      }
    }

    // Check permissions using the extracted service
    const canPerform = await rbacService.canPerformAction(
      targetUserId, 
      action, 
      resourceType, 
      resourceId
    );

    return createSuccessResponse({
      userId: targetUserId,
      action,
      resourceType,
      resourceId,
      canPerform
    });
    
  } catch (error: any) {
    console.error("❌ [RBAC API] Error checking permissions:", error);
    return NextResponse.json({ canPerform: false }, { status: 200 });
  }
});
