#!/usr/bin/env node

import { existsSync } from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import process from 'process';

const envCandidates = ['.env.local', '.env'];
const nodeArgs = [];

for (const candidate of envCandidates) {
  const absPath = path.resolve(process.cwd(), candidate);
  if (existsSync(absPath)) {
    nodeArgs.push(`--env-file=${absPath}`);
  } else {
    console.warn(`[dev-server] Skipping missing env file ${candidate}`);
  }
}

const [nodeMajor, nodeMinor] = process.versions.node
  .split('.')
  .map((part) => Number.parseInt(part, 10));

if (Number.isFinite(nodeMajor) && Number.isFinite(nodeMinor) && (nodeMajor > 20 || (nodeMajor === 20 && nodeMinor >= 6))) {
  nodeArgs.push('--import', 'tsx');
} else {
  nodeArgs.push('--loader', 'tsx');
}

nodeArgs.push('server-vite.js');

const child = spawn(process.execPath, nodeArgs, {
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
