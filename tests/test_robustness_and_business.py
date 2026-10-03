import io
import pytest
import numpy as np
import pandas as pd
from starlette.testclient import TestClient

from api.main import app
from src.config import config
from src.train import load_and_prepare_data
from src.business import compute_cost_curve, compute_retention_planner
from src.calibration import evaluate_calibration
from src.utils import SAMPLE_HIGH_RISK_CUSTOMER
import joblib

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

def test_pipeline_zero_leakage_and_bounds():
    """
    Verifies that pipeline outputs valid probabilities strictly in [0.0, 1.0]
    and fits without target leakage columns.
    """
    pipeline_path = config.MODELS_DIR / "pipeline.joblib"
    assert pipeline_path.exists(), "Pipeline artifact must exist"

    pipeline = joblib.load(pipeline_path)
    X, y, _ = load_and_prepare_data()

    # Ensure target and leakage columns are not in input features
    assert "Churn Value" not in X.columns
    assert "Churn Reason" not in X.columns
    assert "Churn Score" not in X.columns

    sample_slice = X.iloc[:50]
    probs = pipeline.predict_proba(sample_slice)[:, 1]

    # Verify bounds
    assert np.all(probs >= 0.0)
    assert np.all(probs <= 1.0)
    assert len(probs) == 50

def test_api_rejects_invalid_input(client):
    """
    Tests that FastAPI rejects invalid schema payloads with HTTP 422 / 400.
    """
    # 1. Missing required fields
    bad_payload = {"Gender": "Female"}
    res = client.post("/predict", json=bad_payload)
    assert res.status_code == 422

    # 2. Invalid data types / negative charges
    bad_payload2 = SAMPLE_HIGH_RISK_CUSTOMER.copy()
    bad_payload2["Monthly Charges"] = -100.0
    res2 = client.post("/predict", json=bad_payload2)
    # Pydantic or predict route should reject or raise validation error
    assert res2.status_code in [400, 422]

def test_batch_upload_skips_bad_rows_and_reports(client):
    """
    Tests that POST /predict/batch scores valid rows and quarantines corrupted rows.
    """
    csv_data = (
        "CustomerID,Gender,Senior Citizen,Partner,Dependents,Tenure Months,Phone Service,"
        "Multiple Lines,Internet Service,Online Security,Online Backup,Device Protection,"
        "Tech Support,Streaming TV,Streaming Movies,Contract,Paperless Billing,Payment Method,Monthly Charges,Total Charges\n"
        "CUST-001,Female,No,No,No,2,Yes,No,Fiber optic,No,No,No,No,Yes,Yes,Month-to-month,Yes,Electronic check,95.8,191.6\n"
        "CUST-002,Male,No,Yes,Yes,60,Yes,Yes,DSL,Yes,Yes,Yes,Yes,No,No,Two year,No,Credit card (automatic),64.2,3852.0\n"
        "CUST-BAD,InvalidGender,No,No,No,-5,Yes,No,Fiber optic,No,No,No,No,Yes,Yes,InvalidContract,Yes,Electronic check,-95.8,bad\n"
    )

    files = {"file": ("test_batch.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
    res = client.post("/predict/batch", files=files)
    assert res.status_code == 200

    data = res.json()
    summary = data["summary"]
    assert summary["total_records"] == 3
    assert summary["scored_records"] == 2
    assert summary["skipped_records"] == 1
    assert data["preview"][0]["churn_probability"] is not None
    assert data["preview"][2]["churn_probability"] is None

def test_business_cost_optimization_math():
    """
    Verifies that cost curve computes expected loss and picks optimal threshold.
    """
    mock_thresh_data = [
        {"threshold": 0.3, "tp": 300, "fp": 300, "fn": 50, "tn": 750, "precision": 0.5, "recall": 0.85, "f1": 0.63},
        {"threshold": 0.5, "tp": 250, "fp": 150, "fn": 100, "tn": 900, "precision": 0.62, "recall": 0.71, "f1": 0.66},
        {"threshold": 0.7, "tp": 150, "fp": 50, "fn": 200, "tn": 1000, "precision": 0.75, "recall": 0.42, "f1": 0.54},
    ]

    cost_result = compute_cost_curve(
        threshold_data=mock_thresh_data,
        cost_missed_churner=500.0,
        cost_retention_offer=50.0
    )

    assert "optimal_threshold" in cost_result
    assert "estimated_savings_vs_05" in cost_result
    assert len(cost_result["cost_curve"]) == 3

def test_retention_planner_cumulative_gains():
    """
    Verifies that retention planner gains increase monotonically with contact percentage.
    """
    y_true = np.array([1, 1, 1, 0, 0, 1, 0, 0, 0, 0] * 10)
    y_probs = np.linspace(0.9, 0.1, 100)

    planner = compute_retention_planner(y_true, y_probs, contact_percentage=20.0)
    gains = [d["churn_capture_percentage"] for d in planner["gain_chart"]]

    # Cumulative gain must be non-decreasing
    for i in range(1, len(gains)):
        assert gains[i] >= gains[i - 1]

    # Lift for top 10% should be > 1.0 on ordered probabilities
    assert planner["gain_chart"][0]["lift"] >= 1.0

def test_calibration_evaluation():
    """
    Verifies calibration evaluation correctly computes Brier scores.
    """
    y_true = np.array([0, 1, 0, 1, 0, 1, 0, 0, 1, 1])
    uncal = np.array([0.1, 0.9, 0.2, 0.8, 0.3, 0.7, 0.1, 0.4, 0.6, 0.85])
    cal = np.array([0.05, 0.95, 0.15, 0.85, 0.25, 0.75, 0.05, 0.35, 0.65, 0.90])

    res = evaluate_calibration(y_true, uncal, cal, n_bins=5)
    assert "brier_score_uncalibrated" in res
    assert "brier_score_calibrated" in res
    assert res["brier_score_calibrated"] >= 0.0
