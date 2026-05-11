# Medical Laboratory System — Comprehensive Project Report
> Java Spring Boot Microservices | Internship Team Project | Interview Preparation

---

## 1. PROJECT OVERVIEW

The **Medical Laboratory System (MedLab)** is a backend platform that digitizes and automates the complete workflow of a medical diagnostic laboratory — from test ordering through sample processing, result delivery, billing, and patient notifications.

**Purpose:** Enable hospitals and diagnostic labs to manage patient test orders, sample processing, result approval, billing, and patient notification through a unified API.

**Core End-to-End Workflow:**
1. Physician/Receptionist creates a test order for a patient
2. Lab technician collects the sample
3. Lab Processing Service processes the sample and generates results
4. An admin approves the result
5. Billing Service auto-generates an invoice
6. Patient pays the invoice via the payment endpoint
7. Patient receives lab result + payment notification

**Key Stats:**
- Language: Java 21
- Framework: Spring Boot 4.0.5 + Spring Cloud 2025.1.1
- Service Discovery: Netflix Eureka
- API Gateway: Spring Cloud Gateway (reactive / WebFlux)
- Total Microservices: 10
- Database: MySQL 8.0 (one separate DB per service)
- Authentication: JWT (JJWT 0.11.5, HS256 algorithm)
- API Documentation: SpringDoc OpenAPI 3.0.0 (Swagger)

---

## 2. ARCHITECTURE & INFRASTRUCTURE

### 2.1 High-Level System Design

```
CLIENT (Browser/Postman)
         ↓
    API GATEWAY (port 8090)
    ├─ JWT Validation Filter
    ├─ Route Management (path-based)
    └─ Swagger UI Aggregation
         ↓
    ┌──────┬────────┬───────────┬──────────┬──────────┬────────────┐
    ↓      ↓        ↓           ↓          ↓          ↓            ↓
  User  Order  Lab Processing  Inventory  Billing  Patient  Notification
Service Service    Service     Service   Service  Service    Service
(8081) (8082)     (8083)       (8084)    (8085)   (8086)
    │      │        │           │          │          │            │
    └──────┴────────┴───────────┴──────────┴──────────┴────────────┘
         ↓
   INFRASTRUCTURE
    ├─ Config Server (8888)
    ├─ Eureka Discovery Server (8761)
    └─ MySQL Databases (one per service)
```

### 2.2 Service Registration & Discovery (Eureka)

All 10 services auto-register with Eureka on startup using these standard properties:

```properties
eureka.client.register-with-eureka=true
eureka.client.fetch-registry=true
eureka.client.service-url.defaultZone=http://localhost:8761/eureka/
eureka.instance.prefer-ip-address=true
```

Services discover each other by **name** (e.g., `lb://order-service`) — no hardcoded IPs. Spring Cloud Load Balancer resolves the actual instance at call time.

### 2.3 API Gateway (Port 8090)

The **single entry point** for all client requests. Implemented with Spring Cloud Gateway (reactive).

**What it does:**
- Routes requests to the correct downstream service based on URL path
- Validates JWT tokens on all requests (except open paths)
- Forwards `X-Auth-User` and `X-Auth-Role` headers downstream
- Aggregates all Swagger UIs into one unified docs page

**Open Paths (no JWT required):**
- `/auth/register`, `/auth/login` — authentication
- `/swagger-ui`, `/v3/api-docs`, `/webjars` — API documentation
- `/notification` — allows other services to post notifications without JWT
- `/actuator` — health checks

**Route Table:**
```
/auth/**              → user-service     (8081)
/orders/**            → order-service    (8082)
/api/jobs/**          → lab-processing   (8083)
/tests/**, /inventory/** → inventory     (8084)
/billing/**, /invoices/**, /payments/** → billing (8085)
/patient/**           → patient-service  (8086)
/notification/**      → notification     (separate)
```

**JWT Filter Logic:**
1. Extract token from `Authorization: Bearer <token>` header
2. Validate signature using shared secret
3. Extract username + role
4. Add headers (`X-Auth-User`, `X-Auth-Role`) to forward to downstream
5. Return `401 Unauthorized` if token is missing/invalid
6. Executes before all other filters (priority order = -1)

### 2.4 Config Server (Port 8888)

Centralized configuration management. All services pull their config at startup.

