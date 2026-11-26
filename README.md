# Veritix — Anti-Scam Escrow & Geo-Verified Event Ticketing Platform

> **Enterprise-Grade Distributed Event Ticketing & Financial Escrow System**  
> Engineered for native bare-metal OS execution (Windows / Linux / macOS) with zero Docker/Kubernetes container overhead. Guarantees **zero overselling under 1,000+ concurrent requests** via database-level pessimistic row locking, financial integrity through an immutable double-entry ledger, and physical venue presence verification through mobile GPS telemetry and camera EXIF inspection.

---

## 1. Project Overview & Core Guarantees

Veritix solves the systemic vulnerabilities of event ticketing—phantom/empty venues, ticket overselling, and scam cancellations—by decoupling ticket purchases from immediate host payouts. All attendee ticket funds remain locked in an automated escrow vault until physical venue legitimacy is established.

### The Three Architectural Pillars

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                VERITIX THREE PILLARS                                   │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ 1. Escrow-Locked Ledger  │ 2. Pessimistic Inventory    │ 3. Forensic Anti-Fraud Engine │
│    Double-Entry Audit    │    Concurrency Control      │    GPS + Camera EXIF Proof    │
│    event_end_time + 12h  │    SELECT ... FOR UPDATE    │    <= 300m Haversine Radius   │
│    Zero-Sum Invariant    │    Zero Overselling Guarantee│   Crowd-Consensus Auto-Freeze │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

1. **Escrow-Locked Double-Entry Financial Ledger**:
   - Ticket purchase funds do not go directly to the organizer. Proceeds are credited to an escrow vault account (`ESCROW_POOL_EVENT_{id}`) and locked with an irrevocable hold until `event_end_time + 12 hours` (`43,200` seconds default).
   - Every monetary transaction produces balanced, immutable credit/debit records across six ledger entry types:
     - `TICKET_SALE_HELD`: Attendee funds locked into the event escrow vault.
     - `PLATFORM_COMMISSION`: Platform revenue deduction (default `10%`).
     - `GATEWAY_PROCESSING_FEE`: Payment processor transaction fee deduction (default `2%`).
     - `ESCROW_RELEASE`: Payout dispatched to the host's linked account after clearance.
     - `DISPUTE_FREEZE`: Funds frozen in escrow upon suspicion or confirmed fraud.
     - `AUTO_REFUND`: Batch attendee refund returned to original payment methods.
   - The double-entry invariant is strictly enforced:  
     $$\text{Gross Sales} = \text{Platform Fee} + \text{Gateway Fee} + \text{Net Host Payout}$$

2. **Pessimistic Inventory Concurrency Control**:
   - Standard optimistic locking (`@Version`) fails under high-concurrency ticket stampedes due to rollbacks. Veritix executes an explicit database row lock:
     ```sql
     SELECT * FROM ticket_tiers WHERE id = :tierId FOR UPDATE;
     ```
   - Concurrent reservation requests are serialized in PostgreSQL. The system enforces:
     $$\text{reserved\_count} + \text{sold\_count} \le \text{total\_capacity}$$
   - Every booking carries a unique `idempotency_key` (UUID v4) enforced by a `UNIQUE` database constraint, guaranteeing that double-clicks or network retries never create duplicate tickets or charge attendees twice.

