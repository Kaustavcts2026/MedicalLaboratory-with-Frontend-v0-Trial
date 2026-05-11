@echo off
setlocal EnableExtensions

set "SHIM=%~dp0mysql-shim.ps1"
powershell.exe -NoLogo -ExecutionPolicy Bypass -File "%SHIM%" %*
exit /b %errorlevel%
