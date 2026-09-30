from app.services.anomaly_detector import score_features
from ml.feature_columns import FEATURE_COLUMNS


def test_model_loads_and_predicts():
    features = {
        "failed_attempts": 0, "login_hour": 14, "is_new_device": 0,
        "is_new_location": 0, "login_frequency": 20, "time_since_previous_login": 18,
        "device_count": 1, "location_count": 1,
    }
    result = score_features(features)
    assert "raw_score" in result
    assert isinstance(result["is_outlier"], bool)


def test_feature_ordering_matches_training():
    assert FEATURE_COLUMNS == [
        "failed_attempts", "login_hour", "is_new_device", "is_new_location",
        "login_frequency", "time_since_previous_login", "device_count", "location_count",
    ]


def test_anomalous_pattern_scores_worse_than_normal():
    normal = {
        "failed_attempts": 0, "login_hour": 14, "is_new_device": 0,
        "is_new_location": 0, "login_frequency": 20, "time_since_previous_login": 18,
        "device_count": 1, "location_count": 1,
    }
    anomalous = {
        "failed_attempts": 7, "login_hour": 3, "is_new_device": 1,
        "is_new_location": 1, "login_frequency": 2, "time_since_previous_login": 0.2,
        "device_count": 6, "location_count": 6,
    }
    normal_score = score_features(normal)["raw_score"]
    anomalous_score = score_features(anomalous)["raw_score"]
    assert anomalous_score < normal_score
