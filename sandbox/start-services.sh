#!/bin/bash
set -e

echo "=== MedLab Backend Starting ==="
echo "This takes 30-90 seconds per service..."

start_service() {
    local name=$1
    local jar=$2
    local port=$3
    echo "[$name] Starting on port $port..."
    java -jar "$jar" --server.port=$port &
}

wait_for() {
    local port=$1
    local name=$2
    echo "[$name] Waiting for port $port..."
    for i in {1..60}; do
        if curl -sf "http://localhost:$port/actuator/health" > /dev/null 2>&1; then
            echo "[$name] Ready!"
            return 0
        fi
        sleep 3
    done
    echo "[$name] Timeout waiting for port $port"
}

start_service "Eureka" "server.jar" 8761
wait_for 8761 "Eureka"

start_service "Config" "config-server.jar" 8888
wait_for 8888 "Config"

start_service "Auth" "auth-service.jar" 8081
start_service "Patient" "patient-service.jar" 8086
start_service "Inventory" "inventory-service.jar" 8084
start_service "Order" "order-service.jar" 8082
start_service "LabProcessing" "lab-processing-service.jar" 8083
start_service "Notification" "notification-service.jar" 8087
start_service "Billing" "billing-service.jar" 8085

sleep 15

start_service "API Gateway" "api-gateway.jar" 8090

echo ""
echo "=== All services started ==="
echo "Eureka:        http://localhost:8761"
echo "API Gateway:   http://localhost:8090"
echo "Swagger:       http://localhost:8090/swagger-ui.html"
echo ""

wait
