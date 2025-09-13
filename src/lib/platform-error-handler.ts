/**
 * Platform Error Handler
 * Comprehensive error handling strategies for social platform APIs
 */

export interface PlatformError {
  platform: string;
  operation: string;
  errorType: ErrorType;
  code?: string | number;
  message: string;
  originalError?: unknown;
  retryable: boolean;
  retryAfter?: number;
  suggestedAction?: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export enum ErrorType {
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  QUOTA_EXCEEDED = 'quota_exceeded',
  NOT_FOUND = 'not_found',
  FORBIDDEN = 'forbidden',
  VALIDATION = 'validation',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  SERVER_ERROR = 'server_error',
  PARSING = 'parsing',
  UNKNOWN = 'unknown'
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
}

export interface ErrorHandlerConfig {
  logErrors: boolean;
  trackMetrics: boolean;
  defaultRetryConfig: RetryConfig;
  platformSpecificRetry: Map<string, RetryConfig>;
}

/**
 * Error classification and handling for social platform APIs
 */
export class PlatformErrorHandler {
  private config: ErrorHandlerConfig;
  private errorCounts: Map<string, number> = new Map();
  private lastErrors: Map<string, PlatformError> = new Map();

  constructor(config?: Partial<ErrorHandlerConfig>) {
    this.config = {
      logErrors: true,
      trackMetrics: true,
      defaultRetryConfig: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 30000,
        backoffMultiplier: 2,
        jitter: true
      },
      platformSpecificRetry: new Map([
        ['rapidapi', {
          maxRetries: 2,
          baseDelay: 2000,
          maxDelay: 60000,
          backoffMultiplier: 3,
          jitter: true
        }],
        ['apify', {
          maxRetries: 1,
          baseDelay: 5000,
          maxDelay: 30000,
          backoffMultiplier: 2,
          jitter: false
        }],
        ['tiktok', {
          maxRetries: 3,
          baseDelay: 3000,
          maxDelay: 45000,
          backoffMultiplier: 2.5,
          jitter: true
        }],
        ['instagram', {
          maxRetries: 2,
          baseDelay: 4000,
          maxDelay: 60000,
          backoffMultiplier: 3,
          jitter: true
        }],
        ['youtube', {
          maxRetries: 3,
          baseDelay: 1000,
          maxDelay: 30000,
          backoffMultiplier: 2,
          jitter: true
        }]
      ]),
      ...config
    };
  }

  /**
   * Handle and classify errors from platform APIs
   */
  handleError(
    platform: string,
    operation: string,
    error: unknown,
    context?: Record<string, unknown>
  ): PlatformError {
    const platformError = this.classifyError(platform, operation, error, context);
    
    if (this.config.logErrors) {
      this.logError(platformError);
    }

    if (this.config.trackMetrics) {
      this.trackError(platformError);
    }

    return platformError;
  }

  /**
   * Execute operation with automatic retry logic
   */
  async executeWithRetry<T>(
    platform: string,
    operation: string,
    fn: () => Promise<T>,
    customRetryConfig?: Partial<RetryConfig>
  ): Promise<T> {
    const retryConfig = {
      ...this.getRetryConfig(platform),
      ...customRetryConfig
    };

    let lastError: PlatformError | null = null;
    let attempt = 0;

    while (attempt <= retryConfig.maxRetries) {
      try {
        console.log(`🔄 [${platform}] Executing ${operation} (attempt ${attempt + 1}/${retryConfig.maxRetries + 1})`);
        
        const result = await fn();
        
        if (attempt > 0) {
          console.log(`✅ [${platform}] ${operation} succeeded after ${attempt} retries`);
        }
        
        return result;
      } catch (error) {
        const platformError = this.handleError(platform, operation, error);
        lastError = platformError;
        attempt++;

        // Don't retry if error is not retryable or max retries reached
        if (!platformError.retryable || attempt > retryConfig.maxRetries) {
          break;
        }

        // Calculate delay with backoff and jitter
        const delay = this.calculateDelay(attempt - 1, retryConfig, platformError);
        
        console.log(`⏳ [${platform}] ${operation} failed (${platformError.errorType}), retrying in ${delay}ms...`);
        console.log(`   Error: ${platformError.message}`);
        
        await this.sleep(delay);
      }
    }

    if (lastError) {
      console.error(`❌ [${platform}] ${operation} failed after ${attempt} attempts`);
      throw new Error(lastError.message);
    }

    throw new Error('Operation failed with unknown error');
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    totalErrors: number;
    errorsByPlatform: Record<string, number>;
    errorsByType: Record<string, number>;
    recentErrors: PlatformError[];
  } {
    const errorsByPlatform: Record<string, number> = {};
    const errorsByType: Record<string, number> = {};

    for (const [key, count] of this.errorCounts) {
      if (key.includes(':')) {
        const [platform, type] = key.split(':');
        errorsByPlatform[platform] = (errorsByPlatform[platform] || 0) + count;
        errorsByType[type] = (errorsByType[type] || 0) + count;
      }
    }

    const totalErrors = Object.values(errorsByPlatform).reduce((sum, count) => sum + count, 0);
    const recentErrors = Array.from(this.lastErrors.values()).slice(-10);

    return {
      totalErrors,
      errorsByPlatform,
      errorsByType,
      recentErrors
    };
  }

