#!/bin/bash

echo "🔄 Restarting Development Server..."

# Kill any existing NPM/Next.js development servers
echo "🔪 Killing existing servers..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "node.*next" 2>/dev/null || true

# Wait for processes to fully terminate
echo "⏳ Waiting for processes to terminate..."
sleep 3

# Clear any potential port conflicts
echo "🧹 Clearing ports 3000-3004 & 5000-5004..."
lsof -ti:3000,3001,3002,3003,3004,5000,5001,5002,5003,5004 | xargs kill -9 2>/dev/null || true

# Wait a bit more to ensure ports are freed
sleep 2

# Start fresh development server
echo "🚀 Starting fresh development server..."
npm run dev 
