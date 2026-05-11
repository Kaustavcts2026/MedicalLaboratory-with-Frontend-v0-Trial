@echo off
echo === MedLab Dev Container ===
echo Starting container with Maven, Node.js, MySQL...
echo.

docker compose -f sandbox\docker-compose-dev.yml up -d --build
docker compose -f sandbox\docker-compose-dev.yml exec dev bash
