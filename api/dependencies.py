from functools import lru_cache
from src.predict import ChurnPredictor
from src.explain import ChurnExplainer
from api.database import get_db

@lru_cache()
def get_predictor() -> ChurnPredictor:
    return ChurnPredictor()

@lru_cache()
def get_explainer() -> ChurnExplainer:
    return ChurnExplainer()
