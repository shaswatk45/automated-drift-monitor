# routes.py
# ──────────────────────────────────────────────────────────────────────────────
# FastAPI route handlers for the Automated Drift Monitor backend.
#
# Endpoints:
#   GET  /health                — server health check
#   GET  /model/info            — model metadata (version, features, metrics)
#   POST /predict               — single-row loan prediction
#   POST /drift/run             — upload CSV, run drift check, return results
#   GET  /drift/reports         — list all saved drift reports
#   GET  /drift/reports/{name}  — fetch a specific report
#   GET  /drift/reports/{name}/download — download a report as an attachment
#   DELETE /drift/reports/{name} — delete a specific report
#   GET  /drift/latest          — fetch the most recent report
#   GET  /drift/history         — time series of drift scores for trend charts
# ──────────────────────────────────────────────────────────────────────────────

import io
import json
import logging
import os
from datetime import datetime, timezone

import pandas as pd
from fastapi import APIRouter, File, HTTPException, UploadFile
from fastapi.responses import JSONResponse
from pydantic import BaseModel

log = logging.getLogger(__name__)

# ── This will be called once from main.py to inject shared dependencies ──────
_predictor = None
_detector_factory = None
_report_store = None
_config = None
_project_root = None


def init_routes(predictor, detector_factory, report_store, config, project_root):
    """
    Initialize route dependencies.  Called once at startup from main.py.

    Parameters
    ----------
    predictor : LoanPredictor
        Pre-loaded prediction helper.
    detector_factory : callable
        A function that returns a configured DriftDetector instance.
    report_store : ReportStore
        File-based report storage.
    config : dict
        Full project config.
    project_root : str
        Absolute path to the project root directory.
    """
    global _predictor, _detector_factory, _report_store, _config, _project_root
    _predictor = predictor
    _detector_factory = detector_factory
    _report_store = report_store
    _config = config
    _project_root = project_root


# ── Router ────────────────────────────────────────────────────────────────────
router = APIRouter()


# ── Pydantic models for request/response validation ──────────────────────────

class PredictionRequest(BaseModel):
    """
    Input schema for the /predict endpoint.
    Each field corresponds to a feature in the loan prediction dataset.
    All fields are optional so partial inputs can be handled gracefully.
    """
    Gender: str = "Male"
    Married: str = "Yes"
    Dependents: str = "0"
    Education: str = "Graduate"
    Self_Employed: str = "No"
    ApplicantIncome: float = 5000
    CoapplicantIncome: float = 0
    LoanAmount: float = 150
    Loan_Amount_Term: float = 360
    Credit_History: float = 1.0
    Property_Area: str = "Urban"


# ── Endpoint: Health check ────────────────────────────────────────────────────

@router.get("/health", tags=["System"])
def health_check():
    """
    Simple health check — returns 200 if the server is running.
    Useful for monitoring tools and load balancers.
    """
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ── Endpoint: Model info ─────────────────────────────────────────────────────

@router.get("/model/info", tags=["Model"])
def get_model_info():
    """
    Return model metadata: version, training date, feature names,
    evaluation metrics, and hyperparameters.
    """
    metadata_path = os.path.join(_project_root, _config["paths"]["model_metadata"])
    if not os.path.exists(metadata_path):
        raise HTTPException(status_code=404, detail="Model metadata not found")

    with open(metadata_path, "r") as f:
        metadata = json.load(f)
    return metadata


# ── Endpoint: Predict ─────────────────────────────────────────────────────────

@router.post("/predict", tags=["Model"])
def predict(request: PredictionRequest):
    """
    Make a loan approval prediction for a single applicant.

    Send a JSON body with the applicant's features and receive back:
      - prediction: "Y" (approved) or "N" (rejected)
      - probability: confidence score (0.0 to 1.0)
    """
    # Convert the Pydantic model to a plain dict for the predictor
    features = request.model_dump()
    try:
        result = _predictor.predict(features)
        return result
    except Exception as e:
        log.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


# ── Endpoint: Run drift check ────────────────────────────────────────────────

