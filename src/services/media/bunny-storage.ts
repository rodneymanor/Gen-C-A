export function isBunnyStorageEnabled(): boolean {
  const config = getConfig();
  if (config.explicitlyDisabled) return false;
  return Boolean(config.host && config.zone && config.password && config.cdnBase);
}

export function buildThumbnailKey(videoId: string, contentType?: string): string {
  const safeId = String(videoId || 'unknown').replace(/[^a-zA-Z0-9-_]/g, '');
  const extension = inferExtension(contentType) || 'jpg';
  return `thumbnails/${safeId}.${extension}`;
}

export interface BunnyUploadResult {
  url: string;
  key: string;
}

export async function uploadThumbnailToBunny(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<BunnyUploadResult> {
  const config = getConfig();
  if (config.explicitlyDisabled || !config.host || !config.zone || !config.password || !config.cdnBase) {
    throw new Error('Bunny storage is not configured');
  }

  const endpoint = `https://${config.host}/${config.zone}/${key}`;
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: {
      AccessKey: config.password,
      'Content-Type': contentType,
      'Content-Length': String(buffer.length),
      'Cache-Control': 'public, max-age=31536000',
    },
    body: buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Bunny upload failed (${response.status}): ${body}`);
  }

  return {
    key,
    url: `${config.cdnBase}/${key}`,
  };
}

function getConfig() {
  const host = process.env.BUNNY_STORAGE_HOST?.trim() || '';
  const zone = process.env.BUNNY_STORAGE_ZONE?.trim() || '';
  const password = process.env.BUNNY_STORAGE_PASSWORD?.trim() || '';
  const cdnBase = process.env.BUNNY_STORAGE_CDN?.replace(/\/$/, '') || '';
  const flag = process.env.BUNNY_STORAGE_ENABLED;
  const explicitlyDisabled = typeof flag === 'string' && flag.toLowerCase() === 'false';

  return { host, zone, password, cdnBase, explicitlyDisabled };
}

function inferExtension(contentType?: string | null): string | null {
  if (!contentType) return null;
  const normalized = contentType.toLowerCase();
  if (normalized.includes('png')) return 'png';
  if (normalized.includes('webp')) return 'webp';
  if (normalized.includes('jpeg') || normalized.includes('jpg')) return 'jpg';
  if (normalized.includes('gif')) return 'gif';
  if (normalized.includes('heic') || normalized.includes('heif')) return 'jpg';
  return null;
}

export async function prepareThumbnailForUpload(
  buffer: Buffer,
  contentType?: string | null,
): Promise<{ buffer: Buffer; contentType: string }> {
  const originalType = contentType || 'image/jpeg';
  const normalized = originalType.toLowerCase();
  const sanitizedType = !normalized || normalized === 'application/octet-stream' ? 'image/jpeg' : originalType;

  const shouldConvertToJpeg =
    normalized.includes('heic') ||
    normalized.includes('heif') ||
    normalized.includes('avif') ||
    isLikelyHeif(buffer);

  if (!shouldConvertToJpeg) {
    return { buffer, contentType: sanitizedType };
  }

  try {
    const sharpModule = await import('sharp');
    const sharp = sharpModule.default || sharpModule;
    const converted = await sharp(buffer).jpeg({ quality: 92 }).toBuffer();
    return { buffer: converted, contentType: 'image/jpeg' };
  } catch (error) {
    console.warn('[media][bunny-storage] Failed to convert HEIC thumbnail, uploading original', error);
    return { buffer, contentType: sanitizedType };
  }
}

const HEIF_BRANDS = new Set([
  'heic',
  'heix',
  'hevc',
  'hevx',
  'heim',
  'heis',
  'hevm',
  'hevs',
  'mif1',
  'msf1',
  'avic',
  'avif',
  'avis',
  'av01',
]);

function isLikelyHeif(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 12) return false;

  const boxType = buffer.toString('ascii', 4, 8);
  if (boxType !== 'ftyp') return false;

  const majorBrand = buffer.toString('ascii', 8, 12).toLowerCase();
  if (HEIF_BRANDS.has(majorBrand)) return true;

  const compatibilityStart = 16; // skip major brand (4 bytes) + minor version (4 bytes)
  const compatibilityEnd = Math.min(buffer.length, compatibilityStart + 24); // inspect first six entries

  for (let offset = compatibilityStart; offset + 4 <= compatibilityEnd; offset += 4) {
    const brand = buffer.toString('ascii', offset, offset + 4).toLowerCase();
    if (HEIF_BRANDS.has(brand)) {
      return true;
    }
  }

  return false;
}
