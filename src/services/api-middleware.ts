/**
 * API Middleware for Extracted Services
 * Provides authentication and authorization middleware for Next.js API routes
 * using the extracted AuthService and RBACService
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import { createServerServices, getServices, isServicesInitialized } from './service-container';
import type { RBACContext } from './auth/RBACService';
import type { AuthUser } from './auth/types';

// ================================
// MIDDLEWARE TYPES
// ================================

export interface AuthenticatedContext {
  userId: string;
  user?: AuthUser;
  rbacContext?: RBACContext;
  isAuthenticated: true;
}

export interface UnauthenticatedContext {
  userId?: never;
  user?: never;
  rbacContext?: never;
  isAuthenticated: false;
}

export type ApiContext = AuthenticatedContext | UnauthenticatedContext;

export type AuthenticatedHandler = (
  request: NextRequest,
  context: AuthenticatedContext
) => Promise<NextResponse> | NextResponse;

export type OptionalAuthHandler = (
  request: NextRequest,
  context: ApiContext
) => Promise<NextResponse> | NextResponse;

// ================================
// MIDDLEWARE CONFIGURATION
// ================================

interface MiddlewareConfig {
  requireAuth?: boolean;
  requireRole?: 'super_admin' | 'coach' | 'creator' | Array<'super_admin' | 'coach' | 'creator'>;
  requirePermission?: {
    action: 'read' | 'write' | 'delete';
    resourceType: 'collection' | 'video' | 'user';
    resourceId?: string | ((req: NextRequest) => string | undefined);
  };
  initializeServices?: boolean;
}

// ================================
// INITIALIZATION HELPERS
// ================================

/**
 * Ensure services are initialized
 */
async function ensureServicesInitialized(): Promise<void> {
  if (!isServicesInitialized()) {
    const db = getAdminDb();
    if (!db) {
      throw new Error('Firebase Admin not initialized');
    }
    
    await createServerServices(db);
  }
}

/**
 * Extract Firebase ID token from request
 */
function extractIdToken(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check session cookie (future implementation)
  const sessionCookie = request.cookies.get('session')?.value;
  if (sessionCookie) {
    // For now, treat session cookie as token (would need proper session management)
    return sessionCookie;
  }

  return null;
}

/**
 * Validate Firebase ID token and get user context
 */
async function validateTokenAndGetContext(token: string): Promise<{
  userId: string;
  user?: AuthUser;
  rbacContext?: RBACContext;
}> {
  const { authService, rbacService } = getServices();

  try {
    // Validate token with AuthService
    const tokenData = await authService.validateToken(token);
    const userId = tokenData.uid;

    // Get RBAC context
    const rbacContext = await rbacService.getRBACContext(userId);

    return {
      userId,
      rbacContext
    };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// ================================
// MIDDLEWARE FUNCTIONS
// ================================

/**
 * Create middleware that requires authentication
 */
export function withAuth(handler: AuthenticatedHandler, config: MiddlewareConfig = {}): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Initialize services if needed
      if (config.initializeServices !== false) {
        await ensureServicesInitialized();
      }

      // Extract and validate token
      const token = extractIdToken(request);
      if (!token) {
        return NextResponse.json(
          { error: 'Authentication required', code: 'auth/missing-token' },
          { status: 401 }
        );
      }

      // Validate token and get context
      let authContext: AuthenticatedContext;
      try {
        const tokenContext = await validateTokenAndGetContext(token);
        authContext = {
          userId: tokenContext.userId,
          user: tokenContext.user,
          rbacContext: tokenContext.rbacContext,
          isAuthenticated: true
        };
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid token', code: 'auth/invalid-token' },
          { status: 401 }
        );
      }

      // Check role requirements
      if (config.requireRole && authContext.rbacContext) {
        const requiredRoles = Array.isArray(config.requireRole) ? config.requireRole : [config.requireRole];
        const userRole = authContext.rbacContext.role as 'super_admin' | 'coach' | 'creator';
        
        if (!requiredRoles.includes(userRole)) {
          return NextResponse.json(
            { error: 'Insufficient permissions', code: 'auth/insufficient-role' },
            { status: 403 }
          );
        }
      }

      // Check permission requirements
      if (config.requirePermission && authContext.rbacContext) {
        const { action, resourceType, resourceId } = config.requirePermission;
        const resolvedResourceId = typeof resourceId === 'function' ? resourceId(request) : resourceId;
        
        const { rbacService } = getServices();
        const hasPermission = await rbacService.canPerformAction(
          authContext.userId,
          action,
          resourceType,
          resolvedResourceId
        );

        if (!hasPermission) {
          return NextResponse.json(
            { error: 'Insufficient permissions', code: 'auth/insufficient-permission' },
            { status: 403 }
          );
        }
      }

      // Call the handler with authenticated context
      return await handler(request, authContext);

    } catch (error: any) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error', code: 'auth/middleware-error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Create middleware that allows optional authentication
 */
