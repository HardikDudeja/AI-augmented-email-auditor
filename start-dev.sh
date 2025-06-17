#!/bin/sh

# Set -e option to exit immediately if a command exits with a non-zero status.
# This is good practice but be careful if you want one service to stay up even if another fails.
set -e

echo "Starting Email Auditor Development Environment..."

# Start the backend server in the background
# It runs the compiled JavaScript from the 'dist' directory.
echo "Starting backend server (node /app/backend/dist/index.js)..."
node /app/BE/dist/index.js & # The '&' runs it in the background

# Start the frontend development server
# This command usually keeps the process in the foreground.
echo "Starting frontend development server (npm run dev)..."
cd /app/FE && npm run dev

# Keep the script running (optional if npm run dev keeps it alive, but robust)
# If npm run dev exits, the container will exit.
wait # Wait for all background jobs to finish (i.e., the backend)