@router.post("/drift/run", tags=["Drift Detection"])
async def run_drift_check(file: UploadFile = File(...)):
    """
    Upload a production CSV file and run a drift check against baseline.

    The endpoint will:
      1. Read the uploaded CSV into a DataFrame.
      2. Run the DriftDetector on it.
      3. Save a JSON report to logs/drift_reports/.
      4. Return the drift results.
    """
    # Validate file type
    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are supported. Please upload a .csv file."
        )

    try:
        # Read the uploaded file into a DataFrame
        contents = await file.read()
        production_df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
        log.info(f"Uploaded file '{file.filename}' -- shape: {production_df.shape}")

        # Also save the uploaded file to data/production/ for record-keeping.
        # Sanitize the filename to its basename so a crafted name like
        # "../../evil.csv" cannot escape the production directory.
        prod_dir = os.path.join(_project_root, _config["drift_detection"]["production_data_dir"])
        os.makedirs(prod_dir, exist_ok=True)
        safe_name = os.path.basename(file.filename)
        save_path = os.path.join(prod_dir, safe_name)
        production_df.to_csv(save_path, index=False)
        log.info(f"Saved uploaded file to {save_path}")

        # Create a fresh detector and run the check
        detector = _detector_factory()
        results = detector.detect_drift(production_df)

        # Save the report
        from drift_detection.drift_report import generate_report
        report_dir = os.path.join(_project_root, _config["drift_detection"]["report_output_dir"])
        report_path = generate_report(results, report_dir)

        # Add the report filename to the response
        results["report_file"] = os.path.basename(report_path)
        return results

    except Exception as e:
        log.error(f"Drift check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Drift check error: {str(e)}")


# ── Endpoint: List drift reports ──────────────────────────────────────────────

@router.get("/drift/reports", tags=["Drift Detection"])
def list_drift_reports():
    """
    List all available drift reports, sorted by date (newest first).
    Returns filename, creation timestamp, and file size for each report.
    """
    reports = _report_store.list_reports()
    return {"total": len(reports), "reports": reports}


# ── Endpoint: Get specific report ─────────────────────────────────────────────

@router.get("/drift/reports/{filename}", tags=["Drift Detection"])
def get_drift_report(filename: str):
    """
    Fetch a specific drift report by its filename.
    Example: GET /drift/reports/drift_report_20260309_135316.json
    """
    report = _report_store.get_report(filename)
    if report is None:
        raise HTTPException(status_code=404, detail=f"Report '{filename}' not found")
    return report


# ── Endpoint: Get latest report ───────────────────────────────────────────────

@router.get("/drift/latest", tags=["Drift Detection"])
def get_latest_drift_report():
    """
    Fetch the most recent drift report.
    Returns 404 if no reports exist yet.
    """
    report = _report_store.get_latest_report()
    if report is None:
        raise HTTPException(status_code=404, detail="No drift reports found")
    return report


# ── Endpoint: Drift history (time series) ─────────────────────────────────────

@router.get("/drift/history", tags=["Drift Detection"])
def get_drift_history(limit: int = 100):
    """
    Return a time-ordered (oldest-first) history of drift runs for trend
    charts: each point has timestamp, drift_score, and drift counts.
    """
    limit = max(1, min(limit, 500))
    return {"points": _report_store.history(limit=limit)}


# ── Endpoint: Download a report as a file ─────────────────────────────────────

@router.get("/drift/reports/{filename}/download", tags=["Drift Detection"])
def download_drift_report(filename: str):
    """Download a specific report as a JSON attachment."""
    report = _report_store.get_report(filename)
    if report is None:
        raise HTTPException(status_code=404, detail=f"Report '{filename}' not found")
    return JSONResponse(
        content=report,
        headers={"Content-Disposition": f'attachment; filename="{os.path.basename(filename)}"'},
    )


# ── Endpoint: Delete a report ─────────────────────────────────────────────────

@router.delete("/drift/reports/{filename}", tags=["Drift Detection"])
def delete_drift_report(filename: str):
    """Delete a specific drift report. Returns 404 if it does not exist."""
    ok = _report_store.delete_report(filename)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Report '{filename}' not found")
    return {"deleted": filename}
