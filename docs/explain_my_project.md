# ChurnLens: Plain-English Project Walkthrough

---

## ⏱️ The 60-Second Elevator Pitch
> *"I built **ChurnLens**, a production-grade machine learning platform that helps subscription businesses catch customer churn before it happens and take cost-effective action.*
> 
> *Starting from raw IBM Telco data, I designed a zero-leakage scikit-learn pipeline using an XGBoost classifier that achieves **0.862 CV ROC-AUC** and **83.7% recall** at an F1-optimized threshold of **0.45**, outperforming classical linear and random forest baselines.*
> 
> *Instead of stopping at training, I calibrated its probabilities with Platt scaling (reducing the Brier error score from 0.157 to 0.133), added TreeSHAP local explanations, built an interactive What-If counterfactual simulator, and created a cost-optimal decision engine that calculates exact dollar savings based on customer acquisition vs retention costs.*
> 
> *The entire system is deployed via FastAPI with SQLite audit logging, monitored for data drift using Population Stability Index (PSI), covered by 27 automated pytest tests, and packaged into a Docker Compose stack with a bespoke React/Tailwind analytics frontend."*

---

## 🎙️ The 5-Minute Deep-Dive Interview Answer

### 1. The Business Problem & The "Why"
"Most machine learning churn projects on GitHub are simple Jupyter notebooks that train a Random Forest, print an 80% accuracy score, and stop. But in real-world business, accuracy is misleading because churn is imbalanced—roughly 26.5% of customers churn in this dataset. If you simply predict that nobody churns, you get 73.5% accuracy while losing millions in revenue.

Furthermore, false negatives and false positives have asymmetric business costs: missing a churning customer costs ~$500 in lost Customer Lifetime Value, whereas offering an unnecessary discount to a loyal customer only costs ~$50.

My goal with ChurnLens was to build a complete, portfolio-grade ML product that handles the entire lifecycle: from raw data validation and leakage prevention to cost-optimal decision boundaries, calibration, explainability, API design, and drift monitoring."

---

### 2. Data Engineering & Leakage Isolation
"I started with the IBM Telco benchmark (7,043 customer accounts). Before training, I performed a rigorous audit and identified severe target leakage:
- `Churn Reason` is populated 100% of the time when a customer churns and empty otherwise. Leaving it in would give fake 100% test accuracy.
- `Churn Score` was a pre-existing vendor metric that already measured risk.
I quarantined both features immediately.

I also fixed real-world data issues: 11 rows had blank whitespace in `Total Charges`. This happened because their `Tenure` was 0 months (newly joined customers who had never been billed yet). Naive imputation with the column mean would be totally wrong, so I cleaned them to `0.0`.

To guarantee zero data leakage between train and test splits, I engineered all custom transformations—like tenure cohorts and service count aggregators—inside a Scikit-Learn `Pipeline` with `ColumnTransformer`. Scalers and one-hot encoders are fitted strictly inside cross-validation training folds."

---

### 3. Model Benchmark & Calibration
"I evaluated 4 model families using 5-fold Stratified Cross-Validation on the 80% training split:
- **Logistic Regression:** CV ROC-AUC `0.8590`
- **Random Forest:** CV ROC-AUC `0.8613`
- **Gradient Boosting:** CV ROC-AUC `0.8605`
- **XGBoost:** CV ROC-AUC `0.8622 ± 0.0097` (Holdout Test ROC-AUC `0.8551`, PR-AUC `0.6691`)

XGBoost won cleanly across ROC-AUC and PR-AUC. However, gradient boosted trees optimize ranking loss and often output overconfident, uncalibrated probabilities. To fix this, I evaluated Platt sigmoid calibration (`CalibratedClassifierCV`), which dropped the Brier score from **0.1569 down to 0.1329**—a 15.3% reduction in probability error. This means when ChurnLens tells a retention manager a customer has an 80% chance of churning, 8 out of 10 of those customers truly churn."

---

### 4. Threshold Tuning & Business Impact
"Rather than blindly using the default 0.50 threshold, I conducted a threshold sweep from 0.05 to 0.95:
- At threshold 0.50, recall was 79.9%.
- At **threshold 0.45**, recall increased to **83.69%** (intercepting 313 of 374 holdout churners), reaching the peak F1 score of **0.6381**.

I also built a Cost-Optimal Threshold Engine in `src/business.py`. By letting executives plug in their true unit economics (e.g. $500 lost LTV vs $50 retention offer), the algorithm computes the expected business loss curve and picks the exact threshold that maximizes profit, saving thousands of dollars compared to an arbitrary 0.50 cutoff.

For marketing teams with fixed headcount, I added a Retention Planner view: targeting just the top 20% highest-risk customers captures **52.1% of all churners** with a precision of **69.1%**, delivering a **2.6x lift** over random campaigns."

---

### 5. Explainability & The Counterfactual Simulator
"For individual predictions, ChurnLens runs TreeSHAP to compute local feature attributions, rendering a diverging bar chart showing which factors push risk up (e.g. Month-to-month contracts, fiber optic pricing) and which factors protect the customer (e.g. long tenure, online security).

I also built an interactive What-If Simulator with synchronized radial gauges. However, I made sure to add a prominent disclaimer that this is a **statistical model simulation, not a causal prediction**. The model shows conditional probability $P(Y \mid X)$, but in the real world, forcing customers onto contracts without randomized control trials (A/B testing) could trigger complaints or immediate cancellations."

---

### 6. Production API, Drift Monitoring & Containerization
"Finally, I engineered the production serving layer:
- **FastAPI backend** with Pydantic v2 schemas and SQLite/PostgreSQL audit logging (`churnlens.db`). Every prediction logs a UUID, timestamp, model version, and feature vector.
- **Batch CSV processing** that validates rows, quarantines corrupted records with diagnostics, and streams back scored CSVs.
- **Population Stability Index (PSI) drift engine** (`src/monitoring.py`). Because real churn labels take 30-90 days to mature, you cannot monitor accuracy in real-time. Tracking covariate PSI alerts engineers immediately if customer pricing or demographic distributions drift.
- **Production containerization:** A multi-stage Dockerfile and Docker Compose configuration running both FastAPI and a custom React + Vite frontend.
- **Test suite:** 27 passing automated pytest tests verifying schema validation, zero-leakage, calibration, and REST endpoints."

---

## 🎯 Summary
"ChurnLens proves that I understand the full machine learning lifecycle: data validation, zero-leakage preprocessing, rigorous cross-validation, probability calibration, business loss optimization, TreeSHAP interpretability, REST APIs, production monitoring, and containerized deployment."
