from typing import Tuple, List
import pandas as pd
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from src.config import config
from src.features import TelcoFeatureEngineer

def get_preprocessor_pipeline() -> Tuple[Pipeline, List[str], List[str]]:
    """
    Constructs a leak-free scikit-learn ColumnTransformer wrapped with custom feature engineering.
    """
    numerical_features = config.NUMERICAL_COLS + config.ENGINEERED_NUMERICAL_COLS
    categorical_features = config.CATEGORICAL_COLS

    numeric_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler", StandardScaler())
    ])

    categorical_transformer = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("onehot", OneHotEncoder(handle_unknown="ignore", sparse_output=False))
    ])

    column_transformer = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numerical_features),
            ("cat", categorical_transformer, categorical_features)
        ],
        remainder="drop"
    )

    full_preprocessing_pipeline = Pipeline(steps=[
        ("feature_engineer", TelcoFeatureEngineer()),
        ("column_transformer", column_transformer)
    ])

    return full_preprocessing_pipeline, numerical_features, categorical_features

def get_feature_names(fitted_pipeline: Pipeline) -> List[str]:
    """
    Extracts explicit feature names output by the ColumnTransformer for explainability and SHAP.
    """
    col_transformer = fitted_pipeline.named_steps["column_transformer"]
    feature_names = []
    
    # Numerical names
    num_cols = config.NUMERICAL_COLS + config.ENGINEERED_NUMERICAL_COLS
    feature_names.extend(num_cols)
    
    # Categorical one-hot names
    cat_encoder = col_transformer.named_transformers_["cat"].named_steps["onehot"]
    cat_cols = config.CATEGORICAL_COLS
    encoded_cat_names = cat_encoder.get_feature_names_out(cat_cols).tolist()
    feature_names.extend(encoded_cat_names)
    
    return feature_names
