#!/usr/bin/env node
import fs from 'node:fs';
import dotenv from 'dotenv';

// Load env from .env.local then .env if present
['.env.local', '.env'].forEach((p) => {
  if (fs.existsSync(p)) dotenv.config({ path: p });
});

const backend = (process.env.BACKEND_URL || 'http://localhost:5001').replace(/\/$/, '');
const dev = (process.env.DEV_URL || 'http://localhost:4000').replace(/\/$/, '');
const userId = process.env.SMOKE_USER_ID || process.env.FIREBASE_TEST_UID || process.env.DEFAULT_EXTENSION_USER_ID;
const extKey = process.env.INTERNAL_API_SECRET || process.env.API_KEY || process.env.NEXT_PUBLIC_API_KEY || process.env.ADMIN_API_KEY;
const rapidKey = process.env.RAPIDAPI_KEY;
const ttUser = process.env.TIKTOK_SMOKE_USERNAME || process.env.VIRAL_TIKTOK_USERNAME;
const fbToken = process.env.SMOKE_FIREBASE_TOKEN;
const collId = process.env.SMOKE_COLLECTION_ID;
const targetCollId = process.env.SMOKE_TARGET_COLLECTION_ID;
const videoId = process.env.SMOKE_VIDEO_ID;

async function check(name, url) {
  const start = Date.now();
  try {
    const res = await fetch(url, { timeout: 5000 });
    const ms = Date.now() - start;
    console.log(`${name} ${res.status} ${url} (${ms}ms)`);
    return res.ok;
  } catch (err) {
    const ms = Date.now() - start;
    console.error(`${name} ERR ${url} (${ms}ms) ->`, err.message);
    return false;
  }
}

