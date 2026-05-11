param(
    [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"
if (Get-Variable -Name PSNativeCommandUseErrorActionPreference -ErrorAction SilentlyContinue) {
    $PSNativeCommandUseErrorActionPreference = $false
}

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$Logs = Join-Path $Root "medlab-lite-logs"
$PidsFile = Join-Path $PSScriptRoot "medlab-lite.pids.json"
$ComposeFile = Join-Path $PSScriptRoot "docker-compose-dev.yml"
$JavaExe = "C:\Program Files\Java\jdk-21.0.10\bin\java.exe"
if (-not (Test-Path $JavaExe)) {
    $JavaExe = (Get-Command java).Source
}
$NodeExe = (Get-Command node).Source

New-Item -ItemType Directory -Force -Path $Logs | Out-Null

function Wait-Http($Name, $Url, $TimeoutSeconds = 120) {
    Write-Host "[$Name] Waiting for $Url ..."
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            Invoke-WebRequest -UseBasicParsing -Uri $Url -TimeoutSec 5 | Out-Null
            Write-Host "[$Name] Ready"
            return
        } catch {
            Start-Sleep -Seconds 3
        }
    }
    throw "Timed out waiting for $Name at $Url"
}

function Wait-Port($Name, $Port, $TimeoutSeconds = 120) {
    Write-Host "[$Name] Waiting for port $Port ..."
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $client = New-Object System.Net.Sockets.TcpClient
        try {
            $async = $client.BeginConnect("127.0.0.1", $Port, $null, $null)
            if ($async.AsyncWaitHandle.WaitOne(1000) -and $client.Connected) {
                $client.EndConnect($async)
                Write-Host "[$Name] Ready"
                return
            }
        } catch {
        } finally {
            $client.Close()
        }
        Start-Sleep -Seconds 2
    }
    throw "Timed out waiting for $Name on port $Port"
}

function Wait-MySql {
    Write-Host "[mysql] Waiting for Docker MySQL ..."
    for ($i = 0; $i -lt 60; $i++) {
        $previousErrorActionPreference = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        $output = & docker compose -f $ComposeFile exec -T mysql mysqladmin ping -h localhost -uroot -proot 2>&1
        $ErrorActionPreference = $previousErrorActionPreference
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[mysql] Ready"
            return
        }
        Start-Sleep -Seconds 3
    }
    throw "Timed out waiting for MySQL"
}

function Start-MedLabProcess($Name, $Exe, [string[]]$ProcessArgs, $WorkingDirectory, [hashtable]$Env = @{}) {
    $stdout = Join-Path $Logs "$Name.out.log"
    $stderr = Join-Path $Logs "$Name.err.log"
    Remove-Item $stdout, $stderr -Force -ErrorAction SilentlyContinue

    $argumentString = ($ProcessArgs | ForEach-Object {
        if ($_ -match '[\s"]') {
            '"' + ($_ -replace '"', '\"') + '"'
        } else {
            $_
        }
    }) -join " "

    $oldEnv = @{}
    foreach ($key in $Env.Keys) {
        $oldEnv[$key] = [Environment]::GetEnvironmentVariable($key, "Process")
        Set-Item -Path "Env:$key" -Value ([string]$Env[$key])
    }

    $process = Start-Process -FilePath $Exe `
        -ArgumentList $argumentString `
        -WorkingDirectory $WorkingDirectory `
        -RedirectStandardOutput $stdout `
        -RedirectStandardError $stderr `
        -WindowStyle Hidden `
        -PassThru

    foreach ($key in $Env.Keys) {
        if ($null -eq $oldEnv[$key]) {
            Remove-Item -Path "Env:$key" -ErrorAction SilentlyContinue
        } else {
            Set-Item -Path "Env:$key" -Value $oldEnv[$key]
        }
    }

    Write-Host ("[{0}] Started pid {1}" -f $Name, $process.Id)
    return [pscustomobject]@{
        name = $Name
        pid = $process.Id
        stdout = $stdout
        stderr = $stderr
    }
}

function Start-Jar($Name, $Jar, $Port, $Database = $null) {
    $jarArgs = @(
        "-jar", $Jar,
        "--server.port=$Port",
        "--eureka.client.service-url.defaultZone=http://localhost:8761/eureka/",
        "--spring.config.import=optional:configserver:http://localhost:8888"
    )

    $env = @{
        JWT_SECRET = "medlab-local-dev-secret-change-me"
    }
    if ($Database) {
        $dbUrl = "jdbc:mysql://localhost:13306/$Database`?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC"
        $jarArgs += @(
            "--spring.datasource.url=$dbUrl",
            "--spring.datasource.username=root",
            "--spring.datasource.password=root"
        )
        $env["DB_URL"] = $dbUrl
        $env["DB_USER"] = "root"
        $env["DB_PASSWORD"] = "root"
    }

    Start-MedLabProcess -Name $Name -Exe $JavaExe -ProcessArgs $jarArgs -WorkingDirectory $Root -Env $env
}