3. **Geo-Spatial & Forensic Anti-Fraud Engine**:
   - **Haversine Geofencing**: Check-in requires attendees to be within `300` meters of the venue coordinates (`venue_latitude`, `venue_longitude`). Device GPS readings with accuracy error margins $> 150$ meters are rejected to prevent low-accuracy location spoofing.
   - **Pillow Camera EXIF Validation**: Anti-scam reports capture live venue photos using mobile camera inputs (`capture="environment"`). Python Pillow parses EXIF tags:
     - Tag `271` (`Make`) & Tag `272` (`Model`): Confirms authentic camera hardware.
     - Tag `36867` (`DateTimeOriginal`): Validates capture timestamp freshness ($< 24\text{ hours}$ old). Screenshots and web downloads lacking EXIF tags are flagged as `SUSPECT_METADATA_MISSING`.
   - **Crowd-Consensus Auto-Freeze**:
     $$\text{Dispute Ratio} = \frac{\text{Unique Verified Reporters}}{\text{Total Sold Tickets}} \ge 0.25 \quad (25\%)$$
     $$\text{Check-In Ratio} = \frac{\text{Checked-In Tickets}}{\text{Total Sold Tickets}} \le 0.30 \quad (30\%)$$
     When $\ge 3$ verified attendees submit evidence matching these thresholds, the event and escrow payout are automatically locked into `FROZEN_DISPUTE` without requiring human admin intervention, and the background worker prepares automated refunds.

---

## 2. System Architecture

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (Browser / Mobile PWA)"]
        UI["React 18 + Vite (Port 5173)\nTailwind CSS Editorial UI"]
        Cam["HTML5 Camera API\n(capture='environment')"]
        Geo["Browser Geolocation API\n(High-Accuracy GPS)"]
    end

    subgraph CoreBackend ["Core Financial & RBAC Service (Java 21 / Spring Boot 3.3.5)"]
        Spring["Spring Security + JJWT (Port 8080)"]
        BookService["TicketBookingService\n(@Lock PESSIMISTIC_WRITE)"]
        Ledger["LedgerService\n(Double-Entry Audit)"]
        RzpRoute["RazorpayRouteService\n(Split Hold & Webhook HMAC)"]
        Hikari["HikariCP Pool\n(50 max connections)"]
    end

    subgraph FraudEngine ["Fraud & Settlement Microservice (Python 3.11+ / FastAPI)"]
        FastAPI["FastAPI App (Port 8000)"]
        ExifParser["Pillow EXIF Validator\n(Make, Model, DateTimeOriginal)"]
        Haversine["Haversine Geofence Engine\n(<= 300m, Accuracy <= 150m)"]
        Scheduler["APScheduler Loop (60s tick)\n(Hold Release & Auto-Refunds)"]
    end

    subgraph DataLayer ["Data Storage (PostgreSQL 16)"]
        DB[("PostgreSQL 16 (Port 5432)\nDatabase: antiscam_ticketing")]
        Settings[("system_settings Table\nDynamic Runtime Configuration")]
    end

    subgraph ExternalGateway ["Payment Gateway"]
        RZP["Razorpay Route / Linked Accounts\n(acc_xxx & Split Orders)"]
    end

    %% Client Interactions
    UI -->|"Auth & Booking (REST / JWT)"| Spring
    Cam -->|"Photo Upload (Multipart)"| FastAPI
    Geo -->|"GPS Telemetry (lat, lon, acc)"| FastAPI
    UI -.->|"Razorpay Checkout SDK"| RZP

    %% Java Core Interactions
    Spring --> BookService
    BookService --> Ledger
    BookService --> RzpRoute
    BookService --> Hikari
    Hikari -->|"SQL (SELECT FOR UPDATE)"| DB
    Spring -->|"Load Dynamic Settings"| Settings

    %% Python Microservice Interactions
    FastAPI --> ExifParser
    FastAPI --> Haversine
    FastAPI -->|"Audit Invariants & Updates"| DB
    Scheduler -->|"Release Matured Payouts"| DB
    Scheduler -->|"Process Batch Refunds"| DB
    Scheduler -->|"Query Dynamic Thresholds"| Settings

    %% Webhook Verification
    RZP -->|"HMAC-SHA256 Webhook"| Spring
