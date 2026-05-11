# EXAM RUN GUIDE — MedLab Microservices
**Gateway: `http://localhost:8090` | All calls go through gateway**

---

## STEP 1 — MySQL Workbench: Create Databases

```sql
CREATE DATABASE IF NOT EXISTS auth_db;
CREATE DATABASE IF NOT EXISTS patient_db;
CREATE DATABASE IF NOT EXISTS inventory_db;
CREATE DATABASE IF NOT EXISTS billing;
CREATE DATABASE IF NOT EXISTS medlab;
CREATE DATABASE IF NOT EXISTS lab_processing;
CREATE DATABASE IF NOT EXISTS notification_db;
```

---

## STEP 2 — Start Services (10 separate CMD windows, in order)

> Each window: `cd` → set env vars (if needed) → `mvn spring-boot:run`
> Wait for `Started XxxApplication` before opening the next window.

### Window 1 — Eureka
```cmd
cd C:\Users\2485797\Downloads\Medical-Laboratory-System-2\backend\server
mvn spring-boot:run
```
Verify: http://localhost:8761

### Window 2 — Config Server
```cmd
cd C:\Users\2485797\Downloads\Medical-Laboratory-System-2\backend\config-server
mvn spring-boot:run
```

### Window 3 — Auth Service
```cmd
cd C:\Users\2485797\Downloads\Medical-Laboratory-System-2\backend\auth-service
set DB_URL=jdbc:mysql://localhost:3306/auth_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
set DB_USER=root
set DB_PASSWORD=root
set JWT_SECRET=thisisverysecuresecretkeyforjwttokengenerationandvalidationteam5medlab
mvn spring-boot:run
```

### Window 4 — Patient Service
```cmd
cd C:\Users\2485797\Downloads\Medical-Laboratory-System-2\backend\patient_service
set DB_URL=jdbc:mysql://localhost:3306/patient_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
set DB_USER=root
set DB_PASSWORD=root
set JWT_SECRET=thisisverysecuresecretkeyforjwttokengenerationandvalidationteam5medlab
mvn spring-boot:run
```

### Window 5 — Inventory Service
```cmd
cd C:\Users\2485797\Downloads\Medical-Laboratory-System-2\backend\inventory-service
mvn spring-boot:run
```

### Window 6 — Order Service
```cmd
cd C:\Users\2485797\Downloads\Medical-Laboratory-System-2\backend\order-service
mvn spring-boot:run
```

### Window 7 — Lab Processing Service (LPS)
```cmd
cd C:\Users\2485797\Downloads\Medical-Laboratory-System-2\backend\lab-processing-service
mvn spring-boot:run
```

### Window 8 — Notification Service
```cmd
cd C:\Users\2485797\Downloads\Medical-Laboratory-System-2\backend\Notification_service
set DB_URL=jdbc:mysql://localhost:3306/notification_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
set DB_USER=root
set DB_PASSWORD=root
set JWT_SECRET=thisisverysecuresecretkeyforjwttokengenerationandvalidationteam5medlab
mvn spring-boot:run
```

### Window 9 — Billing Service
```cmd
cd C:\Users\2485797\Downloads\Medical-Laboratory-System-2\backend\billing-service
mvn spring-boot:run
```

### Window 10 — API Gateway (start last)
```cmd
cd C:\Users\2485797\Downloads\Medical-Laboratory-System-2\backend\api-gateway
mvn spring-boot:run
```

**All 9 services must show UP at http://localhost:8761 before proceeding.**

---

## STEP 3 — One-Time DB Setup (fresh database only)

### 3A — Register Users
```
POST http://localhost:8090/auth/register
Content-Type: application/json
{"username":"admin@lab.com","password":"Admin123"}
```
```
POST http://localhost:8090/auth/register
Content-Type: application/json
{"username":"labtech@lab.com","password":"Technician123"}
```
```
POST http://localhost:8090/auth/register
Content-Type: application/json
{"username":"patient@lab.com","password":"Patient123"}
```
Expected all 3: `200 OK` → `User registered successfully`

### 3B — Assign Roles (MySQL Workbench)
```sql
UPDATE auth_db.users SET role = 'ADMIN'    WHERE username = 'admin@lab.com';
UPDATE auth_db.users SET role = 'LAB_TECH' WHERE username = 'labtech@lab.com';
SELECT username, role FROM auth_db.users;
```
Expected: `admin@lab.com | ADMIN`, `labtech@lab.com | LAB_TECH`, `patient@lab.com | PATIENT`

