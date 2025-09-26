#!/usr/bin/env node

const backend = (process.env.BACKEND_URL || 'http://localhost:5001').replace(/\/$/, '');
const dev = (process.env.DEV_URL || 'http://localhost:4000').replace(/\/$/, '');
const userId = process.env.SMOKE_USER_ID || process.env.FIREBASE_TEST_UID || process.env.DEFAULT_EXTENSION_USER_ID;

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
  allOk &&= await check('dev-server', `${dev}/api/health`);

  // Compare viral feed via backend and via proxy
  const a = await (await fetch(`${backend}/api/viral-content/feed?page=0`)).json().catch(()=>({}));
  const b = await (await fetch(`${dev}/api/viral-content/feed?page=0`)).json().catch(()=>({}));
  const parity = a?.success === true && b?.success === true;
  console.log(`viral-content/feed parity: ${parity ? 'OK' : 'MISMATCH'}`);
  allOk &&= parity;

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
