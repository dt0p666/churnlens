import json
from typing import Dict, Any, List, Tuple, Optional
from pathlib import Path
import joblib
import pandas as pd
import numpy as np

from src.config import config
from src.data_validation import validate_single_record, validate_batch_dataframe

class ChurnPredictor:
    def __init__(self, model_dir: Optional[Path] = None):
        self.model_dir = model_dir or config.MODELS_DIR
        self.pipeline_path = self.model_dir / "pipeline.joblib"
        self.metadata_path = self.model_dir / "metadata.json"

        if not self.pipeline_path.exists():
            raise FileNotFoundError(
                f"Trained pipeline artifact missing at: {self.pipeline_path}. Run 'python -m src.train' first."
            )

        self.pipeline = joblib.load(self.pipeline_path)
        with open(self.metadata_path, "r") as f:
            self.metadata = json.load(f)

        self.threshold = self.metadata.get("default_threshold", config.DEFAULT_THRESHOLD)
        self.model_version = self.metadata.get("model_version", "v1.0.0")
        self.model_name = self.metadata.get("model_name", "XGBoost")

    def determine_risk_tier(self, probability: float) -> str:
        """
        Maps continuous probability to business risk tiers:
        - HIGH: >= 0.60
        - MEDIUM: 0.35 to 0.5999
        - LOW: < 0.35
        """
        if probability >= 0.60:
            return "HIGH"
        elif probability >= 0.35:
            return "MEDIUM"
        else:
            return "LOW"

    def predict_single(self, customer_data: Dict[str, Any], custom_threshold: Optional[float] = None) -> Dict[str, Any]:
        """
        Validates and runs inference on a single customer dictionary.
        Returns churn_probability, churn_prediction, and risk_tier ('HIGH'/'MEDIUM'/'LOW').
        """
        is_valid, errors = validate_single_record(customer_data)
        if not is_valid:
            raise ValueError(f"Customer record validation failed: {errors}")

        threshold = custom_threshold if custom_threshold is not None else self.threshold
        df = pd.DataFrame([customer_data])

        prob = float(self.pipeline.predict_proba(df)[0, 1])
        prediction = int(prob >= threshold)
        risk_tier = self.determine_risk_tier(prob)

        return {
            "churn_probability": round(prob, 4),
            "churn_prediction": prediction,
            "risk_tier": risk_tier,
            "decision_threshold": threshold,
            "model_version": self.model_version,
            "model_name": self.model_name
        }

    def predict_dataframe(self, df: pd.DataFrame, custom_threshold: Optional[float] = None) -> pd.DataFrame:
        """
        Runs vector prediction on a pandas DataFrame and appends churn_probability,
        churn_prediction, and risk_tier.
        """
        threshold = custom_threshold if custom_threshold is not None else self.threshold
        df_out = df.copy()

        # Isolate candidate feature columns
        probabilities = self.pipeline.predict_proba(df_out)[:, 1]
        df_out["churn_probability"] = np.round(probabilities, 4)
        df_out["churn_prediction"] = (probabilities >= threshold).astype(int)
        df_out["risk_tier"] = [self.determine_risk_tier(p) for p in probabilities]

        return df_out

    def predict_batch(self, df: pd.DataFrame, custom_threshold: Optional[float] = None) -> Tuple[pd.DataFrame, Dict[str, Any]]:
        """
        Validates batch DataFrame, scores valid records, and returns predictions with summary.
        """
        valid_df, invalid_df, val_summary = validate_batch_dataframe(df)
        threshold = custom_threshold if custom_threshold is not None else self.threshold

        if len(valid_df) == 0:
            return invalid_df, {
                **val_summary,
                "scored_count": 0,
                "high_risk": 0,
                "medium_risk": 0,
                "low_risk": 0,
                "mean_probability": 0.0
            }

        probabilities = self.pipeline.predict_proba(valid_df)[:, 1]
        valid_df["churn_probability"] = np.round(probabilities, 4)
        valid_df["churn_prediction"] = (probabilities >= threshold).astype(int)
        valid_df["risk_tier"] = [self.determine_risk_tier(p) for p in probabilities]

        high_risk = int((valid_df["risk_tier"] == "HIGH").sum())
        med_risk = int((valid_df["risk_tier"] == "MEDIUM").sum())
        low_risk = int((valid_df["risk_tier"] == "LOW").sum())

        skipped_bad_rows = []
        if len(invalid_df) > 0:
            for idx, r in invalid_df.iterrows():
                skipped_bad_rows.append({
                    "row_index": int(idx),
                    "reason": str(r.get("validation_errors", "Malformed row"))
                })

        summary = {
            **val_summary,
            "scored_count": len(valid_df),
            "high_risk": high_risk,
            "medium_risk": med_risk,
            "low_risk": low_risk,
            "mean_probability": round(float(np.mean(probabilities)), 4),
            "skipped_bad_rows": skipped_bad_rows
        }

        if len(invalid_df) > 0:
            invalid_df["churn_probability"] = np.nan
            invalid_df["churn_prediction"] = np.nan
            invalid_df["risk_tier"] = "INVALID"
            result_df = pd.concat([valid_df, invalid_df], axis=0).sort_index()
        else:
            result_df = valid_df

        return result_df, summary

# Module-level convenience functions
_default_predictor = None

def get_default_predictor() -> ChurnPredictor:
    global _default_predictor
    if _default_predictor is None:
        _default_predictor = ChurnPredictor()
    return _default_predictor

def predict_customer(customer_data: Dict[str, Any], threshold: Optional[float] = None) -> Dict[str, Any]:
    return get_default_predictor().predict_single(customer_data, custom_threshold=threshold)

def predict_dataframe(df: pd.DataFrame, threshold: Optional[float] = None) -> pd.DataFrame:
    return get_default_predictor().predict_dataframe(df, custom_threshold=threshold)