- **Source:** Native profile (reads YAML files from classpath `/config`)
- **Fallback:** Services use `optional:configserver:...` so they start even if Config Server is down
- **What it provides:** DB URLs, JWT secret, Eureka URLs, ports — one config per service
- **Refresh:** `/actuator/refresh` reloads config without restart

### 2.5 Security Model: JWT + RBAC

**JWT Token Structure:**
- Algorithm: HS256
- Shared Secret (same across ALL services): `thisisverysecuresecretkeyforjwttokengenerationandvalidationteam5medlab`
- Claims: `sub` (username), `role` (user role), `iat`, `exp`

**Roles:**
- `ADMIN` — full system access
- `PATIENT` — self-service (own profile, own invoices, pay, view notifications)
- `LAB_TECH` — lab operations (process samples, enter/approve results)
- `PHYSICIAN` — can create orders, view results
- `RECEPTIONIST` — can create orders, process payments

**Enforcement:**
- API Gateway: validates token presence; rejects if missing/expired
- Downstream services: re-validate JWT + use `@PreAuthorize("hasAuthority('ROLE_NAME')")` on controller methods

**Important nuance — `hasRole()` vs `hasAuthority()`:**
The JWT stores plain role strings like `"LAB_TECH"`. Spring Security's `hasRole('LAB_TECH')` internally looks for `"ROLE_LAB_TECH"` (prepends `ROLE_`), which won't match. So all services use `hasAuthority('LAB_TECH')` instead.

---

## 3. ALL 10 SERVICES — DETAILED BREAKDOWN

---

### SERVICE 1: USER SERVICE (Auth Service) — Port 8081
**Eureka name:** `user-service` | **Folder:** `auth-service`

**What it does:**  
Central identity provider. Manages user registration, login, and JWT token issuance. This is the only service that generates JWT tokens — all other services just validate them.

**Database:** `users` (MySQL)

**Data Model:**
```
Users:
  - id (PK)
  - username (unique)
  - password (hashed)
  - role (enum: ADMIN, PATIENT, LAB_TECH)

AuditLog:
  - id (PK)
  - user_id (FK)
  - action
  - timestamp
```

**REST Endpoints:**

| Method | Path | JWT Required | Description |
|--------|------|---|---|
| POST | `/auth/register` | No | Register new user |
| POST | `/auth/login` | No | Login, returns JWT token |
| GET | `/users/{id}` | Yes | Get user by ID |
| PUT | `/users/{id}` | Yes | Update user |
| POST | `/admin/**` | Yes (ADMIN) | Admin-only operations |
| POST | `/labTech/**` | Yes (LAB_TECH) | Lab tech operations |
| GET | `/patient/profile` | Yes (PATIENT) | Patient profile (also in Patient Service) |
| GET | `/patient/reports` | Yes (PATIENT) | Patient reports |

**Key Classes:**
- `Users` — JPA entity (username, password, role)
- `Role` — enum (ADMIN, PATIENT, LAB_TECH)
- `AuthRequest` / `AuthResponse` — DTOs for login/register
- `AuthService` — login, register, token generation logic
- `JwtUtil` — JWT creation and validation
- `JwtFilter` — Spring Security filter

