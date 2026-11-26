import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    Column, BigInteger, String, Text, Numeric, Integer, Boolean,
    DateTime, ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(BigInteger, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(30))
    role = Column(String(50), nullable=False)
    is_active = Column(Boolean, default=True)

class Event(Base):
    __tablename__ = "events"
    id = Column(BigInteger, primary_key=True, index=True)
    host_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description_markdown = Column(Text, nullable=False)
    venue_name = Column(String(255), nullable=False)
    venue_address = Column(Text, nullable=False)
    venue_latitude = Column(Numeric(10, 7), nullable=False)
    venue_longitude = Column(Numeric(10, 7), nullable=False)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    escrow_release_time = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(50), nullable=False, default="DRAFT")
    venue_booking_proof_url = Column(Text, nullable=False)

    tickets = relationship("Ticket", back_populates="event")
    escrow_transfer = relationship("EscrowTransfer", back_populates="event", uselist=False)

class Ticket(Base):
    __tablename__ = "tickets"
    id = Column(BigInteger, primary_key=True, index=True)
    ticket_number = Column(String(64), unique=True, nullable=False)
    event_id = Column(BigInteger, ForeignKey("events.id"), nullable=False)
    ticket_tier_id = Column(BigInteger, nullable=False)
    user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    purchase_price = Column(Numeric(12, 2), nullable=False)
    payment_gateway_order_id = Column(String(128))
    payment_gateway_payment_id = Column(String(128))
    idempotency_key = Column(String(128), unique=True, nullable=False)
    status = Column(String(50), nullable=False, default="PAID_HELD_IN_ESCROW")
    qr_code_signature = Column(Text, nullable=False)
    checked_in_at = Column(DateTime(timezone=True))
    check_in_latitude = Column(Numeric(10, 7))
    check_in_longitude = Column(Numeric(10, 7))

    event = relationship("Event", back_populates="tickets")
    user = relationship("User")

class EscrowTransfer(Base):
    __tablename__ = "escrow_transfers"
    id = Column(BigInteger, primary_key=True, index=True)
    event_id = Column(BigInteger, ForeignKey("events.id"), nullable=False)
    host_account_id = Column(String(100), nullable=False)
    gross_amount = Column(Numeric(12, 2), nullable=False, default=0)
    platform_fee_percent = Column(Numeric(5, 2), nullable=False, default=10.0)
    platform_fee_amount = Column(Numeric(12, 2), nullable=False, default=0)
    gateway_fee_amount = Column(Numeric(12, 2), nullable=False, default=0)
    net_payout_amount = Column(Numeric(12, 2), nullable=False, default=0)
    razorpay_transfer_id = Column(String(128))
    status = Column(String(50), nullable=False, default="ON_HOLD")
    on_hold_until = Column(DateTime(timezone=True), nullable=False)
    released_at = Column(DateTime(timezone=True))
    dispute_reason = Column(Text)

    event = relationship("Event", back_populates="escrow_transfer")

class LedgerEntry(Base):
    __tablename__ = "ledger_entries"
    id = Column(BigInteger, primary_key=True, index=True)
    entry_id = Column(UUID(as_uuid=True), default=uuid.uuid4, unique=True, nullable=False)
    transaction_id = Column(String(128), nullable=False)
    idempotency_key = Column(String(128), unique=True, nullable=False)
    account_from = Column(String(100), nullable=False)
    account_to = Column(String(100), nullable=False)
    amount = Column(Numeric(14, 2), nullable=False)
    currency = Column(String(10), nullable=False, default="INR")
    entry_type = Column(String(50), nullable=False)
    metadata_json = Column(JSONB)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

class VenueDispute(Base):
    __tablename__ = "venue_disputes"
    id = Column(BigInteger, primary_key=True, index=True)
    event_id = Column(BigInteger, ForeignKey("events.id"), nullable=False)
    reporter_user_id = Column(BigInteger, ForeignKey("users.id"), nullable=False)
    ticket_id = Column(BigInteger, ForeignKey("tickets.id"))
    reporter_latitude = Column(Numeric(10, 7), nullable=False)
    reporter_longitude = Column(Numeric(10, 7), nullable=False)
    gps_accuracy_meters = Column(Numeric(8, 2), nullable=False)
    distance_from_venue_meters = Column(Numeric(8, 2), nullable=False)
    photo_url = Column(Text, nullable=False)
    exif_capture_time = Column(DateTime(timezone=True))
    exif_camera_make = Column(String(100))
    exif_camera_model = Column(String(100))
    exif_validation_status = Column(String(50), nullable=False, default="VERIFIED_VALID")
    report_text = Column(Text, nullable=False)
    status = Column(String(50), nullable=False, default="PENDING_REVIEW")
    admin_notes = Column(Text)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    event = relationship("Event")
    reporter = relationship("User")
    ticket = relationship("Ticket")

class SystemSetting(Base):
    __tablename__ = "system_settings"
    setting_key = Column(String(100), primary_key=True)
    setting_value = Column(String(255), nullable=False)
    description = Column(Text)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_by = Column(String(100), default="SYSTEM")
