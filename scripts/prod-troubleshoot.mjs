#!/usr/bin/env node
// Production troubleshooting + smoke test using Puppeteer (optional) and Node fetch
// Usage:
//   node scripts/prod-troubleshoot.mjs --base=https://www.gencapp.pro
// Optional env for auth checks:
//   FIREBASE_TEST_EMAIL, FIREBASE_TEST_PASSWORD, NEXT_PUBLIC_FIREBASE_API_KEY

import puppeteer from 'puppeteer';

const args = Object.fromEntries(process.argv.slice(2).map(arg => {
  const [k, v] = arg.split('=');
  return [k.replace(/^--/, ''), v ?? true];
}));

const base = (args.base || process.env.TEST_BASE_URL || 'https://www.gencapp.pro').replace(/\/$/, '');

function url(p) { return p.startsWith('http') ? p : `${base}${p.startsWith('/') ? '' : '/'}${p}`; }

async function fetchJson(path, init) {
  const res = await fetch(url(path), init);
  const ct = res.headers.get('content-type') || '';
  const body = ct.includes('application/json') ? await res.json().catch(() => ({})) : await res.text();
  return { ok: res.ok, status: res.status, body };
}

function logStatus(name, { ok, status }, extra = '') {
  const flag = ok ? '✅' : '❌';
  console.log(`${flag} ${name} -> ${status}${extra ? ` ${extra}` : ''}`);
}

async function signInWithPassword(email, password, apiKey) {
  const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  if (!res.ok) throw new Error(`signInWithPassword failed (${res.status})`);
  const data = await res.json();
  return { idToken: data.idToken, uid: data.localId };
}

async function main() {
  console.log(`🔎 Troubleshooting against ${base}`);

  // Launch headless page just to ensure site renders (no blockers)
  let browser; let page;
  try {
    browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox','--disable-setuid-sandbox'] });
    page = await browser.newPage();
    const resp = await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 60000 });
    console.log(`🌐 Page load: ${resp.status()} ${base}`);
  } catch (e) {
    console.warn('⚠️ Puppeteer page load failed:', e.message);
  } finally {
    if (browser) await browser.close().catch(() => {});
  }

  // Diagnostics
  const diag = await fetchJson('/api/diagnostics');
  logStatus('GET /api/diagnostics', diag);
  if (diag.ok) console.log('   →', JSON.stringify(diag.body));

  const self = await fetchJson('/api/diagnostics/self-test');
  logStatus('GET /api/diagnostics/self-test', self);
  if (self.ok) console.log('   →', JSON.stringify(self.body));

  // Public endpoints
  const viral = await fetchJson('/api/viral-content/feed?page=0');
  logStatus('GET /api/viral-content/feed?page=0', viral);

  const voices = await fetchJson('/api/brand-voices/list');
  logStatus('GET /api/brand-voices/list', voices);

  // Chrome extension endpoints (optional API key + uid)
  const extKey = process.env.EXT_TEST_API_KEY || process.env.INTERNAL_API_SECRET;
  const extUid = process.env.EXT_TEST_UID || process.env.ADMIN_DEFAULT_USER_ID || process.env.DEFAULT_EXTENSION_USER_ID;
  if (extKey && extUid) {
    const hdrs = { 'x-api-key': extKey, 'x-user-id': extUid };
    const extCols = await fetchJson('/api/chrome-extension/collections', { headers: hdrs });
    logStatus('GET /api/chrome-extension/collections', extCols);
    const extNotes = await fetchJson('/api/chrome-extension/notes', { headers: hdrs });
    logStatus('GET /api/chrome-extension/notes', extNotes);
  } else {
    console.log('ℹ️ Skipping extension checks (set EXT_TEST_API_KEY and EXT_TEST_UID to enable).');
  }

  // Auth endpoints (optional)
  const email = process.env.FIREBASE_TEST_EMAIL;
  const password = process.env.FIREBASE_TEST_PASSWORD;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  let failures = 0;

  if (email && password && apiKey) {
    try {
      const { idToken, uid } = await signInWithPassword(email, password, apiKey);
      console.log(`🔐 Authenticated test user: ${uid}`);

      const notes = await fetchJson('/api/notes', { headers: { Authorization: `Bearer ${idToken}` } });
      logStatus('GET /api/notes', notes);

      const scripts = await fetchJson('/api/scripts', { headers: { Authorization: `Bearer ${idToken}` } });
      logStatus('GET /api/scripts', scripts);

      const collections = await fetchJson('/api/collections', { headers: { 'x-user-id': uid } });
      logStatus('GET /api/collections', collections);

      failures += [viral, voices, notes, scripts, collections].filter(r => !r.ok).length;
    } catch (e) {
      console.warn('⚠️ Auth tests skipped:', e.message);
      failures += [viral, voices].filter(r => !r.ok).length;
    }
  } else {
    console.log('ℹ️ Skipping auth tests (set FIREBASE_TEST_EMAIL, FIREBASE_TEST_PASSWORD, NEXT_PUBLIC_FIREBASE_API_KEY to enable).');
    failures += [viral, voices].filter(r => !r.ok).length;
  }

  if (!diag.ok || !self.ok) failures++;
  if (failures > 0) {
    console.error(`❌ Smoke test finished with ${failures} failure(s).`);
    process.exit(1);
  }
  console.log('✅ All checks passed.');
}

main().catch((e) => { console.error(e); process.exit(1); });
