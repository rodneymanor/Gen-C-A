/**
 * Authentication Middleware Patterns
 * Ready-to-use middleware for different frameworks
 */

import { AuthService } from "./AuthService";
import { RBACService } from "./RBACService";
import { 
  FirebaseUser, 
  AuthError, 
  RBACContext, 
  UserRole,
  ExpressAuthRequest,
  ExpressAuthResponse,
  NextAuthRequest,
  NextAuthResponse
} from "./interfaces";

// ===== Express.js Middleware =====

export class ExpressAuthMiddleware {
  private authService: AuthService;
  private rbacService?: RBACService;

  constructor(authService: AuthService, rbacService?: RBACService) {
    this.authService = authService;
    this.rbacService = rbacService;
  }

  /**
   * Basic authentication middleware
   */
  authenticate() {
    return async (req: ExpressAuthRequest, res: ExpressAuthResponse, next: any) => {
      try {
        const authHeader = req.headers.authorization;
        const result = await this.authService.validateBearerToken(authHeader);

        if (!result.valid) {
          return res.status(result.error!.status).json({
            success: false,
            error: result.error
          });
        }

        req.user = result.user;
        next();
      } catch (error) {
        console.error("❌ [Auth Middleware] Authentication failed:", error);
        res.status(500).json({
          success: false,
          error: {
            code: "auth/internal-error",
            message: "Internal authentication error",
            status: 500
          }
        });
      }
    };
  }

  /**
   * Role-based authentication middleware
   */
  requireRole(requiredRole: UserRole | UserRole[]) {
    return async (req: ExpressAuthRequest, res: ExpressAuthResponse, next: any) => {
      try {
        // First authenticate
        const authResult = await this.authenticate()(req, res, () => {});
        if (!req.user) return; // Authentication failed

        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        const userRole = await this.authService.getUserRole(req.user.uid);

        if (!userRole || !roles.includes(userRole as UserRole)) {
          return res.status(403).json({
            success: false,
            error: {
              code: "auth/insufficient-permissions",
              message: "Insufficient permissions for this action",
              status: 403
            }
          });
        }

        next();
      } catch (error) {
        console.error("❌ [Auth Middleware] Role check failed:", error);
        res.status(500).json({
          success: false,
          error: {
            code: "auth/internal-error",
            message: "Internal authentication error", 
            status: 500
          }
        });
      }
    };
  }

  /**
   * RBAC permission middleware
   */
  requirePermission(
    action: "read" | "write" | "delete",
    resourceType: "collection" | "video" | "user",
    getResourceId?: (req: ExpressAuthRequest) => string
  ) {
    return async (req: ExpressAuthRequest, res: ExpressAuthResponse, next: any) => {
      if (!this.rbacService) {
        return res.status(500).json({
          success: false,
          error: {
            code: "auth/rbac-not-configured",
            message: "RBAC service not configured",
            status: 500
          }
        });
      }

      try {
        // First authenticate
        const authResult = await this.authenticate()(req, res, () => {});
        if (!req.user) return; // Authentication failed

        const resourceId = getResourceId ? getResourceId(req) : undefined;
        const hasPermission = await this.rbacService.canPerformAction(
          req.user.uid,
          action,
          resourceType,
          resourceId
        );

        if (!hasPermission) {
          return res.status(403).json({
            success: false,
            error: {
              code: "auth/access-denied",
              message: "Access denied for this resource",
              status: 403
            }
          });
        }

        // Attach RBAC context to request
        req.userContext = await this.rbacService.getRBACContext(req.user.uid);
        next();
      } catch (error) {
        console.error("❌ [Auth Middleware] Permission check failed:", error);
        res.status(500).json({
          success: false,
          error: {
            code: "auth/internal-error", 
            message: "Internal authentication error",
            status: 500
          }
        });
      }
    };
  }

  /**
   * Optional authentication middleware (doesn't fail if no token)
   */
  optionalAuth() {
    return async (req: ExpressAuthRequest, res: ExpressAuthResponse, next: any) => {
      try {
        const authHeader = req.headers.authorization;
        if (authHeader) {
          const result = await this.authService.validateBearerToken(authHeader);
          if (result.valid) {
            req.user = result.user;
          }
        }
        next();
      } catch (error) {
        console.error("❌ [Auth Middleware] Optional auth failed:", error);
        next(); // Continue anyway for optional auth
      }
    };
  }
}

