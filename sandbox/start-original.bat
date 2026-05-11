@echo off
setlocal
title MedLab Sandbox Environment -> start-all.bat

echo.
echo  ============================================================
echo   MedLab Sandbox Environment for original start-all.bat
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

echo.
echo  Sandbox commands are active for this run:
echo    mvn   -> prebuilt backend jars
echo    mysql -> Docker MySQL client/container
echo    npm   -> existing Angular node_modules
echo.

call "%~dp0..\start-all.bat"
exit /b %errorlevel%
