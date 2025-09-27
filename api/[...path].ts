import type { VercelRequest, VercelResponse } from '@vercel/node';

const backendBase =
  process.env.BACKEND_INTERNAL_URL ||
  process.env.BACKEND_URL ||
  process.env.BACKEND_DEV_URL ||
  process.env.VITE_BACKEND_URL ||
  'http://localhost:5001';

function buildUrl(req: VercelRequest, pathOverride?: string) {
  const base = backendBase.replace(/\/$/, '');
  const target = pathOverride || (req.url || '/');
  const url = new URL(target, `${base}`);
  if (pathOverride && req.query) {
    for (const [key, val] of Object.entries(req.query)) {
      if (Array.isArray(val)) val.forEach((v) => url.searchParams.append(key, String(v)));
      else if (val != null) url.searchParams.set(key, String(val));
    }
  }
  return url.toString();
}

async function forward(req: VercelRequest, res: VercelResponse, pathOverride?: string) {
  const url = buildUrl(req, pathOverride);
  const headers: Record<string, string> = {};
  for (const key of ['authorization', 'x-api-key', 'x-user-id', 'content-type']) {
    const val = req.headers[key];
    if (typeof val === 'string') headers[key] = val;
  }
  const method = (req.method || 'GET').toUpperCase();
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
    res.setHeader('x-served-by', 'shim');
    return res.status(response.status).json(json);
  } catch {
    res.setHeader('x-served-by', 'shim');
    return res.status(response.status).send(text);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { pathname } = new URL(req.url || '/', 'http://localhost');
    const path = pathname || '/';

    // Special remaps that differ between FE and BE
    if (path === '/api/health') return forward(req, res, '/health');
    if (path === '/api/content-inbox/items') return forward(req, res, '/api/chrome-extension/content-inbox');
    if (path === '/api/idea-inbox/items') return forward(req, res, '/api/chrome-extension/idea-inbox/text');

    // Default: proxy everything under /api/* as-is
    if (path.startsWith('/api/')) return forward(req, res, path);

    return res.status(404).send('Not Found');
  } catch (err: any) {
    console.error('[api/[...path]] error:', err);
    return res.status(500).json({ success: false, error: err?.message || 'Internal Server Error' });
  }
}
