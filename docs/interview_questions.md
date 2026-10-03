# ChurnLens - Senior Machine Learning Engineering Interview Defense

### 1. Why Churn Prediction?
Acquiring new customers is 5 to 7 times more expensive than retaining existing ones. Churn models serve as proactive early-warning systems, enabling retention teams to allocate interventions (discounts, service outreach, contract renewals) where expected ROI is highest.

### 2. How did you prevent Data Leakage?
Data leakage was prevented at two critical levels:
1. **Target Leakage Isolation:** The raw dataset included `Churn Reason` (which is only recorded after a customer churns) and `Churn Score` (a pre-computed vendor score with $r=0.665$ correlation). Using either in training yields artificial 99%+ accuracy. Both were quarantined and excluded from training features.
2. **Preprocessing Leakage:** Imputers and scalers were embedded strictly inside a Scikit-Learn `ColumnTransformer` within the `Pipeline`. All statistical parameters (mean, standard deviation, median imputations) were fitted solely on the training folds and never exposed to test data.

### 3. How did you handle missing and malformed data?
`Total Charges` was stored as an `object` due to 11 records containing whitespace `" "`. Inspection revealed all 11 had `Tenure Months == 0` (new accounts that had not completed their first billing cycle). In `TelcoFeatureEngineer`, these were converted to `0.0` rather than dropping them or imputing arbitrary means.

### 4. Why not rely on Accuracy alone?
The dataset has a 26.5% churn prevalence (73.5% non-churn). A naive dummy classifier predicting "no churn" for everyone would achieve 73.5% accuracy while identifying zero at-risk customers. We evaluated models using **ROC-AUC** (discrimination ability) and **PR-AUC** (average precision across positive class recall) to guarantee actual identification of churners.

### 5. ROC-AUC vs. PR-AUC: When do you use which?
- **ROC-AUC** measures the model's ability to rank positive instances higher than negative instances across all false positive rates. However, in imbalanced datasets, a large number of true negatives can make ROC-AUC appear optimistic.
- **PR-AUC** focuses exclusively on the positive class (churners) without being diluted by the majority retained class. In telecom churn, PR-AUC directly informs retention campaign efficiency.

### 6. What is Decision Threshold Optimization and why isn't 0.5 always optimal?
The standard 0.5 threshold assumes false positives and false negatives carry equal cost. In churn prevention:
- **Cost of False Negative (FN):** Losing a high-value customer (~$65/mo MRR lost permanently).
- **Cost of False Positive (FP):** Sending a retention email or discount offer to someone who wasn't leaving (~$5 to $10).
Because FN is substantially more expensive than FP, lowering the threshold to `0.35` captures 84.8% of churners (high recall) while maintaining acceptable precision.

### 7. What does SHAP actually tell us, and why isn't it causal?
SHAP (Shapley Additive exPlanations) uses cooperative game theory to calculate the marginal contribution of each feature to the model's prediction relative to the expected base value.
- **What it tells us:** "Under this specific model's mathematical decision surface, having a Month-to-month contract increased the predicted log-odds of churn by +0.55."
- **Why it is NOT causal:** SHAP reflects statistical association, not real-world intervention effects. Migrating an unhappy customer to a 2-year contract might not prevent churn if the underlying reason for discontent is unresolved service unreliability.

### 8. How is the system architected and how does it scale?
- **Current Architecture:** FastAPI asynchronous REST API serving a serialized Scikit-Learn + XGBoost `pipeline.joblib`. SQLite database for lightweight audit logging. React + Vite single-page application communicating via REST.
- **Scaling Path:**
  1. **API:** Containerized with Docker; scale horizontally across Kubernetes pods behind an ingress load balancer.
  2. **Batch Processing:** Decouple batch scoring from HTTP requests by offloading CSV processing to Celery workers with Redis or an AWS SQS queue.
  3. **Database:** Migrate `DATABASE_URL` from SQLite to managed PostgreSQL.
  4. **Drift Monitoring:** Schedule a daily cron job running `src.monitoring.check_feature_drift` to compute PSI against the training baseline and alert if PSI $\ge 0.2$.
