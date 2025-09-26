import type { VercelRequest, VercelResponse } from '@vercel/node';

function backendBase(): string {
  const base =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.BACKEND_URL ||
    process.env.BACKEND_DEV_URL ||
    'http://localhost:5001';
  return base.replace(/\/$/, '');
}

function buildTargetUrl(req: VercelRequest, pathOverride?: string): string {
  const base = backendBase();
  if (pathOverride) {
    const url = new URL(pathOverride, `${base}/`);
    const query = req.query || {};
    Object.entries(query).forEach(([key, value]) => {
      if (Array.isArray(value)) value.forEach((v) => url.searchParams.append(key, String(v)));
      else if (value != null) url.searchParams.set(key, String(value));
    });
    return url.toString();
  }
  // fallback: preserve original path and query
  const url = new URL(req.url || '/', `${base}/`);
  return url.toString();
}

function pickHeaders(req: VercelRequest): Record<string, string> {
  const headers: Record<string, string> = {};
  const source = req.headers || {};
  const allow = ['authorization', 'x-api-key', 'x-user-id', 'x-internal-secret', 'content-type'];
  for (const key of allow) {
    const value = (source[key] as string) || (source[key.toUpperCase()] as any);
    if (typeof value === 'string') headers[key] = value;
  }
  return headers;
}

export async function proxyToBackend(req: VercelRequest, res: VercelResponse, pathOverride?: string) {
  const url = buildTargetUrl(req, pathOverride);
  const method = (req.method || 'GET').toUpperCase();
  const headers = pickHeaders(req);

  let body: string | undefined;
  if (!['GET', 'HEAD'].includes(method)) {
    if (req.body && typeof req.body === 'object') {
      body = JSON.stringify(req.body);
      if (!headers['content-type']) headers['content-type'] = 'application/json';
    } else if (typeof req.body === 'string') {
      body = req.body;
      if (!headers['content-type']) headers['content-type'] = 'application/json';
    }
  }

  const response = await fetch(url, { method, headers, body });
  const text = await response.text();
  try {
    const json = text ? JSON.parse(text) : null;
    return res.status(response.status).json(json);
  } catch {
    return res.status(response.status).send(text);
  }
}

