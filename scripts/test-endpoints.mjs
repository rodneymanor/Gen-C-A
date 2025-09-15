#!/usr/bin/env node

// Local endpoint smoke tests without running the server.
// Uses in-memory req/res mocks and JSON fallbacks implemented in handlers.

import path from 'path';
import { fileURLToPath } from 'url';

process.env.API_KEY = process.env.API_KEY || 'testkey_123';
process.env.FORCE_JSON_FALLBACK = '1';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
process.chdir(path.join(__dirname, '..'));

// Import handlers
const {
  handleCECollectionsGet,
  handleCECollectionsPost,
  handleCECollectionsAddVideo,
  handleCENotesGet,
  handleCENotesPost,
  handleContentInboxPost,
  handleIdeaInboxTextPost,
  handleIdeaInboxVideoPost,
} = await import('../src/api-routes/chrome-extension.js');

const { handleCreateNote } = await import('../src/api-routes/notes.js');

function mockReq({ method = 'GET', url = '/', headers = {}, body = null, query = {} } = {}) {
  return { method, url, headers, body, query };
}

function mockRes() {
  const res = { statusCode: 200 };
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res._done && res._done({ status: res.statusCode, data });
  };
  return new Promise((resolve) => {
    res._done = resolve;
  }).then((result) => result);
}

async function run(name, handler, reqInit) {
  const req = mockReq(reqInit);
  const resP = mockRes();
  const resObj = await resP; // race safety
  // invoke handler after setting resolver
  await handler(req, {
    status: (c) => ({ json: (d) => resObj._done({ status: c, data: d }) }),
    json: (d) => resObj._done({ status: 200, data: d }),
    setHeader() {},
  }).catch((e) => resObj._done({ status: 500, data: { error: e?.message || String(e) } }));
}

// Simpler handler runner compatible with our mockRes above
async function call(handler, reqInit) {
  const req = mockReq(reqInit);
  let resolve;
  const done = new Promise((r) => (resolve = r));
  const res = {
    _payload: null,
    statusCode: 200,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      resolve({ status: this.statusCode, data });
    },
    setHeader() {},
  };
  await handler(req, res);
  return done;
}

async function main() {
  const uid = process.argv[2] || 'xfPvnnUdJCRIJEVrpJCmR7kXBOX2';
  const ig = process.argv[3] || 'https://www.instagram.com/reel/DOUsKxUDWA2/';
  const tt = process.argv[4] || 'https://www.tiktok.com/@aronsogi/video/7497999929667849494';
  const authHeaders = { 'x-api-key': process.env.API_KEY, 'x-user-id': uid };

  const outputs = {};

  // 1) Create collection
  outputs.createCollection = await call(handleCECollectionsPost, {
    method: 'POST',
    url: '/api/chrome-extension/collections',
    headers: authHeaders,
    body: { userId: uid, title: 'Test Collection', description: '' },
  });

  // 2) List collections
  outputs.listCollections = await call(handleCECollectionsGet, {
    method: 'GET',
    url: '/api/chrome-extension/collections',
    headers: authHeaders,
    query: { userId: uid },
  });

  // 3) Add Instagram video
  outputs.addIG = await call(handleCECollectionsAddVideo, {
    method: 'POST',
    url: '/api/chrome-extension/collections/add-video',
    headers: authHeaders,
    body: { videoUrl: ig, collectionTitle: 'Test Collection', title: 'IG Video' },
  });

  // 4) Add TikTok video
  outputs.addTT = await call(handleCECollectionsAddVideo, {
    method: 'POST',
    url: '/api/chrome-extension/collections/add-video',
    headers: authHeaders,
    body: { videoUrl: tt, collectionTitle: 'Test Collection', title: 'TikTok Video' },
  });

  // 5) Content Inbox item
  outputs.contentInbox = await call(handleContentInboxPost, {
    method: 'POST',
    url: '/api/content-inbox/items',
    headers: authHeaders,
    body: { url: ig, platform: 'instagram', category: 'inspiration', tags: ['clip'] },
  });

  // 6) Idea Inbox text
  outputs.ideaText = await call(handleIdeaInboxTextPost, {
    method: 'POST',
    url: '/api/chrome-extension/idea-inbox/text',
    headers: authHeaders,
    body: { title: 'Idea', content: 'A thought saved from extension' },
  });

  // 7) Idea Inbox video
  outputs.ideaVideo = await call(handleIdeaInboxVideoPost, {
    method: 'POST',
    url: '/api/chrome-extension/idea-inbox/video',
    headers: authHeaders,
    body: { url: ig },
  });

  // 8) Chrome Extension note create
  outputs.ceNoteCreate = await call(handleCENotesPost, {
    method: 'POST',
    url: '/api/chrome-extension/notes',
    headers: authHeaders,
    body: { title: 'CE Note', content: 'Saved from test' },
  });

  // 9) Chrome Extension notes list
  outputs.ceNotesList = await call(handleCENotesGet, {
    method: 'GET',
    url: '/api/chrome-extension/notes',
    headers: authHeaders,
    query: {},
  });

  // 10) Core notes (iOS Shortcut compatible)
  outputs.coreNoteCreate = await call(handleCreateNote, {
    method: 'POST',
    url: '/api/notes',
    headers: { ...authHeaders },
    body: { title: 'Shortcut Note', content: 'Created via test' },
  });

  console.log(JSON.stringify(outputs, null, 2));
}

main().catch((e) => {
  console.error('Test failed:', e);
  process.exit(1);
});
