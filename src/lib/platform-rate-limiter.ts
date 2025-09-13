/**
 * Platform Rate Limiter
 * Comprehensive rate limiting for social platform APIs with quota management
 */

export interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour?: number;
  requestsPerDay?: number;
  burstLimit?: number; // Allow short bursts
  retryAfterMs?: number; // Default retry delay
}

export interface RateLimitQuota {
  remaining: number;
  total: number;
  resetTime: Date;
  windowType: 'second' | 'minute' | 'hour' | 'day';
}

export interface RateLimitStatus {
  allowed: boolean;
  quotas: RateLimitQuota[];
  retryAfterMs?: number;
  reason?: string;
}

interface RequestEntry {
  timestamp: number;
  success: boolean;
}

interface RateLimitBucket {
  requests: RequestEntry[];
  lastCleanup: number;
  burstTokens: number;
  lastBurstRefill: number;
}

/**
 * Advanced Rate Limiter with multiple time windows and burst support
 */
export class PlatformRateLimiter {
  private buckets: Map<string, RateLimitBucket> = new Map();
  private configs: Map<string, RateLimitConfig> = new Map();

  // Default configurations for different platforms
  private static readonly DEFAULT_CONFIGS: Record<string, RateLimitConfig> = {
    'rapidapi-global': {
      requestsPerSecond: 1,
      requestsPerMinute: 50,
      requestsPerHour: 1000,
      requestsPerDay: 10000,
      burstLimit: 3,
      retryAfterMs: 2000,
    },
    'tiktok': {
      requestsPerSecond: 1,
      requestsPerMinute: 30,
      requestsPerHour: 500,
      burstLimit: 2,
      retryAfterMs: 3000,
    },
    'instagram': {
      requestsPerSecond: 0.5, // More conservative for Instagram
      requestsPerMinute: 25,
      requestsPerHour: 300,
      burstLimit: 2,
      retryAfterMs: 4000,
    },
    'youtube': {
      requestsPerSecond: 2,
      requestsPerMinute: 100,
      requestsPerHour: 10000,
      burstLimit: 5,
      retryAfterMs: 1000,
    },
    'apify': {
      requestsPerSecond: 0.1, // Very conservative for Apify
      requestsPerMinute: 5,
      requestsPerHour: 100,
      burstLimit: 1,
      retryAfterMs: 10000,
    },
  };

  constructor() {
    // Initialize with default configurations
    for (const [platform, config] of Object.entries(PlatformRateLimiter.DEFAULT_CONFIGS)) {
      this.configs.set(platform, config);
    }

    // Clean up old entries periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  /**
   * Set custom rate limit configuration for a platform
   */
  setConfig(platform: string, config: Partial<RateLimitConfig>): void {
    const existingConfig = this.configs.get(platform) || PlatformRateLimiter.DEFAULT_CONFIGS['rapidapi-global'];
    this.configs.set(platform, { ...existingConfig, ...config });
  }

  /**
   * Check if request is allowed and get rate limit status
   */
  checkRateLimit(platform: string, operation: string = 'default'): RateLimitStatus {
    const key = `${platform}:${operation}`;
    const config = this.configs.get(platform) || this.configs.get('rapidapi-global')!;
    
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = {
        requests: [],
        lastCleanup: Date.now(),
        burstTokens: config.burstLimit || 0,
        lastBurstRefill: Date.now(),
      };
      this.buckets.set(key, bucket);
    }

    const now = Date.now();
    
    // Refill burst tokens
    this.refillBurstTokens(bucket, config, now);
    
    // Clean old entries
    this.cleanupBucket(bucket, now);
    
    // Check all rate limit windows
    const quotas = this.calculateQuotas(bucket, config, now);
    const violatedQuota = quotas.find(quota => quota.remaining <= 0);
    
    if (violatedQuota) {
      return {
        allowed: false,
        quotas,
        retryAfterMs: this.calculateRetryDelay(violatedQuota, config),
        reason: `Rate limit exceeded for ${violatedQuota.windowType} window`
      };
    }

    // Check burst limit
    if (config.burstLimit && bucket.burstTokens <= 0) {
      const nextRefill = this.calculateNextBurstRefill(bucket, config, now);
      return {
        allowed: false,
        quotas,
        retryAfterMs: nextRefill - now,
        reason: 'Burst limit exceeded'
      };
    }

    return {
      allowed: true,
      quotas
    };
  }

