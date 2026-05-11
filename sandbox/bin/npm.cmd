@echo off
setlocal EnableExtensions

set "NODE_EXE=%LOCALAPPDATA%\OpenAI\Codex\bin\node.exe"
if not exist "%NODE_EXE%" (
  echo [sandbox-npm] node.exe was not found at %NODE_EXE%
  exit /b 1
)

if /I "%~1"=="start" (
  if exist "%CD%\node_modules\@angular\cli\bin\ng.js" (
    set "NG_CLI_ANALYTICS=false"
    set "CI=true"
    "%NODE_EXE%" "%CD%\node_modules\@angular\cli\bin\ng.js" serve --host 0.0.0.0 --port 4200
    exit /b %errorlevel%
  )
  echo [sandbox-npm] Angular CLI not found in %CD%\node_modules.
  exit /b 1
)

if /I "%~1"=="install" (
  if exist "%CD%\node_modules" (
    echo [sandbox-npm] node_modules already exists. Skipping npm install.
    exit /b 0
  )
  echo [sandbox-npm] npm install is not available in this no-install sandbox.
  echo [sandbox-npm] Restore/copy frontend\node_modules or use Docker build mode.
  exit /b 1
)

echo [sandbox-npm] This lightweight npm shim supports only: npm start
echo [sandbox-npm] Original args: %*
exit /b 1
