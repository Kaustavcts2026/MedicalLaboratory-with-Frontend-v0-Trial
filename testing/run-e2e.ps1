#Requires -Version 5.0
<#
.SYNOPSIS
    MedLab Playwright E2E Browser Tests
.DESCRIPTION
    Installs Playwright (first run only, downloads Chromium ~180 MB) and runs
    the full browser test suite against http://localhost:4200.

    Outputs PASS/FAIL/SKIP lines compatible with test-all.ps1 summary format.

.EXAMPLE
    .\testing\run-e2e.ps1
    .\testing\run-e2e.ps1 -SkipInstall
    .\testing\run-e2e.ps1 -Headed        # show the browser window while running
#>

param(
    [switch]$SkipInstall,
    [switch]$Headed
)

$E2E = Join-Path $PSScriptRoot "e2e"

function Write-Step { param($m) Write-Host ""; Write-Host "==> $m" -ForegroundColor Cyan }
function Write-OK   { param($m) Write-Host "    [OK]  $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "    [!!]  $m" -ForegroundColor Yellow }
function Write-Err  { param($m) Write-Host "    [ERR] $m" -ForegroundColor Red }

# ── Port 4200 check ──────────────────────────────────────────────────────────
# Use an HTTP GET rather than a raw TCP connect to 127.0.0.1 -- Node.js v17+
# binds to ::1 (IPv6) on modern Windows, so an IPv4-only check always fails.
Write-Step "Checking Angular dev server (port 4200)..."
$up = $false
try {
    $r = Invoke-WebRequest -Uri "http://localhost:4200" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
    $up = ($r.StatusCode -eq 200)
} catch {}

if (-not $up) {
    Write-Err "Angular dev server is NOT running on port 4200."
    Write-Warn "Start it: run debug.bat (answer Y) or frontend-dev.bat serve"
    Write-Host ""
    Write-Host "  [SKIP] All E2E browser tests -- Angular not running" -ForegroundColor DarkGray
    exit 0
}
Write-OK "Port 4200 is open."

# ── Node check ───────────────────────────────────────────────────────────────
if (-not (Get-Command "node" -ErrorAction SilentlyContinue)) {
    Write-Err "Node.js not found. Install from https://nodejs.org"
    exit 1
}

# ── Install (first run) ──────────────────────────────────────────────────────
if (-not $SkipInstall) {
    Write-Step "Installing Playwright (Chromium download ~180 MB on first run)..."
    Push-Location $E2E
    & npm install 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) { Pop-Location; Write-Err "npm install failed."; exit 1 }
    & npx playwright install chromium 2>&1 | ForEach-Object {
        if ($_ -match "chromium|download|install") {
            Write-Host "          $_" -ForegroundColor DarkGray
        }
    }
    Pop-Location
    Write-OK "Playwright ready."
}

# ── Run ──────────────────────────────────────────────────────────────────────
Write-Step "Running browser tests (headless Chromium)..."
Write-Host "    Target: http://localhost:4200" -ForegroundColor Gray
Write-Host ""

$headedFlag = if ($Headed) { "--headed" } else { "" }
Push-Location $E2E
$proc = Start-Process -FilePath "npx" `
    -ArgumentList "playwright", "test", $headedFlag, "--reporter=line" `
    -NoNewWindow -PassThru -Wait `
    -RedirectStandardOutput "$env:TEMP\pw_out.txt" `
    -RedirectStandardError  "$env:TEMP\pw_err.txt"
Pop-Location

Get-Content "$env:TEMP\pw_out.txt" -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "  $_" }

$passed  = 0; $failed  = 0; $skipped = 0
foreach ($line in (Get-Content "$env:TEMP\pw_out.txt" -ErrorAction SilentlyContinue)) {
    if ($line -match "(\d+) passed")  { $passed  = [int]$Matches[1] }
    if ($line -match "(\d+) failed")  { $failed  = [int]$Matches[1] }
    if ($line -match "(\d+) skipped") { $skipped = [int]$Matches[1] }
}

Write-Host ""
Write-Host "+============================================================+" -ForegroundColor Cyan
Write-Host "|   E2E Browser Tests  (Playwright / headless Chromium)     |" -ForegroundColor Cyan
Write-Host "+============================================================+" -ForegroundColor Cyan
Write-Host "  Total: $($passed+$failed+$skipped)   PASS: $passed   FAIL: $failed   SKIP: $skipped" -ForegroundColor Cyan
Write-Host ""
if ($failed -eq 0) {
    Write-Host "  All browser tests passed!" -ForegroundColor Green
} else {
    Write-Host "  $failed test(s) failed." -ForegroundColor Red
    Write-Host "  HTML report  : playwright-report\index.html" -ForegroundColor Yellow
    Write-Host "  Screenshots  : playwright-results\" -ForegroundColor Yellow
}
Write-Host ""
exit $proc.ExitCode
