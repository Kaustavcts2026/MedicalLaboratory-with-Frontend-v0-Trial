$ErrorActionPreference = "Stop"
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
}

$composeFile = Join-Path $PSScriptRoot "..\docker-compose-original.yml"
$filtered = @("--protocol=TCP", "-hlocalhost")

foreach ($arg in $args) {
    if ($arg -match "^-h(localhost|127\.0\.0\.1)?$") { continue }
    if ($arg -match "^--host=(localhost|127\.0\.0\.1)$") { continue }
    if ($arg -match "^-P3306$") { continue }
    if ($arg -match "^--port=3306$") { continue }
    $filtered += $arg
}

& docker compose -f $composeFile exec -T mysql mysql @filtered
exit $LASTEXITCODE
