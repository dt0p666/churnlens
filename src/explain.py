import json
from typing import Dict, Any, List, Optional
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
import shap

from src.config import config
from src.preprocessing import get_feature_names

class ChurnExplainer:
    def __init__(self, model_dir: Optional[Path] = None):
        self.model_dir = model_dir or config.MODELS_DIR
        self.pipeline_path = self.model_dir / "pipeline.joblib"
        self.metadata_path = self.model_dir / "metadata.json"

        if not self.pipeline_path.exists():
            raise FileNotFoundError(f"Missing pipeline artifact at: {self.pipeline_path}. Run 'python -m src.train' first.")

        self.pipeline = joblib.load(self.pipeline_path)
        with open(self.metadata_path, "r") as f:
            self.metadata = json.load(f)

        self.preprocessor = self.pipeline.named_steps["preprocessor"]
        self.classifier = self.pipeline.named_steps["classifier"]
        self.feature_names = get_feature_names(self.preprocessor)

        # Initialize TreeExplainer for tree estimators
        try:
            self.explainer = shap.TreeExplainer(self.classifier)
        except Exception:
            self.explainer = None

    def explain_instance(self, customer_data: Dict[str, Any], top_n: int = 5) -> Dict[str, Any]:
        """
        Computes local SHAP attributions for an individual customer profile.
        Returns top features driving churn risk higher or lower.
        """
        df = pd.DataFrame([customer_data])
        X_trans = self.preprocessor.transform(df)

        if self.explainer is not None:
            shap_values = self.explainer.shap_values(X_trans)
            if isinstance(shap_values, list):
                raw_values = shap_values[1][0]
            elif len(shap_values.shape) == 2:
                raw_values = shap_values[0]
            elif len(shap_values.shape) == 3:
                raw_values = shap_values[0, :, 1]
            else:
                raw_values = shap_values[0]
            base_value = float(
                self.explainer.expected_value
                if not isinstance(self.explainer.expected_value, (list, np.ndarray))
                else self.explainer.expected_value[1]
            )
        else:
            coef = getattr(self.classifier, "coef_", np.ones((1, len(self.feature_names))))[0]
            raw_values = X_trans[0] * coef
            base_value = float(getattr(self.classifier, "intercept_", [0.0])[0])

        contributions = []
        for name, val, raw_input_val in zip(self.feature_names, raw_values, X_trans[0]):
            contributions.append({
                "feature": name,
                "shap_value": round(float(val), 4),
                "magnitude": round(abs(float(val)), 4),
                "direction": "INCREASES_RISK" if val > 0 else "REDUCES_RISK",
                "transformed_value": round(float(raw_input_val), 3)
            })

        # Rank by absolute magnitude of impact
        contributions.sort(key=lambda x: x["magnitude"], reverse=True)
        top_factors = contributions[:top_n]

        risk_drivers = [f for f in top_factors if f["direction"] == "INCREASES_RISK"]
        retention_drivers = [f for f in top_factors if f["direction"] == "REDUCES_RISK"]

        return {
            "base_value": round(base_value, 4),
            "top_contributing_features": top_factors,
            "top_factors": top_factors,  # compatibility alias
            "risk_drivers": risk_drivers,
            "retention_drivers": retention_drivers,
            "interpretation_notice": "SHAP explains statistical model weights, not real-world causality.",
            "disclaimer": "SHAP explains statistical model weights, not real-world causality."
        }

# Module-level convenience function
_default_explainer = None

def get_default_explainer() -> ChurnExplainer:
    global _default_explainer
    if _default_explainer is None:
        _default_explainer = ChurnExplainer()
    return _default_explainer

def explain_customer(customer_data: Dict[str, Any], top_n: int = 5) -> Dict[str, Any]:
    return get_default_explainer().explain_instance(customer_data, top_n=top_n)
