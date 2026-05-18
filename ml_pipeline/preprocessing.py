# preprocessing.py
# ──────────────────────────────────────────────────────────────────────────────
# Preprocessing utilities for the loan dataset.
# Handles missing-value imputation and categorical label encoding.
# ──────────────────────────────────────────────────────────────────────────────

import logging

import pandas as pd
from sklearn.preprocessing import LabelEncoder

log = logging.getLogger(__name__)


def preprocess(df: pd.DataFrame, cfg: dict):
    """
    Clean and encode a raw loan DataFrame for model training.

    Steps
    -----
    1. Drop any ID-like columns listed in ``cfg["drop_cols"]``.
    2. Impute missing values:
       - Categorical columns → fill with "Unknown"
       - Numeric columns     → fill with column median
    3. Label-encode every remaining object (categorical) column.

    Parameters
    ----------
    df : pd.DataFrame
        Raw input data (e.g. loaded from data/raw/loan_data.csv).
    cfg : dict
        Training configuration dict.  Must contain the key ``"drop_cols"``
        with a list of column names to drop before encoding.

    Returns
    -------
    df : pd.DataFrame
        Fully preprocessed DataFrame (all numeric, ready for sklearn).
    encoders : dict
        Mapping of ``{column_name: LabelEncoder}`` for every categorical
        column that was encoded.  These encoders are persisted to disk and
        reused at inference time so the same integer mapping is applied.
    """
    # Step 1 — drop ID-like columns
    df = df.drop(columns=cfg["drop_cols"], errors="ignore")
    log.info(f"Dropped columns: {cfg['drop_cols']}")

    # Step 2 — impute missing values
    for col in df.columns:
        if df[col].dtype == "object":
            df[col] = df[col].fillna("Unknown")
        else:
            df[col] = df[col].fillna(df[col].median())
    log.info("Missing values imputed")

    # Step 3 — label-encode categorical columns
    encoders = {}
    for col in df.select_dtypes(include="object").columns:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le
    log.info(f"Encoded {len(encoders)} categorical column(s): {list(encoders.keys())}")

    return df, encoders
