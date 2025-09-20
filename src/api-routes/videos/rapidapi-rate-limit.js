const DEFAULT_DELAY_MS = (() => {
  const env = Number(process.env.RAPIDAPI_THROTTLE_MS);
  return Number.isFinite(env) && env >= 0 ? env : 2000;
})();

const MAX_ATTEMPTS = (() => {
  const env = Number(process.env.RAPIDAPI_MAX_ATTEMPTS);
  return Number.isFinite(env) && env > 0 ? Math.floor(env) : 5;
})();

const throttleState = (() => {
  const key = '__rapidApiThrottleState__';
  if (!globalThis[key]) {
    globalThis[key] = {
      queue: Promise.resolve(),
      lastCompletedAt: 0,
    };
  }
  return globalThis[key];
})();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const jitter = (ms) => Math.floor(Math.random() * ms);

const parseRetryAfter = (header) => {
  if (!header) return null;
  const numeric = Number(header);
  if (Number.isFinite(numeric)) {
    // Header can be seconds; interpret conservatively.
    return numeric > 1000 ? numeric : numeric * 1000;
  }

  const date = Date.parse(header);
  if (!Number.isNaN(date)) {
    const diff = date - Date.now();
    return diff > 0 ? diff : null;
  }
  return null;
};

async function schedule(task, label) {
  const labelText = label || 'RapidAPI request';

  const runner = async () => {
    const elapsed = Date.now() - throttleState.lastCompletedAt;
    const wait = Math.max(0, DEFAULT_DELAY_MS - elapsed);
    if (wait > 0) {
      console.log(`⏳ [RapidAPI] Waiting ${wait}ms before ${labelText}`);
      await delay(wait);
    }

    try {
      return await task();
    } finally {
      throttleState.lastCompletedAt = Date.now();
    }
  };

  const execution = throttleState.queue.then(runner);
  throttleState.queue = execution.catch(() => {});
  return execution;
}

export function withRapidApiThrottle(task, label) {
  return schedule(task, label);
}

export function rapidApiFetch(url, options = {}, label) {
  const requestLabel = label ?? url;

  return withRapidApiThrottle(async () => {
    let attempt = 0;
    let lastError;

    while (attempt < MAX_ATTEMPTS) {
      attempt += 1;
      try {
        const response = await fetch(url, options);

        if (response.ok || (response.status >= 200 && response.status < 400)) {
          return response;
        }

        if (response.status === 429 || response.status >= 500) {
          const retryAfterHeader = response.headers?.get?.('retry-after');
          const retryAfterMs = parseRetryAfter(retryAfterHeader);
          const backoffBase = retryAfterMs ?? Math.min(30000, DEFAULT_DELAY_MS * Math.pow(2, attempt));
          const sleepMs = backoffBase + jitter(500);
          console.warn(`🛑 [RapidAPI] ${response.status} on "${requestLabel}". Backing off ${sleepMs}ms (attempt ${attempt}/${MAX_ATTEMPTS}).`);
          await delay(sleepMs);
          lastError = new Error(`HTTP ${response.status}`);
          continue;
        }

        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        const sleepMs = Math.min(30000, DEFAULT_DELAY_MS * Math.pow(2, attempt)) + jitter(500);
        console.warn(`⚠️ [RapidAPI] Network error on "${requestLabel}": ${lastError.message}. Retrying in ${sleepMs}ms (attempt ${attempt}/${MAX_ATTEMPTS}).`);
        await delay(sleepMs);
      }
    }

    throw lastError ?? new Error('RapidAPI request failed');
  }, requestLabel);
}

export const RAPIDAPI_DELAY_MS = DEFAULT_DELAY_MS;
