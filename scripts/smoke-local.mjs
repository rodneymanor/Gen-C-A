#!/usr/bin/env node

const backend = process.env.BACKEND_URL || 'http://localhost:5001';
const dev = 'http://localhost:4000';

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
  allOk &&= await check('backend', `${backend.replace(/\/$/, '')}/health`);
  allOk &&= await check('dev-server', `${dev}/api/health`);
  process.exit(allOk ? 0 : 1);
}

main();
