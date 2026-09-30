import os
import joblib
import numpy as np

_BASE = os.path.join(os.path.dirname(__file__), "..", "..", "ml", "models")
_MODEL_PATH = os.path.join(_BASE, "isolation_forest.joblib")
_SCALER_PATH = os.path.join(_BASE, "scaler.joblib")

_bundle = None
_scaler = None


def _load():
    global _bundle, _scaler
    if _bundle is None:
        _bundle = joblib.load(_MODEL_PATH)
        _scaler = joblib.load(_SCALER_PATH)
    return _bundle, _scaler


def score_features(features: dict):
    """
    Returns (anomaly_score, feature_columns) where anomaly_score is a
    raw Isolation Forest score. More negative = more anomalous.
    This raw score is an INTERNAL signal only - never shown to end users.
    """
    bundle, scaler = _load()
    model = bundle["model"]
    columns = bundle["feature_columns"]

    vector = np.array([[features[c] for c in columns]])
    vector_scaled = scaler.transform(vector)

    raw_score = float(model.score_samples(vector_scaled)[0])
    is_outlier = int(model.predict(vector_scaled)[0] == -1)

    return {
        "raw_score": raw_score,
        "is_outlier": bool(is_outlier),
        "feature_columns": columns,
    }
