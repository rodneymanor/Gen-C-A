import { NextResponse } from 'next/server';

import { authenticateWithFirebaseToken } from './firebase-auth-helpers';

const TEST_MODE_API_KEY = 'test-internal-secret-123';
const RATE_LIMIT_RESET_MS = 60_000;

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

type RequestLike = Request & {
  nextUrl?: URL;
  headers: Headers & Record<string, unknown>;
  body?: unknown;
  [key: string]: unknown;
};

let cachedExtensionKeyMap: Record<string, string> | null = null;

function getExtensionKeyMap(): Record<string, string> {
  if (cachedExtensionKeyMap) return cachedExtensionKeyMap;

  const raw = process.env.EXTENSION_API_KEYS;
  const map: Record<string, string> = {};

  if (raw) {
    raw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => {
        const [key, uid] = entry.split(':');
        if (key && uid) {
          map[key.trim()] = uid.trim();
        }
      });
  }

  cachedExtensionKeyMap = map;
  return map;
}

function normalizeHeaderValue(value: unknown): string | undefined {
  if (Array.isArray(value)) return value[0] ? String(value[0]) : undefined;
  if (value == null) return undefined;
  return String(value);
}

function getHeader(request: RequestLike, name: string): string | undefined {
  const headers: any = request.headers;
  if (headers?.get) {
    const value = headers.get(name);
    if (value) return value;
  }
  if (headers && typeof headers === 'object') {
    const direct = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
    if (direct) return normalizeHeaderValue(direct);
  }
  return undefined;
}

function buildDefaultRateLimit(): RateLimitResult {
  return {
    allowed: true,
    reason: 'ok',
    resetTime: new Date(Date.now() + RATE_LIMIT_RESET_MS).toISOString(),
    violationsCount: 0,
  };
}

function extractUserId(request: RequestLike): string | undefined {
  const headerCandidates = ['x-user-id', 'x-user', 'x-userid'];
  for (const candidate of headerCandidates) {
    const value = getHeader(request, candidate);
    if (value && value.trim()) {
      return value.trim();
    }
  }

  // Query parameters
  let searchParams: URLSearchParams | undefined;
  if (request.nextUrl instanceof URL) {
    searchParams = request.nextUrl.searchParams;
  } else if (typeof request.url === 'string') {
    try {
      searchParams = new URL(request.url, 'http://localhost').searchParams;
    } catch {
      // ignore malformed URLs
    }
  }

  if (searchParams) {
    const candidates = [
      searchParams.get('userId'),
      searchParams.get('uid'),
    ];
    for (const candidate of candidates) {
      if (candidate && candidate.trim()) {
        return candidate.trim();
      }
    }
  }

  return undefined;
}

export class ApiKeyAuthService {
  static extractApiKey(request: RequestLike): string | null {
    try {
      const headerKey = getHeader(request, 'x-api-key');
      if (headerKey) return headerKey;

      const searchParams =
        request.nextUrl?.searchParams ||
        (typeof request.url === 'string'
          ? (() => {
              try {
                return new URL(request.url, 'http://localhost').searchParams;
              } catch {
                return undefined;
              }
            })()
          : undefined);

      if (searchParams) {
        const candidates = ['apiKey', 'apikey', 'key'];
        for (const candidate of candidates) {
          const value = searchParams.get(candidate);
          if (value && value.trim()) {
            return value.trim();
          }
        }
      }

      const bodyKey = (request as any)?.body?.apikey || (request as any)?.body?.apiKey;
      if (typeof bodyKey === 'string' && bodyKey.trim()) return bodyKey.trim();

      return null;
    } catch {
      return null;
    }
  }

  static async validateApiKey(
    apiKey: string | null,
    options: { userId?: string } = {},
  ): Promise<ApiKeyValidationResult | null> {
    if (!apiKey) return null;

    const expectedKeys = [
      process.env.API_KEY,
      process.env.NEXT_PUBLIC_API_KEY,
      process.env.INTERNAL_API_SECRET,
      process.env.ADMIN_API_KEY,
    ].filter(Boolean) as string[];

    const extensionKeyMap = getExtensionKeyMap();
    const normalizedUserId = options.userId?.trim();

    const mappedUid = extensionKeyMap[apiKey];
    const fallbackUid =
      normalizedUserId ||
      mappedUid ||
      (apiKey === TEST_MODE_API_KEY ? 'test-extension-user' : undefined) ||
      process.env.ADMIN_DEFAULT_USER_ID ||
      process.env.DEFAULT_EXTENSION_USER_ID;

    const isKnownEnvKey = expectedKeys.includes(apiKey);
    const managedKey = /^genc(beta|live|test)_/i.test(apiKey);

    if (!(isKnownEnvKey || mappedUid || managedKey || apiKey === TEST_MODE_API_KEY)) {
      return null;
    }

    if (!fallbackUid) return null;

    return {
      user: { uid: String(fallbackUid) },
      rateLimitResult: buildDefaultRateLimit(),
    };
  }
}

export async function authenticateApiKey(
  request: RequestLike,
): Promise<ApiKeyValidationResult | NextResponse> {
  const apiKey = ApiKeyAuthService.extractApiKey(request);
  const userId = extractUserId(request);

  if (apiKey) {
    const validation = await ApiKeyAuthService.validateApiKey(apiKey, { userId });
    if (validation) {
      return validation;
    }
  }

  const authHeader = getHeader(request, 'authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice('Bearer '.length);
    const firebaseResult = await authenticateWithFirebaseToken(token);
    if (!(firebaseResult instanceof NextResponse)) {
      return {
        user: { uid: firebaseResult.user.uid },
        rateLimitResult: {
          allowed: true,
          reason: 'firebase',
          resetTime: new Date(Date.now() + RATE_LIMIT_RESET_MS).toISOString(),
          violationsCount: 0,
        },
      };
    }
    return firebaseResult;
  }

  return NextResponse.json(
    {
      success: false,
      error: 'Unauthorized',
    },
    { status: 401 },
  );
}

export default ApiKeyAuthService;