  /**
   * Clear error tracking data
   */
  clearStats(): void {
    this.errorCounts.clear();
    this.lastErrors.clear();
    console.log('🧹 [ErrorHandler] Error tracking data cleared');
  }

  // Private methods

  private classifyError(
    platform: string,
    operation: string,
    error: unknown,
    context?: Record<string, unknown>
  ): PlatformError {
    const timestamp = new Date();
    
    // Default error structure
    let platformError: PlatformError = {
      platform,
      operation,
      errorType: ErrorType.UNKNOWN,
      message: 'Unknown error occurred',
      originalError: error,
      retryable: true,
      timestamp,
      metadata: context
    };

    // Handle different error types
    if (error instanceof Error) {
      platformError.message = error.message;
      platformError = this.classifyByMessage(platformError, error.message);
    } else if (typeof error === 'object' && error !== null) {
      platformError = this.classifyObjectError(platformError, error);
    } else if (typeof error === 'string') {
      platformError.message = error;
      platformError = this.classifyByMessage(platformError, error);
    }

    // Platform-specific error handling
    platformError = this.applyPlatformSpecificHandling(platformError);

    return platformError;
  }

  private classifyByMessage(platformError: PlatformError, message: string): PlatformError {
    const lowerMessage = message.toLowerCase();
    
    // Authentication errors
    if (lowerMessage.includes('unauthorized') || 
        lowerMessage.includes('invalid api key') ||
        lowerMessage.includes('authentication failed') ||
        lowerMessage.includes('401')) {
      return {
        ...platformError,
        errorType: ErrorType.AUTHENTICATION,
        retryable: false,
        suggestedAction: 'Check API credentials and permissions'
      };
    }

    // Rate limiting errors
    if (lowerMessage.includes('rate limit') ||
        lowerMessage.includes('too many requests') ||
        lowerMessage.includes('429')) {
      const retryAfter = this.extractRetryAfter(message);
      return {
        ...platformError,
        errorType: ErrorType.RATE_LIMIT,
        retryable: true,
        retryAfter,
        suggestedAction: 'Wait before retrying or implement backoff'
      };
    }

    // Quota exceeded
    if (lowerMessage.includes('quota exceeded') ||
        lowerMessage.includes('limit exceeded') ||
        lowerMessage.includes('usage limit')) {
      return {
        ...platformError,
        errorType: ErrorType.QUOTA_EXCEEDED,
        retryable: false,
        suggestedAction: 'Wait for quota reset or upgrade plan'
      };
    }

    // Not found errors
    if (lowerMessage.includes('not found') ||
        lowerMessage.includes('404') ||
        lowerMessage.includes('does not exist')) {
      return {
        ...platformError,
        errorType: ErrorType.NOT_FOUND,
        retryable: false,
        suggestedAction: 'Verify the resource exists and URL is correct'
      };
    }

    // Forbidden errors
    if (lowerMessage.includes('forbidden') ||
        lowerMessage.includes('403') ||
        lowerMessage.includes('access denied')) {
      return {
        ...platformError,
        errorType: ErrorType.FORBIDDEN,
        retryable: false,
        suggestedAction: 'Check permissions and access rights'
      };
    }

    // Network errors
    if (lowerMessage.includes('network') ||
        lowerMessage.includes('connection') ||
        lowerMessage.includes('fetch')) {
      return {
        ...platformError,
        errorType: ErrorType.NETWORK,
        retryable: true,
        suggestedAction: 'Check network connectivity'
      };
    }

    // Timeout errors
    if (lowerMessage.includes('timeout') ||
        lowerMessage.includes('timed out')) {
      return {
        ...platformError,
        errorType: ErrorType.TIMEOUT,
        retryable: true,
        suggestedAction: 'Increase timeout or try again later'
      };
    }

    // Server errors
    if (lowerMessage.includes('server error') ||
        lowerMessage.includes('internal error') ||
        lowerMessage.includes('5')) {
      return {
        ...platformError,
        errorType: ErrorType.SERVER_ERROR,
        retryable: true,
        suggestedAction: 'Server issue, try again later'
      };
    }

    // Validation errors
    if (lowerMessage.includes('invalid') ||
        lowerMessage.includes('validation') ||
        lowerMessage.includes('malformed')) {
      return {
        ...platformError,
        errorType: ErrorType.VALIDATION,
        retryable: false,
        suggestedAction: 'Check request format and parameters'
      };
    }

    return platformError;
  }

