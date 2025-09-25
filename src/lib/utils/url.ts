let cachedBackendBaseUrl: string | null = null;

function sanitizeBaseUrl(raw: string): string {
  return raw.replace(/\/$/, '');
}

export function getBackendBaseUrl(): string {
  if (cachedBackendBaseUrl) return cachedBackendBaseUrl;

  const candidates = [
    process.env.BACKEND_INTERNAL_URL,
    process.env.BACKEND_URL,
    process.env.BACKEND_DEV_URL,
    process.env.VITE_BACKEND_URL,
    process.env.INTERNAL_API_URL,
    process.env.API_URL,
  ];

  const resolved = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);

  if (resolved && resolved.trim()) {
    cachedBackendBaseUrl = sanitizeBaseUrl(resolved.trim());
    return cachedBackendBaseUrl;
  }

  cachedBackendBaseUrl = 'http://localhost:5001';
  return cachedBackendBaseUrl;
}

export function buildInternalUrl(path: string): string {
  const base = getBackendBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
