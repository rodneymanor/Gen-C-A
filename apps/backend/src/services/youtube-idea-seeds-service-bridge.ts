import { createRequire } from 'module';

const require = createRequire(import.meta.url);

interface IdeaSeedsModule {
  YouTubeIdeaSeedsServiceError: {
    new (message: string, statusCode?: number, debug?: unknown): IdeaSeedsServiceErrorInstance;
  };
  getYouTubeIdeaSeedsService: () => IdeaSeedsServiceInstance;
}

export interface IdeaSeedsServiceInstance {
  generateIdeaSeeds(payload: Record<string, unknown>): Promise<Record<string, unknown>>;
}

export interface IdeaSeedsServiceErrorInstance extends Error {
  statusCode: number;
  debug?: unknown;
}

const ideaSeedsModule = require('../../../../src/services/scripts/youtube-idea-seeds-service.js') as IdeaSeedsModule;

export const YouTubeIdeaSeedsServiceError = ideaSeedsModule.YouTubeIdeaSeedsServiceError;
export const getYouTubeIdeaSeedsService = ideaSeedsModule.getYouTubeIdeaSeedsService;
