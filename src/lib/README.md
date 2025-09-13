# Social Platform Integration Services

This library provides comprehensive, extracted business logic for integrating with TikTok, Instagram, and YouTube APIs. All services are framework-agnostic and can be used across different platforms (web, mobile, server-side).

## 🚀 Features

- **Platform-Specific Clients**: Unified interfaces for TikTok, Instagram, and YouTube
- **Advanced Rate Limiting**: Multi-window rate limiting with burst support and backoff
- **Authentication Management**: Comprehensive API key and OAuth credential handling
- **Error Handling**: Intelligent error classification with retry strategies
- **Data Transformation**: Normalize data formats across platforms
- **TypeScript Support**: Full type safety with comprehensive interfaces

## 📁 File Structure

```
src/lib/
├── index.ts                          # Main exports
├── social-platform-services.ts       # Platform client classes
├── platform-rate-limiter.ts         # Advanced rate limiting
├── platform-auth-manager.ts         # Authentication management
├── platform-error-handler.ts        # Error handling strategies
├── platform-data-transformer.ts     # Data transformation utilities
└── README.md                         # This documentation
```

## 🔧 Quick Start

### Basic Usage

```typescript
import { 
  socialPlatformService,
  withRateLimit,
  authHelper 
} from './lib';

// Fetch content from any platform
const content = await socialPlatformService.fetchContent('https://tiktok.com/@user/video/123');

// Download video with rate limiting
const video = await withRateLimit('tiktok', () => 
  socialPlatformService.downloadVideo('https://tiktok.com/@user/video/123')
);

// Get transcript from YouTube
const transcript = await socialPlatformService.getTranscript('https://youtube.com/watch?v=abc123');
```

### Advanced Configuration

```typescript
import { 
  createSocialPlatformServiceManager,
  createAuthManager,
  PlatformRateLimiter 
} from './lib';

// Create custom service manager
const platformService = createSocialPlatformServiceManager({
  rapidApiKey: 'your-key',
  apifyToken: 'your-token',
  timeout: 30000,
  rateLimit: {
    requestsPerSecond: 0.5,
    requestsPerMinute: 25
  }
});

// Create custom rate limiter
const rateLimiter = new PlatformRateLimiter();
rateLimiter.setConfig('tiktok', {
  requestsPerSecond: 1,
  requestsPerMinute: 30,
  burstLimit: 3
});
```

## 📚 Detailed Documentation

### Social Platform Services

The main service class that orchestrates all platform interactions.

#### Key Classes:

- **`SocialPlatformServiceManager`**: Main orchestrator
- **`TikTokClient`**: TikTok-specific operations
- **`InstagramClient`**: Instagram-specific operations  
- **`YouTubeClient`**: YouTube-specific operations

#### Example Usage:

```typescript
// Auto-detect platform and fetch content
const result = await socialPlatformService.fetchContent(url);

// Platform-specific operations
const tiktokClient = socialPlatformService.getClient('tiktok');
const videoId = tiktokClient.extractContentId(url);
const content = await tiktokClient.fetchContent(videoId);

// Download video
const download = await socialPlatformService.downloadVideo(url);

// Get service status
const status = socialPlatformService.getClientsStatus();
```

### Rate Limiting

Advanced rate limiting with multiple time windows, burst support, and platform-specific configurations.

#### Key Features:

- **Multi-window limiting**: Second, minute, hour, and day limits
- **Burst support**: Allow short bursts above normal limits
- **Platform-specific configs**: Different limits per platform
- **Automatic backoff**: Exponential backoff with jitter
- **Queue management**: Global request queuing

#### Example Usage:

```typescript
import { 
  withRateLimit, 
  rateLimitedExecutor,
  globalRateLimiter 
} from './lib';

// Simple rate limiting
const result = await withRateLimit('tiktok', async () => {
  return fetch('https://api.tiktok.com/...');
});

// With retry logic
const result = await rateLimitedExecutor.executeWithRetry(
  'instagram',
  async () => fetch('https://api.instagram.com/...'),
  'fetch_posts',
  3 // max retries
);

// Check rate limit status
const status = globalRateLimiter.getStatus('tiktok', 'download');
console.log(`Remaining requests: ${status.quotas[0].remaining}`);
```

### Authentication Management

Comprehensive credential management for all supported platforms.

#### Supported Auth Types:

