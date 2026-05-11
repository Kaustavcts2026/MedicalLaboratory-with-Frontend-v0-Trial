@echo off
:: ============================================================
::  MedLab Debug / Full Test  --  debug.bat
::
::  Steps:
::    1. Start all 10 backend microservices (via start-all.ps1)
::    2. (Optional) Launch Angular frontend in its own window
::       -- non-blocking; the 120 s wait below covers startup
::    3. Wait up to 120 s for everything to be ready
::       (press ENTER at any time to skip the wait)
::    4. Run the full automated test suite (test-all.ps1)
::       -- backend: Sections 6-9, ISC, EDGE, GW
::       -- frontend: S.FE (auto-skipped if port 4200 is down)
::
::  Usage:
::    debug.bat                   (MySQL root/root)
::    debug.bat myuser mypassword (custom MySQL credentials)
:: ============================================================

setlocal

set "DB_USER=root"
set "DB_PASS=root"

if not "%~1"=="" set "DB_USER=%~1"
if not "%~2"=="" set "DB_PASS=%~2"

echo.
echo  ============================================================
echo   MedLab Debug Runner
echo  ============================================================
echo.

:: -- FRONTEND PROMPT --
:: Resolve the frontend path NOW (outside any if-block) so %~dp0 always expands correctly.
set "FRONTEND_DIR=%~dp0frontend"

set "START_FE=y"
set /p START_FE="  Also start Angular frontend (port 4200)? (Y/n): "
echo.

:: -- STEP 1: Start backend services --
echo  ============================================================
echo   Step 1: Starting all 10 backend microservices
echo  ============================================================
echo.

:: start-all.ps1 launches each service in its own CMD window and returns
:: immediately -- it does NOT wait for Angular here so this stays fast.
powershell.exe ^
    -NoLogo ^
    -ExecutionPolicy Bypass ^
    -File "%~dp0start-all.ps1" ^
    -DbUser "%DB_USER%" ^
    -DbPassword "%DB_PASS%"

:: -- STEP 2 (optional): Launch Angular in its own window --
if /i "%START_FE%"=="y" (
    echo.
    echo  ============================================================
    echo   Step 2: Launching Angular frontend in background window
    echo   It will be ready in ~30-60 s. The wait below covers it.
    echo  ============================================================
    echo.

    :: Use PowerShell Start-Process to launch Angular.
    :: This is 100% reliable for setting the working directory -- no CMD start/d quirks.
    echo   Frontend dir: %FRONTEND_DIR%
    powershell.exe -NoLogo -ExecutionPolicy Bypass -Command "Start-Process -FilePath 'cmd.exe' -ArgumentList '/k','npm start' -WorkingDirectory '%FRONTEND_DIR%'"

    echo   Angular window opened. It will appear in the taskbar.
    echo.
) else (
    echo.
    echo   Angular frontend skipped.
    echo   S.FE tests in test-all.ps1 will be auto-skipped ^(port 4200 not open^).
    echo.
)

:: -- STEP 3: Wait for everything to settle --
echo  ============================================================
echo   Step 3: Waiting for services to be ready (backend + frontend)
echo   Press ENTER to skip, or auto-continues after 120 s
echo  ============================================================
echo.

powershell.exe -NoLogo -ExecutionPolicy Bypass -Command ^
    "$max = 120;" ^
    "$sw  = [System.Diagnostics.Stopwatch]::StartNew();" ^
    "Write-Host '  Press ENTER to skip, or wait 120 s...' -ForegroundColor Yellow;" ^
    "while ($sw.Elapsed.TotalSeconds -lt $max) {" ^
        "$remaining = $max - [int]$sw.Elapsed.TotalSeconds;" ^
        "Write-Host (\"`r  Continuing in $remaining s...   \") -NoNewline -ForegroundColor DarkGray;" ^
        "if ([Console]::KeyAvailable) {" ^
            "$k = [Console]::ReadKey($true);" ^
            "if ($k.Key -eq 'Enter') { break }" ^
        "}" ^
        "Start-Sleep -Milliseconds 300;" ^
    "}" ^
    "Write-Host '' ; Write-Host '  Proceeding.' -ForegroundColor Green"

:: -- STEP 4: Run full test suite --
echo.
echo  ============================================================
echo   Step 4: Running full automated test suite
echo.
echo   Backend  : Sections 6-9  +  ISC  +  EDGE  +  GW
if /i "%START_FE%"=="y" (
echo   Frontend : S.FE  (Angular dev server on port 4200)
echo   Browser  : S.E2E (Playwright - login, UI, RBAC, visual checks^)
echo              NOTE: First run downloads Chromium ~180 MB
) else (
echo   Frontend : S.FE  --- SKIPPED (frontend not started^)
echo   Browser  : S.E2E -- SKIPPED (frontend not started^)
)
echo  ============================================================
echo.

powershell.exe ^
    -NoLogo ^
    -ExecutionPolicy Bypass ^
    -NoExit ^
    -File "%~dp0test-all.ps1" ^
    -DbUser "%DB_USER%" ^
    -DbPassword "%DB_PASS%"

endlocal