```

---

## 3. Prerequisites & Exact Version Matrix

Verify your environment before starting. All services run natively on host processes without virtualized containers:

| Technology | Minimum Version | Tested Version | Verification Command | Required Role |
| :--- | :--- | :--- | :--- | :--- |
| **Java SDK** | `21 LTS` | `21.0.12.1-tem` | `java -version` | Core Backend runtime |
| **Apache Maven**| `3.9.0+` | `3.9.16` | `mvn -v` | Backend build tool |
| **Python** | `3.11+` | `3.13.6` | `python --version` | Geo & Fraud Microservice |
| **Node.js** | `18.0.0+` | `24.13.0` | `node -v` | Frontend build & runtime |
| **npm** | `9.0.0+` | `11.3.0` | `npm -v` | Frontend package manager |
| **PostgreSQL** | `16.0+` | `16.x / 18.x` | `psql --version` | Relational database engine |
| **PowerShell** | `5.1+` | `7.x / 5.1` | `$PSVersionTable.PSVersion` | Windows startup & test execution |

---

## 4. Step-by-Step Installation & Database Setup

### Step 4.1: PostgreSQL Database Initialization

1. Ensure the PostgreSQL service is running on `localhost:5432`.
2. Add PostgreSQL `bin` to your environment `PATH` (on Windows, typically `C:\Program Files\PostgreSQL\16\bin`).
3. Create the database and execute the schema and seed scripts:

```powershell
# Windows PowerShell
$env:PGPASSWORD = "postgres"
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE antiscam_ticketing;"
psql -U postgres -h localhost -p 5432 -d antiscam_ticketing -f "database\schema.sql"
psql -U postgres -h localhost -p 5432 -d antiscam_ticketing -f "database\seed_settings.sql"
Remove-Item Env:PGPASSWORD
```

```bash
# Linux / macOS Bash
export PGPASSWORD=postgres
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE antiscam_ticketing;"
psql -U postgres -h localhost -p 5432 -d antiscam_ticketing -f database/schema.sql
psql -U postgres -h localhost -p 5432 -d antiscam_ticketing -f database/seed_settings.sql
unset PGPASSWORD
```

---

### Step 4.2: Environment Configuration (`.env`)

A master template is provided in [`.env.example`](file:///d:/per-por/nikunj_bhaiya/.env.example). Ensure [`.env`](file:///d:/per-por/nikunj_bhaiya/.env) exists in the repository root:

```ini
# Database Settings (PostgreSQL 16)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=antiscam_ticketing
DB_USER=postgres
DB_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/antiscam_ticketing

# Java Spring Boot Service Settings
SERVER_PORT=8080
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/antiscam_ticketing
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres
SPRING_DATASOURCE_HIKARI_MAX_POOL_SIZE=50
SPRING_DATASOURCE_HIKARI_MIN_IDLE=10
SPRING_DATASOURCE_HIKARI_IDLE_TIMEOUT=30000
SPRING_DATASOURCE_HIKARI_CONNECTION_TIMEOUT=20000

# Security & Authentication (JWT 256-bit Hex Key)
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
JWT_EXPIRATION_MS=86400000
JWT_REFRESH_EXPIRATION_MS=604800000
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# Payment Gateway (Razorpay Route / Linked Account Escrow)
RAZORPAY_KEY_ID=rzp_test_antiscam_key_id
RAZORPAY_KEY_SECRET=rzp_test_antiscam_secret_val
RAZORPAY_WEBHOOK_SECRET=rzp_webhook_secret_signature_test
RAZORPAY_SIMULATION_MODE=true

# Python FastAPI & APScheduler Geo/Fraud Service
PYTHON_PORT=8000
PYTHON_SERVICE_URL=http://localhost:8000
PYTHON_DB_URL=postgresql://postgres:postgres@localhost:5432/antiscam_ticketing
SCHEDULER_INTERVAL_SECONDS=60
SCHEDULER_ENABLED=true

# Dynamic Escrow & Fraud Default Parameters (Also seeded into system_settings)
DEFAULT_PLATFORM_COMMISSION_PERCENT=10.0
DEFAULT_ESCROW_HOLD_DURATION_SECONDS=43200
DEFAULT_GEOFENCE_RADIUS_METERS=300.0
DEFAULT_GPS_ACCURACY_CEILING_METERS=150.0
DEFAULT_DISPUTE_THRESHOLD_RATIO=0.25
DEFAULT_MIN_DISPUTE_REPORTERS=3
DEFAULT_MAX_CHECKIN_RATIO_FOR_DISPUTE=0.30

