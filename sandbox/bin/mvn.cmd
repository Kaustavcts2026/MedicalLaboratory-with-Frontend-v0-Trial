@echo off
setlocal EnableExtensions

set "ARGS=%*"
echo %ARGS% | findstr /I /C:"spring-boot:run" >nul
if errorlevel 1 (
  echo [sandbox-mvn] This lightweight Maven shim only supports: mvn spring-boot:run
  echo [sandbox-mvn] Original args: %*
  exit /b 1
)

set "JAR="
if exist "target\server-0.0.1-SNAPSHOT.jar" set "JAR=target\server-0.0.1-SNAPSHOT.jar"
if exist "target\config-server-0.0.1-SNAPSHOT.jar" set "JAR=target\config-server-0.0.1-SNAPSHOT.jar"
if exist "target\api-gateway-0.0.1-SNAPSHOT.jar" set "JAR=target\api-gateway-0.0.1-SNAPSHOT.jar"
if exist "target\inventory-service-0.0.1-SNAPSHOT.jar" set "JAR=target\inventory-service-0.0.1-SNAPSHOT.jar"
if exist "target\lps-0.0.1-SNAPSHOT.jar" set "JAR=target\lps-0.0.1-SNAPSHOT.jar"
if exist "target\Notification_service-0.0.1-SNAPSHOT.jar" set "JAR=target\Notification_service-0.0.1-SNAPSHOT.jar"
if exist "target\medlab-billing-service-1.0.0.jar" set "JAR=target\medlab-billing-service-1.0.0.jar"

if not defined JAR (
  echo [sandbox-mvn] No prebuilt Spring Boot jar found under %CD%\target
  exit /b 1
)

echo [sandbox-mvn] Running prebuilt jar: %CD%\%JAR%
java -jar "%JAR%"
exit /b %errorlevel%
