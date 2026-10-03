from typing import Dict, Any, List
import numpy as np
import pandas as pd
from src.config import config

def calculate_psi(expected: np.ndarray, actual: np.ndarray, num_buckets: int = 10) -> float:
    """
    Computes Population Stability Index (PSI) between baseline and production distributions.
    """
    expected = expected[~np.isnan(expected)]
    actual = actual[~np.isnan(actual)]
    
    if len(expected) == 0 or len(actual) == 0:
        return 0.0

    percentiles = np.linspace(0, 100, num_buckets + 1)
    bucket_bounds = np.percentile(expected, percentiles)
    # Ensure strictly increasing bounds
    bucket_bounds[0] -= 1e-5
    bucket_bounds[-1] += 1e-5
    for i in range(1, len(bucket_bounds)):
        if bucket_bounds[i] <= bucket_bounds[i - 1]:
            bucket_bounds[i] = bucket_bounds[i - 1] + 1e-5

    expected_counts, _ = np.histogram(expected, bins=bucket_bounds)
    actual_counts, _ = np.histogram(actual, bins=bucket_bounds)

    expected_pct = expected_counts / max(len(expected), 1)
    actual_pct = actual_counts / max(len(actual), 1)

    # Avoid zero division with smoothing
    eps = 1e-4
    expected_pct = np.where(expected_pct == 0, eps, expected_pct)
    actual_pct = np.where(actual_pct == 0, eps, actual_pct)

    psi_val = np.sum((actual_pct - expected_pct) * np.log(actual_pct / expected_pct))
    return round(float(psi_val), 4)

def check_feature_drift(
    reference_df: pd.DataFrame,
    current_df: pd.DataFrame,
    numeric_columns: List[str] = None
) -> Dict[str, Any]:
    """
    Evaluates drift across key numeric features using Population Stability Index.
    """
    cols = numeric_columns or config.NUMERICAL_COLS
    drift_report = {}
    high_drift_features = []

    for col in cols:
        if col in reference_df.columns and col in current_df.columns:
            ref_vals = pd.to_numeric(reference_df[col], errors="coerce").dropna().values
            curr_vals = pd.to_numeric(current_df[col], errors="coerce").dropna().values

            psi = calculate_psi(ref_vals, curr_vals)
            status = "stable"
            if psi >= 0.2:
                status = "significant_drift"
                high_drift_features.append(col)
            elif psi >= 0.1:
                status = "moderate_drift"

            drift_report[col] = {
                "psi": psi,
                "status": status,
                "reference_mean": round(float(np.mean(ref_vals)), 2) if len(ref_vals) > 0 else 0,
                "current_mean": round(float(np.mean(curr_vals)), 2) if len(curr_vals) > 0 else 0
            }

    return {
        "drift_summary": "Retrain recommended" if len(high_drift_features) > 0 else "Distributions stable",
        "drift_detected": len(high_drift_features) > 0,
        "high_drift_features": high_drift_features,
        "features": drift_report
    }
