# Veritix — Database Architecture & SQL Invariants (PostgreSQL 16)

> **Relational Schema, Double-Entry Financial Invariants & Dynamic System Settings**  
> Designed for **PostgreSQL 16+**. Features normalized relations, B-Tree and partial indexes for high-frequency lookups, database-enforced capacity constraints, and an immutable double-entry financial audit trail.

---

## 1. Schema Architecture & Table Catalog

The schema is defined in [`database/schema.sql`](file:///d:/per-por/nikunj_bhaiya/database/schema.sql) and contains 10 normalized tables:

```
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│      users      │◄──────│  host_profiles  │       │  ticket_tiers    │
└────────┬────────┘       └─────────────────┘       └────────┬─────────┘
         │                                                   │
         │ (1:N)                                             │ (1:N)
         ▼                                                   ▼
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│     events      │◄──────│ escrow_transfers│       │     tickets      │
└────────┬────────┘       └─────────────────┘       └────────┬─────────┘
         │                                                   │
         ├───────────────────────────────────────────────────┘
         │ (1:N)
         ▼
┌─────────────────┐       ┌─────────────────┐       ┌──────────────────┐
│ venue_disputes  │       │ ledger_entries  │       │ system_settings  │
└─────────────────┘       └─────────────────┘       └──────────────────┘
```

### Table 1: `users`
- Stores user identities and RBAC roles.
- **Columns**: `id` (BIGSERIAL PK), `email` (VARCHAR(255) UNIQUE), `password_hash` (BCrypt), `full_name`, `phone`, `role` (`ROLE_ATTENDEE`, `ROLE_HOST`, `ROLE_ADMIN`), `is_active` (BOOL), `created_at`, `updated_at`.
- **Indexes**: `idx_users_email` (B-Tree), `idx_users_role`.

### Table 2: `host_profiles`
- Linked-account KYC records for event organizers.
- **Columns**: `id` (BIGSERIAL PK), `user_id` (BIGINT UNIQUE FK to `users`), `pan_number`, `bank_account_number`, `bank_ifsc`, `business_name`, `business_entity_type` (`INDIVIDUAL`, `PROPRIETORSHIP`, `PARTNERSHIP`, `PRIVATE_LIMITED`, `PUBLIC_LIMITED`), `razorpay_account_id` (`acc_xxx`), `kyc_status` (`PENDING`, `VERIFIED`, `REJECTED`), `kyc_document_url`, `rejection_reason`.

### Table 3: `events`
- Event listings, venue coordinates, and hold schedules.
- **Columns**: `id` (BIGSERIAL PK), `host_id` (FK to `users`), `title`, `description_markdown` (TEXT), `venue_name`, `venue_address`, `venue_latitude` (NUMERIC(10, 7)), `venue_longitude` (NUMERIC(10, 7)), `start_time` (TIMESTAMPTZ), `end_time` (TIMESTAMPTZ), `escrow_release_time` (TIMESTAMPTZ), `status` (`DRAFT`, `PENDING_VERIFICATION`, `VERIFIED_LIVE`, `COMPLETED`, `CANCELED`, `FROZEN_DISPUTE`, `RELEASED_SETTLED`), `venue_booking_proof_url`.
- **Partial Index**: `idx_events_release_time` on `escrow_release_time` where `status IN ('VERIFIED_LIVE', 'COMPLETED')` for rapid scheduler polling.

### Table 4: `ticket_tiers`
- Inventory capacities and pricing per tier.
- **Columns**: `id` (BIGSERIAL PK), `event_id` (FK to `events`), `name`, `price` (NUMERIC(12, 2)), `total_capacity` (INT), `reserved_count` (INT), `sold_count` (INT), `version` (BIGINT).
- **Check Constraint**: `CONSTRAINT chk_capacity_not_exceeded CHECK (reserved_count + sold_count <= total_capacity)`.

### Table 5: `tickets`
- Issued passes with cryptographic HMAC tokens.
- **Columns**: `id` (BIGSERIAL PK), `ticket_number` (VARCHAR(64) UNIQUE), `event_id` (FK to `events`), `ticket_tier_id` (FK to `ticket_tiers`), `user_id` (FK to `users`), `purchase_price`, `payment_gateway_order_id`, `payment_gateway_payment_id`, `idempotency_key` (VARCHAR(128) UNIQUE), `status` (`PAID_HELD_IN_ESCROW`, `CHECKED_IN`, `DISPUTE_FROZEN`, `AUTO_REFUNDED`, `SETTLED_RELEASED`), `qr_code_signature` (TEXT), `checked_in_at`, `check_in_latitude`, `check_in_longitude`.

### Table 6: `escrow_transfers`
- Split payout calculations and clearance timestamps.
- **Columns**: `id` (BIGSERIAL PK), `event_id` (FK to `events`), `host_account_id` (`acc_xxx`), `gross_amount`, `platform_fee_percent`, `platform_fee_amount`, `gateway_fee_amount`, `net_payout_amount`, `razorpay_transfer_id`, `status` (`ON_HOLD`, `FROZEN_DISPUTE`, `RELEASED`, `REFUNDED`), `on_hold_until` (TIMESTAMPTZ), `released_at`, `dispute_reason`.

### Table 7: `ledger_entries`
- Immutable double-entry financial audit log.
- **Columns**: `id` (BIGSERIAL PK), `entry_id` (UUID UNIQUE), `transaction_id`, `idempotency_key` (VARCHAR(128) UNIQUE), `account_from`, `account_to`, `amount` (NUMERIC(14, 2) CHECK > 0), `currency` (VARCHAR(10) DEFAULT 'INR'), `entry_type` (`TICKET_SALE_HELD`, `PLATFORM_COMMISSION`, `GATEWAY_PROCESSING_FEE`, `ESCROW_RELEASE`, `AUTO_REFUND`, `DISPUTE_FREEZE`), `metadata_json` (JSONB), `created_at`.

### Table 8: `venue_disputes`
- Crowd-submitted fraud reports with photo evidence and EXIF tags.
- **Columns**: `id` (BIGSERIAL PK), `event_id` (FK to `events`), `reporter_user_id` (FK to `users`), `ticket_id` (FK to `tickets`), `reporter_latitude`, `reporter_longitude`, `gps_accuracy_meters`, `distance_from_venue_meters`, `photo_url`, `exif_capture_time`, `exif_camera_make`, `exif_camera_model`, `exif_validation_status` (`VERIFIED_VALID`, `SUSPECT_METADATA_MISSING`, `TAMPERED_TIMESTAMPS`), `report_text`, `status` (`PENDING_REVIEW`, `RESOLVED_SCAM_CONFIRMED`, `DISMISSED_FALSE_REPORT`), `admin_notes`.

### Table 9: `webhook_logs`
- Raw incoming gateway webhook payloads and signature verification results.
- **Columns**: `id` (BIGSERIAL PK), `event_id_header`, `event_type`, `payload` (JSONB), `signature`, `is_verified` (BOOL), `processing_status` (`RECEIVED`, `PROCESSED`, `FAILED`).

### Table 10: `system_settings`
- Dynamic runtime parameters modified by admins without server restart.
- **Columns**: `setting_key` (VARCHAR(100) PK), `setting_value` (VARCHAR(255)), `description`, `updated_at`, `updated_by`.

---

## 2. Double-Entry Financial Invariant Rules

To ensure complete financial integrity, the ledger obeys three mathematical invariants:

1. **Escrow Split Parity**:
   $$\text{gross\_amount} = \text{platform\_fee\_amount} + \text{gateway\_fee\_amount} + \text{net\_payout\_amount}$$
   Audited via:
   ```sql
   SELECT id, event_id, gross_amount,
          (platform_fee_amount + gateway_fee_amount + net_payout_amount) AS calculated_sum,
          (gross_amount - (platform_fee_amount + gateway_fee_amount + net_payout_amount)) AS discrepancy
   FROM escrow_transfers
   WHERE gross_amount <> (platform_fee_amount + gateway_fee_amount + net_payout_amount);
   -- Must return 0 rows
   ```

2. **Capacity Conservation**:
   $$\text{sold\_count} \le \text{total\_capacity} \quad \land \quad \text{reserved\_count} \ge 0 \quad \land \quad \text{sold\_count} \ge 0$$
   Audited via:
   ```sql
   SELECT id, event_id, name, total_capacity, reserved_count, sold_count
   FROM ticket_tiers
   WHERE sold_count > total_capacity OR reserved_count < 0 OR sold_count < 0;
   -- Must return 0 rows
   ```

3. **Ledger Immutability**:
   `ledger_entries` records can only be `INSERT`ed; `UPDATE` and `DELETE` operations are strictly forbidden on production databases.

---

## 3. Dynamic `system_settings` Key Catalog

Configured in [`database/seed_settings.sql`](file:///d:/per-por/nikunj_bhaiya/database/seed_settings.sql):

| Setting Key | Default Value | Unit / Format | Description & Runtime Effect |
| :--- | :--- | :--- | :--- |
| `PLATFORM_COMMISSION_PERCENT` | `10.0` | Percentage (`%`) | Platform fee deducted from ticket gross sales upon checkout reservation |
| `ESCROW_HOLD_DURATION_SECONDS` | `43200` | Seconds (`s`) | Escrow payout hold duration ($12\text{ hours} = 43,200\text{s}$) post-event |
| `GEOFENCE_RADIUS_METERS` | `300.0` | Meters (`m`) | Maximum Haversine distance from venue coords for check-ins & fraud reports |
| `GPS_ACCURACY_CEILING_METERS` | `150.0` | Meters (`m`) | Maximum device GPS accuracy error margin allowed before rejecting reading |
| `DISPUTE_FREEZE_THRESHOLD_RATIO` | `0.25` | Ratio ($0.0 - 1.0$) | Ratio of tickets sold reporting fake venue that triggers auto-freeze ($25\%$) |
| `MIN_DISPUTE_REPORTERS` | `3` | Integer count | Minimum distinct verified attendees required to trigger auto-freeze |
| `MAX_CHECKIN_RATIO_FOR_DISPUTE` | `0.30` | Ratio ($0.0 - 1.0$) | Maximum legitimate check-in ratio allowed for fraud freeze evaluation ($30\%$) |
| `GATEWAY_PROCESSING_FEE_PERCENT`| `2.0` | Percentage (`%`) | Payment gateway fee deduction assumption for host escrow breakdown |

---

## 4. Database Setup & Execution Commands

### Create and Seed Database
```powershell
$env:PGPASSWORD = "postgres"
psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE antiscam_ticketing;"
psql -U postgres -h localhost -p 5432 -d antiscam_ticketing -f "database\schema.sql"
psql -U postgres -h localhost -p 5432 -d antiscam_ticketing -f "database\seed_settings.sql"
Remove-Item Env:PGPASSWORD
```

### Run Financial Audit Checks
```powershell
$env:PGPASSWORD = "postgres"
psql -U postgres -d antiscam_ticketing -f "tests\audit_ledger_invariants.sql"
Remove-Item Env:PGPASSWORD
```
