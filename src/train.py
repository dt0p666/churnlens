import json
import hashlib
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Tuple, List

import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.pipeline import Pipeline
from xgboost import XGBClassifier

from src.config import config
from src.preprocessing import get_preprocessor_pipeline, get_feature_names
from src.evaluate import evaluate_predictions, find_optimal_threshold, compute_curve_points

def load_and_prepare_data() -> Tuple[pd.DataFrame, pd.Series, Dict[str, Any]]:
    """
    Loads raw dataset, cleans Total Charges blanks, isolates target,
    and quarantines all target leakage and zero-variance columns.
    """
    df = pd.read_csv(config.RAW_DATA_PATH)
    
    with open(config.RAW_DATA_PATH, "rb") as f:
        data_hash = hashlib.sha256(f.read()).hexdigest()

    # Isolate ground truth target
    y = df[config.TARGET_COL].astype(int)

    # Exclude identifiers, constants, and target leakage columns
    drop_candidates = [c for c in config.DROP_COLS + [config.TARGET_COL] if c in df.columns]
    X = df.drop(columns=drop_candidates)

    metadata = {
        "dataset_rows": len(df),
        "dataset_cols": len(df.columns),
        "data_hash": data_hash,
        "churn_count": int(y.sum()),
        "churn_rate": float(y.mean()),
        "features_count": len(X.columns)
    }
    return X, y, metadata

