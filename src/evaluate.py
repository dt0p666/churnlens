from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    roc_curve,
    precision_recall_curve
)
from sklearn.calibration import calibration_curve

def evaluate_predictions(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    threshold: float = 0.5
) -> Dict[str, Any]:
    """
    Computes all standard classification and probability metrics.
    """
    y_pred = (y_prob >= threshold).astype(int)
    cm = confusion_matrix(y_true, y_pred)
    tn, fp, fn, tp = cm.ravel()

    metrics = {
        "threshold": float(threshold),
        "accuracy": float(accuracy_score(y_true, y_pred)),
        "precision": float(precision_score(y_true, y_pred, zero_division=0)),
        "recall": float(recall_score(y_true, y_pred, zero_division=0)),
        "f1": float(f1_score(y_true, y_pred, zero_division=0)),
        "roc_auc": float(roc_auc_score(y_true, y_prob)),
        "pr_auc": float(average_precision_score(y_true, y_prob)),
        "brier_score": float(brier_score_loss(y_true, y_prob)),
        "confusion_matrix": {
            "tn": int(tn),
            "fp": int(fp),
            "fn": int(fn),
            "tp": int(tp)
        }
    }
    return metrics

def find_optimal_threshold(
    y_true: np.ndarray,
    y_prob: np.ndarray,
    metric: str = "f1"
) -> Tuple[float, List[Dict[str, Any]]]:
    """
    Sweeps decision threshold from 0.05 to 0.95 to identify optimal operating point.
    """
    thresholds = np.linspace(0.05, 0.95, 19)
    threshold_tradeoffs = []
    best_score = -1.0
    best_threshold = 0.5

    for t in thresholds:
        t = round(float(t), 2)
        y_pred = (y_prob >= t).astype(int)
        p = precision_score(y_true, y_pred, zero_division=0)
        r = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()

        entry = {
            "threshold": t,
            "precision": round(float(p), 4),
            "recall": round(float(r), 4),
            "f1": round(float(f1), 4),
            "tp": int(tp),
            "fp": int(fp),
            "fn": int(fn),
            "tn": int(tn)
        }
        threshold_tradeoffs.append(entry)

        target_score = f1 if metric == "f1" else (2 * p * r / (p + r + 1e-9))
        if target_score > best_score:
            best_score = target_score
            best_threshold = t

    return best_threshold, threshold_tradeoffs

def compute_curve_points(y_true: np.ndarray, y_prob: np.ndarray) -> Dict[str, Any]:
    """
    Computes sampled ROC, PR, and Calibration curves for API and frontend visualization.
    """
    fpr, tpr, _ = roc_curve(y_true, y_prob)
    precision, recall, _ = precision_recall_curve(y_true, y_prob)
    prob_true, prob_pred = calibration_curve(y_true, y_prob, n_bins=10, strategy="uniform")

    # Sample to ~20 points for fast network transfer
    roc_sample_idx = np.linspace(0, len(fpr) - 1, min(25, len(fpr))).astype(int)
    pr_sample_idx = np.linspace(0, len(precision) - 1, min(25, len(precision))).astype(int)

    roc_points = [{"fpr": round(float(fpr[i]), 4), "tpr": round(float(tpr[i]), 4)} for i in roc_sample_idx]
    pr_points = [{"recall": round(float(recall[i]), 4), "precision": round(float(precision[i]), 4)} for i in pr_sample_idx]
    cal_points = [{"prob_pred": round(float(prob_pred[i]), 4), "prob_true": round(float(prob_true[i]), 4)} for i in range(len(prob_true))]

    return {
        "roc_curve": roc_points,
        "pr_curve": pr_points,
        "calibration_curve": cal_points
    }