# React Frontend Environment Variables
VITE_API_URL=http://localhost:8080
VITE_PYTHON_SERVICE_URL=http://localhost:8000
VITE_RAZORPAY_KEY_ID=rzp_test_antiscam_key_id
VITE_PORT=5173
```

---

### Step 4.3: Dependency Installation Across All Services

Execute the following commands from the repository root:

1. **Java Spring Boot Core**:
   ```powershell
   mvn -f backend-java\pom.xml clean compile
   ```
2. **Python Geo & Settlement Service**:
   ```powershell
   # Clean up any broken Windows certificate variables if present
   $env:CURL_CA_BUNDLE = $null
   $env:SSL_CERT_FILE = $null
   pip install -r service-python\requirements.txt
   ```
3. **React Frontend**:
   ```powershell
   cd frontend-react
   npm install
   npm run build
   cd ..
   ```

---

## 5. How to Run the Platform

### Option A: Automated One-Command Startup (Recommended)

To launch all three services simultaneously on local OS processes:

```powershell
# Windows PowerShell
.\start-all.ps1
```

```bash
# Linux / macOS Bash
chmod +x start-all.sh stop-all.sh
./start-all.sh
```

To gracefully stop all services and free ports `8080`, `8000`, and `5173`:
```powershell
.\stop-all.ps1
```

---

### Option B: Manual Startup in Separate Terminals (For Debugging)

#### Terminal 1 — Python Geo & Settlement Microservice (Port 8000)
```powershell
cd service-python
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
*Health Check*: `http://localhost:8000/api/geo/health`  
*Expected Output*:
```json
{
  "service": "Python Geo-Verification, EXIF Fraud Engine & APScheduler",
  "status": "UP",
  "scheduler_enabled": true,
  "scheduler_interval": 60
}
```

#### Terminal 2 — Java Spring Boot Core Financial Backend (Port 8080)
```powershell
cd backend-java
mvn spring-boot:run
```
*Health Check*: `http://localhost:8080/api/health`  
*Expected Output*:
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    "service": "Anti-Scam Event Ticketing Core Financial & RBAC Service",
    "status": "UP",
    "database": "PostgreSQL 16",
    "concurrencyProtection": "Pessimistic DB Row Locking (Zero Overselling)",
    "financialEngine": "Double-Entry Immutable Audit Ledger",
    "timestamp": 1772074312000
  }
}
```

#### Terminal 3 — React 18 + Vite Frontend Application (Port 5173)
```powershell
cd frontend-react
npm run dev
```
*Access URL*: `http://localhost:5173`

---

## 6. Default Seeded Accounts & Role Workflows

All test accounts share the default password: **`Password123!`**

| Role | Email | Password | Primary Capabilities & Interfaces |
| :--- | :--- | :--- | :--- |
| **Platform Admin** | `admin@antiscam.io` | `Password123!` | `/admin` (KYC & Event Approvals), `/admin/disputes` (Photo evidence inspection, force-freeze/release overrides), `/admin/settings` (Live dynamic config), `/admin/ledger` (Audit ledger) |
| **Verified Host** | `host.verified@techfest.in` | `Password123!` | `/host/events` (Studio & countdown timer), `/host/kyc` (PAN/Bank linked account), `/host/create-event` (Markdown editor + venue pinpicker), Self-service cancellation |
| **Attendee 1** | `attendee1@gmail.com` | `Password123!` | `/wallet` (QR ticket passes), `/checkin/{id}` (GPS venue check-in), `/report/{id}` (Camera EXIF fraud reporting) |
| **Attendee 2** | `attendee2@gmail.com` | `Password123!` | Second verified buyer for crowd-consensus dispute testing |
| **Attendee 3** | `attendee3@gmail.com` | `Password123!` | Third verified buyer triggering the automated crowd fraud freeze |

