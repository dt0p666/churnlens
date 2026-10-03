import pytest
import pandas as pd
from src.data_validation import validate_single_record, validate_batch_dataframe
from src.utils import SAMPLE_HIGH_RISK_CUSTOMER

def test_valid_single_record():
    is_valid, errors = validate_single_record(SAMPLE_HIGH_RISK_CUSTOMER)
    assert is_valid is True
    assert len(errors) == 0

def test_invalid_categorical_single_record():
    bad_record = SAMPLE_HIGH_RISK_CUSTOMER.copy()
    bad_record["Contract"] = "Lifetime Contract"
    is_valid, errors = validate_single_record(bad_record)
    assert is_valid is False
    assert any("Invalid value for 'Contract'" in e for e in errors)

def test_invalid_numerical_single_record():
    bad_record = SAMPLE_HIGH_RISK_CUSTOMER.copy()
    bad_record["Monthly Charges"] = -50.0
    is_valid, errors = validate_single_record(bad_record)
    assert is_valid is False
    assert any("cannot be negative" in e for e in errors)

def test_validate_batch_dataframe_mixed():
    rows = [
        SAMPLE_HIGH_RISK_CUSTOMER.copy(),
        SAMPLE_HIGH_RISK_CUSTOMER.copy()
    ]
    # Invalidate second row
    rows[1]["Gender"] = "InvalidGender"
    df = pd.DataFrame(rows)

    valid_df, invalid_df, summary = validate_batch_dataframe(df)
    assert summary["total_rows"] == 2
    assert summary["valid_rows"] == 1
    assert summary["invalid_rows"] == 1
    assert len(valid_df) == 1
    assert len(invalid_df) == 1
