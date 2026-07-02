# tests/test_ml_pipeline.py
# ──────────────────────────────────────────────────────────────────────────────
# Unit tests for the ML pipeline modules: data_loader and preprocessing.
#
# Usage:
#   pytest tests/test_ml_pipeline.py -v
# ──────────────────────────────────────────────────────────────────────────────

import os
import sys

import pandas as pd
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml_pipeline.data_loader import load_data
from ml_pipeline.preprocessing import preprocess


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture()
def sample_csv(tmp_path) -> str:
    """Write a small loan-like CSV to a temp file and return its path."""
    df = pd.DataFrame({
        "Loan_ID":           ["LP001", "LP002", "LP003", "LP004", "LP005"],
        "Gender":            ["Male", "Female", "Male", None,    "Male"],
        "Married":           ["Yes",  "No",     "Yes",  "Yes",   "No"],
        "Dependents":        ["0",    "1",      "2",    "3+",    "0"],
        "Education":         ["Graduate", "Not Graduate", "Graduate", "Graduate", "Graduate"],
        "Self_Employed":     ["No", "Yes", "No", "No", None],
        "ApplicantIncome":   [5000, 3000, 4000, 2500, None],
        "CoapplicantIncome": [1500, 0,    1200, 0,    2000],
        "LoanAmount":        [120,  80,   None, 60,   150],
        "Loan_Amount_Term":  [360,  180,  360,  360,  None],
        "Credit_History":    [1.0,  1.0,  0.0,  None, 1.0],
        "Property_Area":     ["Urban", "Rural", "Semiurban", "Urban", "Rural"],
        "Loan_Status":       ["Y", "N", "Y", "N", "Y"],
    })
    path = str(tmp_path / "loan_data.csv")
    df.to_csv(path, index=False)
    return path


@pytest.fixture()
def sample_df(sample_csv) -> pd.DataFrame:
    return load_data(sample_csv)


CONFIG = {
    "drop_cols": ["Loan_ID"],
    "target_col": "Loan_Status",
}


# ── Tests: load_data ──────────────────────────────────────────────────────────

class TestLoadData:
    def test_returns_dataframe(self, sample_csv):
        df = load_data(sample_csv)
        assert isinstance(df, pd.DataFrame)

    def test_correct_shape(self, sample_csv):
        df = load_data(sample_csv)
        assert df.shape[0] == 5    # 5 rows
        assert df.shape[1] == 13   # 13 columns

    def test_column_names_preserved(self, sample_csv):
        df = load_data(sample_csv)
        assert "Loan_ID" in df.columns
        assert "Loan_Status" in df.columns

    def test_raises_on_missing_file(self):
        with pytest.raises(FileNotFoundError):
            load_data("/nonexistent/path/data.csv")


# ── Tests: preprocess ─────────────────────────────────────────────────────────

class TestPreprocess:
    def test_returns_dataframe_and_encoders(self, sample_df):
        df_out, encoders = preprocess(sample_df.copy(), CONFIG)
        assert isinstance(df_out, pd.DataFrame)
        assert isinstance(encoders, dict)

    def test_loan_id_dropped(self, sample_df):
        df_out, _ = preprocess(sample_df.copy(), CONFIG)
        assert "Loan_ID" not in df_out.columns

    def test_no_missing_values_after_preprocessing(self, sample_df):
        df_out, _ = preprocess(sample_df.copy(), CONFIG)
        assert df_out.isnull().sum().sum() == 0, \
            "No NaN values should remain after preprocessing"

    def test_all_columns_are_numeric(self, sample_df):
        df_out, _ = preprocess(sample_df.copy(), CONFIG)
        for col in df_out.columns:
            assert pd.api.types.is_numeric_dtype(df_out[col]), \
                f"Column '{col}' should be numeric after preprocessing"

    def test_encoders_are_saved_for_categorical_columns(self, sample_df):
        _, encoders = preprocess(sample_df.copy(), CONFIG)
        # These columns should have been label-encoded
        categorical_cols = {"Gender", "Married", "Dependents", "Education",
                            "Self_Employed", "Property_Area", "Loan_Status"}
        for col in categorical_cols:
            assert col in encoders, f"Expected encoder for '{col}'"

    def test_encoder_inverse_transform_works(self, sample_df):
        from sklearn.preprocessing import LabelEncoder
        df_out, encoders = preprocess(sample_df.copy(), CONFIG)
        # Verify we can round-trip one column
        le: LabelEncoder = encoders["Gender"]
        encoded_values = df_out["Gender"].values
        decoded = le.inverse_transform(encoded_values)
        assert set(decoded).issubset({"Male", "Female", "Unknown"})

    def test_numeric_nulls_filled_with_median(self, sample_df):
        """ApplicantIncome has one None — it should be filled with the median."""
        df_out, _ = preprocess(sample_df.copy(), CONFIG)
        # Should have exactly 5 rows and no NaN
        assert len(df_out) == 5
        assert not df_out["ApplicantIncome"].isnull().any()

    def test_non_drop_columns_respected(self, sample_df):
        """Drop only Loan_ID; Loan_Status should still be in the output."""
        df_out, _ = preprocess(sample_df.copy(), CONFIG)
        assert "Loan_Status" in df_out.columns

    def test_empty_drop_cols(self, sample_df):
        """With an empty drop list, Loan_ID should still be in the DataFrame."""
        cfg_no_drop = {"drop_cols": [], "target_col": "Loan_Status"}
        df_out, _ = preprocess(sample_df.copy(), cfg_no_drop)
        # Loan_ID is a string column → should be encoded but present
        assert "Loan_ID" in df_out.columns
