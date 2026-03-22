# predict.py
# ──────────────────────────────────────────────────────────────────────────────
# Prediction helper for the loan model.
#
# This module loads the trained model, label encoders, and metadata once,
# then provides a simple predict() function that the API can call.
#
# HOW IT WORKS:
#   1. Load the saved RandomForest model and LabelEncoder objects.
#   2. Accept a dictionary of raw feature values (like a form submission).
#   3. Preprocess the input the same way training did.
#   4. Run the model and return the prediction + probability.
# ──────────────────────────────────────────────────────────────────────────────

import json
import logging
import os

import joblib
import numpy as np
import pandas as pd
import shap

log = logging.getLogger(__name__)


class LoanPredictor:
    """
    Wraps the trained loan model for easy single-row predictions.

    Usage:
        predictor = LoanPredictor(model_path, encoder_path, metadata_path)
        result = predictor.predict({"Gender": "Male", "ApplicantIncome": 5000, ...})
    """

    def __init__(self, model_path: str, encoder_path: str, metadata_path: str):
        """
        Parameters
        ----------
        model_path : str
            Path to the saved model file (loan_model.pkl).
        encoder_path : str
            Path to the saved label encoders (label_encoders.pkl).
        metadata_path : str
            Path to model_metadata.json (for expected feature names).
        """
        # Load the trained model
        self.model = joblib.load(model_path)
        log.info(f"Model loaded from {model_path}")

        # Load label encoders
        self.encoders = joblib.load(encoder_path)
        log.info(f"Label encoders loaded from {encoder_path}")

        # Load metadata
        with open(metadata_path, "r") as f:
            self.metadata = json.load(f)
        self.feature_names = self.metadata["feature_names"]
        log.info(f"Expected features: {self.feature_names}")

        # Build a reverse mapping for the target encoder
        # The target column "Loan_Status" was also label-encoded during training.
        # We need its encoder to convert numeric predictions back to text.
        self.target_encoder = self.encoders.get("Loan_Status", None)
        
        # Initialize SHAP explainer for global/local explainability
        self.explainer = shap.TreeExplainer(self.model)
        log.info("SHAP TreeExplainer initialized")

    def preprocess_input(self, features: dict) -> pd.DataFrame:
        """
        Take a raw feature dictionary and prepare it for model prediction.

        Steps:
          1. Create a single-row DataFrame from the input dict.
          2. Fill any missing features with safe defaults.
          3. Label-encode categorical columns using the saved encoders.
          4. Reorder columns to match the training feature order.
        """
        # Create a single-row DataFrame
        df = pd.DataFrame([features])

        # Fill missing values the same way training did
        for col in df.columns:
            if df[col].dtype == "object":
                df[col] = df[col].fillna("Unknown")
            else:
                df[col] = df[col].fillna(0)

        # Label-encode categorical columns using saved encoders
        for col, le in self.encoders.items():
            # Skip the target column encoder
            if col == "Loan_Status":
                continue
            if col in df.columns:
                known_classes = set(le.classes_)
                df[col] = df[col].astype(str).apply(
                    lambda val, kc=known_classes, lec=le: (
                        val if val in kc
                        else ("Unknown" if "Unknown" in kc else lec.classes_[0])
                    )
                )
                df[col] = le.transform(df[col])

        # Ensure all expected features are present
        for feat in self.feature_names:
            if feat not in df.columns:
                df[feat] = 0  # default value for missing features

        # Reorder to match training order
        df = df[self.feature_names]
        return df

    def predict(self, features: dict) -> dict:
        """
        Make a prediction for a single loan application.

        Parameters
        ----------
        features : dict
            Raw feature values, e.g.:
            {
                "Gender": "Male",
                "Married": "Yes",
                "ApplicantIncome": 5000,
                "LoanAmount": 150,
                ...
            }

        Returns
        -------
        dict with keys:
            - prediction: "Approved" or "Rejected" (or numeric if no encoder)
            - probability: float (probability of approval)
            - features_used: list of feature names
        """
        # Preprocess the input
        input_df = self.preprocess_input(features)

        # Get prediction and probability
        prediction_numeric = self.model.predict(input_df)[0]
        probabilities = self.model.predict_proba(input_df)[0]

        # Convert numeric prediction back to text label if we have the encoder
        if self.target_encoder is not None:
            prediction_label = self.target_encoder.inverse_transform([prediction_numeric])[0]
        else:
            prediction_label = "Approved" if prediction_numeric == 1 else "Rejected"

        # The probability of the positive class (index 1 = Approved)
        approval_probability = float(probabilities[1])

        # Calculate SHAP values for explainability
        shap_vals = self.explainer.shap_values(input_df)
        if isinstance(shap_vals, list):
            # RandomForest returns a list of arrays (one for each class)
            # We care about the positive class (index 1)
            feature_contributions = shap_vals[1][0]
        else:
            # Some wrappers or newer SHAP versions might just return one array
            feature_contributions = shap_vals[0]

        # Build a list of feature importance dictionaries
        reasoning = []
        for feat_name, importance in zip(self.feature_names, feature_contributions):
            reasoning.append({
                "feature": feat_name,
                "importance": float(importance),
                "value": str(input_df[feat_name].iloc[0])
            })
            
        # Sort by absolute importance (highest impact first)
        reasoning.sort(key=lambda x: abs(x["importance"]), reverse=True)

        result = {
            "prediction": prediction_label,
            "probability": round(approval_probability, 4),
            "features_used": self.feature_names,
            "reasoning": reasoning,
        }

        log.info(f"Prediction: {result['prediction']} (prob={result['probability']:.4f})")
        return result
