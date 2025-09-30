import 'dotenv/config';

import { TranscriptionService } from '../src/services/transcription-service.ts';

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('Usage: npx tsx scripts/test-transcription.ts <videoUrl>');
    process.exit(1);
  }

  const service = new TranscriptionService();
  console.log('🔰 Starting transcription test');
  console.log('📡 Source URL preview:', url.substring(0, 120));

  const start = Date.now();
  const result = await service.transcribeFromUrl(url, 'tiktok');
  const duration = Date.now() - start;

  if (!result) {
    console.error('❌ Transcription returned null');
    process.exit(2);
  }

  console.log('✅ Transcription succeeded in', `${duration}ms`);
  console.log('   Transcript length:', result.transcript.length);
  console.log('   Metadata:', result.transcriptionMetadata);
}

main().catch((err) => {
  console.error('❌ Transcription test failed:', err);
  process.exit(3);
});