  private classifyObjectError(platformError: PlatformError, error: object): PlatformError {
    // Handle Response objects
    if ('status' in error && 'statusText' in error) {
      const response = error as { status: number; statusText: string };
      platformError.code = response.status;
      platformError.message = `HTTP ${response.status}: ${response.statusText}`;
      
      // Classify by HTTP status code
      if (response.status >= 400 && response.status < 500) {
        switch (response.status) {
          case 401:
            platformError.errorType = ErrorType.AUTHENTICATION;
            platformError.retryable = false;
            break;
          case 403:
            platformError.errorType = ErrorType.FORBIDDEN;
            platformError.retryable = false;
            break;
          case 404:
            platformError.errorType = ErrorType.NOT_FOUND;
            platformError.retryable = false;
            break;
          case 429:
            platformError.errorType = ErrorType.RATE_LIMIT;
            platformError.retryable = true;
            break;
          default:
            platformError.errorType = ErrorType.VALIDATION;
            platformError.retryable = false;
        }
      } else if (response.status >= 500) {
        platformError.errorType = ErrorType.SERVER_ERROR;
        platformError.retryable = true;
      }
    }

    // Handle structured API error responses
    if ('error' in error || 'message' in error) {
      const errorObj = error as { error?: string; message?: string; code?: string | number };
      if (errorObj.message) {
        platformError.message = errorObj.message;
      } else if (errorObj.error) {
        platformError.message = errorObj.error;
      }
      
      if (errorObj.code) {
        platformError.code = errorObj.code;
      }
    }

    return platformError;
  }

  private applyPlatformSpecificHandling(platformError: PlatformError): PlatformError {
    switch (platformError.platform) {
      case 'rapidapi':
        return this.handleRapidApiError(platformError);
      case 'apify':
        return this.handleApifyError(platformError);
      case 'tiktok':
        return this.handleTikTokError(platformError);
      case 'instagram':
        return this.handleInstagramError(platformError);
      case 'youtube':
        return this.handleYouTubeError(platformError);
      default:
        return platformError;
    }
  }

  private handleRapidApiError(platformError: PlatformError): PlatformError {
    // RapidAPI specific error patterns
    if (platformError.message.includes('subscription')) {
      return {
        ...platformError,
        errorType: ErrorType.QUOTA_EXCEEDED,
        retryable: false,
        suggestedAction: 'Check RapidAPI subscription status and limits'
      };
    }

    if (platformError.message.includes('endpoint')) {
      return {
        ...platformError,
        errorType: ErrorType.NOT_FOUND,
        retryable: false,
        suggestedAction: 'Verify API endpoint URL and service availability'
      };
    }

    return platformError;
  }

  private handleApifyError(platformError: PlatformError): PlatformError {
    // Apify specific error patterns
    if (platformError.message.includes('actor')) {
      return {
        ...platformError,
        errorType: ErrorType.NOT_FOUND,
        retryable: false,
        suggestedAction: 'Check actor ID and availability'
      };
    }

    if (platformError.message.includes('compute units')) {
      return {
        ...platformError,
        errorType: ErrorType.QUOTA_EXCEEDED,
        retryable: false,
        suggestedAction: 'Check Apify compute units balance'
      };
    }

    return platformError;
  }

