import json
from fastapi import APIRouter
from src.config import config

router = APIRouter(prefix="/model", tags=["Model"])

@router.get("/info")
def get_model_info():
    meta_path = config.MODELS_DIR / "metadata.json"
    curves_path = config.MODELS_DIR / "curve_points.json"
    thresholds_path = config.MODELS_DIR / "threshold_analysis.json"
    imp_path = config.MODELS_DIR / "feature_importance.json"
    cal_path = config.MODELS_DIR / "calibration_curve.json"

    metadata = json.load(open(meta_path)) if meta_path.exists() else {}
    curves = json.load(open(curves_path)) if curves_path.exists() else {}
    thresholds = json.load(open(thresholds_path)) if thresholds_path.exists() else []
    importances = json.load(open(imp_path)) if imp_path.exists() else []
    calibration = json.load(open(cal_path)) if cal_path.exists() else {}

    return {
        "metadata": metadata,
        "curves": curves,
        "thresholds": thresholds,
        "feature_importances": importances,
        "calibration": calibration
    }
