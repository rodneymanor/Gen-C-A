/**
 * Social Platform Integration Services
 * Extracted business logic for TikTok, Instagram, and YouTube integration
 */

// Main service classes
export * from './social-platform-services';
export * from './platform-rate-limiter';
export * from './platform-auth-manager';
export * from './platform-error-handler';
export * from './platform-data-transformer';

// Re-export commonly used types and functions
export type {
  PlatformContent,
  PlatformMetrics,
  TranscriptSegment,
  VideoDownloadResult,
  PlatformClientConfig
} from './social-platform-services';

export type {
  RateLimitConfig,
  RateLimitQuota,
  RateLimitStatus
} from './platform-rate-limiter';

export type {
  ApiCredentials,
  PlatformAuth,
  AuthValidationResult
} from './platform-auth-manager';

export type {
  PlatformError,
  ErrorType,
  RetryConfig
} from './platform-error-handler';

export type {
  DataTransformConfig,
  TransformResult,
  NormalizedMetrics,
  ContentMetadata
} from './platform-data-transformer';

// Convenience exports for easy usage
export {
  socialPlatformService,
  createSocialPlatformServiceManager
} from './social-platform-services';

export {
  globalRateLimiter,
  rateLimitedExecutor,
  withRateLimit,
  withRateLimitAndRetry
} from './platform-rate-limiter';

export {
  withGlobalInstagramRateLimit,
  retryWithGlobalBackoff
} from './global-rate-limiter';

export {
  globalAuthManager,
  authHelper,
  createAuthManager,
  createAuthHelper
} from './platform-auth-manager';

export {
  globalErrorHandler,
  withErrorHandling,
  handlePlatformError
} from './platform-error-handler';

export {
  globalDataTransformer,
  transformPlatformContent,
  transformPlatformMetrics,
  transformPlatformTranscript,
  extractContentMetadata
} from './platform-data-transformer';