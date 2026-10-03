"""
ChurnLens Model Drift & Data Quality Monitoring Engine.
Implements Population Stability Index (PSI) for numerical and categorical feature distributions,
as well as prediction score stability tracking for production ML deployments.
"""

from typing import Dict, Any, List, Optional, Union
import numpy as np
import pandas as pd
from src.config import config

def calculate_psi(
    expected: Union[np.ndarray, pd.Series, List[float]], 
    actual: Union[np.ndarray, pd.Series, List[float]], 
    num_buckets: int = 10,
    eps: float = 1e-4
) -> float:
    """
    Computes the Population Stability Index (PSI) between a baseline (expected)
    and a production/serving (actual) numerical distribution.

    PSI Formula:
        PSI = sum((Actual_% - Expected_%) * ln(Actual_% / Expected_%))

    Industry Standard Thresholds:
        - PSI < 0.10: Insignificant change / Stable distribution
        - 0.10 <= PSI < 0.20: Moderate shift / Diagnostic monitoring required
        - PSI >= 0.20: Significant distribution drift / Model retraining triggered
    """
    exp_arr = np.asarray(expected, dtype=float)
    act_arr = np.asarray(actual, dtype=float)

    # Filter out NaNs
    exp_arr = exp_arr[~np.isnan(exp_arr)]
    act_arr = act_arr[~np.isnan(act_arr)]

    if len(exp_arr) == 0 or len(act_arr) == 0:
        return 0.0

    # If data is completely constant
    if np.min(exp_arr) == np.max(exp_arr):
        if np.array_equal(exp_arr, act_arr):
            return 0.0
        return 1.0

    # Calculate quantile bucket boundaries from baseline
    percentiles = np.linspace(0, 100, num_buckets + 1)
    bucket_bounds = np.percentile(exp_arr, percentiles)

    # Ensure unique and strictly increasing cut points for inner bins
    cut_points = bucket_bounds[1:-1]
    for i in range(1, len(cut_points)):
        if cut_points[i] <= cut_points[i - 1]:
            cut_points[i] = cut_points[i - 1] + 1e-5

    # np.digitize places values into bins [0, ..., num_buckets - 1] with open-ended outer bounds
    exp_bins = np.digitize(exp_arr, cut_points)
    act_bins = np.digitize(act_arr, cut_points)

    exp_counts = np.bincount(exp_bins, minlength=num_buckets)
    act_counts = np.bincount(act_bins, minlength=num_buckets)

    exp_pct = exp_counts / max(len(exp_arr), 1)
    act_pct = act_counts / max(len(act_arr), 1)

    # Smooth zero bins to avoid division by zero or log(0)
    exp_pct = np.where(exp_pct <= 0, eps, exp_pct)
    act_pct = np.where(act_pct <= 0, eps, act_pct)

    # Re-normalize to 1.0 after smoothing
    exp_pct = exp_pct / np.sum(exp_pct)
    act_pct = act_pct / np.sum(act_pct)

    psi_val = np.sum((act_pct - exp_pct) * np.log(act_pct / exp_pct))
    return round(float(psi_val), 4)

def calculate_categorical_psi(
    expected: Union[pd.Series, List[str], np.ndarray],
    actual: Union[pd.Series, List[str], np.ndarray],
    eps: float = 1e-4
) -> float:
    """
    Computes Population Stability Index (PSI) between categorical distributions.
    """
    s_exp = pd.Series(expected).astype(str).dropna()
    s_act = pd.Series(actual).astype(str).dropna()

    if len(s_exp) == 0 or len(s_act) == 0:
        return 0.0

    all_categories = sorted(list(set(s_exp.unique()).union(set(s_act.unique()))))

    exp_counts = s_exp.value_counts()
    act_counts = s_act.value_counts()

    exp_pct = np.array([exp_counts.get(c, 0) / len(s_exp) for c in all_categories])
    act_pct = np.array([act_counts.get(c, 0) / len(s_act) for c in all_categories])

    # Smooth zero bins
    exp_pct = np.where(exp_pct <= 0, eps, exp_pct)
    act_pct = np.where(act_pct <= 0, eps, act_pct)

    exp_pct = exp_pct / np.sum(exp_pct)
    act_pct = act_pct / np.sum(act_pct)

    psi_val = np.sum((act_pct - exp_pct) * np.log(act_pct / exp_pct))
    return round(float(psi_val), 4)

