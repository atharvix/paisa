import logging
import uuid
from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from database import SessionLocal
from models import Event, EscrowTransfer, Ticket, LedgerEntry, SystemSetting
from config import settings

logger = logging.getLogger("EscrowScheduler")

def release_mature_escrow_holds():
    """
    Scans for events past their escrow hold period (event_end_time + 12 hours)
    with zero unaddressed disputes, and releases the payout.
    """
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        transfers = db.query(EscrowTransfer).filter(
            EscrowTransfer.status == "ON_HOLD",
            EscrowTransfer.on_hold_until <= now
        ).all()

        for transfer in transfers:
            event = db.query(Event).filter(Event.id == transfer.event_id).first()
            if not event:
                continue

            # Check if event was frozen or canceled
            if event.status in ("FROZEN_DISPUTE", "CANCELED"):
                logger.warning(f"Event {event.id} is in {event.status}. Skipping automated payout release.")
                continue

            logger.info(f"Releasing Escrow Payout for Event {event.id} ('{event.title}'). Net: {transfer.net_payout_amount} INR")

            transfer.status = "RELEASED"
            transfer.released_at = now
            event.status = "RELEASED_SETTLED"

            # Record in double-entry audit ledger
            ledger_entry = LedgerEntry(
                entry_id=uuid.uuid4(),
                transaction_id=f"REL_EVT_{event.id}_{int(now.timestamp())}",
                idempotency_key=f"LEDGER_RELEASE_{event.id}_{transfer.id}",
                account_from=f"ESCROW_POOL_EVENT_{event.id}",
                account_to=f"HOST_LINKED_ACCOUNT_{transfer.host_account_id}",
                amount=transfer.net_payout_amount,
                currency="INR",
                entry_type="ESCROW_RELEASE",
                metadata_json={"eventId": event.id, "hostAccount": transfer.host_account_id, "gross": float(transfer.gross_amount)},
                created_at=now
            )
            db.add(ledger_entry)

        db.commit()
    except Exception as e:
        logger.error(f"Error in release_mature_escrow_holds: {e}")
        db.rollback()
    finally:
        db.close()

def process_batch_refunds_for_frozen_events():
    """
    Scans for events marked 'CANCELED' or 'FROZEN_DISPUTE' and automatically
    processes full refunds to attendees' original payment source.
    """
    db: Session = SessionLocal()
    try:
        now = datetime.now(timezone.utc)
        flagged_events = db.query(Event).filter(
            Event.status.in_(["CANCELED", "FROZEN_DISPUTE"])
        ).all()

        for event in flagged_events:
            tickets_to_refund = db.query(Ticket).filter(
                Ticket.event_id == event.id,
                Ticket.status.in_(["PAID_HELD_IN_ESCROW", "DISPUTE_FROZEN"])
            ).all()

            for ticket in tickets_to_refund:
                logger.info(f"Refunding Ticket {ticket.ticket_number} for flagged Event {event.id}. Amount: {ticket.purchase_price} INR")
                ticket.status = "AUTO_REFUNDED"

                # Record in double-entry audit ledger
                ledger_entry = LedgerEntry(
                    entry_id=uuid.uuid4(),
                    transaction_id=f"RFD_{ticket.id}_{int(now.timestamp())}",
                    idempotency_key=f"LEDGER_REFUND_{ticket.id}_{ticket.ticket_number}",
                    account_from=f"ESCROW_POOL_EVENT_{event.id}",
                    account_to=f"USER_REFUND_WALLET_{ticket.user_id}",
                    amount=ticket.purchase_price,
                    currency="INR",
                    entry_type="AUTO_REFUND",
                    metadata_json={
                        "ticketId": ticket.id,
                        "ticketNumber": ticket.ticket_number,
                        "reason": f"Event status is {event.status}"
                    },
                    created_at=now
                )
                db.add(ledger_entry)

        db.commit()
    except Exception as e:
        logger.error(f"Error in process_batch_refunds_for_frozen_events: {e}")
        db.rollback()
    finally:
        db.close()

def init_scheduler() -> BackgroundScheduler:
    scheduler = BackgroundScheduler(timezone="UTC")
    interval = settings.scheduler_interval_seconds
    scheduler.add_job(release_mature_escrow_holds, "interval", seconds=interval, id="escrow_release_job")
    scheduler.add_job(process_batch_refunds_for_frozen_events, "interval", seconds=interval, id="batch_refund_job")
    return scheduler
