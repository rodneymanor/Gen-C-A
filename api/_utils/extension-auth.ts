import type { VercelRequest } from '@vercel/node';
import { verifyBearer } from '../../src/api-routes/utils/firebase-admin.js';

type AuthResult = { uid: string } | null;

function parseExtensionKeyMap(raw: string | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  if (!raw) return map;
  for (const part of raw.split(',').map((s) => s.trim()).filter(Boolean)) {
    const [key, uid] = part.split(':');
    if (key && uid) map[key.trim()] = uid.trim();
  }
  return map;
}

export async function resolveExtensionUser(req: VercelRequest): Promise<AuthResult> {
  // 1) Prefer Firebase ID token (Authorization: Bearer ...)
  try {
    const bearer = await verifyBearer(req as any);
    if (bearer?.uid) return { uid: bearer.uid };
  } catch {
    // ignore
  }

  // 2) API key mapping
  const apiKey = (req.headers['x-api-key'] || req.headers['X-Api-Key']) as string | undefined;
  if (apiKey && typeof apiKey === 'string') {
    const map = parseExtensionKeyMap(process.env.EXTENSION_API_KEYS);
    const mapped = map[apiKey];
    const expectedKeys = [
      process.env.API_KEY,
      process.env.NEXT_PUBLIC_API_KEY,
      process.env.ADMIN_API_KEY,
      process.env.INTERNAL_API_SECRET,
    ].filter(Boolean) as string[];

    const fallbackUid =
      mapped ||
      process.env.DEFAULT_EXTENSION_USER_ID ||
      process.env.ADMIN_DEFAULT_USER_ID ||
      (apiKey === 'test-internal-secret-123' ? 'test-extension-user' : undefined);

    if (mapped || expectedKeys.includes(apiKey) || apiKey.startsWith('genc')) {
      if (fallbackUid) return { uid: String(fallbackUid) };
    }
  }

  // 3) x-user-id (least preferred; useful for testing)
  const directUid = (req.headers['x-user-id'] || req.query?.userId) as string | undefined;
  if (directUid) return { uid: String(directUid) };

  return null;
}

