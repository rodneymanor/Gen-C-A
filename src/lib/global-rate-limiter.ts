import { rateLimitedExecutor } from "@/lib/platform-rate-limiter";

const DEFAULT_OPERATION_KEY = "default";
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY_MS = 1000;

/**
 * Applies both the shared RapidAPI limiter and the Instagram-specific limiter
 * before executing the provided operation. This ensures we respect overall
 * RapidAPI quotas while still keeping a conservative cap on Instagram calls.
 */
export async function withGlobalInstagramRateLimit<T>(
  operation: () => Promise<T>,
  operationKey: string = DEFAULT_OPERATION_KEY,
): Promise<T> {
  const key = operationKey || DEFAULT_OPERATION_KEY;

  // Enforce the broader RapidAPI quota first, then the Instagram-specific one
  return rateLimitedExecutor.execute(
    "rapidapi-global",
    () => rateLimitedExecutor.execute("instagram", operation, key),
    key,
  );
}

/**
 * Retry helper with exponential backoff + jitter. Primarily intended for
 * network/5xx/rate limit style errors returned from RapidAPI.
 */
export async function retryWithGlobalBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = DEFAULT_MAX_RETRIES,
  baseDelayMs: number = DEFAULT_BASE_DELAY_MS,
  operationKey: string = DEFAULT_OPERATION_KEY,
): Promise<T> {
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      attempt += 1;

      if (!isRetryableError(error) || attempt >= maxRetries) {
        throw error instanceof Error ? error : new Error(String(error));
      }

      const delay = calculateBackoffDelay(baseDelayMs, attempt);
      console.warn(
        `⏳ [GlobalRateLimiter] ${operationKey} attempt ${attempt} failed: ${getErrorMessage(error)}. Retrying in ${delay}ms`,
      );
      await wait(delay);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Operation failed after retry attempts");
}

function calculateBackoffDelay(baseDelayMs: number, attempt: number): number {
  const exponential = baseDelayMs * Math.pow(2, Math.max(0, attempt - 1));
  const jitter = Math.random() * baseDelayMs;
  return Math.round(exponential + jitter);
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return true;
  }

  const message = error.message.toLowerCase();

  if (message.includes("401") || message.includes("403") || message.includes("404")) {
    return false;
  }

  if (message.includes("invalid") || message.includes("unauthorized") || message.includes("forbidden")) {
    return false;
  }

  return true;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
}
