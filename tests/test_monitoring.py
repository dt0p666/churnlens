import pytest
import numpy as np
import pandas as pd
from src.monitoring import (
    calculate_psi, 
    calculate_categorical_psi, 
    classify_drift_tier, 
    DriftMonitor,
    check_feature_drift
)

def test_psi_identical_distributions():
    np.random.seed(42)
    expected = np.random.normal(loc=50.0, scale=10.0, size=2000)
    actual = np.random.normal(loc=50.0, scale=10.0, size=2000)

    psi = calculate_psi(expected, actual)
    assert psi < 0.05
    assert classify_drift_tier(psi) == "STABLE"

def test_psi_shifted_distribution():
    np.random.seed(42)
    expected = np.random.normal(loc=20.0, scale=5.0, size=1500)
    # Severe mean shift representing data drift
    actual = np.random.normal(loc=70.0, scale=15.0, size=1500)

    psi = calculate_psi(expected, actual)
    assert psi > 0.20
    assert classify_drift_tier(psi) == "SIGNIFICANT_DRIFT"

def test_categorical_psi_identical():
    expected = pd.Series(["Month-to-month"] * 500 + ["One year"] * 300 + ["Two year"] * 200)
    actual = pd.Series(["Month-to-month"] * 500 + ["One year"] * 300 + ["Two year"] * 200)

    psi = calculate_categorical_psi(expected, actual)
    assert psi < 0.01
    assert classify_drift_tier(psi) == "STABLE"

def test_categorical_psi_severe_shift():
    expected = pd.Series(["Month-to-month"] * 900 + ["Two year"] * 100)
    # Complete cohort composition inversion
    actual = pd.Series(["Month-to-month"] * 100 + ["Two year"] * 900)

    psi = calculate_categorical_psi(expected, actual)
    assert psi > 0.20
    assert classify_drift_tier(psi) == "SIGNIFICANT_DRIFT"

def test_drift_monitor_batch():
    ref_df = pd.DataFrame({
        "Tenure Months": np.random.randint(1, 72, size=500),
        "Monthly Charges": np.random.uniform(20.0, 100.0, size=500),
        "Contract": np.random.choice(["Month-to-month", "One year", "Two year"], size=500)
    })

    # Batch with shifted monthly charges
    curr_df = pd.DataFrame({
        "Tenure Months": np.random.randint(1, 72, size=200),
        "Monthly Charges": np.random.uniform(110.0, 150.0, size=200),  # Extreme pricing shift
        "Contract": np.random.choice(["Month-to-month", "One year", "Two year"], size=200)
    })

    monitor = DriftMonitor(reference_df=ref_df)
    report = monitor.evaluate_batch_drift(
        current_df=curr_df,
        numeric_columns=["Tenure Months", "Monthly Charges"],
        categorical_columns=["Contract"]
    )

    assert "status" in report
    assert "Monthly Charges" in report["features"]
    assert report["features"]["Monthly Charges"]["psi"] > 0.20
    assert "Monthly Charges" in report["high_drift_features"]
    assert report["retraining_recommended"] is True

def test_check_feature_drift_backwards_compatibility():
    ref_df = pd.DataFrame({"Monthly Charges": [20.0, 25.0, 30.0] * 100})
    curr_df = pd.DataFrame({"Monthly Charges": [20.0, 25.0, 30.0] * 100})

    res = check_feature_drift(ref_df, curr_df, numeric_columns=["Monthly Charges"])
    assert res["drift_detected"] is False
    assert res["drift_summary"] == "Distributions stable"
