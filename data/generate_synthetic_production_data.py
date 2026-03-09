# generate_synthetic_production_data.py
# ──────────────────────────────────────────────────────────────────────────────
# Creates two synthetic production datasets for testing the drift detector:
#
#   1. production_clean.csv   -- sampled from the original distribution (no drift)
#   2. production_drifted.csv -- deliberately shifted features (has drift)
#
# Drifted features:
#   - ApplicantIncome  : mean increased by ~40%
#   - LoanAmount       : mean increased by ~30%
#   - Property_Area    : category distribution skewed (tests categorical check)
#
# Usage (from project root):
#   python data/generate_synthetic_production_data.py
# ──────────────────────────────────────────────────────────────────────────────

import os
import pandas as pd
import numpy as np

# Paths (relative to project root)
RAW_DATA_PATH = "data/raw/loan_data.csv"
OUTPUT_DIR = "data/production"
CLEAN_OUTPUT = os.path.join(OUTPUT_DIR, "production_clean.csv")
DRIFTED_OUTPUT = os.path.join(OUTPUT_DIR, "production_drifted.csv")

# Random seed for reproducibility
np.random.seed(42)


def generate_clean_data(df: pd.DataFrame, n_samples: int = 100) -> pd.DataFrame:
    """
    Create a 'clean' production dataset by randomly sampling rows from the
    original data.  Since these rows come from the same distribution,
    the drift detector should report NO drift.
    """
    clean = df.sample(n=n_samples, replace=True, random_state=42).reset_index(drop=True)
    print(f"[OK] Clean dataset created -- {clean.shape[0]} rows")
    return clean


def generate_drifted_data(df: pd.DataFrame, n_samples: int = 100) -> pd.DataFrame:
    """
    Create a 'drifted' production dataset by sampling from the original data
    and then deliberately modifying certain features.

    Changes made:
      - ApplicantIncome  : multiplied by 1.4  (~40% increase in mean)
      - LoanAmount       : multiplied by 1.3  (~30% increase in mean)
      - Property_Area    : distribution skewed to mostly "Urban"
                           (tests the categorical frequency drift check)
    """
    drifted = df.sample(n=n_samples, replace=True, random_state=99).reset_index(drop=True)

    # Shift 1: Increase applicant income by ~40%
    drifted["ApplicantIncome"] = (drifted["ApplicantIncome"] * 1.4).astype(int)

    # Shift 2: Increase loan amounts by ~30%
    drifted["LoanAmount"] = drifted["LoanAmount"] * 1.3

    # Shift 3: Skew Property_Area distribution
    # Original distribution is roughly: Rural ~30%, Semiurban ~33%, Urban ~37%
    # We change it so ~80% are "Urban", testing the categorical drift check.
    n = len(drifted)
    new_areas = np.random.choice(
        ["Urban", "Semiurban", "Rural"],
        size=n,
        p=[0.80, 0.12, 0.08],   # heavily skewed toward Urban
    )
    drifted["Property_Area"] = new_areas

    print(f"[OK] Drifted dataset created -- {drifted.shape[0]} rows")
    print("  Drifted features: ApplicantIncome (+40%), LoanAmount (+30%), Property_Area (skewed)")
    return drifted


def main():
    # Load original dataset
    print(f"Loading original data from {RAW_DATA_PATH} ...")
    df = pd.read_csv(RAW_DATA_PATH)
    print(f"  Original shape: {df.shape}")

    # Ensure output directory exists
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Generate and save both datasets
    clean_df = generate_clean_data(df)
    clean_df.to_csv(CLEAN_OUTPUT, index=False)
    print(f"  Saved -> {CLEAN_OUTPUT}")

    drifted_df = generate_drifted_data(df)
    drifted_df.to_csv(DRIFTED_OUTPUT, index=False)
    print(f"  Saved -> {DRIFTED_OUTPUT}")

    print("\nDone! You can now run:")
    print(f"  python monitoring/run_drift_check.py --input {CLEAN_OUTPUT}")
    print(f"  python monitoring/run_drift_check.py --input {DRIFTED_OUTPUT}")


if __name__ == "__main__":
    main()
