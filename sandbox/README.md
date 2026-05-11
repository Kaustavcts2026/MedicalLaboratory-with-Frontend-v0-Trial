# MedLab Cloud Dev Environment Setup

This folder contains everything needed to run the entire MedLab system **entirely in the cloud** — no local installation required.

---

## Option 1: Gitpod (Recommended - Works in Browser)

1. **Open in Gitpod:**
   ```
   https://gitpod.io/#https://github.com/YOUR_USERNAME/Medical_Laboratory_Frontend
   ```
   Or prefix any repo URL: `https://gitpod.io/#<YOUR_REPO_URL>`

2. **Automatic setup** handles everything — Java 21, Maven, Node.js, MySQL all pre-installed

3. **After workspace loads**, run:
   ```bash
   bash .devcontainer/start-all.sh
   ```

4. **Access from Gitpod** — ports 8090, 8761, 4200 auto-open in browser

---

## Option 2: VS Code Dev Containers (Local)

1. **Prerequisites:**
   - VS Code
   - Docker Desktop (install once from docker.com)
   - VS Code Dev Containers extension

2. **Open in VS Code:**
   ```
   File > Open Folder > Medical_Laboratory_Frontend-main
   ```

3. **Reopen in Container:**
   ```
   Cmd/Ctrl + Shift + P > "Dev Containers: Reopen in Container"
   ```

4. **Wait for setup** (~5 min), then:
   ```bash
   bash .devcontainer/start-all.sh
   ```

5. **Access:**
   - API Gateway: http://localhost:8090/swagger-ui.html
   - Eureka: http://localhost:8761
   - Frontend: http://localhost:4200

---

## What's Included

| Component | Tool | Version |
|-----------|------|---------|
| Java Runtime | Eclipse Temurin | 21 |
| Build Tool | Maven | 3.9+ |
| Node.js | Node | 20 |
| Frontend Framework | Angular CLI | 16 |
| Database | MySQL | 9.1 |
| Container Runtime | Docker-in-Docker | Latest |

---

## Service Ports

| Service | Port | URL |
|---------|------|-----|
| MySQL | 3306 | localhost:3306 |
| Eureka Dashboard | 8761 | http://localhost:8761 |
| Config Server | 8888 | http://localhost:8888 |
| Auth Service | 8081 | http://localhost:8081 |
| Order Service | 8082 | http://localhost:8082 |
| Lab Processing | 8083 | http://localhost:8083 |
| Inventory Service | 8084 | http://localhost:8084 |
| Billing Service | 8085 | http://localhost:8085 |
| Patient Service | 8086 | http://localhost:8086 |
| Notification Service | 8087 | http://localhost:8087 |
| API Gateway | 8090 | http://localhost:8090/swagger-ui.html |
| Angular Frontend | 4200 | http://localhost:4200 |

---

## Quick Commands

```bash
# Start everything (MySQL + backend)
bash .devcontainer/start-all.sh

# Stop everything
bash .devcontainer/stop-all.sh

# Rebuild backend after code changes
mvn -f backend/pom.xml clean package -DskipTests -q

# Run frontend
cd frontend && npm start
```

---

## Database Initialization

On first run, the databases are created automatically. To reset:
```bash
docker exec medlab-mysql mysql -uroot -proot -e "DROP DATABASE IF EXISTS auth_db; DROP DATABASE IF EXISTS patient_db; ..."
bash .devcontainer/start-all.sh
```
