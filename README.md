# ChurnLens 🔍
> **"See churn before it becomes a problem."**  
> End-to-end customer churn intelligence platform with calibrated gradient boosting, TreeSHAP interpretability, counterfactual what-if simulation, batch scoring, and PSI drift monitoring.

---

## ⚡ Key Highlights & Benchmark Results
- **Winning Estimator:** XGBoost Classifier (`scale_pos_weight=2.77`, `n_estimators=140`)
- **Stratified 5-Fold CV ROC-AUC:** `0.8622 ± 0.0097` (Leader across Logistic Regression, Random Forest, Gradient Boosting)
- **Holdout Test ROC-AUC:** `0.8551`
- **Holdout PR-AUC:** `0.6691` (Baseline positive prevalence = 26.5%)
- **Optimal Decision Threshold:** `0.45` (F1-score = `0.6381`, Recall = `80.60%` on holdout test set)
- **Zero-Leakage Architecture:** Custom `TelcoFeatureEngineer` and `ColumnTransformer` embedded in scikit-learn `Pipeline`
- **Explainability:** Local TreeSHAP attribution with explicit non-causal disclosures
- **Data & Concept Drift:** Automated Population Stability Index (PSI) monitoring across numerical and categorical features

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
   ├── Vectorized Batch CSV Engine
   ├── PSI Drift Monitoring Engine (`src/monitoring.py`)
   └── Scikit-Learn Pipeline (`models/production/pipeline.joblib`)
         ├── Custom Feature Engineering (`TelcoFeatureEngineer`)
         ├── ColumnTransformer (StandardScaler + OneHotEncoder)
         ├── Calibrated XGBoost Estimator
         └── SHAP TreeExplainer Attribution
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
# Build and run both backend and frontend
docker compose up --build
```
- Frontend UI: `http://localhost:3000`
- FastAPI API: `http://localhost:8000`

### 4. Run Test Suite
```bash
pytest -v tests/
```
All 21 unit and integration tests validate schema verification, feature engineering, pipeline inference, TreeSHAP attributions, REST API endpoints, and Population Stability Index (PSI) drift detection.

---

## 📁 Repository Structure
```
churnproject/
├── data/raw/Telco_customer_churn.csv   # Primary raw dataset
├── src/                                # Reusable production ML modules
│   ├── config.py                       # Typed paths and hyperparameters
│   ├── data_validation.py              # Single and batch schema validation
│   ├── features.py                     # Custom Scikit-Learn feature transformer
│   ├── preprocessing.py                # Zero-leakage ColumnTransformer pipeline
│   ├── train.py                        # 5-fold CV training & model registry
│   ├── evaluate.py                     # Threshold optimization & curve generation
│   ├── predict.py                      # Single & batch inference service
│   ├── explain.py                      # TreeSHAP local attribution engine
│   └── monitoring.py                   # Population Stability Index (PSI) drift engine
├── models/production/                  # Versioned model artifacts, metadata & curves
├── notebooks/01_eda.ipynb              # Exploratory Data Analysis notebook
├── api/                                # FastAPI application, database & routes
├── frontend/                           # React + Vite + Tailwind CSS dashboard
├── tests/                              # Pytest test suite (21 passing tests)
├── .github/workflows/ci.yml            # Automated CI pipeline (Pytest + Vite build)
├── Dockerfile & docker-compose.yml     # Production container orchestration
└── requirements.txt                    # Pinned dependencies
```
