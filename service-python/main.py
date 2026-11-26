import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from config import settings
from api_routes import router as geo_router
from escrow_scheduler import init_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("PythonFraudEngine")

# Lifespan context manager to gracefully manage APScheduler
@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = None
    if settings.scheduler_enabled:
        scheduler = init_scheduler()
        scheduler.start()
        logger.info(f"APScheduler background engine started (Interval: {settings.scheduler_interval_seconds}s)")
    yield
    if scheduler and scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("APScheduler gracefully shut down.")

app = FastAPI(
    title="Anti-Scam Event Ticketing Geo & Fraud Detection Engine",
    description="Haversine distance verification, EXIF camera fraud inspection, and APScheduler Escrow settlement",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for dispute photos
os.makedirs("uploads/disputes", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routes
app.include_router(geo_router)

@app.get("/")
def root():
    return {
        "service": "Anti-Scam Event Ticketing Python Geo/Fraud & Scheduler Engine",
        "status": "OPERATIONAL",
        "endpoints": ["/api/geo/health", "/api/geo/check-in", "/api/geo/report-venue"]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.python_port, reload=True)
