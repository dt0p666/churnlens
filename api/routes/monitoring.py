from typing import Optional, Dict, Any
from fastapi import APIRouter, Query
import pandas as pd
from src.monitoring import DriftMonitor, generate_simulated_drift_dataset

router = APIRouter(prefix="/monitoring", tags=["Monitoring & Drift"])

@router.get("/drift-status")
def get_current_drift_status(
    use_simulated_shift: bool = Query(False, description="Simulate a deliberate covariate distribution drift")
) -> Dict[str, Any]:
    monitor = DriftMonitor()

    if use_simulated_shift:
        current_df = generate_simulated_drift_dataset(n_samples=500, random_state=42)
        mode_label = "SIMULATED DISTRIBUTION SHIFT"
    else:
        # Evaluate standard out-of-fold sample (stable reference)
        ref_df = monitor.reference_df
        current_df = ref_df.sample(n=min(500, len(ref_df)), random_state=123)
        mode_label = "BASELINE PRODUCTION SAMPLE"

    report = monitor.evaluate_batch_drift(current_df)

    return {
        **report,
        "mode": mode_label,
        "is_simulated": use_simulated_shift,
        "notice": (
            "This metric measures covariate/input distribution drift (PSI), not live model accuracy, "
            "because ground truth labels do not exist for real-time production traffic."
        )
    }
