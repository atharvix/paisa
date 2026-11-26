import math
from datetime import datetime, timezone
from io import BytesIO
from typing import Dict, Any, Tuple
from PIL import Image, ExifTags
from sqlalchemy.orm import Session
from models import SystemSetting
from config import settings

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes exact great-circle distance between two GPS coordinates in meters.
    """
    R = 6371000.0  # Earth's mean radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    return R * c

def get_dynamic_setting(db: Session, key: str, default_val: float) -> float:
    """
    Retrieves runtime setting from system_settings table, falling back to config default.
    """
    row = db.query(SystemSetting).filter(SystemSetting.setting_key == key).first()
    if row and row.setting_value:
        try:
            return float(row.setting_value)
        except ValueError:
            pass
    return default_val

def validate_image_exif(image_bytes: bytes) -> Dict[str, Any]:
    """
    Validates physical presence proof from live camera upload.
    Extracts DateTimeOriginal, Make, Model, and checks timestamp freshness.
    """
    result = {
        "status": "SUSPECT_METADATA_MISSING",
        "capture_time": None,
        "camera_make": None,
        "camera_model": None,
        "details": "No EXIF tags found in uploaded photo."
    }

    try:
        image = Image.open(BytesIO(image_bytes))
        exif_raw = image._getexif()

        if not exif_raw:
            return result

        exif = {}
        for tag_id, value in exif_raw.items():
            tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
            exif[tag_name] = value

        make = exif.get("Make")
        model = exif.get("Model")
        date_str = exif.get("DateTimeOriginal") or exif.get("DateTimeDigitized") or exif.get("DateTime")

        result["camera_make"] = str(make).strip() if make else None
        result["camera_model"] = str(model).strip() if model else None

        if date_str:
            try:
                # Format typically 'YYYY:MM:DD HH:MM:SS'
                capture_dt = datetime.strptime(str(date_str).strip(), "%Y:%m:%d %H:%M:%S")
                capture_dt = capture_dt.replace(tzinfo=timezone.utc)
                result["capture_time"] = capture_dt

                now = datetime.now(timezone.utc)
                age_hours = abs((now - capture_dt).total_seconds()) / 3600.0

                if age_hours > 24.0:
                    result["status"] = "TAMPERED_TIMESTAMPS"
                    result["details"] = f"Photo timestamp is too old ({age_hours:.1f} hours old). Live venue photo required."
                else:
                    result["status"] = "VERIFIED_VALID"
                    result["details"] = f"Verified camera shot from {make or 'Camera'} {model or ''} taken at {date_str}."
            except Exception as e:
                result["status"] = "SUSPECT_METADATA_MISSING"
                result["details"] = f"Could not parse EXIF date: {e}"
        else:
            result["status"] = "SUSPECT_METADATA_MISSING"
            result["details"] = "Image lacks DateTimeOriginal metadata (possible screenshot or web download)."

    except Exception as e:
        result["status"] = "SUSPECT_METADATA_MISSING"
        result["details"] = f"Failed to parse image EXIF data: {e}"

    return result
