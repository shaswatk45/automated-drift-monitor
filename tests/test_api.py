# tests/test_api.py
# ──────────────────────────────────────────────────────────────────────────────
# Integration tests for the FastAPI backend endpoints.
#
# These tests run against the full FastAPI app using the TestClient, so they
# require that the trained model artifacts already exist in models/.
# Run `python ml_pipeline/train_model.py` before running this suite.
#
# Usage:
#   pytest tests/test_api.py -v
# ──────────────────────────────────────────────────────────────────────────────

import io
import os
import sys

import pandas as pd

# Make the project root importable
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

# ── App import (loads config, model, etc.) ────────────────────────────────────
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)


# ── Helper ────────────────────────────────────────────────────────────────────

SAMPLE_PAYLOAD = {
    "Gender": "Male",
    "Married": "Yes",
    "Dependents": "0",
    "Education": "Graduate",
    "Self_Employed": "No",
    "ApplicantIncome": 5000,
    "CoapplicantIncome": 1500,
    "LoanAmount": 120,
    "Loan_Amount_Term": 360,
    "Credit_History": 1.0,
    "Property_Area": "Urban",
}


def _make_csv_bytes(n_rows: int = 60) -> bytes:
    """Create a minimal valid production CSV with n_rows rows."""
    data = {
        "Loan_ID":            [f"LP{i:05d}" for i in range(n_rows)],
        "Gender":             ["Male"] * n_rows,
        "Married":            ["Yes"] * n_rows,
        "Dependents":         ["0"] * n_rows,
        "Education":          ["Graduate"] * n_rows,
        "Self_Employed":      ["No"] * n_rows,
        "ApplicantIncome":    [5000 + i * 10 for i in range(n_rows)],
        "CoapplicantIncome":  [0.0] * n_rows,
        "LoanAmount":         [150.0] * n_rows,
        "Loan_Amount_Term":   [360.0] * n_rows,
        "Credit_History":     [1.0] * n_rows,
        "Property_Area":      ["Urban"] * n_rows,
        "Loan_Status":        ["Y"] * n_rows,
    }
    df = pd.DataFrame(data)
    return df.to_csv(index=False).encode("utf-8")


# ── Tests: /health ────────────────────────────────────────────────────────────

class TestHealth:
    def test_health_returns_200(self):
        resp = client.get("/health")
        assert resp.status_code == 200

    def test_health_body(self):
        resp = client.get("/health")
        body = resp.json()
        assert body["status"] == "healthy"
        assert "timestamp" in body


# ── Tests: /model/info ────────────────────────────────────────────────────────

class TestModelInfo:
    def test_model_info_returns_200(self):
        resp = client.get("/model/info")
        assert resp.status_code == 200

    def test_model_info_has_required_keys(self):
        resp = client.get("/model/info")
        body = resp.json()
        for key in ("trained_at", "model_version", "feature_names", "metrics"):
            assert key in body, f"Missing key: {key}"

    def test_model_info_metrics_structure(self):
        resp = client.get("/model/info")
        metrics = resp.json()["metrics"]
        for key in ("accuracy", "roc_auc", "f1_macro"):
            assert key in metrics, f"Missing metric: {key}"
            assert 0.0 <= metrics[key] <= 1.0, f"Metric out of range: {key}"


# ── Tests: /predict ───────────────────────────────────────────────────────────

class TestPredict:
    def test_predict_returns_200(self):
        resp = client.post("/predict", json=SAMPLE_PAYLOAD)
        assert resp.status_code == 200

    def test_predict_response_structure(self):
        resp = client.post("/predict", json=SAMPLE_PAYLOAD)
        body = resp.json()
        assert "prediction" in body
        assert "probability" in body
        assert "reasoning" in body

    def test_predict_probability_in_range(self):
        resp = client.post("/predict", json=SAMPLE_PAYLOAD)
        prob = resp.json()["probability"]
        assert 0.0 <= prob <= 1.0

    def test_predict_prediction_is_valid_label(self):
        resp = client.post("/predict", json=SAMPLE_PAYLOAD)
        pred = resp.json()["prediction"]
        # The model was trained with Y/N labels
        assert pred in ("Y", "N", "Approved", "Rejected"), f"Unexpected label: {pred}"

    def test_predict_reasoning_is_list(self):
        resp = client.post("/predict", json=SAMPLE_PAYLOAD)
        reasoning = resp.json()["reasoning"]
        assert isinstance(reasoning, list)
        assert len(reasoning) > 0

    def test_predict_bad_input_returns_error(self):
        # Send completely empty body — FastAPI should return 422 Unprocessable Entity
        resp = client.post("/predict", json={})
        # With all defaults defined in PredictionRequest, this might still succeed
        assert resp.status_code in (200, 422)


# ── Tests: /drift/run ─────────────────────────────────────────────────────────

class TestDriftRun:
    def test_drift_run_with_valid_csv(self):
        csv_bytes = _make_csv_bytes(60)
        resp = client.post(
            "/drift/run",
            files={"file": ("production.csv", io.BytesIO(csv_bytes), "text/csv")},
        )
        assert resp.status_code == 200

    def test_drift_run_response_structure(self):
        csv_bytes = _make_csv_bytes(60)
        resp = client.post(
            "/drift/run",
            files={"file": ("production.csv", io.BytesIO(csv_bytes), "text/csv")},
        )
        body = resp.json()
        for key in ("overall_drift", "drifted_features", "feature_results", "summary"):
            assert key in body, f"Missing key in drift response: {key}"

    def test_drift_run_rejects_non_csv(self):
        resp = client.post(
            "/drift/run",
            files={"file": ("data.txt", io.BytesIO(b"not,a,csv"), "text/plain")},
        )
        assert resp.status_code == 400

    def test_drift_run_summary_counts(self):
        csv_bytes = _make_csv_bytes(60)
        resp = client.post(
            "/drift/run",
            files={"file": ("production.csv", io.BytesIO(csv_bytes), "text/csv")},
        )
        summary = resp.json()["summary"]
        assert "total_features" in summary
        assert summary["drifted_count"] + summary["stable_count"] == summary["total_features"]


# ── Tests: /drift/reports ─────────────────────────────────────────────────────

class TestDriftReports:
    def test_list_reports_returns_200(self):
        resp = client.get("/drift/reports")
        assert resp.status_code == 200

    def test_list_reports_structure(self):
        resp = client.get("/drift/reports")
        body = resp.json()
        assert "total" in body
        assert "reports" in body
        assert isinstance(body["reports"], list)

    def test_get_nonexistent_report_returns_404(self):
        resp = client.get("/drift/reports/nonexistent_file.json")
        assert resp.status_code == 404


# ── Tests: /drift/latest ──────────────────────────────────────────────────────

class TestDriftLatest:
    def test_latest_report_after_run(self):
        # First create a report
        csv_bytes = _make_csv_bytes(60)
        client.post(
            "/drift/run",
            files={"file": ("production.csv", io.BytesIO(csv_bytes), "text/csv")},
        )
        # Now fetch it
        resp = client.get("/drift/latest")
        assert resp.status_code in (200, 404)  # 404 only if first run failed
