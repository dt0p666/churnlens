from functools import lru_cache
from typing import Dict, Any, List
from fastapi import APIRouter
import pandas as pd
import numpy as np
from src.config import config

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@lru_cache()
def load_raw_dataset() -> pd.DataFrame:
    df = pd.read_csv(config.RAW_DATA_PATH)
    df["Total Charges Clean"] = pd.to_numeric(
        df["Total Charges"].astype(str).str.strip().replace("", "0.0"), 
        errors="coerce"
    ).fillna(0.0)
    return df

@router.get("/summary")
def get_analytics_summary() -> Dict[str, Any]:
    df = load_raw_dataset()
    total_customers = len(df)
    churn_count = int((df[config.TARGET_COL] == 1).sum())
    retained_count = total_customers - churn_count
    churn_rate = round(float(churn_count / total_customers), 4)

    avg_monthly = round(float(df["Monthly Charges"].mean()), 2)
    churned_df = df[df[config.TARGET_COL] == 1]
    monthly_revenue_at_risk = round(float(churned_df["Monthly Charges"].sum()), 2)

    return {
        "total_customers": total_customers,
        "churned_customers": churn_count,
        "retained_customers": retained_count,
        "churn_rate": churn_rate,
        "avg_monthly_charges": avg_monthly,
        "monthly_revenue_lost": monthly_revenue_at_risk
    }

@router.get("/churn-distribution")
def get_churn_distributions() -> Dict[str, Any]:
    df = load_raw_dataset()

    # Contract distribution
    contract_data = []
    for contract, grp in df.groupby("Contract"):
        cnt = len(grp)
        chrn = int((grp[config.TARGET_COL] == 1).sum())
        contract_data.append({
            "category": contract,
            "total": cnt,
            "churned": chrn,
            "churn_rate": round(float(chrn / max(cnt, 1)), 4)
        })

    # Internet Service distribution
    internet_data = []
    for service, grp in df.groupby("Internet Service"):
        cnt = len(grp)
        chrn = int((grp[config.TARGET_COL] == 1).sum())
        internet_data.append({
            "category": service,
            "total": cnt,
            "churned": chrn,
            "churn_rate": round(float(chrn / max(cnt, 1)), 4)
        })

    # Payment Method distribution
    payment_data = []
    for pm, grp in df.groupby("Payment Method"):
        cnt = len(grp)
        chrn = int((grp[config.TARGET_COL] == 1).sum())
        payment_data.append({
            "category": pm,
            "total": cnt,
            "churned": chrn,
            "churn_rate": round(float(chrn / max(cnt, 1)), 4)
        })

    # Tenure Buckets (0-6m, 7-12m, 13-24m, 25-48m, 49-72m)
    bins = [-1, 6, 12, 24, 48, 100]
    labels = ["0-6m", "7-12m", "13-24m", "25-48m", "49-72m"]
    df["tenure_cohort"] = pd.cut(df["Tenure Months"], bins=bins, labels=labels)
    tenure_data = []
    for cohort, grp in df.groupby("tenure_cohort", observed=False):
        cnt = len(grp)
        chrn = int((grp[config.TARGET_COL] == 1).sum())
        tenure_data.append({
            "cohort": str(cohort),
            "total": cnt,
            "churned": chrn,
            "churn_rate": round(float(chrn / max(cnt, 1)), 4)
        })

    return {
        "contracts": contract_data,
        "internet_services": internet_data,
        "payment_methods": payment_data,
        "tenure_cohorts": tenure_data
    }

@router.get("/samples")
def get_sample_customers() -> List[Dict[str, Any]]:
    """
    Returns actual customer profiles from the dataset for fast loading and experimentation in UI.
    """
    df = load_raw_dataset()
    # Pick diverse customers across cohorts
    sample_indices = [0, 2, 5, 8, 10, 15, 20, 25, 30, 40]
    sub_df = df.iloc[sample_indices]

    cols_needed = config.CATEGORICAL_COLS + config.NUMERICAL_COLS
    samples = []
    for idx, row in sub_df.iterrows():
        sample = {c: row[c] for c in cols_needed}
        sample["Total Charges"] = float(row["Total Charges Clean"])
        sample["CustomerID"] = str(row["CustomerID"])
        sample["ActualChurn"] = int(row[config.TARGET_COL])
        samples.append(sample)
    return samples

