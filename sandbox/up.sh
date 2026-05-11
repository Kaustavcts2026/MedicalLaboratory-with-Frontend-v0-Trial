#!/bin/bash
set -e

echo "=== MedLab Docker Sandbox ==="
docker compose -f sandbox/docker-compose.yml "$@"
