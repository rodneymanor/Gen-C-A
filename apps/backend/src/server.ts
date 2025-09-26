import { createApp } from './app';
import { loadDotEnvFiles, validateEnv } from '../../src/config/env';

loadDotEnvFiles();
validateEnv('backend');

const port = Number(process.env.BACKEND_PORT || process.env.PORT || 5001);
const app = createApp();

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
