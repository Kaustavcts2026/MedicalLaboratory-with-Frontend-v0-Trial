#!/bin/bash
echo "=== MedLab Dev Container ==="
docker compose -f sandbox/docker-compose-dev.yml up -d --build
docker compose -f sandbox/docker-compose-dev.yml exec dev bash
