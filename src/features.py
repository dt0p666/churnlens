import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin

class TelcoFeatureEngineer(BaseEstimator, TransformerMixin):
    """
    Custom Scikit-Learn Transformer for Domain Feature Engineering.
    Runs inside the Pipeline to prevent any data leakage.
    """
    def __init__(self):
        pass

    def fit(self, X, y=None):
        return self

    def transform(self, X):
        # Create explicit copy
        X_out = X.copy() if isinstance(X, pd.DataFrame) else pd.DataFrame(X)

        # 1. Total Charges coercion (clean blank strings for 0-tenure accounts)
        if "Total Charges" in X_out.columns:
            tc = X_out["Total Charges"].astype(str).str.strip().replace("", "0.0")
            X_out["Total Charges"] = pd.to_numeric(tc, errors="coerce").fillna(0.0)

        # 2. Tenure Months and Monthly Charges numeric safety
        if "Tenure Months" in X_out.columns:
            X_out["Tenure Months"] = pd.to_numeric(X_out["Tenure Months"], errors="coerce").fillna(0.0)
        if "Monthly Charges" in X_out.columns:
            X_out["Monthly Charges"] = pd.to_numeric(X_out["Monthly Charges"], errors="coerce").fillna(0.0)

        # 3. Domain Feature: Count of active value-add services
        service_cols = [
            "Online Security",
            "Online Backup",
            "Device Protection",
            "Tech Support",
            "Streaming TV",
            "Streaming Movies"
        ]
        num_services = pd.Series(0, index=X_out.index)
        for col in service_cols:
            if col in X_out.columns:
                num_services += (X_out[col] == "Yes").astype(int)
        if "Multiple Lines" in X_out.columns:
            num_services += (X_out["Multiple Lines"] == "Yes").astype(int)
        if "Phone Service" in X_out.columns:
            num_services += (X_out["Phone Service"] == "Yes").astype(int)
            
        X_out["NumServices"] = num_services

        # 4. Domain Feature: Average Monthly Charges over tenure
        tenure_safe = np.maximum(X_out["Tenure Months"].values, 1.0)
        avg_monthly = X_out["Total Charges"].values / tenure_safe
        X_out["AvgMonthlyCharges"] = avg_monthly

        # 5. Domain Feature: Price change ratio relative to history
        monthly_safe = np.maximum(X_out["Monthly Charges"].values, 1.0)
        X_out["ChargeDiffRatio"] = (X_out["Monthly Charges"].values - avg_monthly) / monthly_safe

        return X_out
