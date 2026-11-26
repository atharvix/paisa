-- ==============================================================================
-- Anti-Scam Event Ticketing & Escrow Settlement Platform
-- Seed Data: System Settings and Demo Accounts
-- ==============================================================================

-- Seed dynamic system settings with strict default constraints
INSERT INTO system_settings (setting_key, setting_value, description, updated_by)
VALUES
    ('PLATFORM_COMMISSION_PERCENT', '10.0', 'Platform fee percentage deducted from gross ticket sales before settlement', 'SYSTEM_INIT'),
    ('ESCROW_HOLD_DURATION_SECONDS', '43200', 'Escrow retention period post-event (12 hours = 43200s) before releasing payouts to host', 'SYSTEM_INIT'),
    ('GEOFENCE_RADIUS_METERS', '300.0', 'Maximum allowable Haversine distance from venue coords for check-ins and fraud reports', 'SYSTEM_INIT'),
    ('GPS_ACCURACY_CEILING_METERS', '150.0', 'Maximum acceptable device GPS accuracy error radius in meters to prevent GPS spoofing', 'SYSTEM_INIT'),
    ('DISPUTE_FREEZE_THRESHOLD_RATIO', '0.25', 'Ratio of total tickets sold reporting fake/empty venue that triggers automatic escrow freeze (25%)', 'SYSTEM_INIT'),
    ('MIN_DISPUTE_REPORTERS', '3', 'Minimum number of unique verified ticket holders required to trigger auto freeze', 'SYSTEM_INIT'),
    ('MAX_CHECKIN_RATIO_FOR_DISPUTE', '0.30', 'Maximum legitimate check-in ratio allowed for fraud freeze evaluation (30%)', 'SYSTEM_INIT'),
    ('GATEWAY_PROCESSING_FEE_PERCENT', '2.0', 'Payment gateway split fee assumption for settlement breakdown calculations', 'SYSTEM_INIT')
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value,
    description = EXCLUDED.description,
    updated_at = CURRENT_TIMESTAMP;

-- Seed default users with BCrypt-hashed password: Password123!
-- Hash for 'Password123!': $2a$10$wOq2M0gWw7kEhyX0fC00z.eG6x5C71fK6E/w5u70gVvQkRlhMhH82
INSERT INTO users (email, password_hash, full_name, phone, role, is_active)
VALUES
    ('admin@antiscam.io', '$2a$10$wOq2M0gWw7kEhyX0fC00z.eG6x5C71fK6E/w5u70gVvQkRlhMhH82', 'Chief Compliance Officer', '+919999900001', 'ROLE_ADMIN', true),
    ('host.verified@techfest.in', '$2a$10$wOq2M0gWw7kEhyX0fC00z.eG6x5C71fK6E/w5u70gVvQkRlhMhH82', 'Rajesh Sharma (TechFest Org)', '+919876543210', 'ROLE_HOST', true),
    ('attendee1@gmail.com', '$2a$10$wOq2M0gWw7kEhyX0fC00z.eG6x5C71fK6E/w5u70gVvQkRlhMhH82', 'Aarav Mehta', '+919123456780', 'ROLE_ATTENDEE', true),
    ('attendee2@gmail.com', '$2a$10$wOq2M0gWw7kEhyX0fC00z.eG6x5C71fK6E/w5u70gVvQkRlhMhH82', 'Priya Nair', '+919123456781', 'ROLE_ATTENDEE', true),
    ('attendee3@gmail.com', '$2a$10$wOq2M0gWw7kEhyX0fC00z.eG6x5C71fK6E/w5u70gVvQkRlhMhH82', 'Vikram Malhotra', '+919123456782', 'ROLE_ATTENDEE', true)
ON CONFLICT (email) DO NOTHING;

-- Seed Host Profile for verified host
INSERT INTO host_profiles (user_id, pan_number, bank_account_number, bank_ifsc, business_name, business_entity_type, razorpay_account_id, kyc_status, kyc_document_url)
SELECT
    u.id,
    'ABCDE1234F',
    '91827364550192',
    'HDFC0000128',
    'TechFest India Events LLP',
    'PRIVATE_LIMITED',
    'acc_demo_techfest_9918',
    'VERIFIED',
    'https://storage.antiscam.io/kyc/techfest_pan_cert.pdf'
FROM users u
WHERE u.email = 'host.verified@techfest.in'
ON CONFLICT (user_id) DO NOTHING;

-- Seed sample Event
INSERT INTO events (host_id, title, description_markdown, venue_name, venue_address, venue_latitude, venue_longitude, start_time, end_time, escrow_release_time, status, venue_booking_proof_url)
SELECT
    u.id,
    'Bengaluru AI & Distributed Systems Summit 2026',
    E'# Welcome to Bengaluru AI Summit 2026\n\nJoin 1,000+ engineers, founders, and distributed systems architects.\n\n### Schedule Highlights\n- **09:30 AM**: Keynote on Fault-Tolerant Consensus\n- **11:00 AM**: Scaling High-Throughput Financial Systems\n- **02:00 PM**: Production Microservices Without Containers\n- **04:30 PM**: Zero-Overselling Concurrency Architectures\n\n> *Escrow Protected Event*: Ticket funds remain securely locked in the platform escrow pool until 12 hours after event completion.',
    'Nimhans Convention Centre, Auditorium A',
    'Hosur Main Road, Lakkasandra, Bengaluru, Karnataka 560029',
    12.9392231,
    77.5956742,
    NOW() + INTERVAL '2 days',
    NOW() + INTERVAL '2 days' + INTERVAL '8 hours',
    NOW() + INTERVAL '2 days' + INTERVAL '20 hours', -- +12h hold
    'VERIFIED_LIVE',
    'https://storage.antiscam.io/venues/nimhans_booking_confirmation_2026.pdf'
FROM users u
WHERE u.email = 'host.verified@techfest.in'
ON CONFLICT DO NOTHING;

-- Seed ticket tiers for this event
INSERT INTO ticket_tiers (event_id, name, price, total_capacity, reserved_count, sold_count)
SELECT
    e.id,
    'Early Bird Pass',
    999.00,
    300,
    0,
    15
FROM events e
WHERE e.title = 'Bengaluru AI & Distributed Systems Summit 2026'
ON CONFLICT DO NOTHING;

INSERT INTO ticket_tiers (event_id, name, price, total_capacity, reserved_count, sold_count)
SELECT
    e.id,
    'General Admission',
    1999.00,
    500,
    0,
    0
FROM events e
WHERE e.title = 'Bengaluru AI & Distributed Systems Summit 2026'
ON CONFLICT DO NOTHING;

INSERT INTO ticket_tiers (event_id, name, price, total_capacity, reserved_count, sold_count)
SELECT
    e.id,
    'VIP Architect Access',
    4999.00,
    200,
    0,
    0
FROM events e
WHERE e.title = 'Bengaluru AI & Distributed Systems Summit 2026'
ON CONFLICT DO NOTHING;