def classify_drift_tier(psi_val: float) -> str:
    """
    Translates numeric PSI value into standardized drift alert tiers.
    """
    if psi_val >= 0.20:
        return "SIGNIFICANT_DRIFT"
    elif psi_val >= 0.10:
        return "MODERATE_DRIFT"
    return "STABLE"

class DriftMonitor:
    """
    Production monitoring class evaluating incoming batches against baseline training data.
    """
    def __init__(self, reference_df: Optional[pd.DataFrame] = None):
        if reference_df is None:
            if config.RAW_DATA_PATH.exists():
                df = pd.read_csv(config.RAW_DATA_PATH)
                df["Total Charges Clean"] = pd.to_numeric(
                    df["Total Charges"].astype(str).str.strip().replace("", "0.0"),
                    errors="coerce"
                ).fillna(0.0)
                df["Total Charges"] = df["Total Charges Clean"]
                self.reference_df = df
            else:
                self.reference_df = pd.DataFrame()
        else:
            self.reference_df = reference_df

    def evaluate_batch_drift(
        self,
        current_df: pd.DataFrame,
        numeric_columns: Optional[List[str]] = None,
        categorical_columns: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Runs comprehensive PSI calculations across numerical and categorical features.
        """
        num_cols = numeric_columns or config.NUMERICAL_COLS
        cat_cols = categorical_columns or config.CATEGORICAL_COLS

        feature_reports = {}
        high_drift_features = []
        moderate_drift_features = []

        # Numerical Features
        for col in num_cols:
            if col in self.reference_df.columns and col in current_df.columns:
                ref_vals = pd.to_numeric(self.reference_df[col], errors="coerce").dropna().values
                curr_vals = pd.to_numeric(current_df[col], errors="coerce").dropna().values

                psi = calculate_psi(ref_vals, curr_vals)
                tier = classify_drift_tier(psi)

                if tier == "SIGNIFICANT_DRIFT":
                    high_drift_features.append(col)
                elif tier == "MODERATE_DRIFT":
                    moderate_drift_features.append(col)

                feature_reports[col] = {
                    "type": "numerical",
                    "psi": psi,
                    "drift_tier": tier,
                    "reference_mean": round(float(np.mean(ref_vals)), 2) if len(ref_vals) > 0 else 0,
                    "current_mean": round(float(np.mean(curr_vals)), 2) if len(curr_vals) > 0 else 0,
                }

        # Categorical Features
        for col in cat_cols:
            if col in self.reference_df.columns and col in current_df.columns:
                ref_series = self.reference_df[col].dropna()
                curr_series = current_df[col].dropna()

                psi = calculate_categorical_psi(ref_series, curr_series)
                tier = classify_drift_tier(psi)

                if tier == "SIGNIFICANT_DRIFT":
                    high_drift_features.append(col)
                elif tier == "MODERATE_DRIFT":
                    moderate_drift_features.append(col)

                feature_reports[col] = {
                    "type": "categorical",
                    "psi": psi,
                    "drift_tier": tier,
                    "num_categories": len(ref_series.unique()),
                }

        max_psi = max([f["psi"] for f in feature_reports.values()]) if feature_reports else 0.0
        avg_psi = round(float(np.mean([f["psi"] for f in feature_reports.values()])), 4) if feature_reports else 0.0

        alert_status = "CRITICAL_DRIFT" if high_drift_features else ("WARNING" if moderate_drift_features else "HEALTHY")

        return {
            "status": alert_status,
            "max_psi": max_psi,
            "average_psi": avg_psi,
            "high_drift_features": high_drift_features,
            "moderate_drift_features": moderate_drift_features,
            "total_monitored_features": len(feature_reports),
            "retraining_recommended": len(high_drift_features) > 0,
            "features": feature_reports,
        }

def check_feature_drift(
    reference_df: pd.DataFrame,
    current_df: pd.DataFrame,
    numeric_columns: Optional[List[str]] = None
) -> Dict[str, Any]:
    """
    Backwards compatibility function for fast numeric drift evaluation.
    """
    monitor = DriftMonitor(reference_df=reference_df)
    res = monitor.evaluate_batch_drift(
        current_df=current_df, 
        numeric_columns=numeric_columns,
        categorical_columns=[]
    )
    return {
        "drift_summary": "Retrain recommended" if res["retraining_recommended"] else "Distributions stable",
        "drift_detected": res["retraining_recommended"],
        "high_drift_features": res["high_drift_features"],
        "features": res["features"],
    }

def generate_simulated_drift_dataset(n_samples: int = 500, random_state: int = 42) -> pd.DataFrame:
    """
    Generates a deliberately shifted cohort (clearly labeled SIMULATED)
    to demonstrate live covariate drift detection.
    Simulated distribution shifts:
      - Tenure Months: shifted sharply downward (mean ~ 6.5 months vs baseline 32.4 months)
      - Monthly Charges: inflated by 35% (mean ~ $92 vs baseline $64.8)
      - Contract: 85% Month-to-month (vs baseline 55%)
      - Payment Method: 75% Electronic check (vs baseline 33%)
    """
    np.random.seed(random_state)
    df = pd.DataFrame({
        "Gender": np.random.choice(["Male", "Female"], size=n_samples),
        "Senior Citizen": np.random.choice(["No", "Yes"], size=n_samples, p=[0.7, 0.3]),
        "Partner": np.random.choice(["No", "Yes"], size=n_samples, p=[0.65, 0.35]),
        "Dependents": np.random.choice(["No", "Yes"], size=n_samples, p=[0.8, 0.2]),
        # Severe tenure shift towards newly acquired fragile cohorts
        "Tenure Months": np.clip(np.random.exponential(scale=6.0, size=n_samples).astype(int) + 1, 1, 72),
        "Phone Service": np.random.choice(["Yes", "No"], size=n_samples, p=[0.9, 0.1]),
        "Multiple Lines": np.random.choice(["No", "Yes"], size=n_samples, p=[0.6, 0.4]),
        "Internet Service": np.random.choice(["Fiber optic", "DSL", "No"], size=n_samples, p=[0.70, 0.20, 0.10]),
        "Online Security": np.random.choice(["No", "Yes"], size=n_samples, p=[0.85, 0.15]),
        "Online Backup": np.random.choice(["No", "Yes"], size=n_samples, p=[0.75, 0.25]),
        "Device Protection": np.random.choice(["No", "Yes"], size=n_samples, p=[0.75, 0.25]),
        "Tech Support": np.random.choice(["No", "Yes"], size=n_samples, p=[0.85, 0.15]),
        "Streaming TV": np.random.choice(["Yes", "No"], size=n_samples, p=[0.6, 0.4]),
        "Streaming Movies": np.random.choice(["Yes", "No"], size=n_samples, p=[0.6, 0.4]),
        # Contract shifted to high-volatility month-to-month
        "Contract": np.random.choice(["Month-to-month", "One year", "Two year"], size=n_samples, p=[0.85, 0.10, 0.05]),
        "Paperless Billing": np.random.choice(["Yes", "No"], size=n_samples, p=[0.90, 0.10]),
        # Payment shifted to high-friction electronic check
        "Payment Method": np.random.choice(
            ["Electronic check", "Mailed check", "Bank transfer (automatic)", "Credit card (automatic)"],
            size=n_samples,
            p=[0.75, 0.10, 0.08, 0.07]
        ),
        # Monthly charges inflated
        "Monthly Charges": np.round(np.random.normal(loc=92.5, scale=14.0, size=n_samples), 2),
    })

    df["Total Charges"] = np.round(df["Tenure Months"] * df["Monthly Charges"], 2)
    return df

