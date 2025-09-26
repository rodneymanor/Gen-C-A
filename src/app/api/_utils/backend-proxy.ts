import { NextResponse, type NextRequest } from 'next/server';

function backendBase(): string {
  const base =
    process.env.BACKEND_INTERNAL_URL ||
    process.env.BACKEND_URL ||
    process.env.BACKEND_DEV_URL ||
    'http://localhost:5001';
  return base.replace(/\/$/, '');
}

function buildTargetUrl(req: NextRequest, pathOverride?: string): string {
  const base = backendBase();
  if (pathOverride) {
    const url = new URL(pathOverride, `${base}/`);
    const search = new URL(req.url).searchParams;
    for (const [k, v] of search.entries()) url.searchParams.append(k, v);
    return url.toString();
  }
  const original = new URL(req.url);
  const url = new URL(original.pathname + original.search, `${base}/`);
  return url.toString();
}

function pickHeaders(req: NextRequest): Record<string, string> {
  const allow = ['authorization', 'x-api-key', 'x-user-id', 'x-internal-secret', 'content-type'] as const;
  const out: Record<string, string> = {};
  for (const key of allow) {
    const value = req.headers.get(key);
    if (typeof value === 'string' && value) out[key] = value;
  }
  return out;
}

export async function forwardToBackend(req: NextRequest, pathOverride?: string) {
  const url = buildTargetUrl(req, pathOverride);
  const method = req.method.toUpperCase();
  const headers = pickHeaders(req);

  let body: string | undefined;
  if (!['GET', 'HEAD'].includes(method)) {
    body = await req.text();
    if (body && !headers['content-type']) headers['content-type'] = 'application/json';
  }

  const response = await fetch(url, { method, headers, body });
  const contentType = response.headers.get('content-type') || '';
  const init = { status: response.status, headers: { 'content-type': contentType } } as any;

  if (contentType.includes('application/json')) {
    const json = await response.json().catch(() => null);
    return NextResponse.json(json, { status: response.status });
  }

  const text = await response.text();
  return new NextResponse(text, init);
}
