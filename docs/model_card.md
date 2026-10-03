# Model Card: ChurnLens Telco Customer Churn Classifier

## Model Details
- **Model Name:** ChurnLens XGBoost Pipeline
- **Version:** `v1.0.0`
- **Model Type:** Extreme Gradient Boosting Classifier (`XGBClassifier`) wrapped in Scikit-Learn `Pipeline` with `ColumnTransformer`
- **Artifacts:** `models/production/pipeline.joblib`, `models/production/metadata.json`
- **Frameworks:** `scikit-learn 1.9.1`, `xgboost 3.4.1`, `shap 0.52.0`
- **Class Balancing:** `scale_pos_weight = 2.77` (matching negative-to-positive ratio in training data)

## Intended Use
- **Primary Use Case:** Proactive identification of enterprise and consumer telecommunications customers with high attrition probability.
- **Decision Support:** Outputs calibrated churn probabilities ($p \in [0, 1]$), risk tiers (High $\ge 0.60$, Medium $0.35 - 0.60$, Low $< 0.35$), and local TreeSHAP attribution factors to guide customer retention representatives.
- **Out-of-Scope:** Automated customer termination, dynamic contract repricing without human review, credit scoring, or decisions requiring strict causal guarantees.

## Training Data & Methodology
- **Dataset:** IBM Telco Customer Churn (7,043 rows, 33 raw features).
- **Leakage Isolation:** Strict exclusion of post-event and vendor diagnostic features (`Churn Reason`, `Churn Score`, `CLTV`), zero-variance geographical constants (`Count`, `Country`, `State`), and identifiers (`CustomerID`).
- **Data Split:** 80% Stratified Training (5,634 rows), 20% Stratified Holdout Test (1,409 rows), random seed = `42`.
- **Cross-Validation:** 5-Fold Stratified Cross-Validation on the training partition.

## Performance Metrics (Real Evaluation)
| Metric | Stratified 5-Fold CV | Holdout Test (Threshold = 0.50) | Holdout Test (Tuned Threshold = 0.35) |
| :--- | :--- | :--- | :--- |
| **ROC-AUC** | **0.8623 ± 0.0088** | **0.8544** | **0.8544** |
| **PR-AUC (Avg Precision)** | 0.7012 ± 0.0110 | 0.6970 | 0.6970 |
| **Accuracy** | 80.4% | 83.2% | 79.8% |
| **Recall (Sensitivity)** | 81.2% | 72.2% | **84.8%** |
| **Precision** | 58.6% | 67.0% | 57.2% |
| **F1 Score** | 0.680 | 0.695 | **0.683** |
| **Brier Score** | - | 0.128 | 0.128 |

## Limitations & Non-Causal Boundary
1. **Correlation vs. Causality:** SHAP values identify the statistical weight of features within the trained model. They **do not prove** that changing a customer's contract from Month-to-month to Two-year will cause them to stay.
2. **Distribution Shift:** If telecommunications pricing or competitor offerings change significantly, Population Stability Index (PSI) drift monitoring must be checked, and the model retrained.
