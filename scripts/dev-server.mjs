#!/usr/bin/env node

import { existsSync } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import process from 'process';

const envCandidates = ['.env.local', '.env'];
const child = spawn('concurrently', ['-k', 'npm:backend:dev', 'vite'], {
  stdio: 'inherit',
  env: process.env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on('error', (error) => {
  console.error('[dev-server] Failed to start dev server:', error);
  process.exit(1);
});
