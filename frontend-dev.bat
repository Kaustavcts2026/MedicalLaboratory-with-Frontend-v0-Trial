@echo off
title MedLab — Angular Frontend Dev Utility
color 0D

echo.
echo  ============================================================
echo   MedLab Angular Frontend — Developer Utility
echo  ============================================================
echo.
echo  Tip: You can also pass an action directly:
echo    frontend-dev.bat serve
echo    frontend-dev.bat build
echo    frontend-dev.bat install
echo    frontend-dev.bat test
echo    frontend-dev.bat lint
echo    frontend-dev.bat stop
echo.

where powershell >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] PowerShell not found. Please install PowerShell 5+ and retry.
    pause
    exit /b 1
)

if not "%~1"=="" (
    :: Non-interactive: action passed as argument
    powershell.exe -NoLogo -ExecutionPolicy Bypass -NoExit ^
        -File "%~dp0frontend-dev.ps1" -Action "%~1"
) else (
    :: Interactive menu
    powershell.exe -NoLogo -ExecutionPolicy Bypass -NoExit ^
        -File "%~dp0frontend-dev.ps1"
)

exit /b %errorlevel%
