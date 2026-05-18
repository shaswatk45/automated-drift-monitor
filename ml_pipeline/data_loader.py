# data_loader.py
# ──────────────────────────────────────────────────────────────────────────────
# Data loading utilities for the loan dataset.
# ──────────────────────────────────────────────────────────────────────────────

import logging

import pandas as pd

log = logging.getLogger(__name__)


def load_data(path: str) -> pd.DataFrame:
    """
    Load a CSV file into a Pandas DataFrame.

    Parameters
    ----------
    path : str
        Path to the CSV file to load.

    Returns
    -------
    pd.DataFrame
        The loaded dataset.

    Raises
    ------
    FileNotFoundError
        If the CSV file does not exist at the given path.
    """
    log.info(f"Loading data from {path}")
    df = pd.read_csv(path)
    log.info(f"  Shape: {df.shape}  |  Nulls: {df.isnull().sum().sum()}")
    return df