  /**
   * Record a successful request
   */
  recordRequest(platform: string, operation: string = 'default', success: boolean = true): void {
    const key = `${platform}:${operation}`;
    const config = this.configs.get(platform) || this.configs.get('rapidapi-global')!;
    
    let bucket = this.buckets.get(key);
    if (!bucket) {
      bucket = {
        requests: [],
        lastCleanup: Date.now(),
        burstTokens: config.burstLimit || 0,
        lastBurstRefill: Date.now(),
      };
      this.buckets.set(key, bucket);
    }

    const now = Date.now();
    bucket.requests.push({
      timestamp: now,
      success
    });

    // Consume burst token if configured
    if (config.burstLimit && bucket.burstTokens > 0) {
      bucket.burstTokens--;
    }
  }

  /**
   * Wait for rate limit compliance
   */
  async waitForRateLimit(platform: string, operation: string = 'default'): Promise<void> {
    const status = this.checkRateLimit(platform, operation);
    
    if (!status.allowed && status.retryAfterMs) {
      console.log(`⏳ [RateLimit] Waiting ${status.retryAfterMs}ms for ${platform}:${operation} - ${status.reason}`);
      await this.sleep(status.retryAfterMs);
    }
  }

  /**
   * Get current rate limit status for debugging
   */
  getStatus(platform: string, operation: string = 'default'): RateLimitStatus & {
    requestCount: number;
    successRate: number;
    config: RateLimitConfig;
  } {
    const key = `${platform}:${operation}`;
    const config = this.configs.get(platform) || this.configs.get('rapidapi-global')!;
    const bucket = this.buckets.get(key);
    
    if (!bucket) {
      return {
        allowed: true,
        quotas: [],
        requestCount: 0,
        successRate: 1.0,
        config
      };
    }

    const now = Date.now();
    this.cleanupBucket(bucket, now);
    
    const quotas = this.calculateQuotas(bucket, config, now);
    const status = this.checkRateLimit(platform, operation);
    
    const successfulRequests = bucket.requests.filter(r => r.success).length;
    const successRate = bucket.requests.length > 0 ? successfulRequests / bucket.requests.length : 1.0;

    return {
      ...status,
      requestCount: bucket.requests.length,
      successRate,
      config
    };
  }

  /**
   * Reset rate limit for a specific platform/operation
   */
  reset(platform: string, operation: string = 'default'): void {
    const key = `${platform}:${operation}`;
    this.buckets.delete(key);
  }

  /**
   * Get all active rate limiters
   */
  getAllStatus(): Array<{
    platform: string;
    operation: string;
    status: RateLimitStatus;
    requestCount: number;
    successRate: number;
  }> {
    const results: Array<{
      platform: string;
      operation: string;
      status: RateLimitStatus;
      requestCount: number;
      successRate: number;
    }> = [];

    for (const [key] of this.buckets) {
      const [platform, operation] = key.split(':');
      const fullStatus = this.getStatus(platform, operation);
      
      results.push({
        platform,
        operation,
        status: {
          allowed: fullStatus.allowed,
          quotas: fullStatus.quotas,
          retryAfterMs: fullStatus.retryAfterMs,
          reason: fullStatus.reason
        },
        requestCount: fullStatus.requestCount,
        successRate: fullStatus.successRate
      });
    }

    return results;
  }

  // Private helper methods

