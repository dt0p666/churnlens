import json
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session

from api.schemas import CustomerProfileSchema, PredictionResponseSchema
from api.dependencies import get_predictor, get_explainer, get_db
from api.database import PredictionAuditLog
from src.predict import ChurnPredictor
from src.explain import ChurnExplainer

router = APIRouter(tags=["Prediction"])

@router.post("/predict", response_model=PredictionResponseSchema)
def predict_churn(
    profile: CustomerProfileSchema,
    threshold: Optional[float] = Query(None, ge=0.01, le=0.99),
    include_explanation: bool = Query(True),
    predictor: ChurnPredictor = Depends(get_predictor),
    explainer: ChurnExplainer = Depends(get_explainer),
    db: Session = Depends(get_db)
):
    try:
        # Convert Pydantic model to dict matching dataset column names
        data_dict = profile.model_dump(by_alias=True)
        pred_result = predictor.predict_single(data_dict, custom_threshold=threshold)

        explanation = None
        if include_explanation:
            explanation = explainer.explain_instance(data_dict)

        # Audit Log in DB
        request_id = str(uuid.uuid4())
        audit_entry = PredictionAuditLog(
            request_id=request_id,
            model_version=pred_result["model_version"],
            churn_probability=pred_result["churn_probability"],
            churn_prediction=pred_result["churn_prediction"],
            risk_tier=pred_result["risk_tier"],
            decision_threshold=pred_result["decision_threshold"],
            features_json=json.dumps(data_dict)
        )
        db.add(audit_entry)
        db.commit()

        return {
            **pred_result,
            "explanation": explanation
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
