import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

type Platform = 'tiktok' | 'instagram' | 'other';

import { streamToBunnyFromUrl } from '../src/lib/bunny-stream.ts';
import { TranscriptionService } from '../src/services/transcription-service.ts';

const urls = process.argv.slice(2);

if (urls.length === 0) {
  console.error('Usage: npx tsx scripts/pipeline-smoke.ts <videoUrl> [<videoUrl> ...]');
  process.exit(1);
}

const detectPlatform = (url: string): Platform => {
  const lower = url.toLowerCase();
  if (lower.includes('tiktok')) return 'tiktok';
  if (lower.includes('instagram') || lower.includes('cdninstagram')) return 'instagram';
  return 'other';
};

(async () => {
  const transcriptionService = new TranscriptionService();

  for (const url of urls) {
    const platform = detectPlatform(url);
    console.log('🔍 [PIPELINE] Testing URL:', url.substring(0, 120));
    console.log('🪧 [PIPELINE] Detected platform:', platform);

    const transcriptionStart = Date.now();
    const transcription = await transcriptionService.transcribeFromUrl(url, platform);
    if (!transcription) {
      throw new Error('Transcription returned null');
    }
    console.log('📝 [PIPELINE] Transcript length:', transcription.transcript.length);
    console.log('🕒 [PIPELINE] Transcription duration:', `${Date.now() - transcriptionStart}ms`);

    const bunnyStart = Date.now();
    const bunnyResult = await streamToBunnyFromUrl(url, `pipeline-test-${platform}-${Date.now()}.mp4`);
    if (!bunnyResult) {
      throw new Error('Bunny upload returned null');
    }
    console.log('🐰 [PIPELINE] Bunny iframe URL:', bunnyResult.iframeUrl);
    console.log('🐰 [PIPELINE] Bunny direct URL:', bunnyResult.directUrl);
    console.log('🕒 [PIPELINE] Bunny upload duration:', `${Date.now() - bunnyStart}ms`);
  }

  console.log('✅ [PIPELINE] Completed smoke test.');
})().catch((error) => {
  console.error('❌ [PIPELINE] Smoke test failed:', error);
  process.exit(2);
});
