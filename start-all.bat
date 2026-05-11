@echo off
title MedLab — Starting All Services
color 0B

echo.
echo  ============================================================
echo   MedLab — Full Auto-Startup  (backend + optional frontend)
echo  ============================================================
echo.
echo  This will:
echo    1. Create MySQL databases if missing
echo    2. Set environment variables (auth, patient, notification)
echo    3. Start all 10 backend services in sequence
echo    4. Optionally start the Angular frontend (port 4200)
echo.

:: ── CONFIGURABLE ─────────────────────────────────────────────────────────────
set MEDLAB_DB_USER=root
set MEDLAB_DB_PASSWORD=root
set MEDLAB_DB_HOST=localhost
set MEDLAB_DB_PORT=3306

:: ── FRONTEND PROMPT ───────────────────────────────────────────────────────────
set FRONTEND_FLAG=
set /p START_FE="  Also start Angular frontend? (y/N): "
if /i "%START_FE%"=="y" set FRONTEND_FLAG=-StartFrontend

:: ── CHECK POWERSHELL ─────────────────────────────────────────────────────────
where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PowerShell not found. Please install PowerShell 5+ and retry.
    pause
    exit /b 1
)

:: ── RUN THE PS1 SCRIPT ───────────────────────────────────────────────────────
powershell.exe -NoLogo -ExecutionPolicy Bypass -NoExit -File "%~dp0start-all.ps1" ^
    -DbUser "%MEDLAB_DB_USER%" ^
    -DbPassword "%MEDLAB_DB_PASSWORD%" ^
    -DbHost "%MEDLAB_DB_HOST%" ^
    -DbPort "%MEDLAB_DB_PORT%" ^
    %FRONTEND_FLAG%

exit /b %errorlevel%
