import { describe, expect, it } from 'vitest';

import { prepareThumbnailForUpload } from '../../../../src/services/media/bunny-storage';

describe('prepareThumbnailForUpload', () => {
  it('converts HEIF buffers mislabelled as JPEG', async () => {
    const sharpModule = await import('sharp');
    const sharp = sharpModule.default || sharpModule;

    const heifSupport = Boolean(sharp.format?.heif?.output?.supported);
    if (!heifSupport) {
      console.warn('⚠️  Skipping HEIF conversion test: Sharp not compiled with heif support');
      return;
    }

    const heifBuffer = await sharp({
      create: {
        width: 4,
        height: 4,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .toFormat('heif')
      .toBuffer();

    const result = await prepareThumbnailForUpload(heifBuffer, 'image/jpeg');

    expect(result.contentType).toBe('image/jpeg');

    const metadata = await sharp(result.buffer).metadata();
    expect(metadata.format).toBe('jpeg');
  });
});
