import http from 'http';
import { createApp, OPENAPI_VALIDATOR_PROMISE } from './app';
// Import shared env helpers from repo root `src/config/env`
// Note: this file lives at `apps/backend/src/server.ts`, so the correct
// relative path to root `src/config/env` is three directories up.
import { loadDotEnvFiles, validateEnv } from '../../../src/config/env';

loadDotEnvFiles();
validateEnv('backend');

const preferredPort = Number(process.env.BACKEND_PORT || process.env.PORT || 5001);
const app = createApp();

// Ensure OpenAPI validator is fully initialized before serving traffic
const validatorPromise = (app as any).locals[OPENAPI_VALIDATOR_PROMISE] as Promise<void> | undefined;
if (validatorPromise) {
  await validatorPromise.catch((err: unknown) => {
    console.error('[backend] Failed to initialize OpenAPI validator', err);
    throw err;
  });
}

const server = http.createServer(app);

function listen(port: number) {
  server.once('error', (err: any) => {
    if (err && err.code === 'EADDRINUSE' && port !== 0) {
      console.warn(`Port ${port} in use; falling back to a random open port.`);
      listen(0);
    } else {
      throw err;
    }
  });

  server.listen(port, () => {
    const addr = server.address();
    const actualPort = typeof addr === 'object' && addr ? addr.port : port;
    console.log(`Backend server listening on http://localhost:${actualPort}`);
  });
}

listen(preferredPort);
