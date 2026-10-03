import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

class TelcoFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Custom Scikit-Learn Transformer for Domain Feature Engineering.
    Runs inside the Pipeline so transformations are fitted only on training data
    and cannot leak test information.
    """
    def __init__(self):
        pass

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        X_out = X.copy() if isinstance(X, pd.DataFrame) else pd.DataFrame(X)

        # 1. Total Charges data cleaning: handle blanks and whitespace in raw dataset
        if "Total Charges" in X_out.columns:
            tc_series = X_out["Total Charges"].astype(str).str.strip().replace("", "0.0")
            X_out["Total Charges"] = pd.to_numeric(tc_series, errors="coerce").fillna(0.0)

        # 2. Numeric safety for Tenure Months and Monthly Charges
        if "Tenure Months" in X_out.columns:
            X_out["Tenure Months"] = pd.to_numeric(X_out["Tenure Months"], errors="coerce").fillna(0.0)
        if "Monthly Charges" in X_out.columns:
            X_out["Monthly Charges"] = pd.to_numeric(X_out["Monthly Charges"], errors="coerce").fillna(0.0)

        # 3. Engineered Feature: Tenure Group (lifecycle cohort binning)
        if "Tenure Months" in X_out.columns:
            bins = [-1, 12, 24, 48, 60, 120]
            labels = ["0-12m", "13-24m", "25-48m", "49-60m", "61-72m+"]
            X_out["TenureGroup"] = pd.cut(X_out["Tenure Months"], bins=bins, labels=labels).astype(str)

        # 4. Engineered Feature: Service Count (total count of active adopted services)
        service_cols = [
            "Online Security",
            "Online Backup",
            "Device Protection",
            "Tech Support",
            "Streaming TV",
            "Streaming Movies"
        ]
        service_count = pd.Series(0, index=X_out.index)
        for col in service_cols:
            if col in X_out.columns:
                service_count += (X_out[col] == "Yes").astype(int)
        if "Phone Service" in X_out.columns:
            service_count += (X_out["Phone Service"] == "Yes").astype(int)
        if "Multiple Lines" in X_out.columns:
            service_count += (X_out["Multiple Lines"] == "Yes").astype(int)
        if "Internet Service" in X_out.columns:
            service_count += (X_out["Internet Service"] != "No").astype(int)

        X_out["ServiceCount"] = service_count

        # 5. Engineered Feature: Average Historical Monthly Charges & Price Shock Ratio
        tenure_safe = np.maximum(X_out["Tenure Months"].values, 1.0)
        avg_monthly = X_out["Total Charges"].values / tenure_safe
        X_out["AvgMonthlyCharges"] = avg_monthly

        monthly_safe = np.maximum(X_out["Monthly Charges"].values, 1.0)
        X_out["ChargeDiffRatio"] = (X_out["Monthly Charges"].values - avg_monthly) / monthly_safe

        return X_out
