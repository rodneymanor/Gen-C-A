#!/usr/bin/env node
import puppeteer from 'puppeteer';

const BASE = process.env.DEV_URL || 'http://localhost:3000';
const TARGETS = [
  `${BASE.replace(/\/$/, '')}/collections`,
  `${BASE.replace(/\/$/, '')}/library`,
];

function pickAuthHeader(headers) {
  const out = {};
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === 'authorization') out.authorization = v;
    if (k.toLowerCase() === 'x-user-id') out['x-user-id'] = v;
  }
  return out;
}

function formatAuth(hdrs) {
  if (hdrs.authorization) {
    const val = String(hdrs.authorization);
    return val.startsWith('Bearer ') ? 'Bearer <token>' : val;
  }
  if (hdrs['x-user-id']) return `x-user-id=${hdrs['x-user-id']}`;
  return '(none)';
}

const API_PAT = /\/api\/(collections|videos|notes|scripts)/i;

async function main() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(20000);

  const findings = [];

  page.on('request', (req) => {
    const url = req.url();
    if (!API_PAT.test(url)) return;
    const headers = req.headers();
    const auth = pickAuthHeader(headers);
    findings.push({
      type: 'request',
      url,
      method: req.method(),
      auth,
      ts: Date.now(),
    });
  });

  page.on('response', async (res) => {
    const url = res.url();
    if (!API_PAT.test(url)) return;
    findings.push({
      type: 'response',
      url,
      status: res.status(),
      servedBy: res.headers()['x-served-by'] || '(none)',
      ts: Date.now(),
    });
  });

  try {
    for (const target of TARGETS) {
      console.log(`Navigating to ${target}`);
      const resp = await page.goto(target, { waitUntil: 'networkidle2' });
      const code = resp?.status() ?? 'n/a';
      console.log(`Page status: ${code}`);
      await new Promise((r) => setTimeout(r, 2000));
    }

    // Optionally trigger an authenticated request using a provided Firebase ID token
    const token = process.env.SMOKE_FIREBASE_TOKEN || '';
    if (token) {
      console.log('Triggering authenticated fetch to /api/collections using SMOKE_FIREBASE_TOKEN...');
      await page.evaluate(async (tkn) => {
        try {
          await fetch('/api/collections', {
            headers: { Authorization: `Bearer ${tkn}` },
          });
          await fetch('/api/videos/collection', {
            method: 'POST',
            headers: { 'content-type': 'application/json', Authorization: `Bearer ${tkn}` },
            body: JSON.stringify({ collectionId: 'default', videoLimit: 5 }),
          });
        } catch {}
      }, token);
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Print a compact report
    const byUrl = {};
    for (const entry of findings) {
      const key = entry.url;
      if (!byUrl[key]) byUrl[key] = { req: null, res: null };
      if (entry.type === 'request') byUrl[key].req = entry;
      else byUrl[key].res = entry;
    }

    const rows = Object.entries(byUrl)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([url, { req, res }]) => ({
        url,
        method: req?.method ?? '(?)',
        auth: formatAuth(req?.auth || {}),
        status: res?.status ?? '(no response)',
        servedBy: res?.servedBy ?? '(none)',
      }));

    console.log('\n=== Collections/Library API Requests ===');
    for (const r of rows) {
      console.log(`- ${r.method} ${r.url}`);
      console.log(`  Auth: ${r.auth}`);
      console.log(`  Status: ${r.status}  x-served-by: ${r.servedBy}`);
    }

    // Simple exit code policy: fail if any /api/collections or /api/videos/collection had no auth header
    const problematic = rows.filter((r) => /\/api\/(collections|videos)/.test(r.url) && r.auth === '(none)');
    if (problematic.length) {
      console.error(`\nAuth missing on ${problematic.length} request(s).`);
      process.exitCode = 2;
    }
  } catch (err) {
    console.error('Puppeteer check failed:', err.message || err);
    process.exitCode = 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

main();
