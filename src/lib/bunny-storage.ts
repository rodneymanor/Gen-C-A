const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36';

export interface BunnyStorageUploadOptions {
  /** Optional override for filename (defaults to derived from video id) */
  filename?: string;
  /** Treat remote content as this MIME type when uploading */
  contentType?: string;
  /** Provide custom fetch implementation (mainly for tests) */
  fetchImpl?: typeof fetch;
}

export interface BunnyStorageConfig {
  storageZone: string;
  apiKey: string;
  hostname: string;
}

export function resolveBunnyStorageConfig(): BunnyStorageConfig | null {
  const storageZone =
    process.env.BUNNY_STORAGE_ZONE || process.env.BUNNY_STREAM_LIBRARY_ID || '';
  const apiKey =
    process.env.BUNNY_STORAGE_API_KEY || process.env.BUNNY_STREAM_API_KEY || '';
  const hostname =
    process.env.BUNNY_STORAGE_HOST || process.env.BUNNY_CDN_HOSTNAME || '';

  if (!storageZone || !apiKey || !hostname) {
    return null;
  }

  return { storageZone, apiKey, hostname };
}

const LEADING_SLASHES = new RegExp('^/+');
const TRAILING_SLASHES = new RegExp('/+$');

function buildStorageUploadUrl(config: BunnyStorageConfig, objectPath: string): string {
  const normalizedPath = objectPath.replace(LEADING_SLASHES, '');
  return `https://storage.bunnycdn.com/${config.storageZone}/${normalizedPath}`;
}

function buildPublicAssetUrl(config: BunnyStorageConfig, objectPath: string): string {
  const normalizedPath = objectPath.replace(LEADING_SLASHES, '');
  const host = config.hostname.startsWith('https://') || config.hostname.startsWith('http://')
    ? config.hostname.replace(TRAILING_SLASHES, '')
    : `https://${config.hostname.replace(TRAILING_SLASHES, '')}`;
  return `${host}/${normalizedPath}`;
}

export async function uploadThumbnailToBunny(
  sourceUrl: string,
  objectPath: string,
  options: BunnyStorageUploadOptions = {},
): Promise<string | null> {
  const config = resolveBunnyStorageConfig();
  if (!config) {
    console.warn('[bunny-storage] Missing Bunny storage configuration; skipping upload');
    return null;
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const contentType = options.contentType ?? 'image/jpeg';

  const response = await fetchImpl(sourceUrl, {
    headers: {
      'User-Agent': DEFAULT_USER_AGENT,
      Accept: 'image/*,*/*;q=0.8',
    },
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => '');
    console.error('[bunny-storage] Failed to download thumbnail', response.status, detail);
    return null;
  }

  const buffer = await response.arrayBuffer();
  const uploadUrl = buildStorageUploadUrl(config, objectPath);

  const uploadResponse = await fetchImpl(uploadUrl, {
    method: 'PUT',
    headers: {
      AccessKey: config.apiKey,
      'Content-Type': contentType,
    },
    body: buffer,
  });

  if (!uploadResponse.ok) {
    const detail = await uploadResponse.text().catch(() => '');
    console.error('[bunny-storage] Failed to push thumbnail to Bunny', uploadResponse.status, detail);
    return null;
  }

  return buildPublicAssetUrl(config, objectPath);
}
