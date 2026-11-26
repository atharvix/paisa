# Veritix — Geo-Verification, EXIF Fraud Engine & Escrow Scheduler (Python)

> **Physical Presence Verification, Image Forensics & Automated Escrow Settlement Worker**  
> Built with **Python 3.11+**, **FastAPI**, **SQLAlchemy**, **Pillow (PIL)**, and **APScheduler**. Enforces physical venue presence through high-accuracy GPS telemetry, verifies camera hardware integrity through EXIF inspection, evaluates crowd consensus to automatically freeze fraudulent payouts, and runs background scheduled workers to release mature escrow holds and batch attendee refunds.

---

## 1. Module Overview & Architecture

The Python microservice runs natively on port `8000` and interacts directly with the PostgreSQL database (`antiscam_ticketing`). It eliminates external dependencies like Celery or Redis by running an embedded `APScheduler` within the FastAPI application lifespan.

```
service-python/
├── api_routes.py             # FastAPI route definitions (/api/geo/check-in, /api/geo/report-venue, /api/geo/health)
├── config.py                 # Pydantic Settings reading .env and system_settings defaults
├── database.py               # SQLAlchemy database session factory (SessionLocal, engine connection pooling)
├── escrow_scheduler.py       # Background jobs: 12h hold release and batch auto-refunds (60s tick)
├── geo_exif_service.py       # Pure math/forensic functions: Haversine distance, EXIF validation, dynamic settings
├── main.py                   # FastAPI application initialization & lifespan context manager for scheduler
├── models.py                 # SQLAlchemy ORM models matching database/schema.sql
├── requirements.txt          # Python package manifest
└── uploads/disputes/         # Local storage for crowd-submitted forensic dispute images
```

---

## 2. API Endpoints Reference

### 1. `GET /api/geo/health`
- **Purpose**: Microservice health check and scheduler status verification.
- **Auth**: Public.
- **Response**:
  ```json
  {
    "service": "Python Geo-Verification, EXIF Fraud Engine & APScheduler",
    "status": "UP",
    "scheduler_enabled": true,
    "scheduler_interval": 60
  }
  ```

---

### 2. `POST /api/geo/check-in`
- **Purpose**: Physical venue presence check-in for ticket holders.
- **Content-Type**: `application/x-www-form-urlencoded` / `multipart/form-data`
- **Parameters**:
  - `ticket_id` (`int`, required): Unique ticket ID.
  - `latitude` (`float`, required): Device latitude coordinate.
  - `longitude` (`float`, required): Device longitude coordinate.
  - `accuracy` (`float`, required): Device GPS error radius in meters.
- **Validation Pipeline**:
  1. Verifies ticket exists and is currently in `PAID_HELD_IN_ESCROW` status.
  2. Queries `GPS_ACCURACY_CEILING_METERS` from `system_settings` (default `150.0m`). If `accuracy > 150.0m`, check-in is rejected with `HTTP 400` to prevent GPS spoofing.
  3. Queries `GEOFENCE_RADIUS_METERS` from `system_settings` (default `300.0m`).
  4. Computes Haversine distance from the event's `venue_latitude` and `venue_longitude`.
  5. If `distance > geofence_radius`, check-in is rejected with `HTTP 400` reporting exact distance.
  6. Upon success, updates ticket status to `CHECKED_IN`, sets `checked_in_at = NOW()`, and stores check-in coordinates.
- **Success Response (`HTTP 200`)**:
  ```json
  {
    "success": true,
    "message": "Successfully checked in at venue! Distance: 42.5m",
    "ticket_number": "TKT-EVT1-A8B9C0D1",
    "distance_meters": 42.5,
    "checked_in_at": "2026-11-26T10:15:30.123456Z"
  }
  ```

---

### 3. `POST /api/geo/report-venue`
- **Purpose**: "Report Ghost / Empty Venue" flow capturing camera evidence and triggering crowd-consensus fraud freezing.
- **Content-Type**: `multipart/form-data`
- **Parameters**:
  - `event_id` (`int`, required): Event ID being reported.
  - `reporter_user_id` (`int`, required): ID of reporting attendee.
  - `ticket_id` (`int`, optional): Attendee's ticket ID.
  - `latitude` (`float`, required): Device GPS latitude.
  - `longitude` (`float`, required): Device GPS longitude.
  - `accuracy` (`float`, required): Device GPS accuracy error in meters.
  - `report_text` (`str`, required): Description of conditions at venue.
  - `photo` (`UploadFile`, required): Image captured via mobile camera.
- **Forensic Pipeline**:
  1. Inspects image EXIF metadata using Pillow (`PIL.Image`).
  2. Computes Haversine distance between reporter coordinates and venue.
  3. Stores the image in `uploads/disputes/` and persists a `venue_disputes` row.
  4. Evaluates the **Crowd-Consensus Fraud Freezing Algorithm**.
- **Success Response (`HTTP 200`)**:
  ```json
  {
    "success": true,
    "message": "Dispute submitted successfully with live EXIF and GPS evidence",
    "dispute_id": 4,
    "distance_from_venue_meters": 18.4,
    "exif_status": "VERIFIED_VALID",
    "exif_details": "Verified camera shot from Canon EOS R6 taken at 2026:11:26 10:14:22.",
    "automatic_fraud_freeze_triggered": true,
    "current_dispute_count": 3
  }
  ```

