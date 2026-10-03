import pytest
from starlette.testclient import TestClient
from api.main import app
from src.utils import SAMPLE_HIGH_RISK_CUSTOMER

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

def test_api_health(client):
    res = client.get("/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True

def test_api_model_info(client):
    res = client.get("/model/info")
    assert res.status_code == 200
    data = res.json()
    assert "metadata" in data
    assert "curves" in data
    assert data["metadata"]["model_name"] == "XGBoost"

def test_api_predict(client):
    res = client.post("/predict", json=SAMPLE_HIGH_RISK_CUSTOMER)
    assert res.status_code == 200
    data = res.json()
    assert "churn_probability" in data
    assert "explanation" in data
    assert data["risk_tier"] == "HIGH"

def test_api_analytics_summary(client):
    res = client.get("/analytics/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_customers"] == 7043
    assert data["churn_rate"] > 0.20

def test_api_whatif(client):
    payload = {
        "baseline": SAMPLE_HIGH_RISK_CUSTOMER,
        "modifications": {
            "Contract": "Two year",
            "Online Security": "Yes",
            "Tech Support": "Yes"
        }
    }
    res = client.post("/whatif", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert "baseline_probability" in data
    assert "simulated_probability" in data
    assert data["risk_delta"] < 0  # 2-year contract + security reduces risk
    assert "percentage_points_change" in data
    assert "disclaimer" in data
