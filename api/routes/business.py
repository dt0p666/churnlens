import json
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split

from src.config import config
from src.business import (
    compute_cost_curve, 
    compute_retention_planner, 
    DEFAULT_ASSUMPTIONS
)
from src.train import load_and_prepare_data

router = APIRouter(prefix="/business", tags=["Business Impact"])

@router.get("/cost-optimization")
def get_cost_optimization(
    cost_missed_churner: float = Query(DEFAULT_ASSUMPTIONS["cost_missed_churner"], ge=10.0, le=5000.0),
    cost_retention_offer: float = Query(DEFAULT_ASSUMPTIONS["cost_retention_offer"], ge=1.0, le=1000.0),
    cost_successful_outreach: float = Query(DEFAULT_ASSUMPTIONS["cost_successful_outreach"], ge=1.0, le=1000.0),
    intervention_success_rate: float = Query(DEFAULT_ASSUMPTIONS["intervention_success_rate"], ge=0.01, le=1.0)
):
    thresh_path = config.MODELS_DIR / "threshold_analysis.json"
    if not thresh_path.exists():
        raise HTTPException(status_code=404, detail="Threshold analysis artifact not found. Please train model first.")

    with open(thresh_path, "r") as f:
        threshold_data = json.load(f)

    result = compute_cost_curve(
        threshold_data=threshold_data,
        cost_missed_churner=cost_missed_churner,
        cost_retention_offer=cost_retention_offer,
        cost_successful_outreach=cost_successful_outreach,
        intervention_success_rate=intervention_success_rate
    )
    return result

@router.get("/retention-planner")
def get_retention_planner(
    contact_percentage: float = Query(20.0, ge=1.0, le=100.0)
):
    pipeline_path = config.MODELS_DIR / "pipeline.joblib"
    if not pipeline_path.exists():
        raise HTTPException(status_code=404, detail="Model pipeline not found. Run training first.")

    # Load holdout test split
    X, y, _ = load_and_prepare_data()
    _, X_test, _, y_test = train_test_split(
        X, y, test_size=0.20, random_state=config.RANDOM_STATE, stratify=y
    )

    pipeline = joblib.load(pipeline_path)
    probs = pipeline.predict_proba(X_test)[:, 1]

    planner_result = compute_retention_planner(
        y_true=y_test.values,
        y_probs=probs,
        contact_percentage=contact_percentage
    )
    return planner_result
