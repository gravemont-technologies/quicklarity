#!/bin/bash
# One-command startup script for Strategic Clarity Engine

echo "🚀 Starting Strategic Clarity Engine..."
echo ""

# Run preflight check
echo "📋 Running preflight checks..."
node preflight-check.js

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Preflight checks failed. Fix errors above."
    exit 1
fi

echo ""
echo "✅ Preflight checks passed!"
echo ""
echo "Starting services..."
echo ""

# Start backend in background
echo "🔧 Starting Backend API..."
npm run start &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 3

# Start worker in background
echo "⚙️  Starting Worker..."
npm run worker &
WORKER_PID=$!

# Wait a moment for worker to start
sleep 2

# Start frontend
echo "🎨 Starting Frontend..."
cd frontend && npm run dev

# Cleanup on exit
trap "kill $BACKEND_PID $WORKER_PID" EXIT

