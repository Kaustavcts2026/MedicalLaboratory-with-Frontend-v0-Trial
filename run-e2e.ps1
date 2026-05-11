# This file has moved to testing/run-e2e.ps1 -- you can delete this file.
Write-Host "run-e2e.ps1 has moved to testing\run-e2e.ps1" -ForegroundColor Yellow
& (Join-Path $PSScriptRoot "testing\run-e2e.ps1") @args
