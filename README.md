# Medical Laboratory System

A **microservices-based backend system** for managing the full lifecycle of a medical laboratory — from patient test orders and lab processing to billing, inventory, and notifications. Built with Java 21, Spring Boot, and Spring Cloud.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Services](#services)
- [How It Works](#how-it-works)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Security](#security)
- [Project Structure](#project-structure)

---

## Overview

The Medical Laboratory System (MLS) is a distributed backend application designed to digitize and automate the operations of a medical/diagnostic laboratory. It supports multiple user roles — **Admin, Physician, Lab Technician, Receptionist, and Patient** — each with their own access level and workflow.

Core capabilities include:
- Patient test order management
- Lab technician result processing and approval
- Automated invoice and payment generation
- Test catalog and inventory tracking
- Email/SMS notification triggers
- Centralized authentication with JWT

---

## Architecture

The system follows a **microservices architecture** with the following infrastructure components:

```
                        ┌──────────────────────────────────────────┐
                        │             API Gateway :8090             │
                        │  (JWT validation, routing, Swagger agg.) │
                        └────────────────┬─────────────────────────┘
                                         │
          ┌──────────────────────────────┼────────────────────────────┐
          │              │               │              │              │
    ┌─────▼────┐  ┌──────▼────┐  ┌──────▼──────┐ ┌────▼──────┐ ┌────▼─────────┐
    │  Auth    │  │  Order    │  │   Lab Proc. │ │ Inventory │ │  Billing     │
    │ :8081    │  │ :8082     │  │   :8083     │ │ :8084     │ │  :8085       │
    └──────────┘  └───────────┘  └─────────────┘ └───────────┘ └──────────────┘
          │              │               │              │              │
    ┌─────▼──────────────▼───────────────▼──────────────▼──────────────▼──────┐
    │               Eureka Discovery Server :8761 (Service Registry)           │
    └────────────────────────────────────────────────────────────────────────┘
          │
    ┌─────▼────────────────────┐
    │  Config Server :8888     │  ← Centralized config for all services
    └──────────────────────────┘

    Additional Services:
    ├── Patient Service :8086     (patient records & history)
    └── Notification Service :8087 (email/SMS alerts)
```

Each service owns its own **MySQL database** (database-per-service pattern), communicates with peers via **Spring Cloud OpenFeign** (HTTP + Eureka load balancing), and is routed externally through the **API Gateway**.

---

## Technology Stack

| Category | Technology |
|---|---|
| Language | Java 21 |
| Framework | Spring Boot 4.0.5 |
| Cloud/Microservices | Spring Cloud 2025.1.1 |
| API Gateway | Spring Cloud Gateway (reactive) |
| Service Discovery | Spring Cloud Netflix Eureka |
| Inter-Service HTTP | Spring Cloud OpenFeign |
| Config Management | Spring Cloud Config Server |
| Database | MySQL 9.x (one DB per service) |
| ORM | Spring Data JPA / Hibernate |
| Security | Spring Security 6 + JWT (JJWT) |
| API Docs | SpringDoc OpenAPI 3 (Swagger UI) |
| Build Tool | Maven (multi-module) |
| Utilities | Lombok |
| Testing | JUnit 5, Mockito, Spring Test |

---

## Services

| Service | Port | Description |
|---|---|---|
| **Auth Service** | 8081 | User registration, login, JWT issuance, role management, audit logging |
| **Order Service** | 8082 | Create and track lab test orders; integrates with Inventory for test info |
| **Lab Processing Service** | 8083 | Lab technician workflows — create jobs, process samples, approve results |
| **Inventory Service** | 8084 | Test catalog, pricing, stock levels, and low-stock alerts |
| **Billing Service** | 8085 | Auto-generates invoices from approved results; handles payment processing |
| **Patient Service** | 8086 | Patient profiles, medical history, and test reports |
| **Notification Service** | 8087 | Sends email/SMS alerts for order updates, results, and payments |
| **Config Server** | 8888 | Serves externalized configuration to all services (file/Git backed) |
| **API Gateway** | 8090 | Single external entry point — routes requests, validates JWT, aggregates Swagger |

### User Roles

| Role | Access |
|---|---|
| `ADMIN` | Full system access, user management, result approval |
| `LAB_TECH` | Process samples, enter and manage lab results |
| `PATIENT` | Place orders, view own results and notifications |

---

## How It Works

### Typical End-to-End Flow

```
1. User logs in → Auth Service issues JWT token

2. Physician places a test order
   → Order Service creates order, fetches test details from Inventory Service

3. Lab Technician processes the sample
   → Lab Processing Service creates a lab job, updates status, approves result

4. Approved result triggers billing
   → Lab Processing Service calls Billing Service (FeignClient)
   → Billing Service fetches test price from Inventory Service
   → Invoice is auto-generated

5. Notification sent
   → Billing/Lab service calls Notification Service
   → Patient receives email/SMS with result and invoice details
```

### Inter-Service Communication

- Services register with **Eureka** on startup
- **FeignClient** interfaces handle HTTP calls between services (with fallback handlers for resilience)
- **API Gateway** routes all external traffic and validates JWT before forwarding requests

---

## Getting Started

### Prerequisites

- Java 21+
- Maven 3.9+
- MySQL 9.x (running locally or via Docker)
- IDE: IntelliJ IDEA (recommended)

### Database Setup

Create the following MySQL databases (Hibernate auto-creates tables on first run):

```sql
CREATE DATABASE auth_db;
CREATE DATABASE medlab;          -- order-service
CREATE DATABASE inventory_db;
CREATE DATABASE billing;
CREATE DATABASE lab_processing;
CREATE DATABASE patient_db;
CREATE DATABASE notification_db;
```

### Startup Order

Services must be started in this order. Wait for each service to fully start before starting the next.

```
1. Eureka Server      (port 8761)   ← Must be first; all others register here
2. Config Server      (port 8888)   ← Services pull config from here on startup
3. Auth Service       (port 8081)   ← Issues JWTs; gateway needs it
4. Patient Service    (port 8086)   ← Billing calls it to resolve patientId → username
5. Inventory Service  (port 8084)   ← Billing calls it for test prices
6. Order Service      (port 8082)   ← LPS calls it on result approval
7. Lab Processing     (port 8083)   ← Depends on Order Service
8. Notification       (port 8087)   ← Billing + Inventory call it
9. Billing Service    (port 8085)   ← Depends on Inventory, Patient, Notification
10. API Gateway       (port 8090)   ← Start last; routes all traffic
```

### Running a Service

```bash
cd backend/<service-name>
mvn spring-boot:run
```

Or build all modules from the parent:

```bash
cd backend
mvn clean install
```

### Default Credentials (JWT Secret)

All services share the same JWT secret configured in each service's `application.yml`:

```
thisisverysecuresecretkeyforjwttokengenerationandvalidationteam5medlab
```

---

## API Documentation

Swagger UI is available per-service and aggregated at the gateway:

| Endpoint | Description |
|---|---|
| `http://localhost:8090/swagger-ui.html` | Aggregated Swagger (all services via gateway) |
| `http://localhost:8081/swagger-ui/index.html` | Auth Service API |
| `http://localhost:8082/swagger-ui/index.html` | Order Service API |
| `http://localhost:8083/swagger-ui/index.html` | Lab Processing API |
| `http://localhost:8084/swagger-ui/index.html` | Inventory Service API |
| `http://localhost:8085/swagger-ui/index.html` | Billing Service API |
| `http://localhost:8086/swagger-ui/index.html` | Patient Service API |
| `http://localhost:8087/swagger-ui/index.html` | Notification Service API |

---

## Security

- **JWT-based stateless authentication** — tokens issued by Auth Service, validated by API Gateway and individual services
- **Role-based access control (RBAC)** — endpoints are protected based on user role
- **JWT Filter** — runs on every request at both the gateway and service level
- Token contains: user ID, username, roles, expiry

---

## Project Structure

```
Medical-Laboratory-System-2/
├── backend/
│   ├── pom.xml                      # Parent Maven POM (multi-module)
│   ├── api-gateway/                 # Spring Cloud Gateway
│   ├── config-server/               # Spring Cloud Config Server
│   ├── auth-service/                # Authentication & user management
│   ├── order-service/               # Test order lifecycle
│   ├── lab-processing-service/lps/  # Sample processing & result approval
│   ├── inventory-service/           # Test catalog & stock management
│   ├── billing-service/             # Invoicing & payments
│   ├── patient_service/             # Patient records
│   └── Notification_service/        # Alerts & notifications
└── frontend/                        # (Planned — not yet implemented)
```

Each service follows a standard layered structure:

```
src/main/java/
├── controller/      # REST endpoints
├── service/         # Business logic
├── repository/      # JPA data access
├── model/           # JPA entities
├── dto/             # Request/response objects
├── security/        # JWT filters & utilities
├── client/          # FeignClient interfaces
├── config/          # Spring configuration beans
└── exception/       # Global error handling
```

---

> Built as part of a distributed systems project demonstrating microservices design patterns including service discovery, centralized configuration, API gateway routing, inter-service communication with resilience, and database-per-service isolation.
