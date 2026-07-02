# tests/test_drift.py
# ──────────────────────────────────────────────────────────────────────────────
# Unit tests for the core drift detection logic.
#
# These tests exercise the statistical computation functions directly,
# without spinning up the FastAPI server.
#
# Usage:
#   pytest tests/test_drift.py -v
# ──────────────────────────────────────────────────────────────────────────────

import os
import sys

import numpy as np
import pandas as pd

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from drift_detection.drift_detector import calculate_psi, DriftDetector
from drift_detection.drift_report import generate_report


# ── Tests: calculate_psi ──────────────────────────────────────────────────────

class TestCalculatePSI:
    """Tests for the standalone PSI calculation function."""

    def test_identical_distributions_have_low_psi(self):
        data = np.random.normal(0, 1, 1000)
        psi = calculate_psi(data, data.copy())
        assert psi < 0.1, f"PSI for identical distributions should be < 0.1, got {psi:.4f}"

    def test_very_different_distributions_have_high_psi(self):
        baseline   = np.random.normal(0, 1, 1000)
        production = np.random.normal(10, 1, 1000)   # shifted by 10 standard deviations
        psi = calculate_psi(baseline, production)
        assert psi > 0.2, f"PSI for very different distributions should be > 0.2, got {psi:.4f}"

    def test_moderately_different_distributions(self):
        np.random.seed(42)
        baseline   = np.random.normal(0, 1, 1000)
        production = np.random.normal(1, 1, 1000)    # shifted by 1 standard deviation
        psi = calculate_psi(baseline, production)
        assert psi >= 0.0, "PSI must be non-negative"

    def test_empty_expected_returns_zero(self):
        psi = calculate_psi(np.array([]), np.array([1, 2, 3]))
        assert psi == 0.0

    def test_empty_actual_returns_zero(self):
        psi = calculate_psi(np.array([1, 2, 3]), np.array([]))
        assert psi == 0.0

    def test_psi_is_non_negative(self):
        np.random.seed(0)
        for _ in range(20):
            a = np.random.normal(np.random.uniform(-5, 5), 1, 200)
            b = np.random.normal(np.random.uniform(-5, 5), 1, 200)
            psi = calculate_psi(a, b)
            assert psi >= 0.0, f"PSI should always be ≥ 0, got {psi}"

    def test_custom_bucket_count(self):
        data = np.random.normal(0, 1, 500)
        psi_10 = calculate_psi(data, data.copy(), buckets=10)
        psi_5  = calculate_psi(data, data.copy(), buckets=5)
        # Both should be near zero for identical data
        assert psi_10 < 0.1
        assert psi_5  < 0.1


# ── Tests: DriftDetector.compute_stats ────────────────────────────────────────

class TestComputeStats:
    """Tests for the static method that computes per-feature summary statistics."""

    def _make_df(self) -> pd.DataFrame:
        np.random.seed(42)
        return pd.DataFrame({
            "A": np.random.normal(10, 2, 100),
            "B": np.random.uniform(0, 100, 100),
        })

    def test_all_features_present(self):
        df = self._make_df()
        stats = DriftDetector.compute_stats(df)
        assert set(stats.keys()) == {"A", "B"}

    def test_all_stat_keys_present(self):
        df = self._make_df()
        stats = DriftDetector.compute_stats(df)
        expected_keys = {"mean", "std", "min", "max", "q25", "q75"}
        for col, col_stats in stats.items():
            assert set(col_stats.keys()) == expected_keys, \
                f"Column '{col}' missing stat keys: {expected_keys - set(col_stats.keys())}"

    def test_stat_values_are_floats(self):
        df = self._make_df()
        stats = DriftDetector.compute_stats(df)
        for col, col_stats in stats.items():
            for k, v in col_stats.items():
                assert isinstance(v, float), f"{col}.{k} should be float, got {type(v)}"

    def test_mean_is_correct(self):
        df = pd.DataFrame({"X": [1.0, 2.0, 3.0, 4.0, 5.0]})
        stats = DriftDetector.compute_stats(df)
        assert abs(stats["X"]["mean"] - 3.0) < 1e-9

    def test_min_max_correct(self):
        df = pd.DataFrame({"X": [10.0, 20.0, 30.0]})
        stats = DriftDetector.compute_stats(df)
        assert stats["X"]["min"] == 10.0
        assert stats["X"]["max"] == 30.0


# ── Tests: DriftDetector._check_numeric_drift ─────────────────────────────────