- **API Keys**: RapidAPI, YouTube API
- **Tokens**: Apify
- **OAuth2**: Instagram, TikTok (client credentials)

#### Example Usage:

```typescript
import { authHelper, globalAuthManager } from './lib';

// Check authentication status
const isReady = await authHelper.isPlatformReady('rapidapi');

// Get authenticated headers
const headers = authHelper.getRapidApiHeaders('tiktok-scraper.p.rapidapi.com');

// Validate all platforms
const validations = await globalAuthManager.validateAllAuth();
validations.forEach(result => {
  console.log(`${result.platform}: ${result.isValid ? '✅' : '❌'}`);
});

// Get auth summary
const summary = globalAuthManager.getAuthSummary();
console.log(`${summary.validated}/${summary.configured} platforms validated`);
```

### Error Handling

Intelligent error classification with automatic retry strategies.

#### Key Features:

- **Error Classification**: Authentication, rate limit, network, etc.
- **Retry Logic**: Configurable retry with exponential backoff
- **Platform-Specific**: Custom handling per platform
- **Error Tracking**: Statistics and recent error history

#### Example Usage:

```typescript
import { 
  withErrorHandling,
  globalErrorHandler,
  ErrorType 
} from './lib';

// Automatic error handling with retry
const result = await withErrorHandling(
  'instagram',
  'fetch_post',
  async () => {
    const response = await fetch('https://api.instagram.com/...');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },
  { maxRetries: 2, baseDelay: 2000 }
);

// Manual error handling
try {
  await someApiCall();
} catch (error) {
  const platformError = globalErrorHandler.handleError(
    'tiktok',
    'download_video', 
    error
  );
  
  if (platformError.retryable) {
    console.log(`Retryable error: ${platformError.message}`);
  } else {
    console.log(`Permanent error: ${platformError.suggestedAction}`);
  }
}
```

### Data Transformation

Normalize data formats across different platforms.

#### Key Features:

- **Unified Format**: Convert platform-specific data to common format
- **Metadata Extraction**: Enhanced content analysis
- **Data Validation**: Ensure data integrity
- **Content Analysis**: Extract topics, sentiment, complexity

#### Example Usage:

```typescript
import { 
  transformPlatformContent,
  extractContentMetadata,
  globalDataTransformer 
} from './lib';

// Transform raw API response
const result = transformPlatformContent(rawTikTokData, 'tiktok');
if (result.success) {
  const content = result.data; // Now in unified format
  console.log(`Title: ${content.title}`);
  console.log(`Author: @${content.author}`);
  console.log(`Views: ${content.metrics.views}`);
}

// Extract enhanced metadata
const metadata = extractContentMetadata(content);
console.log(`Topics: ${metadata.semantic.topics.join(', ')}`);
console.log(`Sentiment: ${metadata.semantic.sentiment}`);
console.log(`Hooks found: ${metadata.engagement.hooks.length}`);

// Transform transcript
const transcriptResult = globalDataTransformer.transformTranscript(
  rawTranscriptData, 
  'youtube'
);
```

## 🔑 Environment Variables

Configure the following environment variables for full functionality:

```bash
# Required for most operations
RAPIDAPI_KEY=your_rapidapi_key

# Optional for specific features
APIFY_TOKEN=your_apify_token
YOUTUBE_API_KEY=your_youtube_api_key

# OAuth credentials (future use)
INSTAGRAM_CLIENT_ID=your_instagram_client_id
INSTAGRAM_CLIENT_SECRET=your_instagram_client_secret
TIKTOK_CLIENT_ID=your_tiktok_client_id  
TIKTOK_CLIENT_SECRET=your_tiktok_client_secret
```

## 🛠 Configuration Examples

### Custom Rate Limiting

```typescript
import { globalRateLimiter } from './lib';

// Configure Instagram with conservative limits
globalRateLimiter.setConfig('instagram', {
  requestsPerSecond: 0.5,
  requestsPerMinute: 15,
  requestsPerHour: 100,
  burstLimit: 2,
  retryAfterMs: 5000
});

// Configure TikTok with aggressive limits
globalRateLimiter.setConfig('tiktok', {
  requestsPerSecond: 2,
  requestsPerMinute: 60,
  burstLimit: 5
});
```

### Custom Data Transformation

