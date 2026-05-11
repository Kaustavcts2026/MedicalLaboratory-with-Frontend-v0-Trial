@echo off
setlocal
title MedLab Sandbox Environment -> stop-all.bat

set "PATH=%~dp0bin;%PATH%"

call "%~dp0..\stop-all.bat"

echo.
echo  Stopping sandbox Docker MySQL...
docker compose -f "%~dp0docker-compose-original.yml" stop mysql

exit /b %errorlevel%
