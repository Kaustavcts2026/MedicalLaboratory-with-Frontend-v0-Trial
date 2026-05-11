#!/bin/bash
set -e

echo "=== MedLab Backend Build ==="
echo "Building all microservices (Java 21 + Maven)..."
echo "This may take 5-15 minutes on first run."

docker build -t medlab-backend -f sandbox/Dockerfile.backend .

echo ""
echo "Build complete!"
echo ""
echo "Now run: docker compose -f sandbox/docker-compose.yml up -d"
