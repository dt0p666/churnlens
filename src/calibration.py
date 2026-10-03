"""
ChurnLens Probability Calibration Engine.
Evaluates reliability curves and Brier scores for the production model,
comparing uncalibrated vs CalibratedClassifierCV (isotonic / sigmoid).
"""

import json
from pathlib import Path
from typing import Dict, Any, Tuple
import numpy as np
import pandas as pd
from sklearn.calibration import calibration_curve, CalibratedClassifierCV
from sklearn.metrics import brier_score_loss
from sklearn.model_selection import train_test_split
import joblib

from src.config import config

def evaluate_calibration(
    y_test: np.ndarray,
    uncalibrated_probs: np.ndarray,
    calibrated_probs: np.ndarray,
    n_bins: int = 10
) -> Dict[str, Any]:
    """
    Computes calibration curve coordinates and Brier scores for uncalibrated and calibrated models.
    """
    brier_uncal = float(brier_score_loss(y_test, uncalibrated_probs))
    brier_cal = float(brier_score_loss(y_test, calibrated_probs))

    prob_true_uncal, prob_pred_uncal = calibration_curve(
        y_test, uncalibrated_probs, n_bins=n_bins, strategy="uniform"
    )
    prob_true_cal, prob_pred_cal = calibration_curve(
        y_test, calibrated_probs, n_bins=n_bins, strategy="uniform"
    )

    uncal_points = [
        {"pred": round(float(p), 4), "actual": round(float(a), 4)}
        for p, a in zip(prob_pred_uncal, prob_true_uncal)
    ]
    cal_points = [
        {"pred": round(float(p), 4), "actual": round(float(a), 4)}
        for p, a in zip(prob_pred_cal, prob_true_cal)
    ]

    # Pick whichever achieves lower Brier score
    improvement = brier_uncal - brier_cal
    chosen = "calibrated" if brier_cal < brier_uncal else "uncalibrated"

    return {
        "brier_score_uncalibrated": round(brier_uncal, 4),
        "brier_score_calibrated": round(brier_cal, 4),
        "brier_improvement": round(improvement, 4),
        "recommended_model": chosen,
        "calibration_rationale": (
            f"Calibrated model achieved Brier score of {brier_cal:.4f} vs {brier_uncal:.4f} uncalibrated. "
            f"{'Calibration improves posterior probability reliability for risk-based decisions.' if brier_cal < brier_uncal else 'Uncalibrated tree ensemble already shows well-aligned probabilities.'}"
        ),
        "uncalibrated_curve": uncal_points,
        "calibrated_curve": cal_points,
        "perfect_line": [{"pred": i / 10, "actual": i / 10} for i in range(11)]
    }

def run_calibration_study(save_artifacts: bool = True) -> Dict[str, Any]:
    """
    Loads raw dataset and trained pipeline, fits CalibratedClassifierCV on training split,
    evaluates on test split, and exports calibration_curve.json to models/production/.
    """
    from src.train import load_and_prepare_data

    X, y, _ = load_and_prepare_data()
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=config.RANDOM_STATE, stratify=y
    )

    pipeline_path = config.MODELS_DIR / "pipeline.joblib"
    if not pipeline_path.exists():
        raise FileNotFoundError(f"Pipeline not found at {pipeline_path}. Run 'python -m src.train' first.")

    pipeline = joblib.load(pipeline_path)

    # Predictions from current pipeline
    uncal_probs = pipeline.predict_proba(X_test)[:, 1]

    # Pre-transform training and test features for calibration fit
    preprocessor = pipeline.named_steps["preprocessor"]
    classifier = pipeline.named_steps["classifier"]

    X_train_trans = preprocessor.transform(X_train)
    X_test_trans = preprocessor.transform(X_test)

    # Fit Sigmoid / Platt calibration over 5-fold CV on training data
    calibrator = CalibratedClassifierCV(estimator=classifier, method="sigmoid", cv=5)
    calibrator.fit(X_train_trans, y_train)

    cal_probs = calibrator.predict_proba(X_test_trans)[:, 1]

    results = evaluate_calibration(y_test.values, uncal_probs, cal_probs)

    if save_artifacts:
        config.MODELS_DIR.mkdir(parents=True, exist_ok=True)
        out_path = config.MODELS_DIR / "calibration_curve.json"
        with open(out_path, "w") as f:
            json.dump(results, f, indent=2)
        print(f"[Calibration] Saved calibration study to: {out_path}")

    return results

if __name__ == "__main__":
    res = run_calibration_study(save_artifacts=True)
    print(f"Uncalibrated Brier Score: {res['brier_score_uncalibrated']}")
    print(f"Calibrated Brier Score:   {res['brier_score_calibrated']}")
    print(f"Recommendation:          {res['recommended_model']}")
