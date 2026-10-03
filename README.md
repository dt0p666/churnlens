# ChurnLens 🔍
> **"See churn before it becomes a problem."**  
> End-to-end customer churn intelligence platform with calibrated gradient boosting, TreeSHAP interpretability, cost-optimal decision boundaries, counterfactual simulation, batch scoring, and PSI drift monitoring.

---

## ⚡ Key Highlights & Benchmark Results (Real Runs)
- **Winning Estimator:** XGBoost Classifier (`scale_pos_weight=2.77`, `n_estimators=140`)
- **Stratified 5-Fold CV ROC-AUC:** `0.8622 ± 0.0097` (Outperformed Logistic Regression, Random Forest, Gradient Boosting)
- **Holdout Test ROC-AUC:** `0.8551` | **Holdout Test PR-AUC:** `0.6691` (Baseline positive prevalence = 26.5%)
- **Optimal Decision Threshold:** `0.45` (F1-score = `0.6381`, Recall = `83.69%` capturing 313 of 374 holdout churners)
- **Probability Calibration:** Platt scaling (`CalibratedClassifierCV`) reduced Brier score from `0.1569` to `0.1329` (15.3% error reduction)
- **Zero-Leakage Architecture:** Custom `TelcoFeatureEngineer` and `ColumnTransformer` embedded inside scikit-learn `Pipeline`
- **Cost-Optimal Thresholding:** Computes expected loss curves from user unit economics ($500 lost LTV vs $50 retention offer)
- **Drift Monitoring:** Population Stability Index (PSI) tracking across numerical and categorical features with live simulation mode

---

## 📊 Cross-Validation & Test Benchmarks

| Estimator Pipeline | 5-Fold CV ROC-AUC | Test ROC-AUC | Test PR-AUC | Test Recall (0.50) | Test F1 (0.50) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **XGBoost (Winner)** | **0.8622 ± 0.0097** | **0.8551** | **0.6691** | **79.95%** | **0.6341** |
| Random Forest | 0.8613 ± 0.0093 | 0.8514 | 0.6622 | 79.41% | 0.6360 |
| Gradient Boosting | 0.8605 ± 0.0085 | 0.8522 | 0.6630 | 53.48% | 0.5926 |
| Logistic Regression | 0.8590 ± 0.0120 | 0.8493 | 0.6461 | 79.14% | 0.6271 |
| *Dummy Majority Baseline* | 0.5000 | 0.5000 | 0.2654 | 0.00% | 0.0000 |

*Optimal Threshold Operating Point for XGBoost:* At threshold **0.45**, Recall increases to **83.69%** (313/374 churners intercepted) with F1 peaking at **0.6381**.

---

## 🏗️ Architecture

```
User (Browser)
   │
   ▼
React 18 + Vite (Tailwind CSS, Lucide, Recharts)
   │  [HTTP REST / JSON]
   ▼
FastAPI Backend (Pydantic v2 validation)
   ├── SQLite / PostgreSQL (Audit Logging via SQLAlchemy 2.0)
   ├── Vectorized Batch CSV Engine (`api/routes/batch.py`)
   ├── Cost Optimizer & Retention Planner (`src/business.py`)
   ├── PSI Drift Monitoring Engine (`src/monitoring.py`)
   └── Scikit-Learn Pipeline (`models/production/pipeline.joblib`)
         ├── Custom Feature Engineering (`TelcoFeatureEngineer`)
         ├── ColumnTransformer (StandardScaler + OneHotEncoder)
         ├── Calibrated XGBoost Estimator (`src/calibration.py`)
         └── SHAP TreeExplainer Attribution (`src/explain.py`)
```

---

## 🚀 Quickstart

### 1. Backend Setup & Model Training
```bash
# Activate virtual environment
.venv\Scripts\activate   # Windows
# source .venv/bin/activate # Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Train models, run cross-validation, and export production artifacts
python -m src.train

# Run probability calibration evaluation
python -m src.calibration

# Start FastAPI server
uvicorn api.main:app --reload --port 8000
```
Interactive Swagger API Documentation: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Dashboard available at: `http://localhost:5173`

### 3. Docker Deployment
```bash
# Build and run both backend and frontend services
docker compose up --build
```
- Frontend UI: `http://localhost:3000`
- FastAPI API: `http://localhost:8000`

### 4. Run Test Suite
```bash
pytest -v tests/
```
All **27 unit and integration tests** validate schema verification, zero-leakage pipeline fit, probability calibration, cost optimization math, TreeSHAP attributions, REST API endpoints, and Population Stability Index (PSI) drift detection.

---

## ⚠️ Real Limitations & Honest Boundaries
1. **Public Static Benchmark:** The IBM Telco dataset contains 7,043 static rows. Real enterprise telecommunications operators process millions of records with high-frequency temporal CDR (Call Detail Record) event streams and cellular tower QoS telemetry.
2. **Correlation vs. Causality:** TreeSHAP attributions measure statistical model sensitivity ($P(Y \mid X)$), not physical intervention causality ($P(Y \mid do(X))$). Offering a customer a 2-year contract or discount does not mathematically guarantee retention without randomized controlled trials (A/B testing).
3. **Delayed Ground Truth:** In production churn modeling, true labels do not arrive until the billing cycle terminates 30 to 90 days later. This makes input covariate drift tracking (PSI) essential, as real-time accuracy cannot be directly calculated on live traffic.

---

## 🔮 Future Work & Production Scaling
- **Distributed Training:** Migrate pipeline to Ray Train or Spark MLlib for 10M+ customer datasets.
- **Asynchronous Task Queue:** Transition batch scoring to Celery / Redis or Apache Kafka streaming.
- **Feature Store:** Centralize real-time and offline features via Feast to avoid serving skew.
- **Automated Retraining:** Trigger scheduled Airflow / Prefect pipelines when PSI alerts exceed $\ge 0.20$.