```typescript
import { createDataTransformer } from './lib';

const transformer = createDataTransformer({
  normalizeUrls: true,
  extractMetadata: true,
  validateData: true,
  fillDefaults: true
});

const result = transformer.transformContent(rawData, 'tiktok');
```

### Error Handling Configuration

```typescript
import { createErrorHandler } from './lib';

const errorHandler = createErrorHandler({
  logErrors: true,
  trackMetrics: true,
  defaultRetryConfig: {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 30000,
    backoffMultiplier: 2,
    jitter: true
  }
});
```

## 📊 Monitoring and Debugging

### Rate Limit Status

```typescript
import { globalRateLimiter } from './lib';

// Get status for specific platform
const status = globalRateLimiter.getStatus('tiktok', 'download');
console.log('Rate Limit Status:', {
  allowed: status.allowed,
  requestCount: status.requestCount,
  successRate: status.successRate,
  quotas: status.quotas
});

// Get all rate limiters
const allStatus = globalRateLimiter.getAllStatus();
allStatus.forEach(({ platform, operation, status }) => {
  console.log(`${platform}:${operation} - ${status.allowed ? '🟢' : '🔴'}`);
});
```

### Error Statistics

```typescript
import { globalErrorHandler } from './lib';

const stats = globalErrorHandler.getErrorStats();
console.log('Error Statistics:', {
  totalErrors: stats.totalErrors,
  byPlatform: stats.errorsByPlatform,
  byType: stats.errorsByType,
  recent: stats.recentErrors.slice(0, 5)
});
```

### Authentication Status

```typescript
import { globalAuthManager } from './lib';

const summary = globalAuthManager.getAuthSummary();
console.log('Auth Summary:', summary);

// Detailed status
const allAuth = globalAuthManager.getAllAuthStatus();
allAuth.forEach(auth => {
  const status = auth.isConfigured && auth.isValid ? '🟢' : 
                 auth.isConfigured ? '🟡' : '🔴';
  console.log(`${status} ${auth.platform}: ${auth.authType}`);
});
```

## 🧪 Testing

```typescript
// Test platform detection
import { socialPlatformService } from './lib';

const validation = socialPlatformService.validateUrl('https://tiktok.com/@user/video/123');
console.log(`Valid: ${validation.valid}, Platform: ${validation.platform}`);

// Test authentication
import { authHelper } from './lib';

const isReady = await authHelper.isPlatformReady('rapidapi');
console.log(`RapidAPI ready: ${isReady}`);

// Test rate limiting
import { globalRateLimiter } from './lib';

const canProceed = globalRateLimiter.checkRateLimit('tiktok');
if (!canProceed.allowed) {
  console.log(`Rate limited: ${canProceed.reason}, retry in ${canProceed.retryAfterMs}ms`);
}
```

## 🔄 Migration Guide

If migrating from the original scattered implementations:

### Before (Old Pattern):
```typescript
// Multiple imports from different files
import { downloadTikTokVideo } from './tiktok-downloader';
import { fetchInstagramRapidApi } from './instagram-rapidapi';
import { withRapidApiRateLimit } from './rate-limiter';

// Manual error handling
try {
  await withRapidApiRateLimit(async () => {
    const data = await fetchInstagramRapidApi(shortcode);
    return mapInstagramToUnified(data, shortcode);
  });
} catch (error) {
  // Manual error handling
}
```

### After (New Pattern):
```typescript
// Single import
import { socialPlatformService, withRateLimit } from './lib';

// Unified interface with built-in error handling
const content = await withRateLimit('instagram', () =>
  socialPlatformService.fetchContent(url)
);
```

## 📈 Performance Tips

1. **Use Rate Limiting**: Always wrap API calls in rate limiting to avoid 429 errors
2. **Batch Operations**: Use batch methods for multiple requests
3. **Error Handling**: Let the error handler manage retries automatically
4. **Authentication**: Validate authentication once at startup
5. **Caching**: The services include built-in caching where appropriate

## 🤝 Contributing

When extending these services:

1. **Follow TypeScript patterns**: Use proper interfaces and error handling
2. **Add rate limiting**: All new API endpoints should use rate limiting
3. **Include error handling**: Classify errors properly for retry logic
4. **Update transformers**: Add new platforms to the data transformer
5. **Document changes**: Update this README with new features

## 📝 License

This code is part of the Gen C Alpha project and follows the project's licensing terms.