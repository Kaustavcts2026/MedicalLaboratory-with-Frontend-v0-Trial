@echo off
setlocal EnableExtensions

set "CODEX_NODE=%LOCALAPPDATA%\OpenAI\Codex\bin\node.exe"
if exist "%CODEX_NODE%" (
  "%CODEX_NODE%" %*
  exit /b %errorlevel%
)

echo [sandbox-node] node.exe was not found at %CODEX_NODE%
echo [sandbox-node] Start this from Codex, or place portable Node in sandbox\tools\node.
exit /b 1