### End-to-End Operational Lifecycle
1. **Host Onboarding**: Organizer submits PAN, bank account, IFSC, and entity type (`POST /api/host/kyc`). A Razorpay Route Linked Account (`acc_xxx`) is generated.
2. **Admin KYC Verification**: Admin reviews documentation and approves the host (`POST /api/admin/verify-kyc/{id}?approve=true`).
3. **Event Creation**: Verified host drafts an event with venue coordinates, ticket tiers, and booking proof (`POST /api/events`).
4. **Event Approval**: Admin inspects the venue booking deed and approves the event to `VERIFIED_LIVE`.
5. **Attendee Booking**:
   - `POST /api/bookings/initiate` acquires a pessimistic row lock (`SELECT ... FOR UPDATE`), decrements availability, and creates a Razorpay Route split hold order.
   - `POST /api/bookings/verify` verifies the signature, issues a cryptographically signed HMAC QR ticket, and logs balanced entries into the double-entry financial ledger.
6. **Physical Verification**:
   - **Legitimate Event**: Attendee checks in within $300\text{m}$ of venue coordinates (`POST /api/geo/check-in`). Payout releases automatically $12\text{ hours}$ post-event.
   - **Fraudulent / Empty Venue**: Attendees capture camera photos (`POST /api/geo/report-venue`). Once $\ge 3$ verified attendees report fraud ($\ge 25\%$ dispute ratio), the event is automatically locked to `FROZEN_DISPUTE` and refunds are batched.

---

## 7. How to Run the Automated Test Suite

The test suite validates end-to-end functionality, security RBAC boundaries, adversarial fraud vectors, scheduler releases, and load concurrency:

### Run the Master Test Suite
```powershell
.\tests\run-all-tests.ps1
```
*Expected Output*:
```
==========================================================
 VERITIX ENTERPRISE TEST SUITE - FULL SYSTEM VERIFICATION
==========================================================
[PRE-FLIGHT] Java (8080) and Python (8000) services are UP.

--- [SUITE 1] E2E HAPPY PATH & ESCROW SPLIT ---
[PASS] Ticket #1 issued in PAID_HELD_IN_ESCROW state.
[PASS] Duplicate verify request returned original Ticket #1.
[PASS] GPS check-in succeeded at 0m (Event #2).

--- [SUITE 2] ADVERSARIAL GPS, EXIF & CROWD-FREEZE ---
[PASS][GEO-03] Rejected low-accuracy GPS reading (500m).
[PASS][GEO-04] Stripped EXIF flagged: SUSPECT_METADATA_MISSING
[PASS][FRD-01] 3 distinct verified reporters triggered automatic FROZEN_DISPUTE on Event #3!

--- [SUITE 3] SECURITY, RBAC & BOUNDARY ENFORCEMENT ---
[PASS][SEC-01] Blocked Attendee privilege escalation to /api/admin/settings (403).
[PASS][FIN-03] Blocked event creation by unverified KYC host.

[SQL AUDIT] Running Double-Entry Ledger and Capacity Invariants...
(0 rows) - Zero discrepancy in escrow split transfers
(0 rows) - Zero oversold ticket tiers
 entry_type              | tx_count | total_inr 
-------------------------+----------+-----------
 GATEWAY_PROCESSING_FEE  |        5 |    100.00
 PLATFORM_COMMISSION     |        5 |    500.00
 TICKET_SALE_HELD        |        5 |   5000.00

==========================================================
 ALL AUTOMATED TEST SUITES COMPLETED SUCCESSFULLY
==========================================================
```