// ===== Next.js API Route Middleware =====

export class NextAuthMiddleware {
  private authService: AuthService;
  private rbacService?: RBACService;

  constructor(authService: AuthService, rbacService?: RBACService) {
    this.authService = authService;
    this.rbacService = rbacService;
  }

  /**
   * Authenticate Next.js API request
   */
  async authenticateRequest(request: NextAuthRequest): Promise<{ user?: FirebaseUser; error?: AuthError }> {
    try {
      const authHeader = request.headers.authorization as string;
      const result = await this.authService.validateBearerToken(authHeader);

      if (!result.valid) {
        return { error: result.error };
      }

      return { user: result.user };
    } catch (error) {
      console.error("❌ [Next Auth Middleware] Authentication failed:", error);
      return {
        error: {
          code: "auth/internal-error",
          message: "Internal authentication error",
          status: 500
        }
      };
    }
  }

  /**
   * Create Next.js API route wrapper with authentication
   */
  withAuth(handler: (req: NextAuthRequest & { user: FirebaseUser }, res: NextAuthResponse) => Promise<any>) {
    return async (req: NextAuthRequest, res: NextAuthResponse) => {
      const { user, error } = await this.authenticateRequest(req);

      if (error) {
        return res.status(error.status).json({
          success: false,
          error
        });
      }

      // Add user to request
      (req as any).user = user;
      return handler(req as NextAuthRequest & { user: FirebaseUser }, res);
    };
  }

  /**
   * Create Next.js API route wrapper with role requirement
   */
  withRole(requiredRole: UserRole | UserRole[], handler: any) {
    return this.withAuth(async (req, res) => {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      const userRole = await this.authService.getUserRole(req.user.uid);

      if (!userRole || !roles.includes(userRole as UserRole)) {
        return res.status(403).json({
          success: false,
          error: {
            code: "auth/insufficient-permissions",
            message: "Insufficient permissions for this action",
            status: 403
          }
        });
      }

      return handler(req, res);
    });
  }

  /**
   * Create Next.js API route wrapper with RBAC permissions
   */
  withPermission(
    action: "read" | "write" | "delete",
    resourceType: "collection" | "video" | "user",
    getResourceId?: (req: NextAuthRequest) => string,
    handler?: any
  ) {
    if (!this.rbacService) {
      throw new Error("RBAC service not configured");
    }

    return this.withAuth(async (req, res) => {
      const resourceId = getResourceId ? getResourceId(req) : undefined;
      const hasPermission = await this.rbacService!.canPerformAction(
        req.user.uid,
        action,
        resourceType,
        resourceId
      );

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          error: {
            code: "auth/access-denied",
            message: "Access denied for this resource",
            status: 403
          }
        });
      }

      // Add RBAC context to request
      (req as any).userContext = await this.rbacService!.getRBACContext(req.user.uid);
      return handler(req, res);
    });
  }
}

// ===== Generic HTTP Middleware =====

export class GenericAuthMiddleware {
  private authService: AuthService;
  private rbacService?: RBACService;

  constructor(authService: AuthService, rbacService?: RBACService) {
    this.authService = authService;
    this.rbacService = rbacService;
  }

  /**
   * Validate authorization header
   */
  async validateAuthHeader(authHeader: string | null): Promise<{ user?: FirebaseUser; error?: AuthError }> {
    const result = await this.authService.validateBearerToken(authHeader);
    
    if (!result.valid) {
      return { error: result.error };
    }

    return { user: result.user };
  }

  /**
   * Check user role
   */
  async checkUserRole(userId: string, requiredRole: UserRole | UserRole[]): Promise<boolean> {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userRole = await this.authService.getUserRole(userId);
    return userRole ? roles.includes(userRole as UserRole) : false;
  }

  /**
   * Check RBAC permission
   */
  async checkPermission(
    userId: string,
    action: "read" | "write" | "delete",
    resourceType: "collection" | "video" | "user",
    resourceId?: string
  ): Promise<boolean> {
    if (!this.rbacService) {
      return false;
    }

    return this.rbacService.canPerformAction(userId, action, resourceType, resourceId);
  }

