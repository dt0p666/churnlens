import pytest
import pandas as pd
import numpy as np
from src.features import TelcoFeatureEngineer
from src.preprocessing import get_preprocessor_pipeline, get_feature_names
from src.utils import SAMPLE_HIGH_RISK_CUSTOMER

def test_feature_engineer_transformation():
    df = pd.DataFrame([SAMPLE_HIGH_RISK_CUSTOMER])
    transformer = TelcoFeatureEngineer()
    df_out = transformer.transform(df)

    assert "ServiceCount" in df_out.columns
    assert "TenureGroup" in df_out.columns
    assert "AvgMonthlyCharges" in df_out.columns
    assert "ChargeDiffRatio" in df_out.columns
    # Check that services count is numeric and non-negative
    assert df_out["ServiceCount"].iloc[0] >= 0

def test_pipeline_transform_shape():
    df = pd.DataFrame([SAMPLE_HIGH_RISK_CUSTOMER, SAMPLE_HIGH_RISK_CUSTOMER])
    pipeline, num_cols, cat_cols = get_preprocessor_pipeline()
    transformed = pipeline.fit_transform(df)
    feature_names = get_feature_names(pipeline)

    assert transformed.shape[0] == 2
    assert transformed.shape[1] == len(feature_names)
    assert not np.isnan(transformed).any()
