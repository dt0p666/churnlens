from typing import Dict, Any, List, Tuple
import pandas as pd
import numpy as np
from src.config import config

VALID_CATEGORICAL_VALUES: Dict[str, List[str]] = {
    "Gender": ["Male", "Female"],
    "Senior Citizen": ["Yes", "No"],
    "Partner": ["Yes", "No"],
    "Dependents": ["Yes", "No"],
    "Phone Service": ["Yes", "No"],
    "Multiple Lines": ["No", "Yes", "No phone service"],
    "Internet Service": ["DSL", "Fiber optic", "No"],
    "Online Security": ["Yes", "No", "No internet service"],
    "Online Backup": ["Yes", "No", "No internet service"],
    "Device Protection": ["No", "Yes", "No internet service"],
    "Tech Support": ["No", "Yes", "No internet service"],
    "Streaming TV": ["No", "Yes", "No internet service"],
    "Streaming Movies": ["No", "Yes", "No internet service"],
    "Contract": ["Month-to-month", "One year", "Two year"],
    "Paperless Billing": ["Yes", "No"],
    "Payment Method": [
        "Electronic check",
        "Mailed check",
        "Bank transfer (automatic)",
        "Credit card (automatic)"
    ]
}

def validate_single_record(record: Dict[str, Any]) -> Tuple[bool, List[str]]:
    errors = []
    
    # Required categoricals
    for col in config.CATEGORICAL_COLS:
        if col not in record:
            errors.append(f"Missing required field: '{col}'")
        else:
            val = str(record[col]).strip()
            allowed = VALID_CATEGORICAL_VALUES.get(col, [])
            if allowed and val not in allowed:
                errors.append(f"Invalid value for '{col}': '{val}'. Allowed: {allowed}")
                
    # Required numericals
    for col in config.NUMERICAL_COLS:
        if col not in record:
            errors.append(f"Missing required field: '{col}'")
        else:
            val = record[col]
            try:
                # Handle blank string for Total Charges
                if isinstance(val, str) and val.strip() == "":
                    val = 0.0
                num_val = float(val)
                if num_val < 0:
                    errors.append(f"Numerical field '{col}' cannot be negative: {num_val}")
                if col == "Tenure Months" and (num_val > 120):
                    errors.append(f"Unrealistic tenure months: {num_val}")
                if col == "Monthly Charges" and (num_val > 300):
                    errors.append(f"Unrealistic monthly charges: {num_val}")
            except (ValueError, TypeError):
                errors.append(f"Field '{col}' must be numeric, got: '{val}'")
                
    return len(errors) == 0, errors

def validate_batch_dataframe(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, Any]]:
    """
    Validates batch dataframe. Separates valid and invalid rows without failing entire batch.
    """
    total_rows = len(df)
    valid_mask = pd.Series(True, index=df.index)
    error_reasons = {}

    # Check presence of required columns
    missing_cols = [c for c in config.CATEGORICAL_COLS + config.NUMERICAL_COLS if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Batch dataset missing required columns: {missing_cols}")

    # Coerce Total Charges
    df_clean = df.copy()
    if "Total Charges" in df_clean.columns:
        df_clean["Total Charges"] = pd.to_numeric(
            df_clean["Total Charges"].astype(str).str.strip().replace("", "0.0"), 
            errors="coerce"
        )
    
    # Numeric bounds
    for col in config.NUMERICAL_COLS:
        df_clean[col] = pd.to_numeric(df_clean[col], errors="coerce")
        col_invalid = df_clean[col].isna() | (df_clean[col] < 0)
        if col == "Tenure Months":
            col_invalid = col_invalid | (df_clean[col] > 120)
        for idx in df_clean[col_invalid].index:
            valid_mask.loc[idx] = False
            error_reasons.setdefault(idx, []).append(f"Invalid {col}")

    # Categorical domain checks
    for col, allowed in VALID_CATEGORICAL_VALUES.items():
        if col in df_clean.columns:
            str_series = df_clean[col].astype(str).str.strip()
            cat_invalid = ~str_series.isin(allowed)
            for idx in df_clean[cat_invalid].index:
                valid_mask.loc[idx] = False
                error_reasons.setdefault(idx, []).append(f"Invalid category in {col}: '{df_clean.loc[idx, col]}'")

    valid_df = df_clean[valid_mask].copy()
    invalid_df = df_clean[~valid_mask].copy()
    invalid_df["validation_errors"] = ["; ".join(error_reasons.get(i, ["Unknown error"])) for i in invalid_df.index]

    summary = {
        "total_rows": total_rows,
        "valid_rows": len(valid_df),
        "invalid_rows": len(invalid_df),
        "valid_rate": float(len(valid_df) / max(total_rows, 1))
    }
    return valid_df, invalid_df, summary