### 3C — Add Lab Test (get ADMIN token first — see Step 4)
```
POST http://localhost:8090/tests
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
{"code":"CBC","name":"Complete Blood Count","price":45.00,"turnaroundHours":24,"description":"Full blood panel"}
```
Expected: `201 Created` → `{"id":1,"code":"CBC","price":45.00,...}`

### 3D — Add Inventory Item (MySQL Workbench)
```sql
INSERT INTO inventory_db.inventory_items (item_name, quantity, unit, description, low_stock_threshold)
SELECT 'CBC Reagent Kit', 20, 'units', 'Reagent kit for CBC test', 10
WHERE NOT EXISTS (SELECT 1 FROM inventory_db.inventory_items WHERE item_name = 'CBC Reagent Kit');
SELECT id, item_name, quantity, low_stock_threshold FROM inventory_db.inventory_items;
```
Expected: `1 | CBC Reagent Kit | 20 | 10`

---

## STEP 4 — Login & Get Tokens (repeat every session / on 401)

```
POST http://localhost:8090/auth/login
Content-Type: application/json
{"username":"admin@lab.com","password":"Admin123"}
```
→ Copy `token` → **ADMIN_TOKEN**

```
POST http://localhost:8090/auth/login
Content-Type: application/json
{"username":"labtech@lab.com","password":"Technician123"}
```
→ Copy `token` → **LABTECH_TOKEN**

```
POST http://localhost:8090/auth/login
Content-Type: application/json
{"username":"patient@lab.com","password":"Patient123"}
```
→ Copy `token` → **PATIENT_TOKEN**

---

## STEP 5 — End-to-End Happy Path

### 5.1 — Create Patient Profile
```
POST http://localhost:8090/patient/addProfile
Authorization: Bearer <PATIENT_TOKEN>
Content-Type: application/json
{"firstName":"John","lastName":"Doe","age":35,"gender":"MALE","phoneNumber":"9876543210","email":"john@example.com","address":"123 Main Street"}
```
Expected: `200 OK` → `Profile created successfully.`

**Verify (SQL):**
```sql
SELECT id, username FROM patient_db.patient;
```
Expected: `1 | patient@lab.com`

### 5.2 — Place Order
```
POST http://localhost:8090/orders/addOrder
Authorization: Bearer <PATIENT_TOKEN>
Content-Type: application/json
{"tests":[1],"requestedBy":1,"priority":"ROUTINE"}
```
Expected: `201 Created` → `{"orderId":1,"orderNumber":"ORD-...","status":"CREATED","priority":"ROUTINE"}`

**Verify (SQL):**
```sql
SELECT id, order_number, status, priority FROM medlab.orders;
SELECT order_id, test_id FROM medlab.order_tests;
```
Expected: `1 | ORD-... | CREATED | ROUTINE` + `1 | 1`

**Verify ORDER_PLACED notification (SQL):**
```sql
SELECT username, type, message FROM notification_db.notification WHERE type = 'ORDER_PLACED';
```
Expected: 1 row — message contains order number and `₹45.00`

### 5.3 — Collect Sample
```
POST http://localhost:8090/orders/collectSample/1?collectedBy=1
Authorization: Bearer <ADMIN_TOKEN>
```
Expected: `200 OK` → `Sample collected successfully`

**Verify (SQL):**
```sql
SELECT id, order_id, collected_by FROM medlab.samples;
SELECT id, status FROM medlab.orders WHERE id = 1;
SELECT id, sample_id, test_id, status FROM lab_processing.processing_jobs;
```
Expected: `samples: 1|1|1` — `orders: 1|SAMPLE_COLLECTED` — `processing_jobs: 1|1|1|CREATED`

**Verify via API:**
```
GET http://localhost:8090/orders/viewOrder/1
Authorization: Bearer <PATIENT_TOKEN>
```
Expected: `200 OK` → `"status":"SAMPLE_COLLECTED"`

### 5.4 — Start Processing
```
POST http://localhost:8090/api/jobs/1/start
Authorization: Bearer <LABTECH_TOKEN>
```
Expected: `200 OK` → `{"id":1,"sampleId":1,"testId":1,"status":"IN_PROCESS",...}`

### 5.5 — Mark QC Pending
```
POST http://localhost:8090/api/jobs/1/qc
Authorization: Bearer <LABTECH_TOKEN>
```
Expected: `200 OK` → `{"id":1,"status":"QC_PENDING",...}`