@router.get("/customers")
def get_customers(
    limit: int = 50,
    offset: int = 0,
    search: str = "",
    contract: str = ""
) -> Dict[str, Any]:
    """
    Paginated, searchable directory of actual Telco customers for the Customers view.
    """
    df = load_raw_dataset()
    filtered = df

    if search:
        s = search.strip().lower()
        filtered = filtered[
            filtered["CustomerID"].astype(str).str.lower().str.contains(s) |
            filtered["Payment Method"].astype(str).str.lower().str.contains(s) |
            filtered["Internet Service"].astype(str).lower().str.contains(s)
        ]

    if contract and contract != "ALL":
        filtered = filtered[filtered["Contract"] == contract]

    total_count = len(filtered)
    paged = filtered.iloc[offset : offset + limit]

    cols_needed = config.CATEGORICAL_COLS + config.NUMERICAL_COLS
    customers = []
    for _, row in paged.iterrows():
        cust = {c: row[c] for c in cols_needed}
        cust["Total Charges"] = float(row["Total Charges Clean"])
        cust["CustomerID"] = str(row["CustomerID"])
        cust["ActualChurn"] = int(row[config.TARGET_COL])
        customers.append(cust)

    return {
        "total": total_count,
        "limit": limit,
        "offset": offset,
        "customers": customers
    }

@lru_cache()
def get_scored_sample_dataset():
    """
    Computes real model predictions across a diverse sample of 300 real customers
    for the Customer Risk Map scatter plot and top risk feed.
    """
    import joblib
    pipeline_path = config.MODELS_DIR / "pipeline.joblib"
    if not pipeline_path.exists():
        return []

    pipeline = joblib.load(pipeline_path)
    df = load_raw_dataset()

    # Stratified representative sample of 300 real accounts
    sample_df = df.sample(n=min(300, len(df)), random_state=42).copy()

    cols_needed = config.CATEGORICAL_COLS + config.NUMERICAL_COLS
    sub_features = sample_df[cols_needed].copy()
    sub_features["Total Charges"] = sample_df["Total Charges Clean"]

    probs = pipeline.predict_proba(sub_features)[:, 1]
    sample_df["churn_probability"] = np.round(probs, 4)

    records = []
    for idx, row in sample_df.iterrows():
        p = float(row["churn_probability"])
        tier = "HIGH" if p >= 0.60 else ("MEDIUM" if p >= 0.35 else "LOW")
        records.append({
            "customer_id": str(row["CustomerID"]),
            "tenure": int(row["Tenure Months"]),
            "monthly_charges": round(float(row["Monthly Charges"]), 2),
            "total_charges": round(float(row["Total Charges Clean"]), 2),
            "churn_probability": p,
            "risk_tier": tier,
            "contract": str(row["Contract"]),
            "internet_service": str(row["Internet Service"]),
            "payment_method": str(row["Payment Method"]),
            "actual_churn": int(row[config.TARGET_COL])
        })
    return records

@router.get("/risk-map")
def get_customer_risk_map() -> List[Dict[str, Any]]:
    """
    Returns real scored customers for the Tenure vs Monthly Charges risk map scatter plot.
    """
    return get_scored_sample_dataset()

@router.get("/top-risk-feed")
def get_top_risk_feed(limit: int = 8) -> List[Dict[str, Any]]:
    """
    Returns top highest-risk real customers from the scored dataset for the live risk feed.
    """
    scored = get_scored_sample_dataset()
    sorted_by_risk = sorted(scored, key=lambda x: x["churn_probability"], reverse=True)
    return sorted_by_risk[:limit]

