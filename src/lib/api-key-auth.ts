/**
 * ApiKeyAuthService - Minimal compatibility implementation
 * Provides extract and validate functions used by admin API routes.
 */

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  resetTime?: string;
  violationsCount?: number;
}

export interface ApiKeyValidationResult {
  user: { uid: string };
  rateLimitResult: RateLimitResult;
}

export class ApiKeyAuthService {
  static extractApiKey(request: Request | any): string | null {
    try {
      const headerKey = request?.headers?.get
        ? request.headers.get('x-api-key')
        : request?.headers?.['x-api-key'];
      return headerKey || null;
    } catch {
      return null;
    }
  }

  static async validateApiKey(apiKey: string | null): Promise<ApiKeyValidationResult | null> {
    if (!apiKey) return null;
    const expected = process.env.NEXT_PUBLIC_API_KEY || process.env.API_KEY || process.env.INTERNAL_API_SECRET;
    if (expected && apiKey === expected) {
      return {
        user: { uid: process.env.ADMIN_DEFAULT_USER_ID || 'system' },
        rateLimitResult: {
          allowed: true,
          reason: 'ok',
          resetTime: new Date(Date.now() + 60_000).toISOString(),
          violationsCount: 0,
        },
      };
    }
    return null;
  }
}

export default ApiKeyAuthService;