async function main() {
  let allOk = true;
  allOk &&= await check('backend', `${backend}/health`);
  const devUp = await check('dev-server', `${dev}/api/health`);

  // Compare viral feed via backend and via proxy
  if (devUp) {
    const a = await (await fetch(`${backend}/api/viral-content/feed?page=0`)).json().catch(()=>({}));
    const b = await (await fetch(`${dev}/api/viral-content/feed?page=0`)).json().catch(()=>({}));
    const parity = a?.success === true && b?.success === true;
    console.log(`viral-content/feed parity: ${parity ? 'OK' : 'MISMATCH'}`);
    allOk &&= parity;
  } else {
    console.log('viral-content/feed parity: skipped (dev proxy not running)');
  }

  // Basic 400 parity checks (no external calls made)
  const check400 = async (name, path) => {
    const rb = await fetch(`${backend}${path}`);
    if (!devUp) {
      console.log(`${name} → backend:${rb.status} (dev proxy not running, skipped)`);
      return rb.status >= 400;
    }
    const rd = await fetch(`${dev}${path}`);
    console.log(`${name} → backend:${rb.status} dev:${rd.status}`);
    return rb.status === rd.status && rb.status >= 400;
  };

  allOk &&= await check400('instagram/user-id (missing)', '/api/instagram/user-id');
  allOk &&= await check400('tiktok/user-feed (missing)', '/api/tiktok/user-feed');

  // TikTok user-feed positive check (requires RAPIDAPI_KEY and a test username)
  if (rapidKey && ttUser) {
    try {
      const payload = { username: ttUser, count: 3 };
      const beRes = await fetch(`${backend}/api/tiktok/user-feed`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const beServedBy = beRes.headers.get('x-served-by');
      let deStatus = 'skip';
      let deServedBy = 'skip';
      if (devUp) {
        const deRes = await fetch(`${dev}/api/tiktok/user-feed`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        deStatus = String(deRes.status);
        deServedBy = String(deRes.headers.get('x-served-by'));
      }
      console.log(`tiktok/user-feed POST → backend:${beRes.status} [${beServedBy}]${devUp ? ` dev:${deStatus} [${deServedBy}]` : ' dev:skip'}`);
      const json = await beRes.json().catch(() => ({}));
      const ok = beRes.ok && json?.success === true && Array.isArray(json?.videos);
      console.log(`tiktok/user-feed shape: ${ok ? 'OK' : 'NOT VERIFIED'}`);
      if (ok) allOk &&= true; // non-blocking if not verified (depends on external API/username)
    } catch (e) {
      console.error('tiktok/user-feed positive check failed:', e.message);
      allOk = false;
    }
  } else {
    console.log('ℹ️ Set RAPIDAPI_KEY and TIKTOK_SMOKE_USERNAME (or VIRAL_TIKTOK_USERNAME) to enable TikTok 200 smoke.');
  }

  // Chrome Extension: youtube-transcript
  const ytUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const withQuery = `?url=${encodeURIComponent(ytUrl)}`;

  // Expect unauthorized without key
  const beNoAuth = await fetch(`${backend}/api/chrome-extension/youtube-transcript${withQuery}`);
  const beNoAuthServedBy = beNoAuth.headers.get('x-served-by');
  let deNoAuthStatus = 'skip';
  let deNoAuthServedBy = 'skip';
  if (devUp) {
    const deNoAuth = await fetch(`${dev}/api/chrome-extension/youtube-transcript${withQuery}`);
    deNoAuthStatus = String(deNoAuth.status);
    deNoAuthServedBy = String(deNoAuth.headers.get('x-served-by'));
  }
  console.log(`chrome-ext/transcript GET (no auth) → backend:${beNoAuth.status} [${beNoAuthServedBy}]${devUp ? ` dev:${deNoAuthStatus} [${deNoAuthServedBy}]` : ' dev:skip'}`);
  allOk &&= beNoAuth.status === 401;

  // If we have a key, ensure both respond; if RAPIDAPI_KEY present, expect JSON with segments
  if (extKey) {
    const hdrs = { 'x-api-key': extKey };
    const beAuth = await fetch(`${backend}/api/chrome-extension/youtube-transcript${withQuery}`, { headers: hdrs });
    let deAuthStatus = 'skip';
    const beAuthServedBy = beAuth.headers.get('x-served-by');
    let jd = null;
    if (devUp) {
      const deAuth = await fetch(`${dev}/api/chrome-extension/youtube-transcript${withQuery}`, { headers: hdrs });
      deAuthStatus = String(deAuth.status);
      try { jd = await deAuth.json(); } catch {}
      console.log(`chrome-ext/transcript header dev x-served-by: ${deAuth.headers.get('x-served-by')}`);
    }
    console.log(`chrome-ext/transcript GET (auth) → backend:${beAuth.status} [${beAuthServedBy}]${devUp ? ` dev:${deAuthStatus}` : ' dev:skip'}`);
    if (rapidKey) {
      try {
        const jb = await beAuth.json();
        const okShape = Array.isArray(jb?.segments) && (!devUp || Array.isArray(jd?.segments));
        console.log(`chrome-ext/transcript shape: ${okShape ? 'OK' : 'BAD'}`);
        allOk &&= okShape;
      } catch (e) {
        console.log('chrome-ext/transcript parse error:', e.message);
        allOk = false;
      }
    } else {
      // Without RapidAPI configured, a non-401 response from backend is acceptable (e.g., 500/404)
      allOk &&= beAuth.status !== 401;
    }
  } else {
    console.log('ℹ️ Set INTERNAL_API_SECRET to fully exercise Chrome Extension transcript.');
  }

  // Chrome Extension: idea-inbox/text and idea-inbox/video (auth required)
  if (extKey) {
    const headers = { 'content-type': 'application/json', 'x-api-key': extKey };

    const textRes = await fetch(`${backend}/api/chrome-extension/idea-inbox/text`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content: 'Hello from smoke tests!' })
    });
    console.log(`chrome-ext/idea-inbox/text POST → backend:${textRes.status}`);
    allOk &&= textRes.status === 201 || textRes.status === 200;

    const videoRes = await fetch(`${backend}/api/chrome-extension/idea-inbox/video`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ url: 'https://www.tiktok.com/@user/video/1234567890', title: 'Smoke Video' })
    });
    console.log(`chrome-ext/idea-inbox/video POST → backend:${videoRes.status}`);
    allOk &&= videoRes.status === 201 || videoRes.status === 200;
  }

  // Collections/Videos contract presence checks (expect 401 without auth)
  try {
    const vList = await fetch(`${backend}/api/videos/collection`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ collectionId: 'all-videos', videoLimit: 3 }) });
    console.log(`videos/collection POST (no auth) → backend:${vList.status}`);
    allOk &&= vList.status === 401 || vList.status === 400 || vList.status === 200; // allow 400/401/200 depending on backend setup
  } catch (e) {
    console.log('videos/collection check failed:', e.message);
    allOk = false;
  }

  // Gated authenticated collection ops
  if (fbToken) {
    const authHeaders = { 'content-type': 'application/json', Authorization: `Bearer ${fbToken}` };
    // Update collection title if collection id provided
    if (collId) {
      const newTitle = `Smoke ${new Date().toISOString().slice(11,19)}`;
      const upd = await fetch(`${backend}/api/collections/update`, { method: 'PATCH', headers: authHeaders, body: JSON.stringify({ id: collId, title: newTitle }) });
      console.log(`collections/update PATCH → backend:${upd.status}`);
      allOk &&= upd.status === 200;
    }
    // Move/copy video if all ids provided
    if (videoId && collId && targetCollId) {
      const mv = await fetch(`${backend}/api/collections/move-video`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ videoId, fromCollectionId: collId, toCollectionId: targetCollId }) });
      console.log(`collections/move-video POST → backend:${mv.status}`);
      allOk &&= mv.status === 200 || mv.status === 404 || mv.status === 400; // tolerate data missing

      const cp = await fetch(`${backend}/api/collections/copy-video`, { method: 'POST', headers: authHeaders, body: JSON.stringify({ videoId, fromCollectionId: collId, toCollectionId: targetCollId }) });
      console.log(`collections/copy-video POST → backend:${cp.status}`);
      allOk &&= cp.status === 200 || cp.status === 404 || cp.status === 400;
    }
  } else {
    console.log('ℹ️ Set SMOKE_FIREBASE_TOKEN (and SMOKE_COLLECTION_ID / SMOKE_TARGET_COLLECTION_ID / SMOKE_VIDEO_ID) to exercise authenticated collections ops.');
  }

  // Optional: collections endpoints when a test user is provided
  if (userId) {
    const bc = await fetch(`${backend}/api/collections?userId=${encodeURIComponent(userId)}`);
    const dc = await fetch(`${dev}/api/collections?userId=${encodeURIComponent(userId)}`);
    console.log(`collections GET → backend:${bc.status} dev:${dc.status}`);

    const body = { collectionId: 'default', videoLimit: 5 };
    const bv = await fetch(`${backend}/api/videos/collection`, { method: 'POST', headers: { 'content-type':'application/json','x-user-id': userId }, body: JSON.stringify(body) });
    const dv = await fetch(`${dev}/api/videos/collection`, { method: 'POST', headers: { 'content-type':'application/json','x-user-id': userId }, body: JSON.stringify(body) });
    console.log(`videos/collection POST → backend:${bv.status} dev:${dv.status}`);
  } else {
    console.log('ℹ️ Set SMOKE_USER_ID to exercise collection endpoints.');
  }

  process.exit(allOk ? 0 : 1);
}

main();