**Inter-service communication:** None (it's the JWT source; others call it via gateway)

---

### SERVICE 2: ORDER SERVICE — Port 8082
**Eureka name:** `order-service`

**What it does:**  
Orchestrates the test ordering workflow. A test order links a patient to one or more lab tests. Tracks the order from creation → sample collection → lab processing → completion. It's the source of truth for "where is this test right now?"

**Database:** `orders` (MySQL)

**Data Model:**
```
Orders:
  - id (PK)
  - order_number (unique) — e.g., "ORD-0001-2024"
  - patient_id (FK to Patient Service)
  - status (enum: CREATED, SAMPLE_COLLECTED, PROCESSING, RESULT_READY, COMPLETED, CANCELLED)
  - priority (enum: LOW, MEDIUM, HIGH, URGENT)
  - requested_by (user_id from User Service)
  - created_at

OrderTests (join table):
  - id (PK)
  - order_id (FK)
  - test_id (FK to Inventory Service's LabTest)

Samples:
  - id (PK)
  - order_id (FK, one-to-one)
  - sample_type (e.g., BLOOD, URINE)
  - collected_at
  - collected_by (user_id)
```

**Order Status Flow:**
```
CREATED → SAMPLE_COLLECTED → PROCESSING → RESULT_READY → COMPLETED
  │                                                            │
  └──────────────────────→ CANCELLED ←────────────────────────┘
```

**REST Endpoints:**

| Method | Path | Role Required | Description |
|--------|------|---|---|
| POST | `/orders/addOrder` | PATIENT, LAB_TECH | Create a new test order |
| GET | `/orders/viewOrder/{id}` | PATIENT, LAB_TECH | Get order details |
| POST | `/orders/collectSample/{id}` | ADMIN | Record sample collection |
| POST | `/orders/cancelOrder/{id}` | PATIENT, LAB_TECH | Cancel an order |
| GET | `/orders/viewAllOrders` | ADMIN | List all orders |
| GET | `/orders/by-sample/{sampleId}` | ADMIN, LAB_TECH | Get order by sampleId (internal use) |
| GET | `/orders/{orderId}/detail` | ADMIN, LAB_TECH, PATIENT | Get patientId + testIds (used by Billing) |

**Inter-service communication:**
- Called by **Lab Processing Service** — to resolve sampleId → order details
- Called by **Billing Service** — to fetch orderId → patientId + testIds for invoice

---

### SERVICE 3: LAB PROCESSING SERVICE — Port 8083
**Eureka name:** `lps`

**What it does:**  
Manages wet lab workflow. Once a sample is collected, this service creates a "ProcessingJob" to track that sample through: lab processing → quality control → result entry → admin approval. Results (with values, units, reference ranges) are stored here.

**Database:** `lab_processing` (MySQL)

**Data Model:**
```
ProcessingJobs:
  - id (PK)
  - sample_id (FK to Order Service's Sample)
  - test_id (FK to Inventory Service's LabTest)
  - status (enum: CREATED, IN_PROGRESS, QC_PENDING, APPROVED, REJECTED, CANCELLED)
  - started_at, completed_at, created_at, updated_at

QCRecords:
  - id (PK)
  - processing_job_id (FK, one-to-one)
  - qc_status (PASS / FAIL)
  - status (enum: PENDING, APPROVED, REJECTED)
  - remarks (text)
  - created_at, updated_at

Results:
  - id (PK)
  - processing_job_id (FK)
  - sample_id, test_id (FKs)
  - result_value (string — e.g., "120")
  - unit (string — e.g., "mg/dL")
  - reference_range (string — e.g., "70-100")
  - status (enum: ENTERED, APPROVED)
  - entered_at, approved_at
```

**Job Status Flow:**
```
CREATED → IN_PROGRESS → QC_PENDING → APPROVED → COMPLETED
                              ↓
                           REJECTED → (reprocess or cancel)
```

**REST Endpoints:**

| Method | Path | Role Required | Description |
|--------|------|---|---|
| GET | `/api/jobs` | LAB_TECH, ADMIN | List all processing jobs |
| POST | `/api/jobs` | LAB_TECH, ADMIN | Create job (triggered after sample collection) |
| POST | `/api/jobs/{id}/start` | LAB_TECH | Start processing |
| POST | `/api/jobs/{id}/qc` | LAB_TECH | Mark QC pending |
| POST | `/api/jobs/{id}/complete` | LAB_TECH | Complete job |
| POST | `/api/jobs/{id}/cancel` | ADMIN | Cancel job |
| POST | `/api/jobs/processing/{sampleId}/result` | LAB_TECH | Enter lab result |
| PUT | `/api/jobs/processing/{sampleId}/approve` | ADMIN | Approve result (triggers billing) |
| GET | `/api/jobs/results/by-sample/{sampleId}` | PATIENT, LAB_TECH, ADMIN | Fetch result (used by Billing) |

**Inter-service communication:**
- Called by **Order Service** (auto-creates job on sample collection)
- Calls **Billing Service** (`POST /billing/generate/{orderId}`) when result is approved
- Called by **Billing Service** (`GET /api/jobs/results/by-sample/{sampleId}`) to get result details for notification

---

### SERVICE 4: INVENTORY SERVICE — Port 8084
**Eureka name:** `inventory-service`

**What it does:**  
Two responsibilities in one:
1. **Lab Test Catalog** — manages all available tests with codes, names, and prices
2. **Consumable Inventory** — tracks physical supplies (test tubes, reagents, etc.)

Acts as the **price provider** — Billing Service fetches test prices from here.

**Database:** `inventory` (MySQL)

**Data Model:**
```
LabTests:
  - id (PK)
  - code (unique) — e.g., "BL001"
  - name — e.g., "Blood Glucose Test"
  - price (decimal, precision=10, scale=2)
  - turnaround_hours (int) — e.g., 24
  - description (text)

InventoryItems:
  - id (PK)
  - item_name — e.g., "Test Tubes (10mL)"
  - quantity (int)
  - unit — e.g., "box", "pack"
  - low_stock_threshold (int)
  - description (text)
```

**REST Endpoints:**

| Method | Path | JWT Required | Description |
|--------|------|---|---|
| GET | `/tests` | No | Get all available tests |
| GET | `/tests/{id}` | No | Get test by ID (used by Billing for pricing) |
| POST | `/tests` | Yes (ADMIN) | Add new test |
| PUT | `/tests/{id}` | Yes (ADMIN) | Update test (price, turnaround, etc.) |
| GET | `/inventory` | Yes (ADMIN) | List inventory items |
| POST | `/inventory` | Yes (ADMIN) | Add inventory item |
| PUT | `/inventory/{id}` | Yes (ADMIN) | Update inventory item |

**Inter-service communication:**
- Called by **Billing Service** (`GET /tests/{id}`) — to get price when generating invoice

---

### SERVICE 5: BILLING SERVICE — Port 8085
**Eureka name:** `billing-service`

*(User personally worked on this service — see Section 5 for deep dive)*

**What it does:**  
Financial hub of the system. When a lab result is approved, this service automatically generates an invoice by pulling order and price data from other services. Handles (mocked) payment processing and triggers patient notifications.

**Database:** `billing` (MySQL)

**Data Model:**
```
Invoices:
  - id (PK)
  - invoice_number (unique) — e.g., "INV-2024-001"
  - order_id (FK to Order Service)
  - patient_id (FK to Patient Service)
  - amount (decimal)
  - currency — "INR" (hardcoded)
  - status (enum: PENDING, PAID, CANCELLED)
  - due_date — createdAt + 10 days
  - created_at, updated_at

Payments:
  - id (PK)
  - invoice_id (FK)
  - amount_paid (decimal)
  - payment_method (enum: CREDIT_CARD, DEBIT_CARD, UPI)
  - transaction_id (unique) — e.g., "TXN-2024-0001" (mocked)
  - status (enum: PAID — always PAID, mocked)
  - paid_at

Claims:
  - (table exists, not actively used)
```

**Invoice Lifecycle:**
```
PENDING (created) → PAID (payment submitted)
              └──→ CANCELLED
```

**REST Endpoints:**

| Method | Path | Role Required | Description |
|--------|------|---|---|
| POST | `/billing/generate/{orderId}` | ADMIN | Generate invoice for approved order |
| GET | `/invoices/{id}` | Any (authenticated) | Get invoice by ID |
| GET | `/invoices/order/{orderId}` | Any (authenticated) | Get invoice by order ID |
| GET | `/invoices/patient/{patientId}` | ADMIN, PHYSICIAN, RECEPTIONIST, PATIENT | Get all invoices for patient |
| POST | `/payments` | PATIENT, ADMIN, RECEPTIONIST | Submit payment (mocked) |
| GET | `/payments/{invoiceId}` | PATIENT, ADMIN, RECEPTIONIST, PHYSICIAN | Get payment history |

**Feign Clients (outbound calls):**
| Client | Calls | Purpose |
|--------|-------|---------|
| `OrderClient` | `GET /orders/{orderId}/detail` | Get patientId + testIds |
| `InventoryClient` | `GET /tests/{id}` | Get test price |
| `PatientClient` | `GET /patient/by-id/{patientId}` | Get patient info for notification |
| `NotificationClient` | `POST /notification` | Send INVOICE_GENERATED, PAYMENT_SUCCESS, LAB_RESULT |

All clients have **fallback implementations** (graceful degradation if downstream is down).

---

### SERVICE 6: PATIENT SERVICE — Port 8086
**Eureka name:** `patient-service`

**What it does:**  
Manages patient demographic profiles. Separate from authentication — a user account in User Service is distinct from a patient profile here. Patient registers once in auth-service, then creates profile here (name, age, gender, contact info, address).

**Database:** `patients` (MySQL)

**Data Model:**
```
Patients:
  - id (PK)
  - username (unique, links to User Service)
  - firstname, lastname
  - age (int)
  - gender (M/F)
  - email, phone
  - address
  - created_at, updated_at
```

**REST Endpoints:**

| Method | Path | Role Required | Description |
|--------|------|---|---|
| POST | `/patient/addProfile` | PATIENT | Create patient profile |
| GET | `/patient/profile` | PATIENT | Get own profile |
| PUT | `/patient/updateProfile` | PATIENT | Update own profile |
| GET | `/patient/by-id/{patientId}` | ADMIN, LAB_TECH | Internal — used by Billing Service |

**Inter-service communication:**
- Called by **Billing Service** (`GET /patient/by-id/{patientId}`) to get patient details for notifications

---

### SERVICE 7: NOTIFICATION SERVICE — (separate port, open endpoint)
**Eureka name:** `notification-service`

**What it does:**  
Stores and serves in-app notifications. Other services POST notifications here; patients GET their own notifications. Admins can broadcast system-wide messages. No real email/SMS — all in-database only.

**Database:** `notifications` (MySQL)

**Data Model:**
```
Notifications:
  - id (PK)
  - username (recipient identifier)
  - message (text)
  - type (string: INVOICE_GENERATED, PAYMENT_SUCCESS, LAB_RESULT, ORDER_CREATED, etc.)
  - is_read (boolean, default false)
  - created_at
```

**REST Endpoints:**

| Method | Path | JWT Required | Description |
|--------|------|---|---|
| POST | `/notification` | No (open) | Create notification (called by other services) |
| GET | `/notification` | Yes (PATIENT) | Get own notifications |
| POST | `/notification/broadcast` | Yes (ADMIN) | Send broadcast to all users |
| GET | `/notification/test` | No | Health check |

**Notification Types:**
- `INVOICE_GENERATED` — from Billing Service
- `PAYMENT_SUCCESS` — from Billing Service
- `LAB_RESULT` — patient can see their lab result after payment
- `ORDER_CREATED` — from Order Service

**Inter-service communication:**
- Called by Billing Service, Lab Processing Service, Order Service
- No outbound calls

---

### SERVICE 8: CONFIG SERVER — Port 8888
**Eureka name:** `config-server`

**What it does:**  
Central configuration repository. All services pull their database credentials, JWT secret, Eureka URL, etc. from here at startup time — avoiding hardcoded configs in each service.

- **Source:** Native (reads YAML files from classpath `/config` folder)
- **Fallback:** Services use `optional:configserver:...` so startup doesn't fail if Config Server is down
- **Refresh:** `POST /actuator/refresh` reloads config without restart

**Key Class:** `ConfigServerApplication` — just a Spring Boot app with `@EnableConfigServer`

---

### SERVICE 9: EUREKA DISCOVERY SERVER — Port 8761
**Folder:** `server/`

**What it does:**  
Service registry. Every microservice registers itself (name, IP, port) on startup. When Service A needs to call Service B, it asks Eureka for B's address. Spring Cloud Load Balancer picks an instance if multiple are running.

- Dashboard at `http://localhost:8761` shows all registered services + health
- Services ping Eureka via heartbeat every 30 seconds
- Services cache the registry in memory (so temporary Eureka downtime doesn't break existing calls)

**Key Class:** `ServerApplication` — Spring Boot app with `@EnableEurekaServer`

---

### SERVICE 10: API GATEWAY — Port 8090

*(Detailed above in Section 2.3)*

---

## 4. INTER-SERVICE COMMUNICATION — END-TO-END FLOW

### Complete Order-to-Payment Workflow

```
STEP 1: Create Order
─────────────────────
Client → API Gateway (/orders/addOrder)
  → Order Service:
     - Creates Order (patientId, testIds[], status=CREATED)

STEP 2: Collect Sample
──────────────────────
Client → API Gateway (/orders/collectSample/{orderId})
  → Order Service:
     - Creates Sample (sampleId, collectedAt, collectedBy)
     - Updates Order status: SAMPLE_COLLECTED
     → Lab Processing Service (POST /api/jobs):
        - Creates ProcessingJob (sampleId, testId, status=CREATED)

STEP 3: Process in Lab
──────────────────────
Client → API Gateway (/api/jobs/{id}/start)
  → Lab Processing Service: status = IN_PROGRESS

Client → API Gateway (/api/jobs/processing/{sampleId}/result)
  → Lab Processing Service:
     - Enters Result (value, unit, reference_range)
     - Status = QC_PENDING

STEP 4: Admin Approves Result → TRIGGERS BILLING
─────────────────────────────────────────────────
Client → API Gateway (/api/jobs/processing/{sampleId}/approve)
  → Lab Processing Service:
     - Status = APPROVED
     → Billing Service (POST /billing/generate/{orderId}):
        - Calls Order Service: GET /orders/{orderId}/detail → {patientId, testIds[]}
        - Calls Inventory Service: GET /tests/{id} for each testId → price
        - Calculates total
        - Creates Invoice (status=PENDING, due = today+10 days)
        - Calls Notification Service: "Invoice INV-2024-001 of ₹1300 generated"

STEP 5: Patient Pays
─────────────────────
Client → API Gateway (/payments) { invoiceId, amount, paymentMethod }
  → Billing Service:
     - Creates Payment (always PAID, mocked) + transactionId
     - Updates Invoice: status = PAID
     - Calls Notification: "Payment ₹1300 confirmed. TXN: TXN-2024-0001"
     - Fetches result from LPS: GET /api/jobs/results/by-sample/{sampleId}
     - Calls Notification: "Lab Result: Blood Glucose = 120 mg/dL (70-100)"

STEP 6: Patient Views Notifications
─────────────────────────────────────
Client → GET /notification
  → Patient sees:
     1. "Invoice INV-2024-001 of ₹1300 generated" [INVOICE_GENERATED]
     2. "Payment ₹1300 confirmed. TXN-2024-0001" [PAYMENT_SUCCESS]
     3. "Lab Result: Blood Glucose = 120 mg/dL (Ref: 70-100)" [LAB_RESULT]
```

### Service Call Dependency Map

```
API Gateway ──────────────────────── routes to all

Billing Service calls:
  ├── Order Service        — GET /orders/{orderId}/detail
  ├── Inventory Service    — GET /tests/{id} (per test)
  ├── Patient Service      — GET /patient/by-id/{patientId}
  └── Notification Service — POST /notification

Lab Processing Service calls:
  ├── Billing Service      — POST /billing/generate/{orderId}
  └── Notification Service — POST /notification

Order Service calls:
  └── Lab Processing Service — POST /api/jobs (on sample collection)

User/Auth, Patient, Inventory, Notification, Config, Eureka:
  → No outbound inter-service calls (they receive only)
```

---

## 5. BILLING SERVICE — DEEP DIVE

*(Your personal contribution — extra depth)*

### 5.1 Invoice Generation Logic

```
POST /billing/generate/{orderId}   [ADMIN only]

BillingService.generateInvoice(orderId):
  1. IDEMPOTENCY CHECK:
     If invoice already exists for orderId → throw 409 Conflict
     (prevents duplicate invoices on retry)

  2. FETCH ORDER DETAILS (pull model):
     orderDetail = orderClient.getOrderDetailById(orderId)
     extract: patientId, testIds[]

  3. CALCULATE TOTAL:
     for each testId:
       testResponse = inventoryClient.getTestById(testId)
       total += testResponse.price
     total = sum (BigDecimal)

  4. CREATE INVOICE:
     Invoice {
       invoiceNumber = invoiceNumberGenerator.next()  // "INV-2024-001"
       orderId, patientId, amount = total
       currency = "INR"
       status = PENDING
       dueDate = today + 10 days
     }
     invoiceRepository.save(invoice)

  5. NOTIFY PATIENT:
     notificationClient.send({
       username, message, type: "INVOICE_GENERATED"
     })
     (fails silently via fallback if Notification Service is down)

  Returns: InvoiceResponse (201 Created)
```

### 5.2 Payment Processing (Mocked)

```
POST /payments { invoiceId, amount, paymentMethod }   [PATIENT/ADMIN/RECEPTIONIST]

PaymentService.processPayment(request):
  1. Fetch invoice by ID → 404 if not found
  2. Validate paymentMethod ∈ [CREDIT_CARD, DEBIT_CARD, UPI]
  3. Create Payment (ALWAYS succeeds — mocked):
     Payment {
       invoiceId, amountPaid, paymentMethod
       transactionId = transactionIdGenerator.next()  // "TXN-2024-0001"
       status = PAID  (hardcoded)
       paidAt = now
     }
  4. Update Invoice: status → PAID
  5. Notify: "Payment confirmed. TXN: TXN-2024-0001"
  6. Fetch lab result → notify patient with result details

  Returns: PaymentResponse (201 Created)
```

### 5.3 FeignClients + Fallbacks

All outbound calls use Feign clients with fallbacks, so Billing doesn't crash when downstream services are unavailable:

```java
// If Inventory Service is down → fallback returns price = 0
// (invoice still generates, amount may be 0 — graceful degradation)

@FeignClient(name = "inventory-service", fallback = InventoryClientFallback.class)
public interface InventoryClient {
    @GetMapping("/tests/{id}")
    TestResponse getTestById(@PathVariable Long id);
}

@Component
public class InventoryClientFallback implements InventoryClient {
    @Override
    public TestResponse getTestById(Long id) {
        return new TestResponse(id, "UNKNOWN", BigDecimal.ZERO);  // safe default
    }
}
```

### 5.4 Idempotency Pattern

```
First call:  POST /billing/generate/123  → 201 Created (Invoice created)
Second call: POST /billing/generate/123  → 409 Conflict (InvoiceAlreadyExistsException)
```

This prevents double-billing if Lab Processing Service retries the call.

### 5.5 Exception Handling

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    InvoiceAlreadyExistsException     → 409 Conflict
    ResourceNotFoundException          → 404 Not Found
    InvalidPaymentStateException       → 422 Unprocessable Entity
}
```

### 5.6 Test Coverage

- **BillingServiceTest** (unit, Mockito): 11 tests
  - Happy path invoice generation
  - Missing order / missing test → error
  - Idempotency (duplicate orderId → 409)
  - Notification fallback (silently continues)
  - State transitions (PENDING → PAID, PENDING → CANCELLED)

- **PaymentServiceTest** (unit, Mockito): 8 tests
  - Mocked payment (all methods succeed)
  - Payment history retrieval

- **BillingControllerTest** (@WebMvcTest): 9 tests
  - Role enforcement (only ADMIN can generate invoices)
  - HTTP status codes (201, 400, 403, 404, 409)

- **PaymentControllerTest** (@WebMvcTest): 10 tests
  - Role enforcement, payment method validation
  - HTTP status codes (201, 400, 403, 404, 422)

---

## 6. KEY TECHNOLOGIES — FULL LIST

| Technology | Version | Used By / Purpose |
|---|---|---|
| Java | 21 | All services — programming language |
| Spring Boot | 4.0.5 | All — microservice framework |
| Spring Cloud | 2025.1.1 | Gateway, Config, Discovery, Load Balancer |
| Spring Data JPA + Hibernate | (from Boot 4) | All — ORM / DB access |
| MySQL | 8.0 | All — relational database (one per service) |
| JJWT | 0.11.5 | Auth, Gateway, all services — JWT tokens |
| SpringDoc OpenAPI | 3.0.0 | All — Swagger/OpenAPI docs |
| Lombok | 1.18.36 | All — @Data, @Builder, @Slf4j, etc. |
| Spring Cloud OpenFeign | (from SC) | Billing, LPS — declarative HTTP clients |
| Spring Security | (from Boot 4) | Auth, Billing, all — RBAC enforcement |
| Bean Validation | (from Boot 4) | All — @Valid, @NotNull, etc. |
| JUnit 5 + Mockito | (from Boot 4) | Billing — unit & controller tests |
| Spring Cloud Gateway (WebFlux) | — | API Gateway — reactive, non-blocking |
| Netflix Eureka | (from SC) | All — service discovery |
| Spring Cloud Config | (from SC) | Config Server — centralized configuration |

---

## 7. STARTUP ORDER

Services must start in this order to avoid dependency failures:

```
1. MySQL (database must be up first)
2. Config Server (8888)   — provides config to all
3. Eureka Server (8761)   — all services register here
4. User/Auth Service (8081) — needed for JWT validation
5. Inventory Service (8084) — needed for pricing
6. Order Service (8082)    — needed for order lookups
7. Lab Processing Service (8083)
8. Patient Service (8086)
9. Notification Service
10. Billing Service (8085) — depends on most others
11. API Gateway (8090)     — routes to all, must start last
```

---

## 8. EXAMPLE REQUEST/RESPONSE

### Create Invoice (POST /billing/generate/10)

**Request:**
```http
POST /billing/generate/10
Authorization: Bearer <ADMIN JWT>
```

**What Billing does internally:**
1. Check: no invoice for orderId=10 → OK
2. Fetch order → patientId=1, testIds=[101, 102]
3. Fetch test prices → Blood Glucose: ₹500, Cholesterol: ₹800
4. Create Invoice: ₹1300, status=PENDING, due=2024-06-15

**Response:**
```json
{
  "id": 20,
  "invoiceNumber": "INV-2024-001",
  "orderId": 10,
  "patientId": 1,
  "amount": 1300.00,
  "currency": "INR",
  "status": "PENDING",
  "dueDate": "2024-06-15"
}
```

### Submit Payment (POST /payments)

**Request:**
```json
{
  "invoiceId": 20,
  "amount": 1300.00,
  "paymentMethod": "UPI"
}
```

**Response:**
```json
{
  "id": 30,
  "invoiceId": 20,
  "transactionId": "TXN-2024-0001",
  "status": "PAID",
  "paidAt": "2024-06-05T11:00:00Z"
}
```

---

## 9. POINTS TO MENTION IN INTERVIEW

### What's good (emphasize):
1. **Clean microservices architecture** — 10 independent services, each with own DB
2. **Service discovery via Eureka** — no hardcoded IPs, dynamic routing
3. **JWT-based stateless auth** — shared secret, RBAC with `@PreAuthorize`
4. **Idempotent invoice generation** — prevents duplicate billing on retry
5. **Feign clients with fallbacks** — resilient, billing doesn't crash if one service is down
6. **Full end-to-end workflow** — order → lab → result → invoice → payment → notification
7. **Mocked payment gateway** — practical scoping for internship timeline

### What could be improved (shows critical thinking):
1. **Async messaging** — use Kafka/RabbitMQ for notifications instead of synchronous REST calls
2. **Circuit breaker pattern** — Resilience4j for more robust fault tolerance
3. **Caching** — Redis to cache test prices (Inventory Service is called per test, per invoice)
4. **Distributed transactions** — Saga pattern to handle failures across services
5. **Password hashing** — BCrypt (possible plaintext storage currently)
6. **API rate limiting** — prevent abuse via Gateway
7. **Audit logging** — track sensitive operations system-wide

### Your specific contribution (Billing Service):
- Designed and implemented invoice generation with idempotency guard
- Implemented mocked payment processing with transaction ID generation
- Integrated with Inventory Service (Feign + fallback) for price fetching
- Integrated with Notification Service for patient alerts
- Implemented RBAC (only ADMIN generates invoices; PATIENT/RECEPTIONIST/ADMIN pay)
- Wrote comprehensive tests: unit + controller (27 total tests)

---

## 10. QUICK GLOSSARY

| Term | Meaning in This Project |
|---|---|
| **Eureka** | Service registry — all services register here; others discover by name |
| **API Gateway** | Single entry point — routes, validates JWT, aggregates Swagger |
| **Feign Client** | Spring Cloud's declarative HTTP client for calling other services |
| **Fallback** | What to return when a downstream service is unreachable (graceful degradation) |
| **Idempotent** | Calling the same endpoint twice gives the same result (no side effects) |
| **JWT** | JSON Web Token — signed, stateless auth token carrying username + role |
| **RBAC** | Role-Based Access Control — `@PreAuthorize("hasAuthority('ADMIN')")` etc. |
| **Config Server** | Spring Cloud Config — serves config YAML files to all services at startup |
| **Load Balancer** | Spring Cloud LB — distributes calls across multiple instances of a service |
| **LPS** | Lab Processing Service — the service that manages sample processing jobs |
| **ProcessingJob** | A unit of work: one sample + one test being processed in the lab |
| **Pull Model** | Billing "pulls" order details from Order Service (vs. caller pushing them) |