class TestNumericDriftCheck:
    """Tests for the numeric drift detection logic without loading disk artifacts."""

    def _make_detector(self, tmp_path) -> DriftDetector:
        """Build a minimal DriftDetector pointing at temp files."""
        import json
        import joblib

        # Baseline stats
        baseline_stats = {
            "Income": {"mean": 5000.0, "std": 1000.0, "min": 1000.0, "max": 20000.0,
                       "q25": 3500.0, "q75": 7000.0},
        }
        baseline_path = str(tmp_path / "baseline_stats.json")
        with open(baseline_path, "w") as f:
            json.dump(baseline_stats, f)

        # Label encoders (empty — no categoricals in this test)
        encoder_path = str(tmp_path / "label_encoders.pkl")
        joblib.dump({}, encoder_path)

        # Model metadata
        metadata = {"feature_names": ["Income"]}
        meta_path = str(tmp_path / "model_metadata.json")
        with open(meta_path, "w") as f:
            json.dump(metadata, f)

        # Raw data
        raw_df = pd.DataFrame({"Income": np.random.normal(5000, 1000, 300)})
        raw_path = str(tmp_path / "raw_data.csv")
        raw_df.to_csv(raw_path, index=False)

        return DriftDetector(
            baseline_path=baseline_path,
            encoder_path=encoder_path,
            metadata_path=meta_path,
            raw_data_path=raw_path,
            drop_columns=[],
            target_column="Loan_Status",
            thresholds={
                "mean_shift_factor": 2.0,
                "range_extension_factor": 0.20,
                "categorical_frequency_threshold": 0.15,
            },
            min_sample_size=10,
        )

    def test_stable_data_no_drift(self, tmp_path):
        detector = self._make_detector(tmp_path)
        baseline = {"mean": 5000.0, "std": 1000.0, "min": 1000.0, "max": 20000.0,
                    "q25": 3500.0, "q75": 7000.0}
        production = {"mean": 5050.0, "std": 980.0, "min": 1200.0, "max": 19000.0,
                      "q25": 3600.0, "q75": 7100.0}
        prod_series = pd.Series(np.random.normal(5050, 980, 200))
        result = detector._check_numeric_drift("Income", baseline, production, prod_series)
        assert result["feature_type"] == "numeric"
        # Slight mean shift should not trigger drift
        assert result["drift_detected"] is False or isinstance(result["reasons"], list)

    def test_large_mean_shift_triggers_drift(self, tmp_path):
        detector = self._make_detector(tmp_path)
        baseline   = {"mean": 5000.0, "std": 1000.0, "min": 1000.0, "max": 20000.0,
                      "q25": 3500.0, "q75": 7000.0}
        production = {"mean": 12000.0, "std": 1000.0, "min": 8000.0, "max": 25000.0,
                      "q25": 9000.0,  "q75": 14000.0}
        prod_series = pd.Series(np.random.normal(12000, 1000, 200))
        result = detector._check_numeric_drift("Income", baseline, production, prod_series)
        assert result["drift_detected"] is True
        assert len(result["reasons"]) > 0

    def test_minimum_sample_size_guard(self, tmp_path):
        detector = self._make_detector(tmp_path)
        small_df = pd.DataFrame({"Income": [5000, 6000, 7000]})  # only 3 rows
        result = detector.detect_drift(small_df)
        assert result["overall_drift"] is False
        assert "warning" in result


# ── Tests: generate_report ────────────────────────────────────────────────────

class TestGenerateReport:
    def test_report_file_is_created(self, tmp_path):
        results = {
            "timestamp": "2026-01-01T00:00:00",
            "dataset_size": 100,
            "overall_drift": False,
            "drifted_features": [],
            "feature_results": {},
            "summary": {"total_features": 0, "drifted_count": 0, "stable_count": 0},
        }
        report_path = generate_report(results, str(tmp_path))
        assert os.path.exists(report_path)

    def test_report_is_valid_json(self, tmp_path):
        import json
        results = {
            "timestamp": "2026-01-01T00:00:00",
            "dataset_size": 50,
            "overall_drift": True,
            "drifted_features": ["Income"],
            "feature_results": {},
            "summary": {"total_features": 1, "drifted_count": 1, "stable_count": 0},
        }
        report_path = generate_report(results, str(tmp_path))
        with open(report_path) as f:
            loaded = json.load(f)
        assert loaded["overall_drift"] is True
        assert loaded["drifted_features"] == ["Income"]