### 5.6 — Enter Test Result
```
POST http://localhost:8090/api/jobs/processing/1/result
Authorization: Bearer <LABTECH_TOKEN>
Content-Type: application/json
{"testId":1,"result":"{\"value\":5.6,\"unit\":\"mg/dL\"}","enteredBy":1}
```
Expected: `200 OK` → `Result entered successfully`

**Verify (SQL):**
```sql
SELECT id, result, status FROM lab_processing.results;
```
Expected: `1 | {"value":5.6,"unit":"mg/dL"} | ENTERED`

### 5.7 — Approve Result (triggers full billing chain)
```
PUT http://localhost:8090/api/jobs/processing/1/approve
Authorization: Bearer <ADMIN_TOKEN>
```
Expected: `200 OK` → `Result approved successfully`

**Verify invoice (SQL):**
```sql
SELECT id, invoice_number, order_id, patient_id, amount, status, due_date FROM billing.invoices;
```
Expected: `1 | INV-2026-0001 | 1 | 1 | 45.00 | PENDING | (10 days from today)`

**Verify INVOICE_GENERATED notification (SQL):**
```sql
SELECT username, type, message FROM notification_db.notification WHERE type = 'INVOICE_GENERATED';
```
Expected: `patient@lab.com | INVOICE_GENERATED | Your test result has been approved. Invoice INV-2026-0001 of ₹45.00...`

**Verify via API (patient sees notification):**
```
GET http://localhost:8090/notification
Authorization: Bearer <PATIENT_TOKEN>
```
Expected: array with 1 notification of type `INVOICE_GENERATED`

### 5.8 — View Invoice
```
GET http://localhost:8090/invoices/1
Authorization: Bearer <PATIENT_TOKEN>
```
Expected: `200 OK` → `{"id":1,"invoiceNumber":"INV-2026-0001","orderId":1,"patientId":1,"amount":45.00,"currency":"INR","status":"PENDING","dueDate":"2026-04-27"}`

### 5.9 — Make Payment
```
POST http://localhost:8090/payments
Authorization: Bearer <PATIENT_TOKEN>
Content-Type: application/json
{"invoiceId":1,"paymentMethod":"UPI","amount":45.00}
```
Expected: `201 Created` → `{"transactionId":"TXN-...","invoiceId":1,"amount":45.00,"paymentMethod":"UPI","paymentStatus":"PAID","paidAt":"...","message":"Payment successful. Transaction ID: TXN-..."}`

**Verify invoice PAID (SQL):**
```sql
SELECT invoice_number, amount, status FROM billing.invoices WHERE id = 1;
```
Expected: `INV-2026-0001 | 45.00 | PAID`

**Verify payment record (SQL):**
```sql
SELECT invoice_id, amount_paid, payment_method, transaction_id, status, paid_at FROM billing.payments;
```
Expected: `1 | 45.00 | UPI | TXN-... | PAID | (timestamp)`

**Verify all 3 notifications (SQL):**
```sql
SELECT username, type, message FROM notification_db.notification ORDER BY id;
```
Expected:
```
patient@lab.com | INVOICE_GENERATED | Your test result has been approved. Invoice INV-2026-0001...
patient@lab.com | PAYMENT_SUCCESS   | Payment of ₹45.00 via UPI was successful. Transaction ID: TXN-...
patient@lab.com | LAB_RESULT        | Your lab test result is ready! Test #1 result: {"value":5.6,"unit":"mg/dL"}...
```

**Verify via API:**
```
GET http://localhost:8090/notification
Authorization: Bearer <PATIENT_TOKEN>
```
Expected: array of 3 notifications (INVOICE_GENERATED + PAYMENT_SUCCESS + LAB_RESULT)

### 5.10 — Double Payment Guard
```
POST http://localhost:8090/payments
Authorization: Bearer <PATIENT_TOKEN>
Content-Type: application/json
{"invoiceId":1,"paymentMethod":"CREDIT_CARD","amount":45.00}
```
Expected: `422 Unprocessable Entity` → `Invoice INV-2026-0001 is already PAID.`

---

## STEP 6 — Edge Case Tests

### 6.1 — QC Auto-Flag (abnormal value)
> Prerequisite: create a 2nd order → collectSample/2 → api/jobs/2/start → api/jobs/2/qc, then:
```
POST http://localhost:8090/api/jobs/processing/2/result
Authorization: Bearer <LABTECH_TOKEN>
Content-Type: application/json
{"testId":1,"result":"{\"value\":150.0,\"unit\":\"mg/dL\"}","enteredBy":1}
```
Expected: `200 OK` → `Result entered successfully`

