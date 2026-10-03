from typing import Tuple, List
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from src.config import config
from src.features import TelcoFeatureEngineer

def get_preprocessor_pipeline() -> Tuple[Pipeline, List[str], List[str]]:
    """
    Constructs a leak-free Scikit-Learn ColumnTransformer wrapped with domain feature engineering.
    All transformations are fitted only on training data.
    """
    numerical_features = config.NUMERICAL_COLS + config.ENGINEERED_NUMERICAL_COLS
    categorical_features = config.CATEGORICAL_COLS + config.ENGINEERED_CATEGORICAL_COLS

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

    full_pipeline = Pipeline(steps=[
        ("feature_engineer", TelcoFeatureEngineer()),
        ("column_transformer", column_transformer)
    ])

    return full_pipeline, numerical_features, categorical_features

def get_feature_names(fitted_pipeline: Pipeline) -> List[str]:
    """
    Extracts explicit feature names after ColumnTransformer for explainability and feature importance.
    """
    col_transformer = fitted_pipeline.named_steps["column_transformer"]
    feature_names = []

    # Numerical feature names
    num_cols = config.NUMERICAL_COLS + config.ENGINEERED_NUMERICAL_COLS
    feature_names.extend(num_cols)

    # Categorical one-hot feature names
    cat_cols = config.CATEGORICAL_COLS + config.ENGINEERED_CATEGORICAL_COLS
    cat_encoder = col_transformer.named_transformers_["cat"].named_steps["onehot"]
    encoded_cat_names = cat_encoder.get_feature_names_out(cat_cols).tolist()
    feature_names.extend(encoded_cat_names)

    return feature_names
