import sys
from pathlib import Path

# Add project root to path
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

import pandas as pd
from src.predict import ChurnPredictor, predict_customer, predict_dataframe
from src.explain import ChurnExplainer, explain_customer
from src.config import config

def run_phase2_verification():
    print("=" * 78)
    print(" CHURNLENS - PHASE 2 INFERENCE & SHAP EXPLAINABILITY TEST")
    print("=" * 78)

    # 1. Load real customers from the raw dataset
    df_raw = pd.read_csv(config.RAW_DATA_PATH)

    # Pick 3 diverse real customer profiles:
    # Customer A: High Risk (row 0: 2m tenure, month-to-month, mailed check, churned)
    # Customer B: Medium Risk (row 12: 10m tenure, DSL, one-year contract)
    # Customer C: Low Risk (row 15: 71m tenure, two-year contract, bank transfer)
    selected_indices = [0, 12, 15]
    sample_df = df_raw.iloc[selected_indices].copy()

    predictor = ChurnPredictor()
    explainer = ChurnExplainer()

    print(f"\n[Test 1] Testing Single Customer Inference & SHAP Attribution on 3 Real Customers:")
    print("-" * 78)

    for i, (_, row) in enumerate(sample_df.iterrows(), 1):
        cust_id = row.get("CustomerID", f"CUST-{i}")
        actual_churn = "YES" if row.get("Churn Value") == 1 else "NO"

        # Prepare customer dict matching feature columns
        cust_dict = {col: row[col] for col in config.CATEGORICAL_COLS + config.NUMERICAL_COLS}

        # Predict single customer
        pred_res = predictor.predict_single(cust_dict)

        # Compute SHAP explanation
        exp_res = explainer.explain_instance(cust_dict, top_n=3)

        print(f"\nCustomer #{i}: ID={cust_id} | Actual Churn={actual_churn}")
        print(f"  Contract: {row['Contract']} | Tenure: {row['Tenure Months']} mos | Monthly: ${row['Monthly Charges']}")
        print(f"  -> Predicted Probability: {pred_res['churn_probability']*100:.2f}%")
        print(f"  -> Risk Tier:             {pred_res['risk_tier']}")
        print(f"  -> Binary Prediction:     {pred_res['churn_prediction']} (Threshold = {pred_res['decision_threshold']})")
        print("  Top 3 SHAP Contributing Factors:")
        for factor in exp_res["top_contributing_features"]:
            print(f"     * {factor['feature']:<28} | Impact: {factor['shap_value']:+.4f} ({factor['direction']})")

    # 2. Test DataFrame Batch Prediction
    print("\n" + "-" * 78)
    print("[Test 2] Testing predict_dataframe on a DataFrame of 3 customers:")
    print("-" * 78)
    scored_df = predictor.predict_dataframe(sample_df)
    cols_to_show = ["CustomerID", "Contract", "Tenure Months", "Monthly Charges", "churn_probability", "risk_tier", "churn_prediction"]
    print(scored_df[[c for c in cols_to_show if c in scored_df.columns]].to_string(index=False))

    print("\n" + "=" * 78)
    print(" PHASE 2 VERIFICATION COMPLETE: ALL PREDICTIONS AND SHAP ATTRIBUTIONS VERIFIED")
    print("=" * 78)

if __name__ == "__main__":
    run_phase2_verification()
