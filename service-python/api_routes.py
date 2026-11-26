import os
import uuid
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from database import get_db
from models import Event, Ticket, VenueDispute, EscrowTransfer, LedgerEntry
from geo_exif_service import haversine_distance_meters, validate_image_exif, get_dynamic_setting
from config import settings

logger = logging.getLogger("GeoApiRoutes")
router = APIRouter(prefix="/api/geo", tags=["Geo & Anti-Scam Fraud Engine"])

@router.get("/health")
def geo_health():
    return {
        "service": "Python Geo-Verification, EXIF Fraud Engine & APScheduler",
        "status": "UP",
        "scheduler_enabled": settings.scheduler_enabled,
        "scheduler_interval": settings.scheduler_interval_seconds
    }

@router.post("/check-in")
def check_in_attendee(
    ticket_id: int = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    accuracy: float = Form(...),
    db: Session = Depends(get_db)
):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")

    if ticket.status == "CHECKED_IN":
        return {
            "success": True,
            "message": "Attendee already checked in",
            "checked_in_at": ticket.checked_in_at
        }

    if ticket.status != "PAID_HELD_IN_ESCROW":
        raise HTTPException(
            status_code=400,
            detail=f"Ticket cannot be checked in. Current status: {ticket.status}"
        )

    event = ticket.event
    if not event:
        raise HTTPException(status_code=404, detail="Associated event not found")

    # Dynamic accuracy ceiling from system_settings
    accuracy_ceiling = get_dynamic_setting(
        db, "GPS_ACCURACY_CEILING_METERS", settings.default_gps_accuracy_ceiling_meters
    )
    if accuracy > accuracy_ceiling:
        raise HTTPException(
            status_code=400,
            detail=f"Device GPS accuracy radius ({accuracy:.1f}m) exceeds acceptable ceiling ({accuracy_ceiling:.1f}m). Please enable High Accuracy GPS."
        )

    # Dynamic geofence radius from system_settings
    geofence_radius = get_dynamic_setting(
        db, "GEOFENCE_RADIUS_METERS", settings.default_geofence_radius_meters
    )

    venue_lat = float(event.venue_latitude)
    venue_lon = float(event.venue_longitude)
    distance = haversine_distance_meters(latitude, longitude, venue_lat, venue_lon)

    if distance > geofence_radius:
        raise HTTPException(
            status_code=400,
            detail=f"GPS check-in failed: You are {distance:.1f}m away from the venue. You must be within {geofence_radius:.0f}m to check in."
        )

    # Valid check-in
    now = datetime.now(timezone.utc)
    ticket.status = "CHECKED_IN"
    ticket.checked_in_at = now
    ticket.check_in_latitude = latitude
    ticket.check_in_longitude = longitude
    db.commit()

    return {
        "success": True,
        "message": f"Successfully checked in at venue! Distance: {distance:.1f}m",
        "ticket_number": ticket.ticket_number,
        "distance_meters": round(distance, 2),
        "checked_in_at": now.isoformat()
    }