**Verify QC flag (SQL):**
```sql
SELECT job_id, remarks, qc_status FROM lab_processing.qc_records;
```
Expected: `2 | Abnormal result value detected: 150.0 | FAILED`

### 6.2 — Low-Stock Alert (admin-only, patient must NOT receive)
```
POST http://localhost:8090/inventory/adjust
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
{"itemId":1,"quantityChange":-15,"reason":"Used for test batch"}
```
Expected: `200 OK` → `{"id":1,"itemName":"CBC Reagent Kit","quantity":5,"unit":"units","lowStockThreshold":10,"lowStock":true}`

**Verify admin got LOW_STOCK_ALERT (SQL):**
```sql
SELECT username, message, type FROM notification_db.notification WHERE type = 'LOW_STOCK_ALERT';
```
Expected: `admin@lab.com | Low stock alert: 'CBC Reagent Kit' has only 5 units remaining (threshold: 10)... | LOW_STOCK_ALERT`

**Verify patient did NOT receive LOW_STOCK_ALERT:**
```
GET http://localhost:8090/notification
Authorization: Bearer <PATIENT_TOKEN>
```
Expected: only `INVOICE_GENERATED` / `PAYMENT_SUCCESS` / `LAB_RESULT` — NO `LOW_STOCK_ALERT`

**No alert when stock is above threshold (restock):**
```
POST http://localhost:8090/inventory/adjust
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
{"itemId":1,"quantityChange":20,"reason":"Restock"}
```
Expected: `200 OK` → `{"quantity":25,"lowStock":false,...}` — no notification sent

### 6.3 — RBAC: Inventory / Tests
**PATIENT blocked from creating tests:**
```
POST http://localhost:8090/tests
Authorization: Bearer <PATIENT_TOKEN>
Content-Type: application/json
{"code":"X","name":"X","price":10,"turnaroundHours":1,"description":"X"}
```
Expected: `403 Forbidden`

**ADMIN can create tests:**
```
POST http://localhost:8090/tests
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
{"code":"LFT","name":"Liver Function Test","price":75.00,"turnaroundHours":48,"description":"Liver panel"}
```
Expected: `201 Created`

**Everyone can view tests:**
```
GET http://localhost:8090/tests
Authorization: Bearer <PATIENT_TOKEN>
```
Expected: `200 OK` → array of tests

### 6.4 — RBAC: Auth-Service Admin Endpoints
**Only ADMIN can see all users:**
```
GET http://localhost:8090/admin/users
Authorization: Bearer <ADMIN_TOKEN>
```
Expected: `200 OK` → list of all registered users

```
GET http://localhost:8090/admin/users
Authorization: Bearer <PATIENT_TOKEN>
```
Expected: `403 Forbidden`

**Only ADMIN can create lab techs via API:**
```
POST http://localhost:8090/admin/create-lab-tech
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
{"username":"labtech2@lab.com","password":"Tech456"}
```
Expected: `200 OK` → `Lab Technician Created`

```
POST http://localhost:8090/admin/create-lab-tech
Authorization: Bearer <LABTECH_TOKEN>
Content-Type: application/json
{"username":"someone@lab.com","password":"pass"}
```
Expected: `403 Forbidden`

**Only LAB_TECH can upload reports:**
```
POST http://localhost:8090/labTech/upload
Authorization: Bearer <LABTECH_TOKEN>
```
Expected: `200 OK` → `Report Uploaded`

```
POST http://localhost:8090/labTech/upload
Authorization: Bearer <PATIENT_TOKEN>
```
Expected: `403 Forbidden`

### 6.5 — Direct Billing (bypasses LPS flow)
```
POST http://localhost:8090/billing/generate/9001
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
{"patientId":1,"testIds":[1]}
```
Expected: `201 Created`
```json
{"id":2,"invoiceNumber":"INV-2026-0002","orderId":9001,"patientId":1,"amount":45.00,"status":"PENDING"}
```
`amount = 45.00` confirms Billing → Inventory price lookup works

### 6.6 — Internal Endpoint Verification
**Order by-sample (ADMIN/LAB_TECH only):**
```
GET http://localhost:8090/orders/by-sample/1
Authorization: Bearer <ADMIN_TOKEN>
```
Expected: `200 OK` → `{"orderId":1,"patientId":1,"testIds":[1]}`

**Patient lookup by id (ADMIN/LAB_TECH only):**
```
GET http://localhost:8090/patient/by-id/1
Authorization: Bearer <ADMIN_TOKEN>
```
Expected: `200 OK` → full patient object including `"username":"patient@lab.com"`

