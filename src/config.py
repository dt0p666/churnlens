from pathlib import Path
from dataclasses import dataclass, field
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent

@dataclass(frozen=True)
class ProjectConfig:
    RANDOM_STATE: int = 42
    RAW_DATA_PATH: Path = BASE_DIR / "data" / "raw" / "Telco_customer_churn.csv"
    PROCESSED_DATA_DIR: Path = BASE_DIR / "data" / "processed"
    MODELS_DIR: Path = BASE_DIR / "models" / "production"
    EXPERIMENTS_DIR: Path = BASE_DIR / "models" / "experiments"
    
    TARGET_COL: str = "Churn Value"
    ID_COL: str = "CustomerID"
    
    # Columns strictly dropped to prevent target leakage and zero-variance noise
    DROP_COLS: List[str] = field(default_factory=lambda: [
        "CustomerID",
        "Count",
        "Country",
        "State",
        "City",
        "Zip Code",
        "Lat Long",
        "Latitude",
        "Longitude",
        "Churn Label",
        "Churn Score",   # Pre-computed vendor score (r=0.665 with churn)
        "CLTV",          # Customer Lifetime Value (post-hoc financial metric)
        "Churn Reason",  # Only present when Churn Value == 1 (pure leakage)
    ])
    
    CATEGORICAL_COLS: List[str] = field(default_factory=lambda: [
        "Gender",
        "Senior Citizen",
        "Partner",
        "Dependents",
        "Phone Service",
        "Multiple Lines",
        "Internet Service",
        "Online Security",
        "Online Backup",
        "Device Protection",
        "Tech Support",
        "Streaming TV",
        "Streaming Movies",
        "Contract",
        "Paperless Billing",
        "Payment Method"
    ])
    
    NUMERICAL_COLS: List[str] = field(default_factory=lambda: [
        "Tenure Months",
        "Monthly Charges",
        "Total Charges"
    ])
    
    # Additional engineered feature columns created during pipeline transformation
    ENGINEERED_NUMERICAL_COLS: List[str] = field(default_factory=lambda: [
        "ServiceCount",
        "AvgMonthlyCharges",
        "ChargeDiffRatio"
    ])
    
    ENGINEERED_CATEGORICAL_COLS: List[str] = field(default_factory=lambda: [
        "TenureGroup"
    ])
    
    DEFAULT_THRESHOLD: float = 0.35
    DEFAULT_MODEL_NAME: str = "xgboost_churn_v1"
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'churnlens.db'}"

config = ProjectConfig()
