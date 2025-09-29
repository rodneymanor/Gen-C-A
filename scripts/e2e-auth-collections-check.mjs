#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import puppeteer from 'puppeteer';
import admin from 'firebase-admin';

// Load env
['.env.local', '.env'].forEach((p) => {
  if (fs.existsSync(p)) dotenv.config({ path: p });
});

function initAdmin() {
  if (admin.apps.length) return admin.app();
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const pkEnv = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = pkEnv ? pkEnv.replace(/\\n/g, '\n') : undefined;
  if (projectId && clientEmail && privateKey) {
    return admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
  }
  const saPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
  const resolved = saPath ? (path.isAbsolute(saPath) ? saPath : path.join(process.cwd(), saPath)) : '';
  if (resolved && fs.existsSync(resolved)) {
    const json = JSON.parse(fs.readFileSync(resolved, 'utf8'));
    return admin.initializeApp({ credential: admin.credential.cert(json) });
  }
  return admin.initializeApp();
}

async function ensureTestUser() {
  initAdmin();
  const uid = `smoke_${Date.now()}`;
  const email = `smoke+${uid}@example.com`;
  try {
    await admin.auth().createUser({ uid, email, emailVerified: true, password: 'TestPass123!@#' });
  } catch (e) {
    // ignore if already exists
  }
  const customToken = await admin.auth().createCustomToken(uid);
  return { uid, email, customToken };
}

async function run() {
  const base = (process.env.DEV_URL || 'http://localhost:3000').replace(/\/$/, '');
  const { uid, email, customToken } = await ensureTestUser();
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.setDefaultTimeout(30000);

  const findings = [];
  const apiPat = /\/api\/(collections|videos|notes|scripts)/i;
  page.on('request', (req) => {
    if (!apiPat.test(req.url())) return;
    findings.push({
      type: 'request',
      url: req.url(),
      method: req.method(),
      auth: req.headers()['authorization'] || '(none)',
    });
  });
  page.on('response', async (res) => {
    if (!apiPat.test(res.url())) return;
    findings.push({
      type: 'response',
      url: res.url(),
      status: res.status(),
      servedBy: res.headers()['x-served-by'] || '(none)',
    });
  });

  try {
    // Load app and sign in with custom token inside the page using the app's Firebase client
    await page.goto(`${base}/dashboard`, { waitUntil: 'networkidle2' });
    await page.evaluate(async (token) => {
      const mod = await import('/src/config/firebase.ts');
      const { auth } = mod;
      // if already signed in, skip
      if (!auth.currentUser) {
        const { signInWithCustomToken } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');
        await signInWithCustomToken(auth, token);
      }
    }, customToken);

    // Navigate to collections and library (hooks should fire now that auth is set)
    await page.goto(`${base}/collections`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));
    await page.goto(`${base}/library`, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 1500));

    // Also trigger explicit requests with the user token to be sure
    await page.evaluate(async () => {
      const mod = await import('/src/config/firebase.ts');
      const token = await mod.auth.currentUser.getIdToken();
      await fetch('/api/collections', { headers: { Authorization: `Bearer ${token}` } });
      await fetch('/api/videos/collection', {
        method: 'POST',
        headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ collectionId: 'default', videoLimit: 5 }),
      });
    });
    await new Promise(r => setTimeout(r, 1000));

    // Reduce and print
    const by = findings.reduce((acc, e) => {
      acc[e.url] = acc[e.url] || { req: null, res: null };
      if (e.type === 'request') acc[e.url].req = e; else acc[e.url].res = e;
      return acc;
    }, {});
    const rows = Object.entries(by).map(([url, v]) => ({ url, method: v.req?.method, auth: v.req?.auth, status: v.res?.status, servedBy: v.res?.servedBy }));
    console.log('\n=== E2E Collections Auth Check ===');
    console.table(rows);
    const missingAuth = rows.filter(r => /\/api\/(collections|videos)/.test(r.url) && (!r.auth || r.auth === '(none)'));
    if (missingAuth.length) {
      console.error('Missing Authorization header on some requests');
      process.exitCode = 2;
    }
  } catch (err) {
    console.error('E2E error:', err?.message || err);
    process.exitCode = 1;
  } finally {
    await page.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

run();
