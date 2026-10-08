import pytest
from starlette.testclient import TestClient
from api.main import app
from src.currency import (
    convert_from_usd,
    convert_to_usd,
    format_currency,
    get_currency_config,
    SUPPORTED_CURRENCIES,
    REFERENCE_RATES_DATE,
)

@pytest.fixture(scope="module")
def client():
    return TestClient(app)

def test_currency_config_defaults():
    config = get_currency_config()
    assert config["default_currency"] == "INR"
    assert config["reference_date"] == REFERENCE_RATES_DATE
    assert "INR" in config["currencies"]
    assert "USD" in config["currencies"]
    assert config["currencies"]["INR"]["rate"] == 84.0
    assert config["currencies"]["INR"]["symbol"] == "₹"

def test_convert_from_usd():
    # $100 USD = 8,400 INR
    inr_val = convert_from_usd(100.0, "INR")
    assert inr_val == 8400.0

    # $100 USD = 92.0 EUR
    eur_val = convert_from_usd(100.0, "EUR")
    assert eur_val == 92.0

    # $100 USD = 100.0 USD
    usd_val = convert_from_usd(100.0, "USD")
    assert usd_val == 100.0

def test_convert_to_usd():
    # 8,400 INR = $100 USD
    usd_from_inr = convert_to_usd(8400.0, "INR")
    assert round(usd_from_inr, 2) == 100.0

    # Roundtrip conversion
    original_usd = 65.45
    inr = convert_from_usd(original_usd, "INR")
    recovered_usd = convert_to_usd(inr, "INR")
    assert abs(original_usd - recovered_usd) < 1e-4

def test_format_currency():
    inr_str = format_currency(100.0, "INR")
    assert "₹" in inr_str
    assert "8,400" in inr_str

    usd_str = format_currency(100.0, "USD")
    assert "$" in usd_str
    assert "100" in usd_str

def test_api_currency_config(client):
    res = client.get("/config/currency")
    assert res.status_code == 200
    data = res.json()
    assert data["default_currency"] == "INR"
    assert data["currencies"]["INR"]["rate"] == 84.0

def test_api_batch_with_currency(client):
    import io
    csv_content = (
        "CustomerID,Gender,Senior Citizen,Partner,Dependents,Tenure Months,Phone Service,"
        "Multiple Lines,Internet Service,Online Security,Online Backup,Device Protection,"
        "Tech Support,Streaming TV,Streaming Movies,Contract,Paperless Billing,Payment Method,Monthly Charges,Total Charges\n"
        "1111-TEST,Female,No,No,No,2,Yes,No,Fiber optic,No,No,No,No,Yes,Yes,Month-to-month,Yes,Electronic check,7980.0,15960.0\n"
    )
    # 7980 INR / 84 = 95.0 USD
    files = {"file": ("test_inr.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
    res = client.post("/predict/batch?currency=INR", files=files)
    assert res.status_code == 200
    data = res.json()
    assert data["summary"]["scored_records"] == 1
    assert data["summary"]["total_records"] == 1
    assert "churn_probability" in data["preview"][0]
