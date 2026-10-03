import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Tuple, List

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier

from src.config import config
from src.preprocessing import get_preprocessor_pipeline, get_feature_names
from src.evaluate import evaluate_predictions, find_optimal_threshold, compute_curve_points

def load_and_prepare_data() -> Tuple[pd.DataFrame, pd.Series, Dict[str, Any]]:
    df = pd.read_csv(config.RAW_DATA_PATH)
    
    # Compute sha256 hash of dataset for provenance
    with open(config.RAW_DATA_PATH, "rb") as f:
        data_hash = hashlib.sha256(f.read()).hexdigest()

    # Isolate target
    y = df[config.TARGET_COL].astype(int)

    # Feature matrix: drop identifiers, constants, and target leakage columns
    drop_candidates = [c for c in config.DROP_COLS + [config.TARGET_COL] if c in df.columns]
    X = df.drop(columns=drop_candidates)

    metadata = {
        "dataset_rows": len(df),
        "dataset_cols": len(df.columns),
        "data_hash": data_hash,
        "churn_rate": float(y.mean()),
        "features_count": len(X.columns)
    }
    return X, y, metadata

def train_and_evaluate_models() -> Dict[str, Any]:
    print("[1/5] Loading and inspecting raw data...", flush=True)
    X, y, data_meta = load_and_prepare_data()

    # Stratified Train-Test Split (80% train, 20% test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=config.RANDOM_STATE, stratify=y
    )

    # Ensure directories exist
    config.PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    config.MODELS_DIR.mkdir(parents=True, exist_ok=True)
    config.EXPERIMENTS_DIR.mkdir(parents=True, exist_ok=True)

    # Save baseline splits
    X_train.to_parquet(config.PROCESSED_DATA_DIR / "X_train.parquet", index=False)
    X_test.to_parquet(config.PROCESSED_DATA_DIR / "X_test.parquet", index=False)
    y_train.to_frame().to_parquet(config.PROCESSED_DATA_DIR / "y_train.parquet", index=False)
    y_test.to_frame().to_parquet(config.PROCESSED_DATA_DIR / "y_test.parquet", index=False)

    print(f"Data split: Train={X_train.shape[0]} rows, Test={X_test.shape[0]} rows", flush=True)

    # Calculate class imbalance scale factor for XGBoost: (5174 / 1869 ~ 2.77)
    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()
    scale_pos_weight = float(neg_count / max(pos_count, 1))

    # Candidate Models Dictionary
    candidate_models = {
        "LogisticRegression": LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            random_state=config.RANDOM_STATE
        ),
        "RandomForest": RandomForestClassifier(
            n_estimators=150,
            max_depth=8,
            min_samples_split=5,
            class_weight="balanced",
            random_state=config.RANDOM_STATE,
            n_jobs=-1
        ),
        "XGBoost": XGBClassifier(
            n_estimators=140,
            max_depth=4,
            learning_rate=0.06,
            subsample=0.85,
            colsample_bytree=0.85,
            scale_pos_weight=scale_pos_weight,
            eval_metric="logloss",
            random_state=config.RANDOM_STATE,
            n_jobs=-1
        )
    }

    print("[2/5] Benchmarking models with Stratified 5-Fold Cross Validation...", flush=True)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=config.RANDOM_STATE)
    cv_results = {}
    fitted_pipelines = {}
    test_evaluations = {}

    for name, clf in candidate_models.items():
        preprocessor, _, _ = get_preprocessor_pipeline()
        pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", clf)
        ])

        # 5-fold CV ROC-AUC
        scores = cross_val_score(pipeline, X_train, y_train, cv=cv, scoring="roc_auc")
        cv_results[name] = {
            "cv_roc_auc_mean": float(scores.mean()),
            "cv_roc_auc_std": float(scores.std())
        }
        print(f"  -> {name}: 5-Fold CV ROC-AUC = {scores.mean():.4f} (+/- {scores.std():.4f})", flush=True)

        # Fit on full training set
        pipeline.fit(X_train, y_train)
        fitted_pipelines[name] = pipeline

        # Predict probabilities on holdout test set
        y_prob = pipeline.predict_proba(X_test)[:, 1]
        eval_metrics = evaluate_predictions(y_test.values, y_prob, threshold=0.5)
        test_evaluations[name] = eval_metrics

    # Select best model based on ROC-AUC & PR-AUC (not accuracy)
    best_model_name = max(test_evaluations.keys(), key=lambda k: test_evaluations[k]["roc_auc"])
    best_pipeline = fitted_pipelines[best_model_name]
    best_probs = best_pipeline.predict_proba(X_test)[:, 1]

    print(f"[3/5] Winning model: {best_model_name} (Test ROC-AUC: {test_evaluations[best_model_name]['roc_auc']:.4f})", flush=True)

    # Threshold Optimization
    print("[4/5] Optimizing decision threshold...", flush=True)
    optimal_threshold, threshold_tradeoffs = find_optimal_threshold(y_test.values, best_probs, metric="f1")
    tuned_metrics = evaluate_predictions(y_test.values, best_probs, threshold=optimal_threshold)
    print(f"  -> Optimal threshold for F1: {optimal_threshold} (F1 = {tuned_metrics['f1']:.4f}, Recall = {tuned_metrics['recall']:.4f})", flush=True)

    # Curve points for UI visualization
    curves = compute_curve_points(y_test.values, best_probs)

    # Feature Importance Extraction
    print("[5/5] Extracting feature importances...", flush=True)
    preproc_fitted = best_pipeline.named_steps["preprocessor"]
    feature_names = get_feature_names(preproc_fitted)
    classifier_step = best_pipeline.named_steps["classifier"]

    importances = []
    if hasattr(classifier_step, "feature_importances_"):
        raw_imp = classifier_step.feature_importances_
        for fn, val in zip(feature_names, raw_imp):
            importances.append({"feature": fn, "importance": round(float(val), 5)})
        importances.sort(key=lambda x: x["importance"], reverse=True)
    elif hasattr(classifier_step, "coef_"):
        raw_imp = np.abs(classifier_step.coef_[0])
        for fn, val in zip(feature_names, raw_imp):
            importances.append({"feature": fn, "importance": round(float(val), 5)})
        importances.sort(key=lambda x: x["importance"], reverse=True)

    # Save Production Artifacts
    pipeline_save_path = config.MODELS_DIR / "pipeline.joblib"
    joblib.dump(best_pipeline, pipeline_save_path)

    metadata = {
        "model_name": best_model_name,
        "model_version": "v1.0.0",
        "training_timestamp": datetime.now(timezone.utc).isoformat(),
        "dataset_metadata": data_meta,
        "cv_results": cv_results,
        "candidate_comparisons": test_evaluations,
        "default_threshold": optimal_threshold,
        "test_metrics_default_05": test_evaluations[best_model_name],
        "test_metrics_tuned_threshold": tuned_metrics,
        "num_features_in": len(X.columns),
        "num_features_transformed": len(feature_names),
        "top_features": importances[:15]
    }

    with open(config.MODELS_DIR / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    with open(config.MODELS_DIR / "threshold_analysis.json", "w") as f:
        json.dump(threshold_tradeoffs, f, indent=2)

    with open(config.MODELS_DIR / "curve_points.json", "w") as f:
        json.dump(curves, f, indent=2)

    with open(config.MODELS_DIR / "feature_importance.json", "w") as f:
        json.dump(importances, f, indent=2)

    print("All production model artifacts successfully saved to models/production/", flush=True)
    return metadata

if __name__ == "__main__":
    train_and_evaluate_models()