@router.post("/report-venue")
async def report_ghost_venue(
    event_id: int = Form(...),
    reporter_user_id: int = Form(...),
    ticket_id: Optional[int] = Form(None),
    latitude: float = Form(...),
    longitude: float = Form(...),
    accuracy: float = Form(...),
    report_text: str = Form(...),
    photo: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    # Read uploaded photo
    photo_bytes = await photo.read()
    if len(photo_bytes) < 100:
        raise HTTPException(status_code=400, detail="Uploaded photo is empty or corrupted")

    # Validate EXIF metadata using Pillow
    exif_analysis = validate_image_exif(photo_bytes)

    # Verify geofence distance
    venue_lat = float(event.venue_latitude)
    venue_lon = float(event.venue_longitude)
    distance = haversine_distance_meters(latitude, longitude, venue_lat, venue_lon)

    # Save photo to local disk / public storage
    os.makedirs("uploads/disputes", exist_ok=True)
    filename = f"dispute_evt{event_id}_{uuid.uuid4().hex[:8]}.jpg"
    filepath = os.path.join("uploads/disputes", filename)
    with open(filepath, "wb") as f:
        f.write(photo_bytes)
    photo_url = f"/uploads/disputes/{filename}"

    # Create VenueDispute entry
    dispute = VenueDispute(
        event_id=event_id,
        reporter_user_id=reporter_user_id,
        ticket_id=ticket_id,
        reporter_latitude=latitude,
        reporter_longitude=longitude,
        gps_accuracy_meters=accuracy,
        distance_from_venue_meters=round(distance, 2),
        photo_url=photo_url,
        exif_capture_time=exif_analysis["capture_time"],
        exif_camera_make=exif_analysis["camera_make"],
        exif_camera_model=exif_analysis["camera_model"],
        exif_validation_status=exif_analysis["status"],
        report_text=report_text,
        status="PENDING_REVIEW"
    )
    db.add(dispute)
    db.commit()
    db.refresh(dispute)

    # Crowd Fraud Freeze Evaluation Algorithm
    # 1. Total tickets sold
    total_tickets_sold = db.query(Ticket).filter(Ticket.event_id == event_id).count()
    if total_tickets_sold == 0:
        total_tickets_sold = 1

    # 2. Count distinct reporters for this event
    distinct_reporters = db.query(VenueDispute.reporter_user_id).filter(
        VenueDispute.event_id == event_id
    ).distinct().count()

    # 3. Count checked-in tickets
    checked_in_count = db.query(Ticket).filter(
        Ticket.event_id == event_id,
        Ticket.status == "CHECKED_IN"
    ).count()

    # Dynamic thresholds from system_settings
    dispute_threshold_ratio = get_dynamic_setting(
        db, "DISPUTE_FREEZE_THRESHOLD_RATIO", settings.default_dispute_threshold_ratio
    )
    min_reporters = int(get_dynamic_setting(
        db, "MIN_DISPUTE_REPORTERS", float(settings.default_min_dispute_reporters)
    ))
    max_checkin_ratio = get_dynamic_setting(
        db, "MAX_CHECKIN_RATIO_FOR_DISPUTE", settings.default_max_checkin_ratio_for_dispute
    )

    dispute_ratio = distinct_reporters / float(total_tickets_sold)
    checkin_ratio = checked_in_count / float(total_tickets_sold)

    auto_frozen = False
    if (distinct_reporters >= min_reporters and
        dispute_ratio >= dispute_threshold_ratio and
        checkin_ratio <= max_checkin_ratio):

        logger.warning(
            f"AUTOMATIC FRAUD FREEZE TRIGGERED for Event {event_id}: "
            f"Reporters={distinct_reporters}, Ratio={dispute_ratio:.2f}>={dispute_threshold_ratio}, "
            f"Checkins={checkin_ratio:.2f}<={max_checkin_ratio}"
        )

        if event.status != "FROZEN_DISPUTE":
            event.status = "FROZEN_DISPUTE"
            escrow = db.query(EscrowTransfer).filter(EscrowTransfer.event_id == event_id).first()
            if escrow:
                escrow.status = "FROZEN_DISPUTE"
                escrow.dispute_reason = (
                    f"Automated anti-scam freeze: {distinct_reporters} verified attendees reported fake/empty venue "
                    f"({dispute_ratio*100:.1f}% dispute ratio, {checkin_ratio*100:.1f}% checkin ratio)."
                )

            # Freeze tickets
            db.query(Ticket).filter(
                Ticket.event_id == event_id,
                Ticket.status == "PAID_HELD_IN_ESCROW"
            ).update({"status": "DISPUTE_FROZEN"}, synchronize_session=False)

            # Record dispute freeze in Double-Entry Ledger
            now = datetime.now(timezone.utc)
            ledger_entry = LedgerEntry(
                entry_id=uuid.uuid4(),
                transaction_id=f"FREEZE_EVT_{event_id}_{int(now.timestamp())}",
                idempotency_key=f"LEDGER_AUTO_FREEZE_{event_id}_{dispute.id}",
                account_from=f"ESCROW_POOL_EVENT_{event_id}",
                account_to="DISPUTE_FROZEN_HOLD",
                amount=escrow.gross_amount if escrow else 0.0,
                currency="INR",
                entry_type="DISPUTE_FREEZE",
                metadata_json={
                    "eventId": event_id,
                    "reporters": distinct_reporters,
                    "disputeRatio": round(dispute_ratio, 3),
                    "trigger": "AUTOMATIC_CROWD_CONSENSUS"
                },
                created_at=now
            )
            db.add(ledger_entry)
            db.commit()
            auto_frozen = True

    return {
        "success": True,
        "message": "Dispute submitted successfully with live EXIF and GPS evidence",
        "dispute_id": dispute.id,
        "distance_from_venue_meters": dispute.distance_from_venue_meters,
        "exif_status": exif_analysis["status"],
        "exif_details": exif_analysis["details"],
        "automatic_fraud_freeze_triggered": auto_frozen,
        "current_dispute_count": distinct_reporters
    }
