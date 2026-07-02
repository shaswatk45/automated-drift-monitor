# tests/test_new_features.py
# ------------------------------------------------------------------------------
# Tests for the newer backend capabilities:
#   - structured drift metrics (drift_score, severity, per-feature metrics)
#   - report history, download, and delete endpoints
#   - path-traversal protection in ReportStore
# ------------------------------------------------------------------------------

import io
import os
import sys

import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from backend.main import app
from backend.database import ReportStore

client = TestClient(app)


def _make_csv_bytes(n_rows: int = 60) -> bytes:
    data = {
        "Loan_ID":           [f"LP{i:05d}" for i in range(n_rows)],
        "Gender":            ["Male"] * n_rows,
        "Married":           ["Yes"] * n_rows,
        "Dependents":        ["0"] * n_rows,
        "Education":         ["Graduate"] * n_rows,
        "Self_Employed":     ["No"] * n_rows,
        "ApplicantIncome":   [5000 + i * 10 for i in range(n_rows)],
        "CoapplicantIncome": [0.0] * n_rows,
        "LoanAmount":        [150.0] * n_rows,
        "Loan_Amount_Term":  [360.0] * n_rows,
        "Credit_History":    [1.0] * n_rows,
        "Property_Area":     ["Urban"] * n_rows,
        "Loan_Status":       ["Y"] * n_rows,
    }
    return pd.DataFrame(data).to_csv(index=False).encode("utf-8")


def _run_drift():
    return client.post(
        "/drift/run",
        files={"file": ("production.csv", io.BytesIO(_make_csv_bytes(60)), "text/csv")},
    )


class TestStructuredDriftOutput:
    def test_drift_run_has_score_and_severity(self):
        body = _run_drift().json()
        assert "drift_score" in body
        assert 0.0 <= body["drift_score"] <= 1.0
        assert "critical_count" in body["summary"]
        assert "warning_count" in body["summary"]

    def test_feature_results_carry_metrics_and_severity(self):
        body = _run_drift().json()
        for name, result in body["feature_results"].items():
            assert result["severity"] in ("stable", "warning", "critical"), name
            assert "metrics" in result, name


class TestHistoryEndpoint:
    def test_history_returns_points(self):
        _run_drift()  # ensure at least one report exists
        resp = client.get("/drift/history")
        assert resp.status_code == 200
        points = resp.json()["points"]
        assert isinstance(points, list)
        assert len(points) >= 1
        assert "drift_score" in points[0]
        assert "timestamp" in points[0]


class TestDownloadAndDelete:
    def test_download_then_delete_roundtrip(self):
        filename = _run_drift().json()["report_file"]

        dl = client.get(f"/drift/reports/{filename}/download")
        assert dl.status_code == 200
        assert "attachment" in dl.headers.get("content-disposition", "")

        deleted = client.delete(f"/drift/reports/{filename}")
        assert deleted.status_code == 200
        assert deleted.json()["deleted"] == filename

        # Second delete should 404
        assert client.delete(f"/drift/reports/{filename}").status_code == 404

    def test_delete_missing_returns_404(self):
        assert client.delete("/drift/reports/does_not_exist.json").status_code == 404


class TestPathTraversalGuard:
    def test_safe_path_rejects_traversal(self, tmp_path):
        store = ReportStore(str(tmp_path))
        assert store._safe_path("../secret.json") is None
        assert store._safe_path("sub/dir.json") is None
        assert store._safe_path("evil.txt") is None
        assert store._safe_path("ok.json") is not None

    def test_get_report_rejects_traversal(self):
        assert client.get("/drift/reports/..%2f..%2fsecret.json").status_code in (400, 404)
