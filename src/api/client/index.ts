import createClient from 'openapi-fetch';
import type { paths } from '@/types/api';

export type Client = ReturnType<typeof createClient<paths>>;

export function createApiClient(baseUrl = ''): Client {
  return createClient<paths>({ baseUrl });
}

