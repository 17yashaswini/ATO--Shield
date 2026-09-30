from app.services.risk_engine import evaluate_login


def test_low_risk_for_normal_pattern():
    features = {
        "failed_attempts": 0, "login_hour": 14, "is_new_device": 0,
        "is_new_location": 0, "login_frequency": 20, "time_since_previous_login": 18,
        "device_count": 1, "location_count": 1,
    }
    result = evaluate_login(features)
    assert result["risk_level"] == "LOW"
    assert result["action"] == "ALLOW"


def test_medium_risk_for_single_new_signal():
    features = {
        "failed_attempts": 0, "login_hour": 14, "is_new_device": 1,
        "is_new_location": 0, "login_frequency": 15, "time_since_previous_login": 20,
        "device_count": 2, "location_count": 1,
    }
    result = evaluate_login(features)
    assert result["risk_level"] in ("LOW", "MEDIUM")


def test_high_risk_for_combined_attack_pattern():
    features = {
        "failed_attempts": 7, "login_hour": 3, "is_new_device": 1,
        "is_new_location": 1, "login_frequency": 2, "time_since_previous_login": 0.2,
        "device_count": 6, "location_count": 6,
    }
    result = evaluate_login(features)
    assert result["risk_level"] == "HIGH"
    assert result["action"] == "BLOCK"
    assert len(result["reasons"]) > 0