**PATIENT blocked from internal endpoints:**
```
GET http://localhost:8090/orders/by-sample/1
Authorization: Bearer <PATIENT_TOKEN>
```
Expected: `403 Forbidden`

### 6.7 — Notification Broadcast (admin only)
```
POST http://localhost:8090/notification/broadcast
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
{"message":"System maintenance tonight at 10pm"}
```
Expected: `200 OK` → `Broadcast notification sent successfully!`

```
POST http://localhost:8090/notification/broadcast
Authorization: Bearer <PATIENT_TOKEN>
Content-Type: application/json
{"message":"test"}
```
Expected: `403 Forbidden`

### 6.8 — Invoice Idempotency Guard
```
POST http://localhost:8090/billing/generate/1
Authorization: Bearer <ADMIN_TOKEN>
```
Expected: `409 Conflict` → `Invoice already exists for orderId=1 → INV-2026-0001`

### 6.9 — Unauthenticated Request
```
GET http://localhost:8090/orders/viewOrder/1
```
Expected: `401 Unauthorized`

### 6.10 — ORDER_CANCELLED Notification
```
POST http://localhost:8090/orders/addOrder
Authorization: Bearer <PATIENT_TOKEN>
Content-Type: application/json
{"tests":[1],"requestedBy":1,"priority":"ROUTINE"}
```
Note the `orderId` from response, then:
```
POST http://localhost:8090/orders/cancelOrder/<orderId>
Authorization: Bearer <PATIENT_TOKEN>
```
Expected: `200 OK` → `Order cancelled successfully`

**Verify (SQL):**
```sql
SELECT username, type, message FROM notification_db.notification
WHERE username = 'patient@lab.com' AND type = 'ORDER_CANCELLED';
```
Expected: 1+ rows — message contains order number and support contact note

### 6.11 — Payment: Wrong Amount (400)
> Uses invoice id=2 from section 6.5 (amount = ₹45)
```
POST http://localhost:8090/payments
Authorization: Bearer <PATIENT_TOKEN>
Content-Type: application/json
{"invoiceId":2,"paymentMethod":"UPI","amount":99.00}
```
Expected: `400 Bad Request` → `Payment amount ₹99 does not match invoice amount ₹45.00. Please pay the exact invoice amount.`

### 6.12 — Payment: Card Transaction Limit (422)
> Create expensive test via SQL first:
```sql
INSERT INTO inventory_db.tests (code, name, price, turnaround_hours, description)
VALUES ('EXP', 'Expensive Test', 50000.00, 24, 'For card limit testing');
```
> Place order with that test id → collectSample → start → qc → enter result → approve → invoice generated, then:
```
POST http://localhost:8090/payments
Authorization: Bearer <PATIENT_TOKEN>
Content-Type: application/json
{"invoiceId":<expInvoiceId>,"paymentMethod":"CREDIT_CARD","amount":50000.00}
```
Expected: `422 Unprocessable Entity` → `CREDIT_CARD transaction declined: amount ₹50000 exceeds card transaction limit of ₹40000. Please use UPI or split the payment.`

### 6.13 — Payment: Correct Amount + UPI (201 PAID)
> Pay invoice id=2 (amount = ₹45, currently PENDING from section 6.5)
```
POST http://localhost:8090/payments
Authorization: Bearer <PATIENT_TOKEN>
Content-Type: application/json
{"invoiceId":2,"paymentMethod":"UPI","amount":45.00}
```
Expected: `201 Created` → `{"paymentStatus":"PAID",...}`

**Verify LAB_RESULT notification (SQL):**
```sql
SELECT username, type, message FROM notification_db.notification WHERE type = 'LAB_RESULT';
```
Expected: `patient@lab.com | LAB_RESULT | Your lab test result is ready! Test #1 result: {"value":5.6,"unit":"mg/dL"}  Please consult your doctor for interpretation.`

**Verify via API:**
```
GET http://localhost:8090/notification
Authorization: Bearer <PATIENT_TOKEN>
```
Expected: response includes notification with `"type":"LAB_RESULT"` containing actual result JSON

---

## STEP 7 — Fallback / Resilience Tests

### 7.1 — LPS Down During collectSample
Stop LPS (close Window 7), then:
```
POST http://localhost:8090/orders/collectSample/2?collectedBy=1
Authorization: Bearer <ADMIN_TOKEN>
```
Expected: `200 OK` → `Sample collected successfully`