### Run the 1,000-User Concurrent Concurrency Load Test
Tests the pessimistic write lock (`SELECT ... FOR UPDATE`) under heavy stampede load:
```powershell
python .\tests\loadtest_1000_users.py
```
*Expected Output*:
```
Firing 1000 concurrent booking requests (200 threads)...
Completed 1000 requests in 3.42s (292.4 req/s)
HTTP Status Breakdown: {200: 20, 500: 0}
[PASS][CON-01] Zero 5xx server errors under 1,000-user stampede.
```

### Run the APScheduler Escrow Auto-Release Test
Verifies that the background worker detects expired holds and releases payouts:
```powershell
.\tests\test_escrow_scheduler.ps1
```
*Expected Output*:
```
--- [SUITE 4] APSCHEDULER ESCROW AUTO-RELEASE VERIFICATION ---
[PASS][ESCROW-01] APScheduler settled Event #4 to RELEASED.
```

### Run the SQL Ledger Invariant Audit Directly
```powershell
$env:PGPASSWORD = "postgres"
psql -U postgres -d antiscam_ticketing -f .\tests\audit_ledger_invariants.sql
Remove-Item Env:PGPASSWORD
```

---

## 8. Troubleshooting Common Setup Issues

| Symptom | Root Cause | Exact Resolution |
| :--- | :--- | :--- |
| **Port Conflict (`8080`, `8000`, `5173` already in use)** | Existing zombie process holding the port. | Run `.\stop-all.ps1`. If stubborn, run: `Get-NetTCPConnection -LocalPort 8080 \| % { Stop-Process -Id $_.OwningProcess -Force }`. |
| **`psql` is not recognized as an internal or external command** | PostgreSQL `bin` directory is missing from Windows `PATH`. | Run: `$env:Path += ";C:\Program Files\PostgreSQL\16\bin"` or add via System Environment Variables. |
| **Python `pip install` fails with invalid certificate path (`ca-bundle.crt`)** | Stale user environment variable `CURL_CA_BUNDLE` pointing to a missing directory. | Run: `$env:CURL_CA_BUNDLE = $null; $env:SSL_CERT_FILE = $null` before running `pip install`. |
| **Vite build fails with `Property 'env' does not exist on type 'ImportMeta'`** | Missing Vite client type declarations. | Ensure [`frontend-react/src/vite-env.d.ts`](file:///d:/per-por/nikunj_bhaiya/frontend-react/src/vite-env.d.ts) contains `/// <reference types="vite/client" />`. |
| **`psql: error: schema.sql: syntax error at or near ""`** | UTF-8 Byte Order Mark (BOM) prepended by Windows editor. | Re-save the file with UTF-8 encoding (without BOM) in VS Code or PowerShell: `Get-Content schema.sql \| Set-Content -Encoding utf8NoBOM schema.sql`. |

---

## 9. Sub-Module Documentation Links

For in-depth module-specific documentation, consult the individual sub-module guides:

- [**Java Core Financial & RBAC Service (`backend-java/README.md`)**](file:///d:/per-por/nikunj_bhaiya/backend-java/README.md): Spring Boot security architecture, pessimistic row locking implementation, Razorpay Route integration, and the complete REST API table.
- [**Python Geo & Settlement Microservice (`service-python/README.md`)**](file:///d:/per-por/nikunj_bhaiya/service-python/README.md): FastAPI endpoints, Haversine distance rules, Pillow EXIF analysis, crowd-consensus math, and APScheduler lifecycle.
- [**Frontend Web Application (`frontend-react/README.md`)**](file:///d:/per-por/nikunj_bhaiya/frontend-react/README.md): React 18, TypeScript, Tailwind design tokens, role-based dashboards, and signed QR pass generation.
- [**Database Scripts & Architecture (`database/README.md`)**](file:///d:/per-por/nikunj_bhaiya/database/README.md): Entity-relationship definitions, double-entry financial ledger invariants, and the dynamic `system_settings` key catalog.
- [**Automated Test Suite (`tests/README.md`)**](file:///d:/per-por/nikunj_bhaiya/tests/README.md): End-to-end integration tests, load testing scripts, adversarial fraud vectors, and SQL audit assertions.
