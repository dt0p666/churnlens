# ChurnLens 🔍
> **"See churn before it becomes a problem."**  
> End-to-end customer churn intelligence platform with calibrated gradient boosting, TreeSHAP interpretability, counterfactual what-if simulation, and batch scoring.

---

## ⚡ Key Highlights & Benchmark Results
- **Winning Estimator:** XGBoost Classifier (`scale_pos_weight=2.77`, `n_estimators=140`)
- **Stratified 5-Fold CV ROC-AUC:** `0.8623 ± 0.0088`
- **Holdout Test ROC-AUC:** `0.8544`
- **Holdout PR-AUC:** `0.6970` (Baseline prevalence = 26.5%)
- **Zero-Leakage Architecture:** Scikit-Learn `ColumnTransformer` embedded in `Pipeline`
- **Explainability:** Local TreeSHAP attribution with explicit non-causal disclosures

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
   └── Scikit-Learn Pipeline (`pipeline.joblib`)
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
API Documentation will be available at: `http://localhost:8000/docs`

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Dashboard will open at: `http://localhost:5173`

### 3. Run Test Suite
```bash
pytest -v tests/
```

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
├── tests/                              # Pytest test suite (13 passing tests)
├── docs/                               # Model card & interview Q&As
├── Dockerfile & docker-compose.yml     # Production container orchestration
└── requirements.txt                    # Pinned dependencies
```
