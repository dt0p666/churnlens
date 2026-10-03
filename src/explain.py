import json
from typing import Dict, Any, List
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import shap

from src.config import config
from src.preprocessing import get_feature_names

class ChurnExplainer:
    def __init__(self, model_dir: Path = None):
        self.model_dir = model_dir or config.MODELS_DIR
        self.pipeline_path = self.model_dir / "pipeline.joblib"
        self.metadata_path = self.model_dir / "metadata.json"

        if not self.pipeline_path.exists():
            raise FileNotFoundError(f"Missing pipeline artifact at: {self.pipeline_path}")

        self.pipeline = joblib.load(self.pipeline_path)
        with open(self.metadata_path, "r") as f:
            self.metadata = json.load(f)

        self.preprocessor = self.pipeline.named_steps["preprocessor"]
        self.classifier = self.pipeline.named_steps["classifier"]
        self.feature_names = get_feature_names(self.preprocessor)

        # Initialize TreeExplainer for tree-based estimators (XGBoost / RandomForest)
        try:
            self.explainer = shap.TreeExplainer(self.classifier)
        except Exception:
            # Fallback for linear or non-tree
            self.explainer = None

    def explain_instance(self, customer_data: Dict[str, Any], top_n: int = 8) -> Dict[str, Any]:
        """
        Computes local SHAP attributions for a single customer profile.
        Returns top risk factors and retention factors with direction and magnitude.
        """
        df = pd.DataFrame([customer_data])
        X_trans = self.preprocessor.transform(df)

        if self.explainer is not None:
            shap_values = self.explainer.shap_values(X_trans)
            # For binary classification, handle array shape
            if isinstance(shap_values, list):
                # binary list [neg_class, pos_class]
                raw_values = shap_values[1][0]
            elif len(shap_values.shape) == 2:
                raw_values = shap_values[0]
            elif len(shap_values.shape) == 3:
                raw_values = shap_values[0, :, 1]
            else:
                raw_values = shap_values[0]
            base_value = float(self.explainer.expected_value if not isinstance(self.explainer.expected_value, (list, np.ndarray)) else self.explainer.expected_value[1])
        else:
            # Fallback linear attribution
            coef = getattr(self.classifier, "coef_", np.ones((1, len(self.feature_names))))[0]
            raw_values = X_trans[0] * coef
            base_value = float(getattr(self.classifier, "intercept_", [0.0])[0])

        contributions = []
        for name, val, raw_input_val in zip(self.feature_names, raw_values, X_trans[0]):
            contributions.append({
                "feature": name,
                "shap_value": round(float(val), 4),
                "importance": round(abs(float(val)), 4),
                "direction": "increases_risk" if val > 0 else "reduces_risk",
                "transformed_value": round(float(raw_input_val), 3)
            })

        # Sort by absolute impact
        contributions.sort(key=lambda x: x["importance"], reverse=True)
        top_factors = contributions[:top_n]

        # Separate positive (risk accelerators) and negative (retention buffers)
        risk_drivers = [f for f in top_factors if f["direction"] == "increases_risk"]
        retention_drivers = [f for f in top_factors if f["direction"] == "reduces_risk"]

        return {
            "base_value": round(base_value, 4),
            "top_factors": top_factors,
            "risk_drivers": risk_drivers,
            "retention_drivers": retention_drivers,
            "interpretation_notice": (
                "SHAP values quantify how much each feature shifted the model's log-odds / output "
                "relative to the average customer baseline. These indicate correlation within the model, "
                "NOT real-world causality."
            )
        }
