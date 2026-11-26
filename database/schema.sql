-- ==============================================================================
-- Anti-Scam Event Ticketing & Escrow Settlement Platform
-- Database Schema (PostgreSQL 16)
-- Enforces Zero Overselling, Double-Entry Ledger, and Escrow Fraud Controls
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    role VARCHAR(50) NOT NULL CHECK (role IN ('ROLE_ATTENDEE', 'ROLE_HOST', 'ROLE_ADMIN')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 2. HOST PROFILES & KYC
CREATE TABLE IF NOT EXISTS host_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pan_number VARCHAR(20) NOT NULL,
    bank_account_number VARCHAR(50) NOT NULL,
    bank_ifsc VARCHAR(20) NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    business_entity_type VARCHAR(50) NOT NULL CHECK (business_entity_type IN ('INDIVIDUAL', 'PROPRIETORSHIP', 'PARTNERSHIP', 'PRIVATE_LIMITED', 'PUBLIC_LIMITED')),
    razorpay_account_id VARCHAR(100), -- acc_xxxx (Linked account created via Razorpay Route API)
    kyc_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (kyc_status IN ('PENDING', 'VERIFIED', 'REJECTED')),
    kyc_document_url TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_host_profiles_user ON host_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_host_profiles_kyc ON host_profiles(kyc_status);

-- 3. EVENTS
CREATE TABLE IF NOT EXISTS events (
    id BIGSERIAL PRIMARY KEY,
    host_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description_markdown TEXT NOT NULL,
    venue_name VARCHAR(255) NOT NULL,
    venue_address TEXT NOT NULL,
    venue_latitude NUMERIC(10, 7) NOT NULL,
    venue_longitude NUMERIC(10, 7) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    escrow_release_time TIMESTAMPTZ NOT NULL, -- end_time + default_escrow_hold_duration
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_VERIFICATION', 'VERIFIED_LIVE', 'COMPLETED', 'CANCELED', 'FROZEN_DISPUTE', 'RELEASED_SETTLED')),
    venue_booking_proof_url TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_host ON events(host_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_start ON events(start_time);
CREATE INDEX IF NOT EXISTS idx_events_release_time ON events(escrow_release_time) WHERE status = 'VERIFIED_LIVE' OR status = 'COMPLETED';

-- 4. TICKET TIERS
CREATE TABLE IF NOT EXISTS ticket_tiers (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
    total_capacity INT NOT NULL CHECK (total_capacity > 0),
    reserved_count INT NOT NULL DEFAULT 0 CHECK (reserved_count >= 0),
    sold_count INT NOT NULL DEFAULT 0 CHECK (sold_count >= 0),
    version BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_capacity_not_exceeded CHECK (reserved_count + sold_count <= total_capacity)
);

CREATE INDEX IF NOT EXISTS idx_ticket_tiers_event ON ticket_tiers(event_id);

-- 5. TICKETS
CREATE TABLE IF NOT EXISTS tickets (
    id BIGSERIAL PRIMARY KEY,
    ticket_number VARCHAR(64) UNIQUE NOT NULL,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    ticket_tier_id BIGINT NOT NULL REFERENCES ticket_tiers(id) ON DELETE RESTRICT,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    purchase_price NUMERIC(12, 2) NOT NULL,
    payment_gateway_order_id VARCHAR(128),
    payment_gateway_payment_id VARCHAR(128),
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PAID_HELD_IN_ESCROW' CHECK (status IN ('PAID_HELD_IN_ESCROW', 'CHECKED_IN', 'DISPUTE_FROZEN', 'AUTO_REFUNDED', 'SETTLED_RELEASED')),
    qr_code_signature TEXT NOT NULL,
    checked_in_at TIMESTAMPTZ,
    check_in_latitude NUMERIC(10, 7),
    check_in_longitude NUMERIC(10, 7),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_event ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_idempotency ON tickets(idempotency_key);

-- 6. ESCROW TRANSFERS
CREATE TABLE IF NOT EXISTS escrow_transfers (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    host_account_id VARCHAR(100) NOT NULL,
    gross_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    platform_fee_percent NUMERIC(5, 2) NOT NULL DEFAULT 10.0,
    platform_fee_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    gateway_fee_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    net_payout_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
    razorpay_transfer_id VARCHAR(128),
    status VARCHAR(50) NOT NULL DEFAULT 'ON_HOLD' CHECK (status IN ('ON_HOLD', 'FROZEN_DISPUTE', 'RELEASED', 'REFUNDED')),
    on_hold_until TIMESTAMPTZ NOT NULL,
    released_at TIMESTAMPTZ,
    dispute_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_escrow_event ON escrow_transfers(event_id);
CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow_transfers(status);
CREATE INDEX IF NOT EXISTS idx_escrow_hold_until ON escrow_transfers(on_hold_until) WHERE status = 'ON_HOLD';

-- 7. DOUBLE-ENTRY FINANCIAL LEDGER (Immutable Audit Log)
CREATE TABLE IF NOT EXISTS ledger_entries (
    id BIGSERIAL PRIMARY KEY,
    entry_id UUID UNIQUE NOT NULL DEFAULT uuid_generate_v4(),
    transaction_id VARCHAR(128) NOT NULL,
    idempotency_key VARCHAR(128) UNIQUE NOT NULL,
    account_from VARCHAR(100) NOT NULL,
    account_to VARCHAR(100) NOT NULL,
    amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'INR',
    entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('TICKET_SALE_HELD', 'PLATFORM_COMMISSION', 'GATEWAY_PROCESSING_FEE', 'ESCROW_RELEASE', 'AUTO_REFUND', 'DISPUTE_FREEZE')),
    metadata_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ledger_tx ON ledger_entries(transaction_id);
CREATE INDEX IF NOT EXISTS idx_ledger_idempotency ON ledger_entries(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_ledger_entry_type ON ledger_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_ledger_created_at ON ledger_entries(created_at);

-- 8. VENUE DISPUTES & SCAM REPORTING
CREATE TABLE IF NOT EXISTS venue_disputes (
    id BIGSERIAL PRIMARY KEY,
    event_id BIGINT NOT NULL REFERENCES events(id) ON DELETE RESTRICT,
    reporter_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    ticket_id BIGINT REFERENCES tickets(id) ON DELETE RESTRICT,
    reporter_latitude NUMERIC(10, 7) NOT NULL,
    reporter_longitude NUMERIC(10, 7) NOT NULL,
    gps_accuracy_meters NUMERIC(8, 2) NOT NULL,
    distance_from_venue_meters NUMERIC(8, 2) NOT NULL,
    photo_url TEXT NOT NULL,
    exif_capture_time TIMESTAMPTZ,
    exif_camera_make VARCHAR(100),
    exif_camera_model VARCHAR(100),
    exif_validation_status VARCHAR(50) NOT NULL CHECK (exif_validation_status IN ('VERIFIED_VALID', 'SUSPECT_METADATA_MISSING', 'TAMPERED_TIMESTAMPS')),
    report_text TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_REVIEW' CHECK (status IN ('PENDING_REVIEW', 'RESOLVED_SCAM_CONFIRMED', 'DISMISSED_FALSE_REPORT')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_venue_disputes_event ON venue_disputes(event_id);
CREATE INDEX IF NOT EXISTS idx_venue_disputes_user ON venue_disputes(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_venue_disputes_status ON venue_disputes(status);

-- 9. GATEWAY WEBHOOK LOGS
CREATE TABLE IF NOT EXISTS webhook_logs (
    id BIGSERIAL PRIMARY KEY,
    event_id_header VARCHAR(128),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    signature VARCHAR(255) NOT NULL,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    processing_status VARCHAR(50) NOT NULL DEFAULT 'RECEIVED' CHECK (processing_status IN ('RECEIVED', 'PROCESSED', 'FAILED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_type ON webhook_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_status ON webhook_logs(processing_status);

-- 10. SYSTEM SETTINGS (Dynamic Runtime Configuration)
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value VARCHAR(255) NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(100) DEFAULT 'SYSTEM'
);
