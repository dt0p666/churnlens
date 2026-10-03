import pytest
from src.predict import ChurnPredictor
from src.explain import ChurnExplainer
from src.utils import SAMPLE_HIGH_RISK_CUSTOMER, SAMPLE_LOW_RISK_CUSTOMER

@pytest.fixture(scope="module")
def predictor():
    return ChurnPredictor()

@pytest.fixture(scope="module")
def explainer():
    return ChurnExplainer()

def test_prediction_output_structure(predictor):
    res = predictor.predict_single(SAMPLE_HIGH_RISK_CUSTOMER)
    assert "churn_probability" in res
    assert "churn_prediction" in res
    assert "risk_tier" in res
    assert 0.0 <= res["churn_probability"] <= 1.0
    assert res["churn_prediction"] in (0, 1)

def test_risk_differentiation(predictor):
    high_res = predictor.predict_single(SAMPLE_HIGH_RISK_CUSTOMER)
    low_res = predictor.predict_single(SAMPLE_LOW_RISK_CUSTOMER)
    assert high_res["churn_probability"] > low_res["churn_probability"]
    assert high_res["risk_tier"] == "High"
    assert low_res["risk_tier"] == "Low"

def test_shap_explanation_structure(explainer):
    exp = explainer.explain_instance(SAMPLE_HIGH_RISK_CUSTOMER, top_n=5)
    assert "base_value" in exp
    assert "top_factors" in exp
    assert len(exp["top_factors"]) == 5
    assert "interpretation_notice" in exp
