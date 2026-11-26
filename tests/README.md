# Veritix — Automated Test Suite & Invariant Verification

> **Comprehensive End-to-End, Concurrency, RBAC & Adversarial Fraud Test Suite**  
> Validates the financial, concurrency, cryptographic, and forensic guarantees of the Veritix platform. Covers atomic booking idempotency, zero-overselling pessimistic locking under a 1,000-user stampede, GPS accuracy boundaries, camera EXIF analysis, crowd-consensus fraud freezing, and APScheduler settlement releases.

---

## 1. Test Suite Catalog & Architecture Mapping

```
tests/
├── run-all-tests.ps1            # Master orchestrator: pre-flight checks, E2E, fraud, RBAC, and SQL audit
├── test_e2e_happy_path.ps1      # Suite 1: Full registration, KYC, event creation, booking, idempotency, GPS check-in
├── test_adversarial_fraud.ps1   # Suite 2: GPS accuracy spoof rejection, stripped EXIF flagging, 3-reporter crowd freeze
├── test_security_rbac.ps1       # Suite 3: Attendee privilege escalation (403) & unverified host event creation block
├── test_escrow_scheduler.ps1    # Suite 4: APScheduler 60s background worker hold maturity release & ledger entry
├── loadtest_1000_users.py       # Concurrency: 1,000 concurrent requests across 200 worker threads (Python)
├── loadtest_1000_users.js       # Concurrency: k6 load test script (1,000 virtual users, p95 < 500ms)
├── audit_ledger_invariants.sql  # SQL Audit: Escrow split balance parity & ticket tier capacity invariants
└── tmp_images/                  # Ephemeral scratch folder for synthetic Pillow EXIF test images
```

---

## 2. Test Suites Detailed Specifications

### Suite 1: `test_e2e_happy_path.ps1`
- **Goal**: Verifies the complete legitimate attendee lifecycle and financial idempotency.
- **Actions Executed**:
  1. Registers host and attendee accounts via `POST /api/auth/register`.
  2. Updates host profile to `VERIFIED` with linked account `acc_e2e_{suffix}`.
  3. Host creates event with ticket tier (`price = 1000.00`, `capacity = 20`) via `POST /api/events`.
  4. Approves event to `VERIFIED_LIVE`.
  5. Initiates reservation with UUID v4 idempotency key via `POST /api/bookings/initiate`.
  6. Completes payment verification via `POST /api/bookings/verify`.
  7. **Assertion 1**: Asserts issued ticket status is `PAID_HELD_IN_ESCROW`.
  8. **Assertion 2 (Idempotency)**: Re-sends the exact same verify payload with the same idempotency key; asserts the response returns the original ticket ID without creating a duplicate.
  9. **Assertion 3 (GPS Check-In)**: Submits device check-in at exact venue coordinates (`POST /api/geo/check-in`, accuracy `10.0m`); asserts success and distance $\le 300\text{m}$.
- **Execution Command**:
  ```powershell
  .\tests\test_e2e_happy_path.ps1
  ```

---

### Suite 2: `test_adversarial_fraud.ps1`
- **Goal**: Tests adversarial fraud vectors, spoofed GPS telemetry, stripped EXIF images, and automatic crowd-consensus payout freezing.
- **Actions Executed**:
  1. Generates two synthetic JPEG images via Pillow:
     - `no_exif.jpg`: Pure red square with stripped EXIF headers (simulating a web screenshot).
     - `valid_exif.jpg`: Green square with valid EXIF tags: Tag `271` = 'Canon', Tag `272` = 'EOS R6', Tag `36867` = current timestamp.
  2. Creates verified event and registers 4 distinct buyers who each purchase 1 ticket pass.
  3. **Assertion 1 (GPS Accuracy Spoof)**: Attendee submits check-in with accuracy error margin `500.0m` (ceiling: `150.0m`). Asserts request is rejected with `HTTP 400`.
  4. **Assertion 2 (Stripped EXIF)**: Attendee uploads `no_exif.jpg` to `POST /api/geo/report-venue`. Asserts response flags status as `SUSPECT_METADATA_MISSING`.
  5. **Assertion 3 (Crowd Consensus Auto-Freeze)**: 3 distinct verified attendees submit reports with `valid_exif.jpg` and coordinates within venue radius.
  6. **Assertion 4**: Checks PostgreSQL database; asserts event status has automatically transitioned from `VERIFIED_LIVE` to `FROZEN_DISPUTE`, tickets transitioned to `DISPUTE_FROZEN`, and escrow payout is locked.
- **Execution Command**:
  ```powershell
  .\tests\test_adversarial_fraud.ps1
  ```

