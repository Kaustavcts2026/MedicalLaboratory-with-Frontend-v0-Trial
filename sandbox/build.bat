@echo off
echo === MedLab Backend Build ===
echo Building all microservices (Java 21 + Maven)...
echo This takes 5-15 minutes on first run.
echo.

docker build -t medlab-backend -f sandbox\Dockerfile.backend .

echo.
echo Build complete!
echo.
echo Now run: docker compose -f sandbox\docker-compose.yml up -d
pause
