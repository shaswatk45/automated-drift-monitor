# drift_report.py
# ──────────────────────────────────────────────────────────────────────────────
# Generates drift reports from a DriftDetector results dict.
#
# Two outputs:
#   1. A JSON file saved to logs/drift_reports/ (for programmatic consumption)
#   2. A pretty console summary (for quick visual inspection)
#
# JSON report structure:
#   {
#     "timestamp": "...",
#     "dataset_size": 120,
#     "overall_drift": true,
#     "drifted_features": ["ApplicantIncome", "LoanAmount"],
#     "feature_results": {
#       "ApplicantIncome": {
#         "feature_type": "numeric",
#         "baseline_mean": 5529.99,
#         "production_mean": 7741.99,
#         "drift_detected": true,
#         "reasons": [...]
#       }
#     }
#   }
# ──────────────────────────────────────────────────────────────────────────────

import os
import json
import logging
from datetime import datetime, timezone

log = logging.getLogger(__name__)


def generate_report(drift_results: dict, output_dir: str) -> str:
    """
    Save the full drift results as a timestamped JSON report.

    Parameters
    ----------
    drift_results : dict
        The results dictionary returned by DriftDetector.detect_drift().
    output_dir : str
        Directory where the report file will be created.

    Returns
    -------
    str
        Absolute path to the saved report file.
    """
    # Ensure both logs/ and the report subdirectory exist
    os.makedirs("logs", exist_ok=True)
    os.makedirs(output_dir, exist_ok=True)

    # Create a filename with the current timestamp so reports never overwrite
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    filename = f"drift_report_{timestamp}.json"
    filepath = os.path.join(output_dir, filename)

    with open(filepath, "w") as f:
        json.dump(drift_results, f, indent=2)

    log.info(f"Drift report saved -> {filepath}")
    return filepath


def print_summary(drift_results: dict) -> None:
    """
    Print a formatted console table summarising drift results.

    Columns:  Feature | Type | Baseline Mean | Production Mean | Drift Status

    If a warning was returned (e.g. insufficient data), that is displayed
    instead of the per-feature table.
    """
    summary = drift_results.get("summary", {})
    features = drift_results.get("feature_results", {})

    # ── Header ────────────────────────────────────────────────────────────
    print()
    print("=" * 90)
    print("  DRIFT DETECTION REPORT")
    print(f"  Timestamp    : {drift_results.get('timestamp', 'N/A')}")
    print(f"  Dataset Size : {drift_results.get('dataset_size', 'N/A')}")

    # Show warning if present (e.g. insufficient sample size)
    warning = drift_results.get("warning")
    if warning:
        print(f"  WARNING      : {warning}")
        print("=" * 90)
        print()
        return

    drift_flag = drift_results.get("overall_drift", False)
    print(f"  Result       : {'[!] DRIFT DETECTED' if drift_flag else '[OK] NO DRIFT'}")
    print("=" * 90)

    # ── Per-feature table ─────────────────────────────────────────────────
    # Column widths
    max_name = max((len(n) for n in features), default=7)
    col_feat = max(max_name, 7)
    col_type = 12
    col_base = 15
    col_prod = 15
    col_stat = 12

    header = (
        f"  {'Feature':<{col_feat}}  "
        f"{'Type':<{col_type}}  "
        f"{'Baseline Mean':>{col_base}}  "
        f"{'Prod. Mean':>{col_prod}}  "
        f"{'Status':<{col_stat}}"
    )
    sep = (
        f"  {'-' * col_feat}  "
        f"{'-' * col_type}  "
        f"{'-' * col_base}  "
        f"{'-' * col_prod}  "
        f"{'-' * col_stat}"
    )

    print(header)
    print(sep)

    for feat_name, result in features.items():
        feat_type = result.get("feature_type", "unknown")
        b_mean = result.get("baseline_mean")
        p_mean = result.get("production_mean")

        # Format mean values — numeric features show the number;
        # categorical features show the top-category frequency
        if b_mean is not None:
            b_str = f"{b_mean:.4f}"
        else:
            b_str = "N/A"

        if p_mean is not None:
            p_str = f"{p_mean:.4f}"
        else:
            p_str = "N/A"

        status = "[!] DRIFT" if result.get("drift_detected") else "[OK] Stable"

        print(
            f"  {feat_name:<{col_feat}}  "
            f"{feat_type:<{col_type}}  "
            f"{b_str:>{col_base}}  "
            f"{p_str:>{col_prod}}  "
            f"{status:<{col_stat}}"
        )

    print(sep)

    # ── Footer ────────────────────────────────────────────────────────────
    print(
        f"\n  Total: {summary.get('total_features', 0)} features checked  |  "
        f"{summary.get('drifted_count', 0)} drifted  |  "
        f"{summary.get('stable_count', 0)} stable"
    )

    drifted = drift_results.get("drifted_features", [])
    if drifted:
        print(f"  Drifted features: {', '.join(drifted)}")

    print("=" * 90)
    print()
