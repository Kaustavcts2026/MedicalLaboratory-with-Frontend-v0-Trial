#Requires -Version 5.0
<#
.SYNOPSIS
    MedLab Angular Frontend - Developer Utility
.DESCRIPTION
    Menu-driven helper for all common Angular frontend tasks:
      [1] npm install   - install / refresh node_modules
      [2] ng serve      - start dev server on http://localhost:4200
      [3] ng build      - production build (output: frontend/dist/)
      [4] ng test       - run Karma unit tests (headless Chrome)
      [5] ng lint       - run ESLint checks
      [6] Stop frontend - kill whatever is listening on port 4200
      [7] Exit
.EXAMPLE
    .\frontend-dev.ps1
    .\frontend-dev.ps1 -Action serve
    .\frontend-dev.ps1 -Action build
#>

param(
    # Optional: skip the menu and run a specific action directly.
    # Values: install | serve | build | test | lint | stop
    [string]$Action = ""
)

# -- PATHS --------------------------------------------------------------------
$ROOT        = $PSScriptRoot
$FRONTEND    = Join-Path $ROOT "frontend"
$NODE_MODS   = Join-Path $FRONTEND "node_modules"

# -- COLOUR HELPERS -----------------------------------------------------------
function Write-Step { param($m) Write-Host ""; Write-Host "==> $m" -ForegroundColor Cyan }
function Write-OK   { param($m) Write-Host "    [OK]  $m" -ForegroundColor Green }
function Write-Warn { param($m) Write-Host "    [!!]  $m" -ForegroundColor Yellow }
function Write-Err  { param($m) Write-Host "    [ERR] $m" -ForegroundColor Red }
function Write-Info { param($m) Write-Host "          $m" -ForegroundColor Gray }

# -- PREFLIGHT CHECKS ---------------------------------------------------------
function Assert-Prerequisites {
    # Node.js
    $node = Get-Command "node" -ErrorAction SilentlyContinue
    if (-not $node) {
        Write-Err "Node.js not found in PATH."
        Write-Err "Download and install it from https://nodejs.org (LTS recommended)."
        exit 1
    }
    $nodeVer = & node --version 2>&1
    Write-OK "Node.js : $nodeVer"

    # npm
    $npm = Get-Command "npm" -ErrorAction SilentlyContinue
    if (-not $npm) {
        Write-Err "npm not found. It should ship with Node.js - try reinstalling Node."
        exit 1
    }
    $npmVer = & npm --version 2>&1
    Write-OK "npm     : $npmVer"

    # Frontend directory
    if (-not (Test-Path $FRONTEND)) {
        Write-Err "Frontend directory not found: $FRONTEND"
        exit 1
    }
    Write-OK "Frontend: $FRONTEND"
}

# -- ENSURE node_modules EXISTS -----------------------------------------------
function Ensure-NodeModules {
    if (-not (Test-Path $NODE_MODS)) {
        Write-Warn "node_modules not found. Running 'npm install'..."
        Push-Location $FRONTEND
        & npm install
        Pop-Location
        if ($LASTEXITCODE -ne 0) {
            Write-Err "npm install failed. Check the output above."
            exit 1
        }
        Write-OK "Dependencies installed."
    } else {
        Write-OK "node_modules already present."
    }
}

# -- ACTION: INSTALL ----------------------------------------------------------
function Run-Install {
    Write-Step "Installing / updating npm dependencies..."
    Push-Location $FRONTEND
    & npm install
    Pop-Location
    if ($LASTEXITCODE -eq 0) { Write-OK "npm install complete." }
    else { Write-Err "npm install failed." }
}

# -- ACTION: SERVE ------------------------------------------------------------
function Run-Serve {
    Ensure-NodeModules
    Write-Step "Starting Angular dev server..."
    Write-Info "URL  : http://localhost:4200"
    Write-Info "API  : http://localhost:8090  (API Gateway must be running)"
    Write-Info "Press Ctrl+C to stop."
    Write-Host ""
    Push-Location $FRONTEND
    & npm start
    Pop-Location
}

# -- ACTION: BUILD ------------------------------------------------------------
function Run-Build {
    Ensure-NodeModules
    Write-Step "Building for production..."
    Push-Location $FRONTEND
    & npm run build
    Pop-Location
    if ($LASTEXITCODE -eq 0) {
        Write-OK "Build complete. Output: $FRONTEND\dist\"
    } else {
        Write-Err "Build failed. Fix the errors above and retry."
    }
}

