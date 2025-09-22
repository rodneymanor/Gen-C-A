import * as dotenv from 'dotenv';

import { createApp } from './app';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const port = Number(process.env.BACKEND_PORT || process.env.PORT || 5001);
const app = createApp();

app.listen(port, () => {
  console.log(`Backend server listening on http://localhost:${port}`);
});
