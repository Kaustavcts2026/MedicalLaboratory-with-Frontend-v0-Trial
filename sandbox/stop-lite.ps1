$ErrorActionPreference = "Continue"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$PidsFile = Join-Path $PSScriptRoot "medlab-lite.pids.json"
$ComposeFile = Join-Path $PSScriptRoot "docker-compose-dev.yml"

Write-Host "=== MedLab Lite Stop ==="

if (Test-Path $PidsFile) {
    $items = Get-Content -Raw $PidsFile | ConvertFrom-Json
    foreach ($item in $items) {
        $process = Get-Process -Id $item.pid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Host ("Stopping {0} pid {1}" -f $item.name, $item.pid)
            Stop-Process -Id $item.pid -Force
        }
    }
    Remove-Item $PidsFile -Force
} else {
    Write-Host "No MedLab Lite pid file found."
}

Write-Host "Stopping MedLab Java/Node children under this project ..."
Get-CimInstance Win32_Process | Where-Object {
    ($_.Name -in @("java.exe", "node.exe")) -and
    (
        ($_.CommandLine -like "*$Root*") -or
        ($_.CommandLine -like "*backend\*-SNAPSHOT.jar*") -or
        ($_.CommandLine -like "*backend\billing-service\target\medlab-billing-service-1.0.0.jar*") -or
        ($_.CommandLine -like "*node_modules\@angular\cli\bin\ng.js*")
    )
} | ForEach-Object {
    Write-Host ("Stopping pid {0}" -f $_.ProcessId)
    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}

Write-Host "Stopping Docker MySQL container ..."
& docker compose -f $ComposeFile stop mysql

Write-Host "Done."
