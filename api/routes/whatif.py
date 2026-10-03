from typing import Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from api.schemas import WhatIfRequestSchema, WhatIfResponseSchema
from api.dependencies import get_predictor
from src.predict import ChurnPredictor

router = APIRouter(tags=["Simulation"])

@router.post("/whatif", response_model=WhatIfResponseSchema)
def simulate_counterfactual(
    payload: WhatIfRequestSchema,
    predictor: ChurnPredictor = Depends(get_predictor)
):
    try:
        baseline_dict = payload.baseline.model_dump(by_alias=True)

        # Build simulated profile
        if payload.simulated is not None:
            simulated_dict = payload.simulated.model_dump(by_alias=True)
        elif payload.modifications:
            simulated_dict = {**baseline_dict, **payload.modifications}
        else:
            simulated_dict = baseline_dict.copy()

        # Score baseline profile
        base_pred = predictor.predict_single(baseline_dict)

        # Score simulated profile
        sim_pred = predictor.predict_single(simulated_dict)

        risk_delta = round(sim_pred["churn_probability"] - base_pred["churn_probability"], 4)
        pct_change = round(risk_delta * 100, 2)

        return {
            "baseline_probability": base_pred["churn_probability"],
            "baseline_risk_tier": base_pred["risk_tier"],
            "simulated_probability": sim_pred["churn_probability"],
            "simulated_risk_tier": sim_pred["risk_tier"],
            "risk_delta": risk_delta,
            "percentage_points_change": pct_change,
            "model_version": base_pred["model_version"],
            "disclaimer": (
                "Statistical model simulation under XGBoost decision surface. "
                "Answers what the algorithm predicts for these attributes; "
                "does NOT guarantee real-world causal outcome."
            )
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