  private refillBurstTokens(bucket: RateLimitBucket, config: RateLimitConfig, now: number): void {
    if (!config.burstLimit) return;

    const timeSinceLastRefill = now - bucket.lastBurstRefill;
    const refillInterval = 1000; // Refill one token per second
    
    if (timeSinceLastRefill >= refillInterval) {
      const tokensToRefill = Math.floor(timeSinceLastRefill / refillInterval);
      bucket.burstTokens = Math.min(config.burstLimit, bucket.burstTokens + tokensToRefill);
      bucket.lastBurstRefill = now;
    }
  }

  private cleanupBucket(bucket: RateLimitBucket, now: number): void {
    // Only cleanup if it's been more than a minute
    if (now - bucket.lastCleanup < 60000) return;

    // Keep requests from the last day only
    const dayAgo = now - 24 * 60 * 60 * 1000;
    bucket.requests = bucket.requests.filter(req => req.timestamp > dayAgo);
    bucket.lastCleanup = now;
  }

  private calculateQuotas(bucket: RateLimitBucket, config: RateLimitConfig, now: number): RateLimitQuota[] {
    const quotas: RateLimitQuota[] = [];

    // Second window
    const secondAgo = now - 1000;
    const requestsInSecond = bucket.requests.filter(r => r.timestamp > secondAgo).length;
    quotas.push({
      remaining: Math.max(0, config.requestsPerSecond - requestsInSecond),
      total: config.requestsPerSecond,
      resetTime: new Date(Math.ceil(now / 1000) * 1000),
      windowType: 'second'
    });

    // Minute window
    const minuteAgo = now - 60000;
    const requestsInMinute = bucket.requests.filter(r => r.timestamp > minuteAgo).length;
    quotas.push({
      remaining: Math.max(0, config.requestsPerMinute - requestsInMinute),
      total: config.requestsPerMinute,
      resetTime: new Date(Math.ceil(now / 60000) * 60000),
      windowType: 'minute'
    });

    // Hour window (if configured)
    if (config.requestsPerHour) {
      const hourAgo = now - 60 * 60 * 1000;
      const requestsInHour = bucket.requests.filter(r => r.timestamp > hourAgo).length;
      quotas.push({
        remaining: Math.max(0, config.requestsPerHour - requestsInHour),
        total: config.requestsPerHour,
        resetTime: new Date(Math.ceil(now / (60 * 60 * 1000)) * (60 * 60 * 1000)),
        windowType: 'hour'
      });
    }

    // Day window (if configured)
    if (config.requestsPerDay) {
      const dayAgo = now - 24 * 60 * 60 * 1000;
      const requestsInDay = bucket.requests.filter(r => r.timestamp > dayAgo).length;
      quotas.push({
        remaining: Math.max(0, config.requestsPerDay - requestsInDay),
        total: config.requestsPerDay,
        resetTime: new Date(Math.ceil(now / (24 * 60 * 60 * 1000)) * (24 * 60 * 60 * 1000)),
        windowType: 'day'
      });
    }

    return quotas;
  }

  private calculateRetryDelay(quota: RateLimitQuota, config: RateLimitConfig): number {
    const timeUntilReset = quota.resetTime.getTime() - Date.now();
    const configuredDelay = config.retryAfterMs || 1000;
    
    // Use the longer of the two delays
    return Math.max(timeUntilReset, configuredDelay);
  }

  private calculateNextBurstRefill(bucket: RateLimitBucket, config: RateLimitConfig, now: number): number {
    const refillInterval = 1000; // 1 second
    return bucket.lastBurstRefill + refillInterval;
  }

