#!/usr/bin/env node
// Verify how /collections page calls /api/videos/collection and whether headers include uid/token

import puppeteer from 'puppeteer';

const base = (process.env.TEST_BASE_URL || 'https://www.gencapp.pro').replace(/\/$/, '');

async function main() {
  console.log(`🔎 Checking ${base}/collections for videos request headers`);
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (req.url().endsWith('/api/videos/collection')) {
      const headers = req.headers();
      console.log('📡 /api/videos/collection headers:', {
        authorization: headers['authorization'] || null,
        'x-user-id': headers['x-user-id'] || null,
        'x-api-key': headers['x-api-key'] || null,
        'content-type': headers['content-type'] || null,
      });
    }
    req.continue();
  });

  const resp = await page.goto(`${base}/collections`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  console.log('🌐 Page:', resp.status());

  // Give the app time to fire requests
  await new Promise(r => setTimeout(r, 5000));
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
