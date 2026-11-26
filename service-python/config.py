import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    python_port: int = 8000
    python_db_url: str = "postgresql://postgres:postgres@localhost:5432/antiscam_ticketing"
    scheduler_interval_seconds: int = 60
    scheduler_enabled: bool = True

    # Fallback default values
    default_platform_commission_percent: float = 10.0
    default_escrow_hold_duration_seconds: int = 43200
    default_geofence_radius_meters: float = 300.0
    default_gps_accuracy_ceiling_meters: float = 150.0
    default_dispute_threshold_ratio: float = 0.25
    default_min_dispute_reporters: int = 3
    default_max_checkin_ratio_for_dispute: float = 0.30

    razorpay_key_id: str = "rzp_test_antiscam_key_id"
    razorpay_key_secret: str = "rzp_test_antiscam_secret_val"
    razorpay_simulation_mode: bool = True

    class Config:
        env_file = ("../.env", ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()
