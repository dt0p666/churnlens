# Model Card: ChurnLens Telco Customer Churn Classifier

## Model Details
- **Model Name:** ChurnLens XGBoost Pipeline
- **Version:** `v1.0.0`
- **Model Architecture:** Extreme Gradient Boosting Classifier (`XGBClassifier`, `n_estimators=140`, `scale_pos_weight=2.77`) preceded by zero-leakage `TelcoFeatureEngineer` and `ColumnTransformer` (StandardScaler + OneHotEncoder).
- **Artifacts:** `models/production/pipeline.joblib`, `models/production/metadata.json`, `models/production/calibration_curve.json`.
- **Frameworks:** Python 3.14+, `scikit-learn 1.5+`, `xgboost 2.1+`, `shap 0.46+`.

## Intended Use & Purpose
- **Primary Purpose:** Proactive identification of enterprise and consumer telecommunications customers with high attrition probability.
- **Decision Support:** Provides calibrated churn probabilities ($p \in [0, 1]$), risk tiers (HIGH $\ge 0.60$, MEDIUM $0.35 - 0.5999$, LOW $< 0.35$), local TreeSHAP attribution factors, and cost-optimal threshold recommendations for customer success managers.
- **What the Model Should NOT Be Used For:**
  - Automated unilateral account termination or service throttling.
  - Punitive or predatory dynamic contract repricing without customer consent.
  - Credit scoring, lending underwriting, or regulatory financial decisions.
  - Prescriptive causal policy decisions without A/B retention validation (the model estimates $P(Y \mid X)$, not $P(Y \mid do(X))$).

## Training Data & Leakage Isolation
- **Dataset:** IBM Telco Customer Churn benchmark (7,043 rows, 33 raw features).
- **Leakage Quarantine:** Strictly dropped post-event and vendor diagnostic features: `Churn Reason` (100% target leakage), `Churn Score` ($r=0.665$ vendor score), and `CLTV`. Excluded zero-variance constants (`Count`, `Country`, `State`) and identifiers (`CustomerID`).
- **Data Splits:** 80% Stratified Training (5,634 rows), 20% Stratified Holdout Test (1,409 rows), fixed seed `42`.

## Verified Evaluation Benchmarks (Real Runs)
| Metric | Stratified 5-Fold CV | Holdout Test (Threshold = 0.50) | Holdout Test (Optimal F1 Threshold = 0.45) |
| :--- | :--- | :--- | :--- |
| **ROC-AUC** | **0.8622 ± 0.0097** | **0.8551** | **0.8551** |
| **PR-AUC** | 0.6830 ± 0.0120 | 0.6691 | 0.6691 |
| **Recall** | 80.60% | 79.95% | **83.69%** (313/374 churners captured) |
| **Precision** | 54.32% | 52.55% | 51.57% |
| **F1 Score** | 0.6489 | 0.6341 | **0.6381** |
| **Brier Score** | - | 0.1569 (Raw) | **0.1329** (Calibrated via Sigmoid Platt Scaling) |

## Limitations & Fairness Diagnostics
1. **Public Benchmark Bias:** Trained on static IBM Telco data without real-time clickstream or cellular network QoS logs.
2. **Subgroup Vulnerability:** 2-year contract customers exhibit low base churn prevalence (2.8%), making false positives proportionally more expensive; newly acquired customers (<6 months tenure) show higher prediction variance due to limited historical tenure telemetry.
3. **Distribution Drift:** In production, input features must be continuously monitored using Population Stability Index (PSI) to detect pricing or demographic shifts.