---

## 3. Mathematical & Algorithmic Rules

### A. Haversine Great-Circle Distance
Computed in [`geo_exif_service.py`](file:///d:/per-por/nikunj_bhaiya/service-python/geo_exif_service.py#L9-L22):
$$d = 2R \cdot \text{atan2}\left(\sqrt{a}, \sqrt{1-a}\right)$$
$$\text{where } a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
- $R = 6,371,000\text{ meters}$ (Earth's mean radius).
- $\phi_1, \phi_2$ = latitudes in radians; $\Delta \phi, \Delta \lambda$ = differences in radians.
- If $d \le \text{GEOFENCE\_RADIUS\_METERS}$ (default $300\text{m}$), presence is confirmed.

---

### B. Pillow Camera EXIF Validation Logic
Evaluated in [`geo_exif_service.py`](file:///d:/per-por/nikunj_bhaiya/service-python/geo_exif_service.py#L38-L98):
- **Hardware Metadata**: Reads Tag `271` (`Make`) and Tag `272` (`Model`).
- **Timestamp Freshness**: Parses Tag `36867` (`DateTimeOriginal`) or `DateTimeDigitized`:
  $$\text{Age Hours} = \frac{|\text{Server Time} - \text{EXIF Capture Time}|}{3600}$$
  - If $\text{Age Hours} > 24\text{ hours}$: marked `TAMPERED_TIMESTAMPS`.
  - If EXIF tags are missing (e.g. screenshots, downloaded images): marked `SUSPECT_METADATA_MISSING`.
  - If valid camera model exists and timestamp $< 24\text{h}$: marked `VERIFIED_VALID`.

---

### C. Crowd-Consensus Fraud Freezing Evaluation
Evaluated in [`api_routes.py`](file:///d:/per-por/nikunj_bhaiya/service-python/api_routes.py#L140-L198):
$$\text{Dispute Ratio} = \frac{\text{Distinct Verified Attendees Who Reported Fraud}}{\text{Total Sold Tickets}}$$
$$\text{Check-In Ratio} = \frac{\text{Checked-In Tickets}}{\text{Total Sold Tickets}}$$

An **Automated Fraud Freeze** is triggered if and only if:
1. $\text{Distinct Reporters} \ge \text{MIN\_DISPUTE\_REPORTERS}$ (default `3`).
2. $\text{Dispute Ratio} \ge \text{DISPUTE\_FREEZE\_THRESHOLD\_RATIO}$ (default `0.25` / $25\%$).
3. $\text{Check-In Ratio} \le \text{MAX\_CHECKIN\_RATIO\_FOR\_DISPUTE}$ (default `0.30` / $30\%$).

**Automated Actions Executed Immediately**:
- `events.status` updated to `'FROZEN_DISPUTE'`.
- `escrow_transfers.status` updated to `'FROZEN_DISPUTE'`.
- All unredeemed tickets (`PAID_HELD_IN_ESCROW`) transitioned to `'DISPUTE_FROZEN'`.
- Balanced entry logged in `ledger_entries` under `'DISPUTE_FREEZE'`.

---

## 4. APScheduler Background Worker Engine

Initialized in [`escrow_scheduler.py`](file:///d:/per-por/nikunj_bhaiya/service-python/escrow_scheduler.py) and managed by FastAPI lifespan events:

```python
# Ticks every 60 seconds
scheduler.add_job(release_mature_escrow_holds, "interval", seconds=60, id="escrow_release_job")
scheduler.add_job(process_batch_refunds_for_frozen_events, "interval", seconds=60, id="batch_refund_job")
```

1. **`release_mature_escrow_holds`**:
   - Queries `escrow_transfers` where `status = 'ON_HOLD'` and `on_hold_until <= NOW()`.
   - Verifies the event is not in `FROZEN_DISPUTE` or `CANCELED`.
   - Transitions `escrow_transfers.status = 'RELEASED'`, records `released_at = NOW()`, and sets `events.status = 'RELEASED_SETTLED'`.
   - Records double-entry transaction: `ESCROW_POOL_EVENT_{id}` $\rightarrow$ `HOST_LINKED_ACCOUNT_{id}` (`ESCROW_RELEASE`).

2. **`process_batch_refunds_for_frozen_events`**:
   - Scans events in `CANCELED` or `FROZEN_DISPUTE`.
   - Locates tickets in `PAID_HELD_IN_ESCROW` or `DISPUTE_FROZEN`.
   - Transitions tickets to `AUTO_REFUNDED`.
   - Records double-entry transaction: `ESCROW_POOL_EVENT_{id}` $\rightarrow$ `USER_REFUND_WALLET_{userId}` (`AUTO_REFUND`).

---

## 5. Installation & Execution

### Prerequisites
- Python 3.11+
- Working PostgreSQL instance (`localhost:5432`)

### Install Dependencies
```powershell
$env:CURL_CA_BUNDLE = $null
$env:SSL_CERT_FILE = $null
pip install -r service-python\requirements.txt
```

### Run Native Service
```powershell
cd service-python
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
The service will bind to `http://localhost:8000`.
