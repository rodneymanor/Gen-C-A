declare module '@/services/video/instagram-service.js' {
  export interface InstagramUserIdResponse {
    success: true;
    user_id: string;
    username?: string;
  }

  export interface InstagramReelsRequest {
    userId: string;
    count?: number;
    includeFeedVideo?: boolean;
    username?: string;
  }

  export interface InstagramReelsResponse {
    success: true;
    status?: string;
    data: Record<string, unknown> & { items?: unknown[] };
    processed: unknown;
  }

  export class InstagramServiceError extends Error {
    constructor(message: string, statusCode?: number, debug?: unknown);
    statusCode: number;
    debug?: unknown;
  }

  export class InstagramService {
    constructor(apiKey?: string);
    getUserId(usernameInput: string): Promise<InstagramUserIdResponse>;
    getUserReels(params: InstagramReelsRequest): Promise<InstagramReelsResponse>;
  }

  export function getInstagramService(): InstagramService;
}
