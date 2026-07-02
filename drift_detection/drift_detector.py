# drift_detector.py
# ──────────────────────────────────────────────────────────────────────────────
# Core engine for detecting data drift.
#
# HOW IT WORKS (beginner-friendly summary):
#
#   1. During training we saved "baseline statistics" (mean, std, min, max,
#      quartiles) for every feature, plus the LabelEncoder objects that were
#      used to convert categorical text values into numbers.
#
#   2. When new production data arrives we compute the *same* statistics and
#      compare them against the baseline.
#
#   3. The comparison is **feature-type aware**:
#
#      NUMERIC features  (e.g. ApplicantIncome, LoanAmount):
#        - Mean shift:  flag if |prod_mean - base_mean| > threshold * base_std
#        - Range breach: flag if prod min/max extends beyond baseline range
#
#      CATEGORICAL features  (e.g. Gender, Married, Property_Area):
#        - Frequency change: compute the normalized frequency of each category
#          in both baseline and production data; flag if any category's share
#          changed by more than a configurable threshold (default 15 pp).
#
#   4. A minimum sample-size safeguard prevents unreliable results from
#      very small production batches (default: 50 rows).
# ──────────────────────────────────────────────────────────────────────────────

import json
import logging
import os
from datetime import datetime, timezone

import joblib
import numpy as np
import pandas as pd
from scipy.stats import ks_2samp

def calculate_psi(expected, actual, buckets=10):
    """Calculate the PSI (population stability index) for numeric drift."""
    if len(expected) == 0 or len(actual) == 0:
        return 0.0
    
    breakpoints = np.linspace(0, 100, buckets + 1)
    bins = np.percentile(expected, breakpoints)
    bins[0] = -np.inf
    bins[-1] = np.inf
    
    expected_percents = np.histogram(expected, bins=bins)[0] / len(expected)
    actual_percents = np.histogram(actual, bins=bins)[0] / len(actual)
    
    expected_percents = np.where(expected_percents == 0, 0.001, expected_percents)
    actual_percents = np.where(actual_percents == 0, 0.001, actual_percents)
    
    psi_value = np.sum((actual_percents - expected_percents) * np.log(actual_percents / expected_percents))
    return float(psi_value)


def _js_divergence(dist_a: dict, dist_b: dict, categories) -> float:
    """
    Jensen-Shannon divergence between two categorical distributions.

    Symmetric and bounded in [0, ln(2)] (0 = identical distributions).
    A small epsilon avoids log(0) for categories missing from one side.
    """
    eps = 1e-9
    p = np.array([dist_a.get(c, 0.0) + eps for c in categories])
    q = np.array([dist_b.get(c, 0.0) + eps for c in categories])
    p = p / p.sum()
    q = q / q.sum()
    m = 0.5 * (p + q)
    kl = lambda x, y: float(np.sum(x * np.log(x / y)))
    return 0.5 * kl(p, m) + 0.5 * kl(q, m)


log = logging.getLogger(__name__)


