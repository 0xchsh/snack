#!/bin/bash

# Kill any existing Next.js processes
pkill -f "next dev" || true

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

echo "Starting development server with Docker (Node.js 20 LTS)..."
docker-compose -f docker-compose.dev.yml up --build