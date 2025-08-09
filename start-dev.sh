#!/bin/bash

# Kill any existing Next.js processes
pkill -f "next dev" || true

# Set up fnm and use Node.js 20
export PATH="/opt/homebrew/opt/fnm/bin:$PATH"
eval "$(fnm env)"
fnm use 20 2>/dev/null || fnm install 20 && fnm use 20

echo "Using Node.js version: $(node --version)"

# Start the dev server
npm run dev