export function withOptionalAuth(handler: OptionalAuthHandler, config: MiddlewareConfig = {}): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Initialize services if needed
      if (config.initializeServices !== false) {
        await ensureServicesInitialized();
      }

      // Extract token (but don't require it)
      const token = extractIdToken(request);
      let context: ApiContext;

      if (token) {
        try {
          const tokenContext = await validateTokenAndGetContext(token);
          context = {
            userId: tokenContext.userId,
            user: tokenContext.user,
            rbacContext: tokenContext.rbacContext,
            isAuthenticated: true
          };
        } catch (error) {
          // Token invalid, continue as unauthenticated
          context = { isAuthenticated: false };
        }
      } else {
        context = { isAuthenticated: false };
      }

      // Call the handler with context (authenticated or not)
      return await handler(request, context);

    } catch (error: any) {
      console.error('Optional auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error', code: 'auth/middleware-error' },
        { status: 500 }
      );
    }
  };
}

// ================================
// CONVENIENCE MIDDLEWARE FACTORIES
// ================================

/**
 * Require authentication only
 */
export const requireAuth = (handler: AuthenticatedHandler) =>
  withAuth(handler, { requireAuth: true });

/**
 * Require super admin role
 */
export const requireSuperAdmin = (handler: AuthenticatedHandler) =>
  withAuth(handler, { requireAuth: true, requireRole: 'super_admin' });

/**
 * Require coach or super admin role
 */
export const requireCoachOrAdmin = (handler: AuthenticatedHandler) =>
  withAuth(handler, { requireAuth: true, requireRole: ['coach', 'super_admin'] });

/**
 * Require specific permission
 */
export const requirePermission = (
  action: 'read' | 'write' | 'delete',
  resourceType: 'collection' | 'video' | 'user',
  handler: AuthenticatedHandler,
  resourceId?: string | ((req: NextRequest) => string | undefined)
) =>
  withAuth(handler, {
    requireAuth: true,
    requirePermission: { action, resourceType, resourceId }
  });

// ================================
// UTILITY FUNCTIONS
// ================================

/**
 * Create error response
 */
export function createErrorResponse(
  message: string,
  status: number,
  code: string,
  details?: any
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      code,
      status,
      ...(details && { details })
    },
    { status }
  );
}

/**
 * Create success response
 */
export function createSuccessResponse(
  data: any,
  status: number = 200
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      ...data,
      timestamp: new Date().toISOString()
    },
    { status }
  );
}

/**
 * Extract resource ID from URL path
 */
export function getResourceIdFromPath(request: NextRequest, paramName: string = 'id'): string | undefined {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const index = pathParts.findIndex(part => part === paramName);
  return index !== -1 && index < pathParts.length - 1 ? pathParts[index + 1] : undefined;
}

/**
 * Get query parameters
 */
export function getQueryParams(request: NextRequest): Record<string, string> {
  const url = new URL(request.url);
  const params: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}