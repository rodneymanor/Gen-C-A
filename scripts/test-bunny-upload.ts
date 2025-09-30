import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

import { streamToBunnyFromUrl, testBunnyStreamConfig } from '../src/lib/bunny-stream.ts';

const sourceUrl = process.argv[2];

async function main() {
  if (!sourceUrl) {
    console.error('Usage: tsx scripts/test-bunny-upload.ts <videoUrl>');
    process.exit(1);
  }

  console.log('🔰 Starting Bunny upload smoke test');
  console.log('📡 Source URL preview:', sourceUrl.substring(0, 120));

  testBunnyStreamConfig();

  const filename = `codex-test-${Date.now()}.mp4`;
  console.log('🗂️ Using Bunny filename:', filename);

  const start = Date.now();
  const result = await streamToBunnyFromUrl(sourceUrl, filename);
  const durationMs = Date.now() - start;

  if (!result) {
    console.error('❌ Bunny upload failed');
    process.exit(2);
  }

  console.log('✅ Bunny upload succeeded in', `${durationMs}ms`);
  console.log('   iframeUrl:', result.iframeUrl);
  console.log('   directUrl:', result.directUrl);
}

main().catch((err) => {
  console.error('❌ Unexpected error during Bunny upload test:', err);
  process.exit(3);
});
