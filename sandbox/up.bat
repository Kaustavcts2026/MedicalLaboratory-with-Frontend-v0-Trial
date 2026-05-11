@echo off
echo === MedLab Docker Sandbox ===
echo.

docker compose -f sandbox\docker-compose.yml %*
