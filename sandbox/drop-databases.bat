@echo off
setlocal
title MedLab Sandbox - Drop Databases

echo.
echo  ============================================================
echo   DROP ALL MEDLAB DATABASES - SANDBOX MYSQL ONLY
echo  ============================================================
echo.
echo  This deletes all tables and data from the Docker MySQL used by
echo  sandbox\start-original.bat.
echo.
echo  Databases:
echo    auth_db, patient_db, inventory_db, billing,
echo    medlab, lab_processing, notification_db
echo.
set /p CONFIRM="Type DROP to continue: "
if /I not "%CONFIRM%"=="DROP" (
  echo Cancelled.
  exit /b 0
)

docker compose -f "%~dp0docker-compose-original.yml" up -d mysql
if errorlevel 1 (
  echo [ERROR] Could not start sandbox MySQL. Is Docker Desktop running?
  pause
  exit /b 1
)

docker compose -f "%~dp0docker-compose-original.yml" exec -T mysql mysql --protocol=TCP -hlocalhost -uroot -proot -e "DROP DATABASE IF EXISTS auth_db; DROP DATABASE IF EXISTS patient_db; DROP DATABASE IF EXISTS inventory_db; DROP DATABASE IF EXISTS billing; DROP DATABASE IF EXISTS medlab; DROP DATABASE IF EXISTS lab_processing; DROP DATABASE IF EXISTS notification_db;"

if errorlevel 1 (
  echo.
  echo [ERROR] Database reset failed.
  pause
  exit /b 1
)

echo.
echo Databases dropped. The next sandbox startup will recreate them.
pause
