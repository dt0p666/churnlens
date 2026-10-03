"""
ChurnLens Business Impact & Cost-Optimal Threshold Engine.
Models business utility functions, asymmetric misclassification costs,
and cumulative gains / lift analysis for retention campaign planning.
"""

from typing import Dict, Any, List, Optional
import json
import numpy as np
import pandas as pd
from src.config import config

# Default Business Assumptions (explicitly labeled as configurable parameters)
DEFAULT_ASSUMPTIONS = {
    "cost_missed_churner": 500.0,      # Cost of False Negative (Lost LTV)
    "cost_retention_offer": 50.0,       # Cost of False Positive (Wasted incentive/discount)
    "cost_successful_outreach": 50.0,   # Operational outreach cost for True Positive
    "intervention_success_rate": 0.40,  # Fraction of contacted churners successfully saved
}

def compute_cost_curve(
    threshold_data: List[Dict[str, Any]],
    cost_missed_churner: float = DEFAULT_ASSUMPTIONS["cost_missed_churner"],
    cost_retention_offer: float = DEFAULT_ASSUMPTIONS["cost_retention_offer"],
    cost_successful_outreach: float = DEFAULT_ASSUMPTIONS["cost_successful_outreach"],
    intervention_success_rate: float = DEFAULT_ASSUMPTIONS["intervention_success_rate"]
) -> Dict[str, Any]:
    """
    Computes total business cost across candidate decision thresholds.
    Cost Equation:
      Expected Cost = (FN * Cost_FN) + (FP * Cost_FP) + (TP * Cost_TP) - (TP * Success_Rate * LTV_Saved)
    """
    cost_points = []
    min_cost = float("inf")
    optimal_point = None
    baseline_05_point = None

    for entry in threshold_data:
        t = entry["threshold"]
        tp = entry["tp"]
        fp = entry["fp"]
        fn = entry["fn"]
        tn = entry["tn"]

        # Financial impact breakdown
        lost_ltv = fn * cost_missed_churner
        wasted_discounts = fp * cost_retention_offer
        outreach_cost = tp * cost_successful_outreach
        saved_revenue = tp * intervention_success_rate * cost_missed_churner

        net_business_cost = (lost_ltv + wasted_discounts + outreach_cost) - saved_revenue

        point = {
            "threshold": t,
            "net_cost": round(net_business_cost, 2),
            "lost_ltv": round(lost_ltv, 2),
            "wasted_discounts": round(wasted_discounts, 2),
            "outreach_cost": round(outreach_cost, 2),
            "saved_revenue": round(saved_revenue, 2),
            "precision": entry.get("precision", 0),
            "recall": entry.get("recall", 0),
            "f1": entry.get("f1", 0),
            "tp": tp,
            "fp": fp,
            "fn": fn,
            "tn": tn,
        }
        cost_points.append(point)

        if net_business_cost < min_cost:
            min_cost = net_business_cost
            optimal_point = point

        if abs(t - 0.50) < 1e-4 or (baseline_05_point is None and t >= 0.50):
            baseline_05_point = point

    savings_vs_default = 0.0
    if baseline_05_point and optimal_point:
        savings_vs_default = round(baseline_05_point["net_cost"] - optimal_point["net_cost"], 2)

    return {
        "assumptions": {
            "cost_missed_churner": cost_missed_churner,
            "cost_retention_offer": cost_retention_offer,
            "cost_successful_outreach": cost_successful_outreach,
            "intervention_success_rate": intervention_success_rate,
            "is_assumed": True
        },
        "optimal_threshold": optimal_point["threshold"] if optimal_point else 0.45,
        "optimal_cost": optimal_point["net_cost"] if optimal_point else 0.0,
        "baseline_05_cost": baseline_05_point["net_cost"] if baseline_05_point else 0.0,
        "estimated_savings_vs_05": max(0.0, savings_vs_default),
        "cost_curve": cost_points,
    }

def compute_retention_planner(
    y_true: np.ndarray,
    y_probs: np.ndarray,
    contact_percentage: float = 20.0
) -> Dict[str, Any]:
    """
    Computes cumulative gains, lift, and precision@k for retention budget planning.
    """
    df = pd.DataFrame({"y_true": y_true, "y_prob": y_probs})
    df = df.sort_values(by="y_prob", ascending=False).reset_index(drop=True)

    total_customers = len(df)
    total_churners = int(df["y_true"].sum())
    base_churn_rate = total_churners / max(total_customers, 1)

    # 10 deciles for gains chart
    deciles = []
    step = int(np.ceil(total_customers / 10))
    for i in range(1, 11):
        cutoff = min(i * step, total_customers)
        sub = df.iloc[:cutoff]
        captured_churners = int(sub["y_true"].sum())
        pct_contacted = round((cutoff / total_customers) * 100, 1)
        pct_churners_captured = round((captured_churners / max(total_churners, 1)) * 100, 2)
        precision_at_k = round(captured_churners / max(cutoff, 1), 4)
        lift = round(precision_at_k / max(base_churn_rate, 1e-5), 2)

        deciles.append({
            "decile": i,
            "contact_percentage": pct_contacted,
            "captured_churners": captured_churners,
            "churn_capture_percentage": pct_churners_captured,
            "precision_at_k": precision_at_k,
            "lift": lift,
            "random_baseline": pct_contacted
        })

    # Specific query for user's requested contact percentage
    k_customers = max(1, int(np.round((contact_percentage / 100.0) * total_customers)))
    k_sub = df.iloc[:k_customers]
    k_churners = int(k_sub["y_true"].sum())
    k_capture_rate = round((k_churners / max(total_churners, 1)) * 100, 2)
    k_precision = round(k_churners / k_customers, 4)
    k_lift = round(k_precision / max(base_churn_rate, 1e-5), 2)

    return {
        "total_test_customers": total_customers,
        "total_churners": total_churners,
        "base_churn_rate": round(base_churn_rate, 4),
        "user_query": {
            "contact_percentage": contact_percentage,
            "contact_count": k_customers,
            "churners_captured": k_churners,
            "capture_percentage": k_capture_rate,
            "precision_at_k": k_precision,
            "lift": k_lift
        },
        "gain_chart": deciles
    }