  /**
   * Get RBAC context for user
   */
  async getUserContext(userId: string): Promise<RBACContext | null> {
    if (!this.rbacService) {
      return null;
    }

    return this.rbacService.getRBACContext(userId);
  }
}

// ===== Session Management =====

export class SessionManager {
  private authService: AuthService;
  private sessionDuration: number;

  constructor(authService: AuthService, sessionDuration = 5 * 24 * 60 * 60 * 1000) { // 5 days
    this.authService = authService;
    this.sessionDuration = sessionDuration;
  }

  /**
   * Create session from ID token
   */
  async createSession(idToken: string): Promise<string | null> {
    return this.authService.createSessionCookie(idToken, this.sessionDuration);
  }

  /**
   * Validate session cookie
   */
  async validateSession(sessionCookie: string): Promise<FirebaseUser | null> {
    return this.authService.verifySessionCookie(sessionCookie);
  }

  /**
   * Revoke user sessions
   */
  async revokeUserSessions(userId: string): Promise<boolean> {
    return this.authService.revokeUserTokens(userId);
  }

  /**
   * Session-based middleware for Express
   */
  createSessionMiddleware() {
    return async (req: any, res: any, next: any) => {
      try {
        const sessionCookie = req.cookies?.session || req.headers['x-session-cookie'];
        
        if (sessionCookie) {
          const user = await this.validateSession(sessionCookie);
          if (user) {
            req.user = user;
          }
        }
        
        next();
      } catch (error) {
        console.error("❌ [Session Middleware] Session validation failed:", error);
        next();
      }
    };
  }
}

// ===== Rate Limiting =====

export class AuthRateLimiter {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 100, windowMs = 15 * 60 * 1000) { // 100 requests per 15 minutes
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  /**
   * Check if request is within rate limit
   */
  checkRateLimit(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const userRequests = this.requests.get(identifier);

    if (!userRequests || now > userRequests.resetTime) {
      const resetTime = now + this.windowMs;
      this.requests.set(identifier, { count: 1, resetTime });
      return { allowed: true, remaining: this.maxRequests - 1, resetTime };
    }

    if (userRequests.count >= this.maxRequests) {
      return { allowed: false, remaining: 0, resetTime: userRequests.resetTime };
    }

    userRequests.count++;
    return { 
      allowed: true, 
      remaining: this.maxRequests - userRequests.count, 
      resetTime: userRequests.resetTime 
    };
  }

  /**
   * Rate limiting middleware for Express
   */
  createMiddleware() {
    return (req: any, res: any, next: any) => {
      const identifier = req.user?.uid || req.ip || 'anonymous';
      const rateLimit = this.checkRateLimit(identifier);

      res.set({
        'X-RateLimit-Limit': this.maxRequests.toString(),
        'X-RateLimit-Remaining': rateLimit.remaining.toString(),
        'X-RateLimit-Reset': new Date(rateLimit.resetTime).toISOString(),
      });

      if (!rateLimit.allowed) {
        return res.status(429).json({
          success: false,
          error: {
            code: "auth/rate-limit-exceeded",
            message: "Rate limit exceeded",
            status: 429
          }
        });
      }

      next();
    };
  }
}

// ===== Factory Functions =====

export function createExpressAuthMiddleware(authService: AuthService, rbacService?: RBACService): ExpressAuthMiddleware {
  return new ExpressAuthMiddleware(authService, rbacService);
}

export function createNextAuthMiddleware(authService: AuthService, rbacService?: RBACService): NextAuthMiddleware {
  return new NextAuthMiddleware(authService, rbacService);
}

export function createGenericAuthMiddleware(authService: AuthService, rbacService?: RBACService): GenericAuthMiddleware {
  return new GenericAuthMiddleware(authService, rbacService);
}

export function createSessionManager(authService: AuthService, sessionDuration?: number): SessionManager {
  return new SessionManager(authService, sessionDuration);
}

export function createAuthRateLimiter(maxRequests?: number, windowMs?: number): AuthRateLimiter {
  return new AuthRateLimiter(maxRequests, windowMs);
}