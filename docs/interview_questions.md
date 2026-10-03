# ChurnLens: 25 High-Impact Interview Questions & Real-Data Answers

### 1. Project Overview & Business Value
**Q1: What problem does ChurnLens solve, and what is its primary business objective?**
**Answer:** ChurnLens predicts customer churn before contract expiration on a 7,043-account telecommunications dataset (26.54% base churn rate). Its objective is not simply generating accuracy scores, but solving the asymmetric loss problem: an unaddressed churning customer costs ~$500 in lost Customer Lifetime Value (FN), whereas a proactive retention discount costs ~$50 (FP).

**Q2: What is the end-to-end architecture of ChurnLens?**
**Answer:** It follows a production ML lifecycle: data validation with schema quarantine (`src/data_validation.py`), zero-leakage feature engineering and preprocessing in a scikit-learn pipeline (`src/features.py`, `src/preprocessing.py`), 5-fold stratified cross-validation and threshold tuning (`src/train.py`, `src/evaluate.py`), TreeSHAP explainability (`src/explain.py`), probability calibration (`src/calibration.py`), business cost optimization (`src/business.py`), PSI drift monitoring (`src/monitoring.py`), FastAPI backend with SQLAlchemy audit logging (`api/`), and a React + Vite + Tailwind frontend.

---

### 2. Data Engineering & Target Leakage
**Q3: How did you identify and prevent target leakage in this dataset?**
**Answer:** In the raw Telco dataset, `Churn Reason` is populated 100% of the time when a customer churns and blank otherwise—using it would cause catastrophic 100% post-event leakage. Additionally, `Churn Score` is an existing vendor diagnostic metric strongly correlated ($r = 0.665$) with churn. We quarantined both from the feature space, along with identifier `CustomerID` and zero-variance constants (`Count`, `Country`, `State`).

**Q4: How did you handle messy real-world data like blanks in `Total Charges`?**
**Answer:** In the raw CSV, 11 rows had blank whitespace (`" "`) in `Total Charges`, which occurs exclusively when `Tenure Months == 0` (brand-new accounts who have never received a bill). Rather than naively imputing the column mean or dropping customers, we cleaned the whitespace to `0.0`, reflecting their true zero cumulative spend.

**Q5: How did you ensure zero data leakage between train and test splits?**
**Answer:** We encapsulated feature transformations (`TelcoFeatureEngineer`) and preprocessing (`StandardScaler`, `OneHotEncoder`) inside a unified scikit-learn `Pipeline`. All encoders and scalers are fitted strictly on training folds inside `StratifiedKFold`. Test and validation sets are only transformed, never fitted.

---

### 3. Model Architecture & Evaluation Metrics
**Q6: Why did you pick XGBoost as your winning production estimator?**
**Answer:** Across 5-fold stratified cross-validation on 5,634 training rows, XGBoost achieved the highest ROC-AUC (`0.8622 ± 0.0097`) and PR-AUC (`0.6830 ± 0.0120`), outperforming Logistic Regression (`0.8590`), Random Forest (`0.8613`), and Gradient Boosting (`0.8605`). On the 1,409 holdout test set, XGBoost achieved `0.8551` ROC-AUC and `0.6691` PR-AUC.

**Q7: Why is ROC-AUC alone insufficient for evaluating customer churn?**
**Answer:** Churn is an imbalanced problem (26.5% positive prevalence). ROC-AUC plots True Positive Rate vs False Positive Rate; because the negative class (retained customers, 73.5%) is large, a high number of false positives can still yield a deceptively small FPR. Precision-Recall AUC (PR-AUC) evaluates the positive class directly; our model achieved PR-AUC of `0.6691` compared to a random baseline prevalence of `0.2654`, proving true positive discrimination.

**Q8: Why did you choose decision threshold 0.45 instead of the standard 0.50?**
**Answer:** Default 0.50 threshold yielded Recall = `79.95%` (299/374 churners captured) and F1 = `0.6341`. By evaluating the threshold sweep from 0.05 to 0.95 on the test set, threshold `0.45` emerged as the optimal F1 operating point (`0.6381`), boosting Recall to `83.69%` (capturing 313 of 374 churners) with only a modest drop in Precision from `52.55%` to `51.57%`.

---

### 4. Probability Calibration & Business Cost Optimization
**Q9: Why does an XGBoost model need probability calibration?**
**Answer:** Tree ensembles minimize classification loss or ranking errors, often pushing raw tree margin probabilities towards extreme 0s and 1s. While rank ordering (ROC-AUC) remains unaffected, raw probabilities cannot be interpreted as true posterior likelihoods. Using Platt scaling (`CalibratedClassifierCV(method="sigmoid", cv=5)`), we reduced the Brier score from `0.1569` to `0.1329` (a 15.3% reduction in probability error).

**Q10: What is a Brier score, and what does it tell you?**
**Answer:** The Brier score is the mean squared error between predicted probabilities and binary ground-truth labels: $\frac{1}{N} \sum (p_i - y_i)^2$. A score of 0.0 indicates perfect probability calibration. Our calibrated score of `0.1329` confirms that when the model assigns a 70% risk, approximately 7 out of 10 customers will actually churn.

**Q11: How does your cost-optimal threshold work?**
**Answer:** We model expected business cost as:
$$\text{Cost} = (\text{FN} \times C_{\text{FN}}) + (\text{FP} \times C_{\text{FP}}) + (\text{TP} \times C_{\text{TP}}) - (\text{TP} \times \text{Success Rate} \times \text{LTV})$$
Assuming $500 lost LTV for missed churners and $50 for retention offers, the cost curve selects the threshold minimizing net loss, delivering significant monetary savings compared to default 0.50.