  private handleTikTokError(platformError: PlatformError): PlatformError {
    // TikTok specific error patterns
    if (platformError.message.includes('private') || 
        platformError.message.includes('deleted')) {
      return {
        ...platformError,
        errorType: ErrorType.FORBIDDEN,
        retryable: false,
        suggestedAction: 'Video may be private or deleted'
      };
    }

    return platformError;
  }

  private handleInstagramError(platformError: PlatformError): PlatformError {
    // Instagram specific error patterns
    if (platformError.message.includes('login_required')) {
      return {
        ...platformError,
        errorType: ErrorType.AUTHENTICATION,
        retryable: false,
        suggestedAction: 'Instagram requires authentication for this content'
      };
    }

    return platformError;
  }

  private handleYouTubeError(platformError: PlatformError): PlatformError {
    // YouTube specific error patterns
    if (platformError.message.includes('videoNotFound')) {
      return {
        ...platformError,
        errorType: ErrorType.NOT_FOUND,
        retryable: false,
        suggestedAction: 'Video may be private, deleted, or ID is incorrect'
      };
    }

    if (platformError.message.includes('quotaExceeded')) {
      return {
        ...platformError,
        errorType: ErrorType.QUOTA_EXCEEDED,
        retryable: false,
        suggestedAction: 'YouTube API quota exceeded, wait for reset'
      };
    }

    return platformError;
  }

  private extractRetryAfter(message: string): number | undefined {
    // Try to extract retry-after from error message
    const retryMatch = message.match(/retry.*?(\d+)/i);
    if (retryMatch) {
      return parseInt(retryMatch[1]) * 1000; // Convert to milliseconds
    }
    return undefined;
  }

  private getRetryConfig(platform: string): RetryConfig {
    return this.config.platformSpecificRetry.get(platform) || this.config.defaultRetryConfig;
  }

  private calculateDelay(
    attempt: number,
    config: RetryConfig,
    error: PlatformError
  ): number {
    // Use retry-after if provided
    if (error.retryAfter) {
      return Math.min(error.retryAfter, config.maxDelay);
    }

    // Calculate exponential backoff
    let delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt);
    delay = Math.min(delay, config.maxDelay);

    // Add jitter if enabled
    if (config.jitter) {
      const jitter = delay * 0.1 * Math.random(); // Up to 10% jitter
      delay += jitter;
    }

    return Math.round(delay);
  }

  private logError(error: PlatformError): void {
    const emoji = this.getErrorEmoji(error.errorType);
    const retryableText = error.retryable ? 'retryable' : 'non-retryable';
    
    console.error(
      `${emoji} [${error.platform}] ${error.operation} failed: ${error.message} (${error.errorType}, ${retryableText})`
    );

    if (error.suggestedAction) {
      console.error(`   💡 Suggestion: ${error.suggestedAction}`);
    }
  }

  private trackError(error: PlatformError): void {
    const key = `${error.platform}:${error.errorType}`;
    this.errorCounts.set(key, (this.errorCounts.get(key) || 0) + 1);
    this.lastErrors.set(`${error.platform}:${error.operation}`, error);
  }

  private getErrorEmoji(errorType: ErrorType): string {
    switch (errorType) {
      case ErrorType.AUTHENTICATION: return '🔐';
      case ErrorType.RATE_LIMIT: return '⏰';
      case ErrorType.QUOTA_EXCEEDED: return '📊';
      case ErrorType.NOT_FOUND: return '🔍';
      case ErrorType.FORBIDDEN: return '🚫';
      case ErrorType.VALIDATION: return '⚠️';
      case ErrorType.NETWORK: return '🌐';
      case ErrorType.TIMEOUT: return '⏳';
      case ErrorType.SERVER_ERROR: return '🔥';
      case ErrorType.PARSING: return '📝';
      default: return '❌';
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Global error handler instance
 */
export const globalErrorHandler = new PlatformErrorHandler();

/**
 * Convenience wrapper functions
 */
export async function withErrorHandling<T>(
  platform: string,
  operation: string,
  fn: () => Promise<T>,
  retryConfig?: Partial<RetryConfig>
): Promise<T> {
  return globalErrorHandler.executeWithRetry(platform, operation, fn, retryConfig);
}

export function handlePlatformError(
  platform: string,
  operation: string,
  error: unknown,
  context?: Record<string, unknown>
): PlatformError {
  return globalErrorHandler.handleError(platform, operation, error, context);
}

export function createErrorHandler(config?: Partial<ErrorHandlerConfig>): PlatformErrorHandler {
  return new PlatformErrorHandler(config);
}