class DriftDetector:
    """Compare production data against baseline statistics and detect drift."""

    # ── Constructor ───────────────────────────────────────────────────────────

    def __init__(
        self,
        baseline_path: str,
        encoder_path: str,
        metadata_path: str,
        raw_data_path: str,
        drop_columns: list,
        target_column: str,
        thresholds: dict,
        min_sample_size: int = 50,
    ):
        """
        Parameters
        ----------
        baseline_path : str
            Path to baseline_stats.json (numeric stats from training).
        encoder_path : str
            Path to label_encoders.pkl (saved LabelEncoder objects).
        metadata_path : str
            Path to model_metadata.json (expected feature list).
        raw_data_path : str
            Path to the original training CSV — used to compute baseline
            category frequency distributions at runtime, because the
            training pipeline only saved numeric stats.
        drop_columns : list
            Columns to drop before analysis (e.g. ["Loan_ID"]).
        target_column : str
            Name of the target column (excluded from drift checks).
        thresholds : dict
            Keys: mean_shift_factor, range_extension_factor,
                  categorical_frequency_threshold.
        min_sample_size : int
            Minimum number of rows required for drift analysis.
        """
        # ---- Load numeric baseline stats ----
        with open(baseline_path, "r") as f:
            self.baseline_stats = json.load(f)
        log.info(f"Loaded baseline stats from {baseline_path}")

        # ---- Load saved label encoders ----
        self.encoders = joblib.load(encoder_path)
        log.info(f"Loaded label encoders from {encoder_path}")

        # ---- Load model metadata (expected feature order) ----
        with open(metadata_path, "r") as f:
            meta = json.load(f)
        self.expected_features = meta["feature_names"]
        log.info(f"Expected features: {self.expected_features}")

        # ---- Identify which features are categorical ----
        # Any column for which a LabelEncoder was saved during training
        # is categorical; everything else is numeric.
        self.categorical_features = [
            col for col in self.expected_features if col in self.encoders
        ]
        self.numeric_features = [
            col for col in self.expected_features if col not in self.encoders
        ]
        log.info(f"Categorical features: {self.categorical_features}")
        log.info(f"Numeric features:     {self.numeric_features}")

        # ---- Compute baseline category distributions from raw data ----
        self.baseline_category_dist = self._compute_baseline_category_dist(
            raw_data_path, drop_columns, target_column
        )

        # ---- Load raw numeric data for KS-Test and PSI calculation ----
        self.raw_baseline_df = pd.DataFrame()
        if os.path.exists(raw_data_path):
            df = pd.read_csv(raw_data_path)
            # Impute basic missing values for tests
            for col in self.numeric_features:
                if col in df.columns:
                    df[col] = df[col].fillna(df[col].median())
            self.raw_baseline_df = df

        self.drop_columns = drop_columns
        self.target_column = target_column
        self.thresholds = thresholds
        self.min_sample_size = min_sample_size

    # ── Baseline category distributions ───────────────────────────────────────

    def _compute_baseline_category_dist(
        self, raw_data_path: str, drop_columns: list, target_column: str
    ) -> dict:
        """
        Load the raw training CSV and compute the normalized frequency
        distribution for every categorical feature.

        We do this at runtime because the training pipeline only saved
        numeric stats (mean/std/min/max) — it did not save per-category
        frequencies.  This keeps the training pipeline untouched.

        Returns
        -------
        dict
            {feature_name: {category_value: proportion, ...}, ...}
            Example: {"Gender": {"Male": 0.81, "Female": 0.19}, ...}
        """
        if not os.path.exists(raw_data_path):
            log.warning(
                f"Raw data not found at {raw_data_path} "
                "-- categorical drift checks will be skipped."
            )
            return {}

        df = pd.read_csv(raw_data_path)
        df = df.drop(columns=drop_columns, errors="ignore")
        if target_column in df.columns:
            df = df.drop(columns=[target_column])

        # Fill missing categorical values the same way training did
        for col in self.categorical_features:
            if col in df.columns:
                df[col] = df[col].fillna("Unknown")

        distributions = {}
        for col in self.categorical_features:
            if col in df.columns:
                freq = df[col].value_counts(normalize=True)
                distributions[col] = {str(k): round(float(v), 6) for k, v in freq.items()}
        log.info(f"Computed baseline category distributions for {list(distributions.keys())}")
        return distributions

    # ── Preprocessing ─────────────────────────────────────────────────────────

    def preprocess_production_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Apply the *exact same* preprocessing used during training so that
        feature values are directly comparable to the baseline.

        Returns the preprocessed DataFrame (label-encoded, feature-filtered).
        Also stores the *raw* (pre-encoding) categorical values on
        ``self._raw_categorical_values`` for use by the categorical drift
        check, which needs the original text categories, not the encoded ints.
        """
        df = df.copy()

        # Step 1 -- drop ID-like columns
        df = df.drop(columns=self.drop_columns, errors="ignore")

        # Step 2 -- remove target if present
        if self.target_column in df.columns:
            df = df.drop(columns=[self.target_column])

        # Step 3 -- fill nulls exactly as training did
        for col in df.columns:
            if df[col].dtype == "object":
                df[col] = df[col].fillna("Unknown")
            else:
                df[col] = df[col].fillna(df[col].median())

        # ---- Snapshot raw categorical values BEFORE encoding ----
        self._raw_categorical_values = {}
        for col in self.categorical_features:
            if col in df.columns:
                self._raw_categorical_values[col] = df[col].astype(str).copy()

        # Step 4 -- label-encode using the SAME encoder objects from training
        for col, le in self.encoders.items():
            if col in df.columns:
                known_classes = set(le.classes_)
                df[col] = df[col].astype(str).apply(
                    lambda val, kc=known_classes, lec=le: (
                        val if val in kc
                        else ("Unknown" if "Unknown" in kc else lec.classes_[0])
                    )
                )
                df[col] = le.transform(df[col])

        # Keep only expected features, in the right order
        missing = [f for f in self.expected_features if f not in df.columns]
        if missing:
            log.warning(f"Missing features in production data: {missing}")
        df = df[[f for f in self.expected_features if f in df.columns]]
        return df

    # ── Statistics ────────────────────────────────────────────────────────────

    @staticmethod
    def compute_stats(df: pd.DataFrame) -> dict:
        """Compute summary statistics (same 6 values the training pipeline saves)."""
        stats = {}
        for col in df.columns:
            stats[col] = {
                "mean": float(df[col].mean()),
                "std":  float(df[col].std()),
                "min":  float(df[col].min()),
                "max":  float(df[col].max()),
                "q25":  float(df[col].quantile(0.25)),
                "q75":  float(df[col].quantile(0.75)),
            }
        return stats

    # ── Numeric drift check ───────────────────────────────────────────────────

    def _check_numeric_drift(self, feature: str, baseline: dict, production: dict, prod_series: pd.Series) -> dict:
        """
        Check a NUMERIC feature for drift using two methods:
          1. Mean shift -- has the average moved more than N standard deviations?
          2. Range breach -- have min/max stretched beyond the training range?

        Returns a dict with baseline_mean, production_mean, drift_detected, reasons.
        """
        mean_threshold = self.thresholds.get("mean_shift_factor", 2.0)
        range_threshold = self.thresholds.get("range_extension_factor", 0.20)
        reasons = []

        # -- Check 1: Mean shift --
        baseline_std = baseline["std"]
        if baseline_std > 0:
            mean_delta = abs(production["mean"] - baseline["mean"])
            mean_z = mean_delta / baseline_std
            if mean_z > mean_threshold:
                reasons.append(
                    f"Mean shifted by {mean_z:.2f} sigma "
                    f"(baseline={baseline['mean']:.4f}, "
                    f"production={production['mean']:.4f})"
                )
        else:
            if production["mean"] != baseline["mean"]:
                reasons.append(
                    f"Feature was constant during training "
                    f"(baseline={baseline['mean']:.4f}) but changed "
                    f"(production={production['mean']:.4f})"
                )

        # -- Check 2: Range breach --
        baseline_range = baseline["max"] - baseline["min"]
        allowed_extension = baseline_range * range_threshold

        if production["min"] < baseline["min"] - allowed_extension:
            reasons.append(
                f"Min decreased beyond range "
                f"(baseline_min={baseline['min']:.4f}, "
                f"production_min={production['min']:.4f})"
            )
        if production["max"] > baseline["max"] + allowed_extension:
            reasons.append(
                f"Max increased beyond range "
                f"(baseline_max={baseline['max']:.4f}, "
                f"production_max={production['max']:.4f})"
            )

        # -- Structured metrics (so the API/frontend can chart them, not just
        #    parse them out of free-text reason strings) --
        mean_shift_sigma = (
            round(abs(production["mean"] - baseline["mean"]) / baseline_std, 4)
            if baseline_std > 0 else None
        )
        psi_val = None
        ks_stat = None
        ks_pvalue = None

        # -- Check 3: Statistical Tests (KS-Test and PSI) --
        base_series = self.raw_baseline_df.get(feature)
        if base_series is not None and not base_series.empty and not prod_series.empty:
            # KS Test
            stat, p_value = ks_2samp(base_series, prod_series)
            ks_stat = round(float(stat), 4)
            ks_pvalue = round(float(p_value), 6)
            if p_value < 0.05:
                reasons.append(f"[KS-Test] Failed. p-value={p_value:.4f} (<0.05) indicates mathematical distribution shift.")

            # PSI
            try:
                psi_val = round(calculate_psi(base_series.values, prod_series.values), 4)
                if psi_val > 0.2:
                    reasons.append(f"[PSI] Failed. Score={psi_val:.4f} (>0.2) indicates significant population shift.")
                elif psi_val > 0.1:
                    reasons.append(f"[PSI] Warning. Score={psi_val:.4f} (>0.1) indicates moderate population shift.")
            except Exception as e:
                log.error(f"Failed to calculate PSI for {feature}: {e}")

        # -- Severity classification: critical > warning > stable --
        severity = "stable"
        if (psi_val is not None and psi_val > 0.2) or \
           (ks_pvalue is not None and ks_pvalue < 0.01) or \
           (mean_shift_sigma is not None and mean_shift_sigma > mean_threshold):
            severity = "critical"
        elif reasons:
            severity = "warning"

        return {
            "feature_type":    "numeric",
            "baseline_mean":   round(baseline["mean"], 4),
            "production_mean": round(production["mean"], 4),
            "drift_detected":  len(reasons) > 0,
            "severity":        severity,
            "metrics": {
                "psi":              psi_val,
                "ks_stat":          ks_stat,
                "ks_pvalue":        ks_pvalue,
                "mean_shift_sigma": mean_shift_sigma,
            },
            "reasons":         reasons,
        }

    # ── Categorical drift check ───────────────────────────────────────────────

    def _check_categorical_drift(self, feature: str) -> dict:
        """
        Check a CATEGORICAL feature for drift by comparing the normalized
        frequency distribution of each category between baseline and
        production data.

        Flag drift if any category's absolute frequency delta exceeds the
        configured threshold (default 0.15 = 15 percentage points).

        Returns a dict with baseline distribution, production distribution,
        drift_detected, and reasons.
        """
        cat_threshold = self.thresholds.get("categorical_frequency_threshold", 0.15)
        reasons = []

        empty_metrics = {"max_category_shift": None, "js_divergence": None}

        baseline_dist = self.baseline_category_dist.get(feature, {})
        if not baseline_dist:
            return {
                "feature_type":        "categorical",
                "baseline_mean":       None,
                "production_mean":     None,
                "drift_detected":      False,
                "severity":            "stable",
                "metrics":             empty_metrics,
                "reasons":             ["No baseline distribution available"],
            }

        # Get raw (pre-encoding) production values
        prod_series = self._raw_categorical_values.get(feature)
        if prod_series is None:
            return {
                "feature_type":        "categorical",
                "baseline_mean":       None,
                "production_mean":     None,
                "drift_detected":      False,
                "severity":            "stable",
                "metrics":             empty_metrics,
                "reasons":             ["Feature not found in production data"],
            }

        # Compute production frequency distribution
        prod_freq = prod_series.value_counts(normalize=True)
        prod_dist = {str(k): round(float(v), 6) for k, v in prod_freq.items()}

        # Compare every category that appears in either distribution
        all_categories = set(list(baseline_dist.keys()) + list(prod_dist.keys()))

        max_shift = 0.0
        for cat in sorted(all_categories):
            base_pct = baseline_dist.get(cat, 0.0)
            prod_pct = prod_dist.get(cat, 0.0)
            delta = abs(prod_pct - base_pct)
            max_shift = max(max_shift, delta)
            if delta > cat_threshold:
                reasons.append(
                    f"Category '{cat}' frequency changed by {delta:.2f} "
                    f"(baseline={base_pct:.2%}, production={prod_pct:.2%})"
                )

        # Jensen-Shannon divergence over the category distributions
        # (0 = identical, ln(2) ~= 0.693 = maximally different).
        js_div = _js_divergence(baseline_dist, prod_dist, all_categories)

        # For the summary table, show the most-frequent category's baseline
        # and production percentages as a representative "mean" value
        top_baseline_cat = max(baseline_dist, key=baseline_dist.get) if baseline_dist else None
        baseline_mean_repr = baseline_dist.get(top_baseline_cat, 0.0) if top_baseline_cat else None
        production_mean_repr = prod_dist.get(top_baseline_cat, 0.0) if top_baseline_cat else None

        severity = "stable"
        if js_div > 0.1 or max_shift > 2 * cat_threshold:
            severity = "critical"
        elif reasons:
            severity = "warning"

        return {
            "feature_type":          "categorical",
            "baseline_distribution": baseline_dist,
            "production_distribution": prod_dist,
            "baseline_mean":         round(baseline_mean_repr, 4) if baseline_mean_repr is not None else None,
            "production_mean":       round(production_mean_repr, 4) if production_mean_repr is not None else None,
            "drift_detected":        len(reasons) > 0,
            "severity":              severity,
            "metrics": {
                "max_category_shift": round(max_shift, 4),
                "js_divergence":      round(js_div, 4),
            },
            "reasons":               reasons,
        }

    # ── Evidently placeholder ─────────────────────────────────────────────────

    def run_evidently_report(self, reference_df: pd.DataFrame, production_df: pd.DataFrame):
        """
        Placeholder for future Evidently AI integration.

        When implemented, this method will:
          1. Accept a reference (training) DataFrame and a production DataFrame.
          2. Use evidently.report.Report with DataDriftPreset to generate a
             comprehensive statistical drift report.
          3. Return the Evidently report object (or save it as HTML).

        Evidently provides advanced drift tests such as:
          - Kolmogorov-Smirnov test for numeric features
          - Chi-squared test for categorical features
          - Population Stability Index (PSI)
          - Jensen-Shannon divergence

        Example future implementation:
            from evidently.report import Report
            from evidently.metric_preset import DataDriftPreset
            report = Report(metrics=[DataDriftPreset()])
            report.run(reference_data=reference_df, current_data=production_df)
            return report

        This method currently returns None — it is a hook for future work.
        """
        log.info(
            "Evidently integration not yet implemented. "
            "This is a placeholder for future development."
        )
        return None

    # ── Main drift detection pipeline ─────────────────────────────────────────

    def detect_drift(self, production_df: pd.DataFrame) -> dict:
        """
        Full drift detection pipeline:
          1. Validate minimum sample size.
          2. Preprocess the production dataframe.
          3. Compute production statistics.
          4. Compare each feature using type-appropriate logic:
             - Numeric features:     mean shift + range breach
             - Categorical features: category frequency change
          5. Return structured results.

        Returns
        -------
        dict with keys:
          - timestamp        : ISO-formatted check time
          - dataset_size     : number of rows in the production batch
          - overall_drift    : True if any feature drifted
          - drifted_features : list of feature names that drifted
          - feature_results  : dict of feature -> {baseline_mean, production_mean, ...}
        """
        now = datetime.now(timezone.utc).isoformat()
        dataset_size = len(production_df)

        # ── Safeguard: minimum sample size ────────────────────────────────
        if dataset_size < self.min_sample_size:
            log.warning(
                f"Dataset has {dataset_size} rows, which is below the "
                f"minimum of {self.min_sample_size}. Drift detection skipped."
            )
            return {
                "timestamp":        now,
                "dataset_size":     dataset_size,
                "overall_drift":    False,
                "drifted_features": [],
                "feature_results":  {},
                "warning":          (
                    "Insufficient production data for reliable drift detection. "
                    f"Need at least {self.min_sample_size} rows, got {dataset_size}."
                ),
                "summary": {
                    "total_features": 0,
                    "drifted_count":  0,
                    "stable_count":   0,
                },
            }

        # ── Step 1: Preprocess ────────────────────────────────────────────
        processed_df = self.preprocess_production_data(production_df)
        log.info(f"Production data preprocessed -- shape: {processed_df.shape}")

        # ── Step 2: Compute production numeric stats ──────────────────────
        prod_stats = self.compute_stats(processed_df)

        # ── Step 3: Per-feature drift checks ──────────────────────────────
        feature_results = {}
        drifted_features = []

        for feature in self.expected_features:
            if feature in self.numeric_features:
                # --- Numeric drift check ---
                if feature not in self.baseline_stats or feature not in prod_stats:
                    log.warning(f"Skipping numeric feature '{feature}' -- not in both datasets.")
                    continue
                result = self._check_numeric_drift(
                    feature, self.baseline_stats[feature], prod_stats[feature], processed_df[feature]
                )
            elif feature in self.categorical_features:
                # --- Categorical drift check ---
                result = self._check_categorical_drift(feature)
            else:
                log.warning(f"Feature '{feature}' is neither numeric nor categorical. Skipping.")
                continue

            if result["drift_detected"]:
                drifted_features.append(feature)

            feature_results[feature] = result

        overall_drift = len(drifted_features) > 0
        total = len(feature_results)

        # Severity tally + a single 0..1 drift score. Critical features are
        # weighted double so the score reflects *how bad* the drift is, not
        # just how many features moved.
        critical = sum(1 for r in feature_results.values() if r.get("severity") == "critical")
        warning = sum(1 for r in feature_results.values() if r.get("severity") == "warning")
        drift_score = round(min(1.0, (critical + 0.5 * warning) / total), 4) if total else 0.0

        results = {
            "timestamp":        now,
            "dataset_size":     dataset_size,
            "overall_drift":    overall_drift,
            "drift_score":      drift_score,
            "drifted_features": drifted_features,
            "feature_results":  feature_results,
            "summary": {
                "total_features": total,
                "drifted_count":  len(drifted_features),
                "stable_count":   total - len(drifted_features),
                "critical_count": critical,
                "warning_count":  warning,
            },
        }

        log.info(
            f"Drift check complete -- "
            f"{results['summary']['drifted_count']}/{results['summary']['total_features']} "
            f"features drifted"
        )
        return results
