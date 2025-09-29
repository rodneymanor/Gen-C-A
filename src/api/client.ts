import createClient from 'openapi-fetch';
import type { paths } from '@/types/api';

/**
 * Factory for a typed OpenAPI client (openapi-fetch) bound to a base URL.
 * - Pass '' for same-origin relative calls (recommended for web clients).
 * - Pass `https://api.gencapp.pro` for direct prod calls from scripts.
 */
export function createApiClient(baseUrl: string = '') {
  return createClient<paths>({ baseUrl, fetch });
}

export type ApiClient = ReturnType<typeof createApiClient>;

// Re-export generated client for advanced usages
export * from './client';
