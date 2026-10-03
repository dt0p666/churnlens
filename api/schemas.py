from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field, ConfigDict

class CustomerProfileSchema(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    Gender: str
    Senior_Citizen: str = Field(..., alias="Senior Citizen")
    Partner: str
    Dependents: str
    Tenure_Months: float = Field(..., alias="Tenure Months", ge=0, le=120)
    Phone_Service: str = Field(..., alias="Phone Service")
    Multiple_Lines: str = Field(..., alias="Multiple Lines")
    Internet_Service: str = Field(..., alias="Internet Service")
    Online_Security: str = Field(..., alias="Online Security")
    Online_Backup: str = Field(..., alias="Online Backup")
    Device_Protection: str = Field(..., alias="Device Protection")
    Tech_Support: str = Field(..., alias="Tech Support")
    Streaming_TV: str = Field(..., alias="Streaming TV")
    Streaming_Movies: str = Field(..., alias="Streaming Movies")
    Contract: str
    Paperless_Billing: str = Field(..., alias="Paperless Billing")
    Payment_Method: str = Field(..., alias="Payment Method")
    Monthly_Charges: float = Field(..., alias="Monthly Charges", ge=0)
    Total_Charges: float = Field(..., alias="Total Charges", ge=0)

class PredictionResponseSchema(BaseModel):
    churn_probability: float
    churn_prediction: int
    risk_tier: str
    decision_threshold: float
    model_version: str
    model_name: str
    explanation: Optional[Dict[str, Any]] = None

class BatchSummarySchema(BaseModel):
    total_rows: int
    valid_rows: int
    invalid_rows: int
    valid_rate: float
    scored_count: int
    high_risk: int
    medium_risk: int
    low_risk: int
    mean_probability: float

class ModelInfoSchema(BaseModel):
    model_name: str
    model_version: str
    training_timestamp: str
    default_threshold: float
    test_metrics: Dict[str, Any]
    candidate_comparisons: Dict[str, Any]
    cv_results: Dict[str, Any]
    top_features: List[Dict[str, Any]]

class HealthResponseSchema(BaseModel):
    status: str
    environment: str
    model_loaded: bool
    version: str