  private cleanup(): void {
    const now = Date.now();
    
    for (const [key, bucket] of this.buckets) {
      this.cleanupBucket(bucket, now);
      
      // Remove completely empty buckets that haven't been used recently
      if (bucket.requests.length === 0 && now - bucket.lastCleanup > 5 * 60 * 1000) {
        this.buckets.delete(key);
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Rate limit wrapper functions for easy integration
 */
export class RateLimitedExecutor {
  private rateLimiter: PlatformRateLimiter;

  constructor(rateLimiter?: PlatformRateLimiter) {
    this.rateLimiter = rateLimiter || new PlatformRateLimiter();
  }

  /**
   * Execute operation with rate limiting
   */
  async execute<T>(
    platform: string,
    operation: () => Promise<T>,
    operationType: string = 'default'
  ): Promise<T> {
    await this.rateLimiter.waitForRateLimit(platform, operationType);
    
    try {
      const result = await operation();
      this.rateLimiter.recordRequest(platform, operationType, true);
      return result;
    } catch (error) {
      this.rateLimiter.recordRequest(platform, operationType, false);
      throw error;
    }
  }

  /**
   * Execute with retry logic and exponential backoff
   */
  async executeWithRetry<T>(
    platform: string,
    operation: () => Promise<T>,
    operationType: string = 'default',
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        return await this.execute(platform, operation, operationType);
      } catch (error) {
        lastError = error as Error;
        attempt++;

        if (attempt > maxRetries) {
          break;
        }

        // Check if this is a retryable error
        if (!this.isRetryableError(error)) {
          throw error;
        }

        // Exponential backoff with jitter
        const baseDelay = 1000 * Math.pow(2, attempt - 1);
        const jitter = Math.random() * 1000;
        const delay = baseDelay + jitter;

        console.log(`🔄 [RateLimit] Retrying ${platform}:${operationType} in ${Math.round(delay)}ms (attempt ${attempt}/${maxRetries})`);
        await this.sleep(delay);
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Batch execute operations with controlled concurrency
   */
  async executeBatch<T>(
    platform: string,
    operations: Array<() => Promise<T>>,
    operationType: string = 'batch',
    concurrency: number = 1
  ): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
    const results: Array<{ success: boolean; result?: T; error?: Error }> = [];
    
    for (let i = 0; i < operations.length; i += concurrency) {
      const batch = operations.slice(i, i + concurrency);
      
      const batchPromises = batch.map(async (operation, index) => {
        try {
          const result = await this.execute(platform, operation, `${operationType}-${i + index}`);
          return { success: true, result };
        } catch (error) {
          return { success: false, error: error as Error };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      // Don't retry on client errors
      if (message.includes('invalid') || 
          message.includes('unauthorized') || 
          message.includes('forbidden') ||
          message.includes('not found')) {
        return false;
      }

      // Retry on server errors and rate limit errors
      if (message.includes('rate limit') ||
          message.includes('too many requests') ||
          message.includes('server error') ||
          message.includes('timeout')) {
        return true;
      }
    }

    return true; // Default to retryable
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get rate limiter instance for direct access
   */
  getRateLimiter(): PlatformRateLimiter {
    return this.rateLimiter;
  }
}

// Global instances
export const globalRateLimiter = new PlatformRateLimiter();
export const rateLimitedExecutor = new RateLimitedExecutor(globalRateLimiter);

// Convenience wrapper functions
export async function withRateLimit<T>(
  platform: string,
  operation: () => Promise<T>,
  operationType?: string
): Promise<T> {
  return rateLimitedExecutor.execute(platform, operation, operationType);
}

export async function withRateLimitAndRetry<T>(
  platform: string,
  operation: () => Promise<T>,
  operationType?: string,
  maxRetries?: number
): Promise<T> {
  return rateLimitedExecutor.executeWithRetry(platform, operation, operationType, maxRetries);
}

export async function executeBatch<T>(
  platform: string,
  operations: Array<() => Promise<T>>,
  operationType?: string,
  concurrency?: number
): Promise<Array<{ success: boolean; result?: T; error?: Error }>> {
  return rateLimitedExecutor.executeBatch(platform, operations, operationType, concurrency);
}