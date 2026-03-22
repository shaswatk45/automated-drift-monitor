# train_model.py

import os
import json
import logging
from datetime import datetime

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, classification_report,
    roc_auc_score, f1_score
)
import joblib

# ── Logging setup ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler("logs/training.log"),
        logging.StreamHandler()
    ]
)
log = logging.getLogger(__name__)

# ── Config ─────────────────────────────────────────────────────────────────────
CONFIG = {
    "data_path":        "data/raw/loan_data.csv",
    "model_path":       "models/loan_model.pkl",
    "encoder_path":     "models/label_encoders.pkl",
    "metadata_path":    "models/model_metadata.json",
    "baseline_path":    "models/baseline_stats.json",
    "drop_cols":        ["Loan_ID"],
    "target_col":       "Loan_Status",
    "test_size":        0.2,
    "random_state":     42,
    "rf_params": {
        "n_estimators":  200,
        "max_depth":     10,
        "min_samples_split": 5,
        "class_weight":  "balanced",   # handles class imbalance
        "random_state":  42,
        "n_jobs":        -1,
    },
}

# ── Helpers ────────────────────────────────────────────────────────────────────
def ensure_dirs(*paths):
    for p in paths:
        os.makedirs(os.path.dirname(p), exist_ok=True)


def load_data(path: str) -> pd.DataFrame:
    log.info(f"Loading data from {path}")
    df = pd.read_csv(path)
    log.info(f"  Shape: {df.shape}  |  Nulls: {df.isnull().sum().sum()}")
    return df


def preprocess(df: pd.DataFrame, cfg: dict):
    df = df.drop(columns=cfg["drop_cols"], errors="ignore")

    # Fill missing values before encoding
    for col in df.columns:
        if df[col].dtype == "object":
            df[col] = df[col].fillna("Unknown")
        else:
            df[col] = df[col].fillna(df[col].median())

    encoders = {}
    for col in df.select_dtypes(include="object").columns:
        le = LabelEncoder()
        df[col] = le.fit_transform(df[col].astype(str))
        encoders[col] = le

    return df, encoders


def compute_baseline_stats(X: pd.DataFrame) -> dict:
    """Capture feature distribution stats — used later for drift detection."""
    stats = {}
    for col in X.columns:
        stats[col] = {
            "mean":  float(X[col].mean()),
            "std":   float(X[col].std()),
            "min":   float(X[col].min()),
            "max":   float(X[col].max()),
            "q25":   float(X[col].quantile(0.25)),
            "q75":   float(X[col].quantile(0.75)),
        }
    return stats


def train_and_evaluate(X_train, X_test, y_train, y_test, cfg: dict):
    model = RandomForestClassifier(**cfg["rf_params"])

    # Cross-validated score on training set
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=cfg["random_state"])
    cv_scores = cross_val_score(model, X_train, y_train, cv=cv, scoring="roc_auc")
    log.info(f"CV ROC-AUC: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    model.fit(X_train, y_train)
    preds      = model.predict(X_test)
    proba      = model.predict_proba(X_test)[:, 1]

    metrics = {
        "accuracy":  round(accuracy_score(y_test, preds),  4),
        "roc_auc":   round(roc_auc_score(y_test, proba),   4),
        "f1_macro":  round(f1_score(y_test, preds, average="macro"), 4),
        "cv_roc_auc_mean": round(float(cv_scores.mean()), 4),
        "cv_roc_auc_std":  round(float(cv_scores.std()),  4),
    }
    log.info(f"Test metrics: {metrics}")
    log.info("\n" + classification_report(y_test, preds))

    return model, metrics


def save_artifacts(model, encoders, metrics, baseline_stats, feature_names, cfg):
    joblib.dump(model,    cfg["model_path"])
    joblib.dump(encoders, cfg["encoder_path"])
    log.info(f"Model saved  → {cfg['model_path']}")
    log.info(f"Encoders saved → {cfg['encoder_path']}")

    metadata = {
        "trained_at":    datetime.utcnow().isoformat(),
        "model_version": "1.0.0",
        "feature_names": feature_names,
        "metrics":       metrics,
        "rf_params":     cfg["rf_params"],
    }
    with open(cfg["metadata_path"], "w") as f:
        json.dump(metadata, f, indent=2)
    log.info(f"Metadata saved → {cfg['metadata_path']}")

    with open(cfg["baseline_path"], "w") as f:
        json.dump(baseline_stats, f, indent=2)
    log.info(f"Baseline stats saved → {cfg['baseline_path']}")


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    ensure_dirs(
        CONFIG["model_path"], CONFIG["encoder_path"],
        CONFIG["metadata_path"], CONFIG["baseline_path"],
        "logs/training.log"
    )

    df, encoders = preprocess(load_data(CONFIG["data_path"]), CONFIG)

    X = df.drop(columns=[CONFIG["target_col"]])
    y = df[CONFIG["target_col"]]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=CONFIG["test_size"],
        random_state=CONFIG["random_state"],
        stratify=y                          # keeps class ratio in both splits
    )

    baseline_stats = compute_baseline_stats(X_train)

    model, metrics = train_and_evaluate(X_train, X_test, y_train, y_test, CONFIG)

    save_artifacts(
        model, encoders, metrics,
        baseline_stats, list(X.columns), CONFIG
    )

    log.info("Training complete")


if __name__ == "__main__":
    main()