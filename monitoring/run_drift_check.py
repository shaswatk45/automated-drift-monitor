# run_drift_check.py
# ──────────────────────────────────────────────────────────────────────────────
# CLI entry point for running a drift check on production data.
#
# Usage:
#   python monitoring/run_drift_check.py --input data/production/some_file.csv
#   python monitoring/run_drift_check.py          # auto-selects newest CSV
#
# What it does:
#   1. Reads the project config from configs/config.yaml.
#   2. Loads the specified (or newest) production CSV.
#   3. Runs the DriftDetector to compare against baseline statistics.
#   4. Generates a JSON report and prints a console summary.
# ──────────────────────────────────────────────────────────────────────────────

import argparse
import glob
import logging
import os
import sys

import yaml
import pandas as pd

# Add the project root to the Python path so we can import our modules.
# This script lives in monitoring/, so the project root is one level up.
PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, PROJECT_ROOT)

from drift_detection.drift_detector import DriftDetector
from drift_detection.drift_report import generate_report, print_summary

# ── Logging setup ─────────────────────────────────────────────────────────────
os.makedirs(os.path.join(PROJECT_ROOT, "logs"), exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(PROJECT_ROOT, "logs", "drift_check.log")),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger(__name__)


def load_config(config_path: str) -> dict:
    """Load YAML configuration file."""
    with open(config_path, "r") as f:
        cfg = yaml.safe_load(f)
    log.info(f"Config loaded from {config_path}")
    return cfg


def find_newest_csv(directory: str) -> str:
    """
    Find the most recently modified CSV file inside the given directory.
    Returns the absolute path, or None if no CSVs exist.
    """
    pattern = os.path.join(directory, "*.csv")
    csv_files = glob.glob(pattern)
    if not csv_files:
        return None
    # Sort by modification time, newest first
    csv_files.sort(key=os.path.getmtime, reverse=True)
    return csv_files[0]


def main():
    # ── Parse command-line arguments ──────────────────────────────────────
    parser = argparse.ArgumentParser(
        description="Run a drift check on production data."
    )
    parser.add_argument(
        "--input",
        type=str,
        required=False,
        default=None,
        help=(
            "Path to the production CSV file to check for drift. "
            "If omitted, the newest CSV in data/production/ is used."
        ),
    )
    parser.add_argument(
        "--config",
        type=str,
        default=os.path.join(PROJECT_ROOT, "configs", "config.yaml"),
        help="Path to the project config file (default: configs/config.yaml).",
    )
    args = parser.parse_args()

    # ── Load config ───────────────────────────────────────────────────────
    cfg = load_config(args.config)
    drift_cfg = cfg["drift_detection"]

    # ── Resolve input file ────────────────────────────────────────────────
    if args.input:
        input_path = args.input
    else:
        # Auto-select the newest CSV in the production directory
        prod_dir = os.path.join(PROJECT_ROOT, drift_cfg["production_data_dir"])
        input_path = find_newest_csv(prod_dir)
        if input_path is None:
            log.error(f"No CSV files found in {prod_dir}")
            sys.exit(1)
        log.info(f"Auto-selected newest CSV: {input_path}")

    if not os.path.exists(input_path):
        log.error(f"File not found: {input_path}")
        sys.exit(1)

    # ── Load production data ──────────────────────────────────────────────
    log.info(f"Loading production data from {input_path}")
    production_df = pd.read_csv(input_path)
    log.info(f"Production data shape: {production_df.shape}")

    # ── Create detector ───────────────────────────────────────────────────
    detector = DriftDetector(
        baseline_path=os.path.join(PROJECT_ROOT, cfg["paths"]["baseline_stats"]),
        encoder_path=os.path.join(PROJECT_ROOT, cfg["paths"]["label_encoders"]),
        metadata_path=os.path.join(PROJECT_ROOT, cfg["paths"]["model_metadata"]),
        raw_data_path=os.path.join(PROJECT_ROOT, cfg["paths"]["raw_data"]),
        drop_columns=drift_cfg["drop_columns"],
        target_column=drift_cfg["target_column"],
        thresholds=drift_cfg["thresholds"],
        min_sample_size=drift_cfg.get("min_sample_size", 50),
    )

    # ── Run drift detection ───────────────────────────────────────────────
    results = detector.detect_drift(production_df)

    # ── Generate report ───────────────────────────────────────────────────
    report_dir = os.path.join(PROJECT_ROOT, drift_cfg["report_output_dir"])
    report_path = generate_report(results, report_dir)
    log.info(f"Report written to {report_path}")

    # ── Print console summary ─────────────────────────────────────────────
    print_summary(results)

    # ── Exit with appropriate code ────────────────────────────────────────
    # Exit code 1 if drift was detected -- useful in CI/CD pipelines later
    if results.get("warning"):
        log.warning(f"[WARN] {results['warning']}")
        sys.exit(0)
    elif results["overall_drift"]:
        log.warning("[!] DRIFT DETECTED -- see report for details.")
        sys.exit(1)
    else:
        log.info("[OK] No drift detected.")
        sys.exit(0)


if __name__ == "__main__":
    main()
