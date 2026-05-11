@echo off
setlocal
title MedLab Sandbox Environment -> debug.bat

echo.
echo  ============================================================
echo   MedLab Sandbox Environment for original debug.bat
echo  ============================================================
echo.
echo  Starting Docker MySQL on localhost:3306...

docker compose -f "%~dp0docker-compose-original.yml" up -d mysql
if errorlevel 1 (
  echo.
  echo [ERROR] Could not start Docker MySQL. Is Docker Desktop running?
  pause
  exit /b 1
)

set "PATH=%~dp0bin;%PATH%"
set "NG_CLI_ANALYTICS=false"
set "CI=true"

call "%~dp0..\debug.bat" %*
exit /b %errorlevel%