---

### Suite 3: `test_security_rbac.ps1`
- **Goal**: Verifies role boundaries and access controls across administrative and financial actions.
- **Actions Executed**:
  1. Registers attendee (`ROLE_ATTENDEE`) and unverified host (`ROLE_HOST` with `kyc_status = 'PENDING'`).
  2. **Assertion 1 (Privilege Escalation)**: Attendee attempts to access `GET /api/admin/settings` with their JWT token. Asserts the request is rejected with `HTTP 403 Forbidden`.
  3. **Assertion 2 (Unverified Host Event Creation)**: Unverified host attempts `POST /api/events`. Asserts the request fails because host KYC is not `VERIFIED`.
- **Execution Command**:
  ```powershell
  .\tests\test_security_rbac.ps1
  ```

---

### Suite 4: `test_escrow_scheduler.ps1`
- **Goal**: Verifies that the embedded `APScheduler` background worker detects expired holds and releases payouts to the organizer's linked account.
- **Actions Executed**:
  1. Sets dynamic system setting `ESCROW_HOLD_DURATION_SECONDS = 30` in PostgreSQL.
  2. Creates event and books ticket pass ($1,000\text{ INR}$).
  3. Adjusts `on_hold_until = NOW() + INTERVAL '15 seconds'` on the event's `escrow_transfers` row.
  4. Polls database every 5 seconds until `status = 'RELEASED'`.
  5. **Assertion 1**: Asserts the background worker transitions status to `RELEASED` and event to `RELEASED_SETTLED`.
  6. Restores dynamic setting to `43200` (12 hours).
- **Execution Command**:
  ```powershell
  .\tests\test_escrow_scheduler.ps1
  ```

---

### Suite 5: `loadtest_1000_users.py` (Concurrency & Stampede)
- **Goal**: Hammers the reservation endpoint with **1,000 concurrent buyers** across **200 simultaneous threads** to prove zero overselling and zero HikariCP connection pool starvation.
- **Actions Executed**:
  1. Registers buyer account to obtain valid JWT token.
  2. Uses `concurrent.futures.ThreadPoolExecutor(max_workers=200)` to dispatch 1,000 simultaneous `POST /api/bookings/initiate` requests for the same ticket tier, each with a unique UUID v4 idempotency key.
  3. Collects HTTP status codes across all 1,000 requests.
  4. **Assertion 1**: Asserts **zero `5xx` server/pool errors** (`sum(status >= 500) == 0`).
  5. **Assertion 2**: Available seats are claimed; remaining requests receive proper status without corrupting inventory.
- **Execution Command**:
  ```powershell
  python .\tests\loadtest_1000_users.py
  ```

---

### Suite 6: `audit_ledger_invariants.sql` (Mathematical Parity Audit)
- **Goal**: Performs direct SQL assertions verifying financial conservation and capacity invariants.
- **Queries Executed**:
  1. **Discrepancy Check**:
     ```sql
     SELECT id, event_id, gross_amount,
            (platform_fee_amount + gateway_fee_amount + net_payout_amount) AS calculated_sum,
            (gross_amount - (platform_fee_amount + gateway_fee_amount + net_payout_amount)) AS discrepancy
     FROM escrow_transfers
     WHERE gross_amount <> (platform_fee_amount + gateway_fee_amount + net_payout_amount);
     -- Expected: (0 rows)
     ```
  2. **Capacity Conservation Check**:
     ```sql
     SELECT id, event_id, name, total_capacity, reserved_count, sold_count
     FROM ticket_tiers
     WHERE sold_count > total_capacity OR reserved_count < 0 OR sold_count < 0;
     -- Expected: (0 rows)
     ```
  3. **Ledger Volume Summary**:
     ```sql
     SELECT entry_type, COUNT(*) AS tx_count, SUM(amount) AS total_inr
     FROM ledger_entries
     GROUP BY entry_type
     ORDER BY entry_type;
     ```
- **Execution Command**:
  ```powershell
  $env:PGPASSWORD = "postgres"
  psql -U postgres -d antiscam_ticketing -f .\tests\audit_ledger_invariants.sql
  Remove-Item Env:PGPASSWORD
  ```

---

## 3. Master Test Execution Command

To run the entire suite in automated sequence with pre-flight health checks:

```powershell
.\tests\run-all-tests.ps1
```

### Pre-requisites for Running Tests
1. Both backend services must be running:
   - Java Spring Boot on `http://localhost:8080`
   - Python FastAPI on `http://localhost:8000`
2. PostgreSQL database `antiscam_ticketing` must be initialized on `localhost:5432`.
3. `psql` command must be accessible in your `PATH`.
