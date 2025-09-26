import type { VercelRequest } from '@vercel/node';

function shouldLog(): boolean {
  const flag = process.env.LOG_REQUEST_DEBUG;
  return flag === '1' || flag === 'true' || process.env.NODE_ENV !== 'production';
}

function redact(value?: string | string[] | null): string | undefined {
  if (!value) return undefined;
  const v = Array.isArray(value) ? value[0] : value;
  if (v.length <= 8) return '***';
  return `${v.slice(0, 4)}…${v.slice(-4)}`;
}

export function debugLogRequest(req: VercelRequest, label: string, extra?: Record<string, unknown>) {
  if (!shouldLog()) return;
  try {
    const h = req.headers || {} as Record<string, string>;
    const info: Record<string, unknown> = {
      label,
      env: process.env.VERCEL ? 'vercel' : (process.env.NODE_ENV || 'dev'),
      method: req.method,
      url: req.url,
      headers: {
        authorization: redact(h['authorization'] as any || (h['Authorization'] as any)),
        'x-api-key': redact(h['x-api-key'] as any || (h['X-Api-Key'] as any)),
        'x-user-id': h['x-user-id'] || (h['X-User-Id'] as any) || undefined,
        'content-type': h['content-type'] || undefined,
      },
    };
    // Shallow body preview (avoid logging large payloads)
    const body = (req as any).body;
    if (body && typeof body === 'object') {
      const preview: Record<string, unknown> = {};
      for (const k of Object.keys(body)) {
        if (k.toLowerCase().includes('token') || k.toLowerCase().includes('key')) continue;
        preview[k] = (body as any)[k];
      }
      info.body = preview;
    }
    if (extra) info.extra = extra;
    console.log('[request-debug]', JSON.stringify(info));
  } catch (e) {
    console.warn('[request-debug] failed to log:', (e as any)?.message || e);
  }
}