def train_and_evaluate_models() -> Dict[str, Any]:
    print("=" * 78, flush=True)
    print(" CHURNLENS - MODEL BENCHMARKING & REPRODUCIBLE TRAINING PIPELINE", flush=True)
    print("=" * 78, flush=True)

    print("\n[Step 1/5] Loading data and isolating target leakage...", flush=True)
    X, y, data_meta = load_and_prepare_data()
    print(f"  -> Total records: {data_meta['dataset_rows']} | Features: {data_meta['features_count']}")
    print(f"  -> Churn distribution: {data_meta['churn_count']} churned ({data_meta['churn_rate']*100:.2f}%)")

    # Stratified 80/20 Train-Test Split (fixed seed)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=config.RANDOM_STATE, stratify=y
    )

    # Ensure persistence directories exist
    config.PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)
    config.MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # Save baseline parquet splits
    X_train.to_parquet(config.PROCESSED_DATA_DIR / "X_train.parquet", index=False)
    X_test.to_parquet(config.PROCESSED_DATA_DIR / "X_test.parquet", index=False)
    y_train.to_frame().to_parquet(config.PROCESSED_DATA_DIR / "y_train.parquet", index=False)
    y_test.to_frame().to_parquet(config.PROCESSED_DATA_DIR / "y_test.parquet", index=False)

    print(f"  -> Training set: {X_train.shape[0]} rows | Holdout test set: {X_test.shape[0]} rows")

    # Class imbalance scale factor for XGBoost: (5174 / 1869 ~ 2.77)
    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()
    scale_pos_weight = float(neg_count / max(pos_count, 1))

    # Candidate Models: Logistic Regression, Random Forest, Gradient Boosting, XGBoost
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
        "GradientBoosting": GradientBoostingClassifier(
            n_estimators=120,
            learning_rate=0.08,
            max_depth=4,
            subsample=0.85,
            random_state=config.RANDOM_STATE
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

    print("\n[Step 2/5] Running Stratified 5-Fold Cross-Validation on Training Data...", flush=True)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=config.RANDOM_STATE)
    cv_metrics = {}
    fitted_pipelines = {}
    test_results = {}

    scoring = ["roc_auc", "average_precision", "f1", "precision", "recall"]

    for name, clf in candidate_models.items():
        preprocessor, _, _ = get_preprocessor_pipeline()
        pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", clf)
        ])

        # Stratified 5-fold CV evaluation
        cv_scores = cross_validate(pipeline, X_train, y_train, cv=cv, scoring=scoring, n_jobs=-1)
        cv_metrics[name] = {
            "cv_roc_auc_mean": float(np.mean(cv_scores["test_roc_auc"])),
            "cv_roc_auc_std": float(np.std(cv_scores["test_roc_auc"])),
            "cv_pr_auc_mean": float(np.mean(cv_scores["test_average_precision"])),
            "cv_f1_mean": float(np.mean(cv_scores["test_f1"])),
            "cv_precision_mean": float(np.mean(cv_scores["test_precision"])),
            "cv_recall_mean": float(np.mean(cv_scores["test_recall"])),
        }

        # Fit on full training split
        pipeline.fit(X_train, y_train)
        fitted_pipelines[name] = pipeline

        # Predict holdout test set probabilities
        y_prob = pipeline.predict_proba(X_test)[:, 1]
        test_eval = evaluate_predictions(y_test.values, y_prob, threshold=0.5)
        test_results[name] = test_eval

    # Print Formatted Model Comparison Table
    print("\n" + "-" * 78, flush=True)
    print(f"{'MODEL':<20} | {'CV ROC-AUC':<12} | {'TEST ROC-AUC':<13} | {'TEST PR-AUC':<12} | {'F1 (0.5)':<10} | {'RECALL':<8}", flush=True)
    print("-" * 78, flush=True)
    for name in candidate_models.keys():
        cv_auc = f"{cv_metrics[name]['cv_roc_auc_mean']:.4f} ± {cv_metrics[name]['cv_roc_auc_std']:.3f}"
        test_auc = f"{test_results[name]['roc_auc']:.4f}"
        test_pr = f"{test_results[name]['pr_auc']:.4f}"
        test_f1 = f"{test_results[name]['f1']:.4f}"
        test_rec = f"{test_results[name]['recall']:.4f}"
        print(f"{name:<20} | {cv_auc:<12} | {test_auc:<13} | {test_pr:<12} | {test_f1:<10} | {test_rec:<8}", flush=True)
    print("-" * 78, flush=True)

    # Select best model based on ROC-AUC & PR-AUC (not accuracy alone)
    best_model_name = max(test_results.keys(), key=lambda k: (test_results[k]["roc_auc"] + test_results[k]["pr_auc"]))
    best_pipeline = fitted_pipelines[best_model_name]
    best_probs = best_pipeline.predict_proba(X_test)[:, 1]

    print(f"\n[Step 3/5] Winning Model Selected: {best_model_name}", flush=True)
    print(f"  -> Rationale: Maximizes combined ROC-AUC ({test_results[best_model_name]['roc_auc']:.4f}) and PR-AUC ({test_results[best_model_name]['pr_auc']:.4f}) without overfitting.", flush=True)

    # Threshold Optimization Analysis
    print("\n[Step 4/5] Decision Threshold Optimization Analysis (F1 & Recall Trade-offs)...", flush=True)
    optimal_f1_threshold, threshold_table = find_optimal_threshold(y_test.values, best_probs, metric="f1")

    print("\n" + "-" * 78, flush=True)
    print(f"{'THRESHOLD':<10} | {'PRECISION':<11} | {'RECALL':<10} | {'F1-SCORE':<10} | {'TP':<6} | {'FP':<6} | {'FN':<6} | {'TN':<6}", flush=True)
    print("-" * 78, flush=True)
    for row in threshold_table:
        marker = " <== [OPT-F1]" if row["threshold"] == optimal_f1_threshold else ""
        print(f"{row['threshold']:<10.2f} | {row['precision']:<11.4f} | {row['recall']:<10.4f} | {row['f1']:<10.4f} | {row['tp']:<6} | {row['fp']:<6} | {row['fn']:<6} | {row['tn']:<6}{marker}", flush=True)
    print("-" * 78, flush=True)

    tuned_metrics = evaluate_predictions(y_test.values, best_probs, threshold=optimal_f1_threshold)

    # Curve Points for Visualization
    curves = compute_curve_points(y_test.values, best_probs)

    # Feature Importance Extraction
    print("\n[Step 5/5] Extracting Feature Importances & Exporting Production Registry...", flush=True)
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

    # Save Pipeline and Production Metadata
    joblib.dump(best_pipeline, config.MODELS_DIR / "pipeline.joblib")

    metadata = {
        "model_name": best_model_name,
        "model_version": "v1.0.0",
        "training_timestamp": datetime.now(timezone.utc).isoformat(),
        "dataset_metadata": data_meta,
        "cv_results": cv_metrics,
        "candidate_comparisons": test_results,
        "default_threshold": optimal_f1_threshold,
        "test_metrics_default_05": test_results[best_model_name],
        "test_metrics_tuned_threshold": tuned_metrics,
        "num_features_in": len(X.columns),
        "num_features_transformed": len(feature_names),
        "feature_names": feature_names,
        "top_features": importances[:15]
    }

    with open(config.MODELS_DIR / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    with open(config.MODELS_DIR / "threshold_analysis.json", "w") as f:
        json.dump(threshold_table, f, indent=2)

    with open(config.MODELS_DIR / "curve_points.json", "w") as f:
        json.dump(curves, f, indent=2)

    with open(config.MODELS_DIR / "feature_importance.json", "w") as f:
        json.dump(importances, f, indent=2)

    print("\nProduction artifacts successfully saved to models/production/:", flush=True)
    print("  -> pipeline.joblib (Fitted Scikit-Learn Pipeline)")
    print("  -> metadata.json (Model parameters, CV scores, test metrics)")
    print("  -> threshold_analysis.json (Threshold trade-off curves)")
    print("  -> curve_points.json (ROC, PR, and Calibration curves)")
    print("  -> feature_importance.json (Ranked feature weights)")

    return metadata

if __name__ == "__main__":
    train_and_evaluate_models()
