#!/bin/bash
set -euo pipefail

echo "🔄 Restarting Development Servers..."

# --- Kill running dev processes ---
echo "🔪 Killing existing dev processes (concurrently/vite/tsx)..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "concurrently -k" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
pkill -f "tsx apps/backend/src/server.ts" 2>/dev/null || true
pkill -f "backend:dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "node.*next" 2>/dev/null || true

# Kill by saved PIDs if present
for pidfile in /tmp/backend.pid /tmp/vite.pid; do
  if [ -f "$pidfile" ]; then
    pid=$(cat "$pidfile" 2>/dev/null || echo "")
    if [ -n "$pid" ]; then
      kill -9 "$pid" 2>/dev/null || true
    fi
    rm -f "$pidfile" || true
  fi
done

# --- Clear port conflicts ---
echo "🧹 Clearing ports 3000-3004, 4000 & 5000-5004..."
if command -v lsof >/dev/null 2>&1; then
  lsof -ti:3000,3001,3002,3003,3004,4000,5000,5001,5002,5003,5004 | xargs kill -9 2>/dev/null || true
else
  echo "⚠️ lsof not found; relying on pkill patterns only."
fi

sleep 1

# --- Start fresh dev servers ---
echo "🚀 Starting dev servers (backend + Vite)..."
npm run dev