Write-Host "=== MedLab Lite Startup ==="
Write-Host "Uses Docker only for MySQL; uses existing backend jars and frontend node_modules."
Write-Host ""

& docker compose -f $ComposeFile up -d mysql
if ($LASTEXITCODE -ne 0) {
    throw "Could not start MySQL with Docker Compose"
}

Wait-MySql

$initSql = Join-Path $PSScriptRoot "init-db.sql"
Get-Content -Raw $initSql | & docker compose -f $ComposeFile exec -T mysql mysql -uroot -proot
if ($LASTEXITCODE -ne 0) {
    throw "Could not initialize MedLab databases"
}

$started = @()

$started += Start-Jar "eureka" (Join-Path $Root "backend\server\target\server-0.0.1-SNAPSHOT.jar") 8761
Wait-Http "eureka" "http://localhost:8761/actuator/health" 180

$started += Start-Jar "config-server" (Join-Path $Root "backend\config-server\target\config-server-0.0.1-SNAPSHOT.jar") 8888
Wait-Http "config-server" "http://localhost:8888/actuator/health" 180

$started += Start-Jar "auth-service" (Join-Path $Root "backend\auth-service\target\server-0.0.1-SNAPSHOT.jar") 8081 "auth_db"
Wait-Port "auth-service" 8081 240
$started += Start-Jar "patient-service" (Join-Path $Root "backend\patient_service\target\server-0.0.1-SNAPSHOT.jar") 8086 "patient_db"
Wait-Port "patient-service" 8086 240
$started += Start-Jar "inventory-service" (Join-Path $Root "backend\inventory-service\inventory-service\target\inventory-service-0.0.1-SNAPSHOT.jar") 8084 "inventory_db"
Wait-Port "inventory-service" 8084 240
$started += Start-Jar "order-service" (Join-Path $Root "backend\order-service\target\server-0.0.1-SNAPSHOT.jar") 8082 "medlab"
Wait-Port "order-service" 8082 240
$started += Start-Jar "lab-processing-service" (Join-Path $Root "backend\lab-processing-service\lps\target\lps-0.0.1-SNAPSHOT.jar") 8083 "lab_processing"
Wait-Port "lab-processing-service" 8083 240
$started += Start-Jar "notification-service" (Join-Path $Root "backend\Notification_service\target\Notification_service-0.0.1-SNAPSHOT.jar") 8087 "notification_db"
Wait-Port "notification-service" 8087 240
$started += Start-Jar "billing-service" (Join-Path $Root "backend\billing-service\target\medlab-billing-service-1.0.0.jar") 8085 "billing"
Wait-Port "billing-service" 8085 240

$started += Start-Jar "api-gateway" (Join-Path $Root "backend\api-gateway\target\api-gateway-0.0.1-SNAPSHOT.jar") 8090
Wait-Http "api-gateway" "http://localhost:8090/actuator/health" 240

if (-not $SkipFrontend) {
    $ng = Join-Path $Root "frontend\node_modules\@angular\cli\bin\ng.js"
    if (Test-Path $ng) {
        $frontendEnv = @{
            NG_CLI_ANALYTICS = "false"
            CI = "true"
        }
        $started += Start-MedLabProcess -Name "frontend" -Exe $NodeExe -ProcessArgs @($ng, "serve", "--host", "0.0.0.0", "--port", "4200") -WorkingDirectory (Join-Path $Root "frontend") -Env $frontendEnv
    } else {
        Write-Warning "Angular CLI was not found at $ng. Re-run with Docker frontend or restore frontend\node_modules."
    }
}

$started | ConvertTo-Json -Depth 3 | Set-Content -Path $PidsFile

Write-Host ""
Write-Host "=== MedLab Lite is starting ==="
Write-Host "Frontend:    http://localhost:4200"
Write-Host "API Gateway: http://localhost:8090"
Write-Host "Swagger:     http://localhost:8090/swagger-ui.html"
Write-Host "Eureka:      http://localhost:8761"
Write-Host "Logs:        $Logs"
Write-Host ""
Write-Host "Stop with:   powershell -ExecutionPolicy Bypass -File sandbox\stop-lite.ps1"
