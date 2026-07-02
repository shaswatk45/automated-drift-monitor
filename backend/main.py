# main.py
# ──────────────────────────────────────────────────────────────────────────────
# FastAPI application for the Automated Drift Monitor.
#
# Start the server:
#   python backend/main.py
#
# Then visit:
#   http://localhost:8000/docs   — interactive Swagger UI
#   http://localhost:8000/health — health check
# ──────────────────────────────────────────────────────────────────────────────

import logging
import os
import sys
from contextlib import asynccontextmanager

import yaml
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ── Project root ──────────────────────────────────────────────────────────────
# This script lives in backend/, so the project root is one level up.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, PROJECT_ROOT)

# ── Logging setup ─────────────────────────────────────────────────────────────
os.makedirs(os.path.join(PROJECT_ROOT, "logs"), exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(PROJECT_ROOT, "logs", "backend.log")),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)

# ── Load config ───────────────────────────────────────────────────────────────
config_path = os.path.join(PROJECT_ROOT, "configs", "config.yaml")
with open(config_path, "r") as f:
    config = yaml.safe_load(f)
log.info(f"Config loaded from {config_path}")

# ── Lifespan handler (replaces deprecated @app.on_event) ──────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("=" * 60)
    log.info("  Automated Drift Monitor API is starting...")
    log.info(f"  Docs available at: http://localhost:{config['backend']['port']}/docs")
    log.info("=" * 60)
    yield
    log.info("Automated Drift Monitor API shutting down.")


# ── Create FastAPI app ────────────────────────────────────────────────────────
app = FastAPI(
    title="Automated Drift Monitor API",
    description=(
        "Backend API for the Automated Data & Model Drift Monitoring Platform. "
        "Provides endpoints for loan predictions, drift detection, and report retrieval."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS middleware ───────────────────────────────────────────────────────────
# Allowed origins come from the CORS_ALLOW_ORIGINS env var (comma-separated),
# falling back to a permissive dev default. Per the CORS spec, credentials
# cannot be combined with a "*" wildcard, so we disable credentials in that
# case to keep the configuration valid and browsers happy.
_cors_env = os.environ.get("CORS_ALLOW_ORIGINS", "*").strip()
_allow_origins = [o.strip() for o in _cors_env.split(",") if o.strip()]
_allow_credentials = _allow_origins != ["*"]
log.info(f"CORS allow_origins={_allow_origins} allow_credentials={_allow_credentials}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Initialize shared dependencies ────────────────────────────────────────────
# These are created once at startup and shared across all requests.

from ml_pipeline.predict import LoanPredictor
from backend.database import ReportStore
from drift_detection.drift_detector import DriftDetector

# 1. Loan predictor (loads model + encoders once)
predictor = LoanPredictor(
    model_path=os.path.join(PROJECT_ROOT, config["paths"]["trained_model"]),
    encoder_path=os.path.join(PROJECT_ROOT, config["paths"]["label_encoders"]),
    metadata_path=os.path.join(PROJECT_ROOT, config["paths"]["model_metadata"]),
)

# 2. Report store (file-based)
report_store = ReportStore(
    report_dir=os.path.join(PROJECT_ROOT, config["drift_detection"]["report_output_dir"])
)

# 3. Drift detector factory — creates a fresh detector for each drift check
#    (because the detector stores state from each run)
drift_cfg = config["drift_detection"]


def create_detector():
    """Factory function that creates a new DriftDetector instance."""
    return DriftDetector(
        baseline_path=os.path.join(PROJECT_ROOT, config["paths"]["baseline_stats"]),
        encoder_path=os.path.join(PROJECT_ROOT, config["paths"]["label_encoders"]),
        metadata_path=os.path.join(PROJECT_ROOT, config["paths"]["model_metadata"]),
        raw_data_path=os.path.join(PROJECT_ROOT, config["paths"]["raw_data"]),
        drop_columns=drift_cfg["drop_columns"],
        target_column=drift_cfg["target_column"],
        thresholds=drift_cfg["thresholds"],
        min_sample_size=drift_cfg.get("min_sample_size", 50),
    )


# ── Register routes ───────────────────────────────────────────────────────────
from backend.routes import router, init_routes

# Inject dependencies into the routes module
init_routes(
    predictor=predictor,
    detector_factory=create_detector,
    report_store=report_store,
    config=config,
    project_root=PROJECT_ROOT,
)

# Include all routes
app.include_router(router)

# ── Entrypoint ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    uvicorn.run(
        "backend.main:app",
        host=config["backend"]["host"],
        port=config["backend"]["port"],
        reload=True,                      # auto-reload on code changes (dev mode)
    )
