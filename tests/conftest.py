# tests/conftest.py
# ──────────────────────────────────────────────────────────────────────────────
# Shared pytest fixtures and configuration.
#
# Fixtures defined here are automatically available to all test modules
# without needing to import them.
# ──────────────────────────────────────────────────────────────────────────────

import os
import sys

import numpy as np
import pandas as pd
import pytest

# Ensure the project root is on the Python path so all imports resolve
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))


# ── Shared data fixtures ───────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def loan_columns():
    """Return the canonical list of feature columns used in the loan dataset."""
    return [
        "Gender", "Married", "Dependents", "Education", "Self_Employed",
        "ApplicantIncome", "CoapplicantIncome", "LoanAmount",
        "Loan_Amount_Term", "Credit_History", "Property_Area",
    ]


@pytest.fixture()
def small_production_df(loan_columns):
    """
    A minimal production-like DataFrame with 60 rows — enough to pass the
    minimum sample size guard in DriftDetector (default: 50).
    """
    n = 60
    np.random.seed(99)
    data = {
        "Gender":            np.random.choice(["Male", "Female"], n),
        "Married":           np.random.choice(["Yes", "No"], n),
        "Dependents":        np.random.choice(["0", "1", "2", "3+"], n),
        "Education":         np.random.choice(["Graduate", "Not Graduate"], n),
        "Self_Employed":     np.random.choice(["Yes", "No"], n),
        "ApplicantIncome":   np.random.normal(5000, 1000, n),
        "CoapplicantIncome": np.random.normal(1500, 500, n),
        "LoanAmount":        np.random.normal(150, 50, n),
        "Loan_Amount_Term":  np.random.choice([360.0, 180.0, 120.0], n),
        "Credit_History":    np.random.choice([1.0, 0.0], n, p=[0.85, 0.15]),
        "Property_Area":     np.random.choice(["Urban", "Rural", "Semiurban"], n),
        "Loan_Status":       np.random.choice(["Y", "N"], n),
    }
    return pd.DataFrame(data)


@pytest.fixture()
def drifted_production_df():
    """
    A production DataFrame intentionally shifted far from baseline, so that
    drift detection tests can assert drift is correctly identified.
    """
    n = 100
    np.random.seed(7)
    return pd.DataFrame({
        "Gender":            ["Female"] * n,                           # all Female
        "Married":           ["No"] * n,                              # all No
        "Dependents":        ["3+"] * n,                              # all 3+
        "Education":         ["Not Graduate"] * n,
        "Self_Employed":     ["Yes"] * n,
        "ApplicantIncome":   np.random.normal(20000, 500, n),         # 3× baseline
        "CoapplicantIncome": np.random.normal(8000, 200, n),
        "LoanAmount":        np.random.normal(800, 50, n),
        "Loan_Amount_Term":  [120.0] * n,
        "Credit_History":    [0.0] * n,                               # all bad credit
        "Property_Area":     ["Rural"] * n,
        "Loan_Status":       ["N"] * n,
    })