# -- ACTION: TEST -------------------------------------------------------------
function Run-Test {
    Ensure-NodeModules
    Write-Step "Running unit tests (Karma / headless Chrome)..."
    Write-Info "Press Ctrl+C to stop the test runner."
    Write-Host ""
    Push-Location $FRONTEND
    & npx ng test --watch=false --browsers=ChromeHeadless
    Pop-Location
}

# -- ACTION: LINT -------------------------------------------------------------
function Run-Lint {
    Ensure-NodeModules
    Write-Step "Running ESLint..."
    Push-Location $FRONTEND
    & npx ng lint
    Pop-Location
    if ($LASTEXITCODE -eq 0) { Write-OK "No lint errors." }
    else { Write-Warn "Lint issues found. See output above." }
}

# -- ACTION: STOP -------------------------------------------------------------
function Run-Stop {
    Write-Step "Stopping Angular dev server (port 4200)..."
    $lines = netstat -ano 2>$null | Where-Object { $_ -match "^\s+TCP\s+.*:4200\s+.*LISTENING" }
    if (-not $lines) {
        Write-Info "Nothing listening on port 4200."
        return
    }
    $pids = $lines | ForEach-Object { ($_ -split '\s+' | Where-Object { $_ -ne "" })[-1] } | Select-Object -Unique
    foreach ($pid in $pids) {
        if (-not $pid -or $pid -eq "0") { continue }
        try {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
            Stop-Process -Id $pid -Force
            Write-OK "Stopped $($proc.Name) (PID $pid) on port 4200."
        } catch {
            Write-Warn "Could not stop PID ${pid}: $_"
        }
    }
}

# -- INTERACTIVE MENU ---------------------------------------------------------
function Show-Menu {
    Clear-Host
    Write-Host "+--------------------------------------------------------------+" -ForegroundColor Magenta
    Write-Host "|       MedLab Angular Frontend - Developer Utility            |" -ForegroundColor Magenta
    Write-Host "+--------------------------------------------------------------+" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "  [1] npm install   - install / refresh dependencies"
    Write-Host "  [2] ng serve      - dev server  ->  http://localhost:4200"
    Write-Host "  [3] ng build      - production build  ->  dist/"
    Write-Host "  [4] ng test       - unit tests (headless Chrome)"
    Write-Host "  [5] ng lint       - ESLint checks"
    Write-Host "  [6] stop frontend - kill process on port 4200"
    Write-Host "  [7] exit"
    Write-Host ""
}

# -- MAIN ---------------------------------------------------------------------
Clear-Host
Write-Host "+--------------------------------------------------------------+" -ForegroundColor Magenta
Write-Host "|       MedLab Angular Frontend - Developer Utility            |" -ForegroundColor Magenta
Write-Host "+--------------------------------------------------------------+" -ForegroundColor Magenta
Write-Host ""

Write-Step "Checking prerequisites..."
Assert-Prerequisites

# Non-interactive mode: action passed as parameter
if ($Action) {
    switch ($Action.ToLower()) {
        "install" { Run-Install }
        "serve"   { Run-Serve   }
        "build"   { Run-Build   }
        "test"    { Run-Test    }
        "lint"    { Run-Lint    }
        "stop"    { Run-Stop    }
        default   { Write-Err "Unknown action '$Action'. Use: install | serve | build | test | lint | stop" }
    }
    exit 0
}

# Interactive menu loop
while ($true) {
    Show-Menu
    $choice = Read-Host "  Enter choice (1-7)"
    switch ($choice) {
        "1" { Run-Install; Write-Host ""; Read-Host "  Press ENTER to return to menu" }
        "2" { Run-Serve;   break }
        "3" { Run-Build;   Write-Host ""; Read-Host "  Press ENTER to return to menu" }
        "4" { Run-Test;    Write-Host ""; Read-Host "  Press ENTER to return to menu" }
        "5" { Run-Lint;    Write-Host ""; Read-Host "  Press ENTER to return to menu" }
        "6" { Run-Stop;    Write-Host ""; Read-Host "  Press ENTER to return to menu" }
        "7" { Write-Host "  Bye!" -ForegroundColor Cyan; exit 0 }
        default { Write-Warn "Invalid choice. Enter a number from 1 to 7."; Start-Sleep -Seconds 1 }
    }
}
