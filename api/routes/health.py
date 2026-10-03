import os
from fastapi import APIRouter, Depends
from api.schemas import HealthResponseSchema
from api.dependencies import get_predictor
from src.predict import ChurnPredictor

router = APIRouter(tags=["Health"])

@router.get("/health", response_model=HealthResponseSchema)
def health_check(predictor: ChurnPredictor = Depends(get_predictor)):
    return {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "model_loaded": predictor.pipeline is not None,
        "version": predictor.model_version
    }