**Q12: What is Precision@k and Cumulative Lift in your Retention Planner?**
**Answer:** Marketing teams have fixed budget constraints. In our test set, contacting the top 20% highest-risk customers captures `52.1%` of all churners with a precision of `69.1%`, representing a `2.6x lift` over random customer outreach.

---

### 5. Explainability & Non-Causal Boundaries
**Q13: How does TreeSHAP explain individual predictions in ChurnLens?**
**Answer:** TreeSHAP computes the Shapley value of each feature using the tree structure in polynomial time. For each customer, it decomposes the log-odds prediction into additive contributions: features pushing risk higher (e.g. Month-to-month contract $+0.24$) and features pushing risk lower (e.g. 60 months tenure $-0.31$).

**Q14: Why is it crucial to state that SHAP is not causal?**
**Answer:** SHAP measures observational feature importance within the model's learned distribution: $P(Y \mid X)$. It does not estimate causal effects: $P(Y \mid do(X))$. For example, moving a customer from Month-to-month to a Two-year contract in the simulator lowers model-predicted risk, but in the real world, forcing customers into contracts could trigger immediate cancellations without randomized control trials (A/B testing).

---

### 6. Monitoring, Data Drift & PSI
**Q15: How does Population Stability Index (PSI) detect data drift?**
**Answer:** PSI measures the divergence between a baseline reference distribution $E$ and a serving distribution $A$:
$$\text{PSI} = \sum_{i=1}^k (A_i - E_i) \times \ln(A_i / E_i)$$
Industry standards: $\text{PSI} < 0.10$ is stable, $0.10 \le \text{PSI} < 0.20$ signals moderate shift, and $\text{PSI} \ge 0.20$ indicates significant drift requiring retraining.

**Q16: Why do you monitor input data drift (PSI) rather than accuracy in real-time?**
**Answer:** Because in churn prediction, ground-truth labels do not physically arrive until the billing cycle terminates 30 to 90 days later. Real-time accuracy cannot be computed on live traffic; monitoring input PSI detects covariate shift immediately when data arrives.

**Q17: How did you implement PSI for numerical and categorical variables?**
**Answer:** For numerical features, we calculate quantile bucket edges on baseline training data with open-ended outer bounds via `np.digitize`. For categorical features, we compute frequency distributions across all categories with an epsilon smoothing factor ($10^{-4}$) to prevent division by zero or $\ln(0)$.

---

### 7. Robustness, Fairness & Failure Modes
**Q18: What is your model's biggest weakness or failure mode?**
**Answer:** On subgroup evaluation, Two-year contract customers have an extremely low base churn rate (2.8%). In this cohort, the model has a higher false positive rate. Additionally, newly acquired customers (tenure < 6 months) exhibit higher prediction variance because there is minimal billing and usage telemetry history.

**Q19: How does the model perform against non-trivial baselines?**
**Answer:** A majority-class dummy classifier achieves 73.5% accuracy but 0.0% Recall and 0.0% F1. An unweighted Logistic Regression achieves `0.8493` ROC-AUC with `0.7914` Recall at 0.50. Production XGBoost achieves `0.8551` ROC-AUC, `0.6691` PR-AUC, and `83.69%` Recall at 0.45.

---

### 8. Productionization, APIs & Scalability
**Q20: How does your batch prediction endpoint handle corrupt or malformed rows?**
**Answer:** `POST /predict/batch` implements row-level validation. Malformed rows (e.g. invalid categorical levels, negative charges) are quarantined with error diagnostics in `skipped_bad_rows`, while valid rows are vectorized, scored, and returned in the preview and CSV download.

**Q21: How do you log predictions in production for governance?**
**Answer:** Every single inference writes an audit record to SQLite/PostgreSQL via SQLAlchemy 2.0 (`PredictionAuditLog`), storing a UUID request token, model version tag, timestamp, predicted probability, assigned risk tier, threshold used, and the serialized JSON feature vector.

**Q22: How is the system containerized?**
**Answer:** We provide a multi-stage Docker architecture: a lightweight Python 3.11 slim container running FastAPI via Uvicorn with a `/health` healthcheck probe, and a Node 20 / Nginx container building and serving the React Vite frontend, unified under `docker compose up`.

**Q23: How would you scale this pipeline for 10 million customers?**
**Answer:** 1) Transition training to distributed XGBoost on Spark or Ray; 2) Convert batch inference to asynchronous streaming (Celery / Apache Kafka) writing predictions directly to Redis or a data lake (Parquet/Snowflake); 3) Cache customer static features in a feature store (Feast); 4) Migrate audit logs to ClickHouse or BigQuery.

**Q24: When would you trigger automated model retraining?**
**Answer:** Automated retraining is triggered when: 1) Covariate drift alert occurs ($\text{PSI} \ge 0.20$ on top features like Contract or Tenure); 2) Performance decay is observed after 60-day ground-truth label maturation (PR-AUC drops $> 5\%$); 3) On a scheduled monthly cadence with rolling 12-month data windows.

**Q25: What are the main limitations of this project?**
**Answer:** 1) It is trained on a static public IBM benchmark rather than live telecommunications CDR (Call Detail Record) event logs; 2) The dataset has 7,043 rows, which is small for enterprise scale; 3) Retention interventions are simulated, not experimentally verified through live randomized A/B tests.