**What happens:** Sample saved + order → `SAMPLE_COLLECTED` ✅. LPS Feign call fails → fallback logs `Failed to create LPS job for sampleId=2 testId=1`. No `processing_jobs` row for sampleId=2.

**Verify (SQL):**
```sql
SELECT id, order_id FROM medlab.samples;
SELECT id, status FROM medlab.orders WHERE id = 2;
SELECT sample_id FROM lab_processing.processing_jobs;
```
Expected: sample row exists, order `SAMPLE_COLLECTED`, NO processing_job for sampleId=2

Restart LPS, then create job manually:
```
POST http://localhost:8090/api/jobs
Authorization: Bearer <LABTECH_TOKEN>
Content-Type: application/json
{"sampleId":2,"testId":1}
```

### 7.2 — Order Service Down During approveResult
Stop order-service (close Window 6), then:
```
PUT http://localhost:8090/api/jobs/processing/1/approve
Authorization: Bearer <ADMIN_TOKEN>
```
Expected: `200 OK` → `Result approved successfully`

**What happens:** Result → `APPROVED`, job → `COMPLETED` ✅. OrderClient fallback returns null → LPS uses sampleId as orderId/patientId proxy. Invoice created with degraded data (patientId = sampleId). LPS console: `OrderService unavailable — using sampleId as orderId/patientId proxy`.

**Verify (SQL):**
```sql
SELECT id, result, status FROM lab_processing.results;
SELECT id, order_id, patient_id, amount FROM billing.invoices ORDER BY id DESC LIMIT 1;
```
Expected: result `APPROVED`, invoice created (amount may be 45.00 if Inventory reachable)

### 7.3 — Inventory Service Down During Invoice Generation
Stop inventory-service (close Window 5), then:
```
POST http://localhost:8090/billing/generate/9002
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
{"patientId":1,"testIds":[1]}
```
Expected: `201 Created`

**What happens:** Billing console: `WARN Could not fetch price for testId=1 (InventoryService unavailable)`. Invoice created with `amount = 0.00`.

**Verify (SQL):**
```sql
SELECT invoice_number, order_id, amount FROM billing.invoices WHERE order_id = 9002;
```
Expected: `INV-2026-... | 9002 | 0.00`

### 7.4 — Notification Service Down During Invoice/Payment
Stop notification-service (close Window 8), then:
```
PUT http://localhost:8090/api/jobs/processing/1/approve
Authorization: Bearer <ADMIN_TOKEN>
```
Expected: `200 OK` → invoice created successfully

**What happens:** Invoice generates with correct amount ✅. NotificationClient fails → fallback: `[FALLBACK] Notification_service unreachable — notification not sent`. Patient does not receive INVOICE_GENERATED, but invoice is unaffected.

**Verify invoice still created correctly (SQL):**
```sql
SELECT invoice_number, amount, status FROM billing.invoices ORDER BY id DESC LIMIT 1;
```
Expected: invoice with correct amount, NO new notification row for it

### 7.5 — Notification Service Down During Low-Stock Alert
Stop notification-service (close Window 8), then:
```
POST http://localhost:8090/inventory/adjust
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
{"itemId":1,"quantityChange":-5,"reason":"Test"}
```
Expected: `200 OK` → `{"lowStock":true,...}`

**What happens:** Stock saves to DB ✅. NotificationClient fails → fallback logs: `[FALLBACK] Notification_service unreachable — low-stock alert NOT sent. Details: username=admin@lab.com | message=Low stock alert...`

**Verify stock saved but no new notification (SQL):**
```sql
SELECT id, item_name, quantity FROM inventory_db.inventory_items WHERE id = 1;
SELECT COUNT(*) FROM notification_db.notification WHERE type = 'LOW_STOCK_ALERT';
```
Expected: quantity reduced, notification count unchanged

---

## Quick Reference: Ports & Eureka Names

| Service Folder | Port | Eureka Name |
|---|---|---|
| server | 8761 | — |
| config-server | 8888 | CONFIG-SERVER |
| auth-service | 8081 | USER-SERVICE |
| patient_service | 8086 | PATIENT-SERVICE |
| inventory-service | 8084 | INVENTORY-SERVICE |
| order-service | 8082 | ORDER-SERVICE |
| lab-processing-service | 8083 | LPS |
| Notification_service | 8087 | NOTIFICATION-SERVICE |
| billing-service | 8085 | BILLING-SERVICE |
| api-gateway | 8090 | API-GATEWAY |
