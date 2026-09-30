"""
Combines the Isolation Forest anomaly signal with explicit behavioural
rules into a single 0-100 risk score, a risk level, an action, and a
list of human-readable reasons.

These weights/thresholds are project-level heuristics for a portfolio
demo, NOT calibrated, industry-standard fraud-scoring thresholds.
"""
from app.config import Config
from app.services.anomaly_detector import score_features

# Normalizes typical raw Isolation Forest score_samples range (~ -0.75 to -0.30)
# into a 0-100 "ML contribution" component.
ML_SCORE_FLOOR = -0.75
ML_SCORE_CEIL = -0.30
ML_WEIGHT = 45  # out of 100

RULE_WEIGHTS = {
    "is_new_device": 18,
    "is_new_location": 14,
    "unusual_hour": 10,
    "failed_attempts": 13,  # scaled by count, capped
}


def _ml_component(raw_score):
    span = ML_SCORE_CEIL - ML_SCORE_FLOOR
    normalized = (ML_SCORE_CEIL - raw_score) / span  # more negative -> higher
    normalized = max(0.0, min(1.0, normalized))
    return normalized * ML_WEIGHT


def _is_unusual_hour(hour):
    # Outside the common 7am-11pm window used across the demo dataset
    return hour < 6 or hour >= 23


def evaluate_login(features: dict):
    ml_result = score_features(features)
    ml_points = _ml_component(ml_result["raw_score"])

    reasons = []
    rule_points = 0

    if features["is_new_device"]:
        rule_points += RULE_WEIGHTS["is_new_device"]
        reasons.append("New device detected")

    if features["is_new_location"]:
        rule_points += RULE_WEIGHTS["is_new_location"]
        reasons.append("Location differs from recent activity")

    if _is_unusual_hour(features["login_hour"]):
        rule_points += RULE_WEIGHTS["unusual_hour"]
        reasons.append("Login happened outside the account's usual hours")

    if features["failed_attempts"] > 0:
        capped = min(features["failed_attempts"], 8)
        rule_points += min(RULE_WEIGHTS["failed_attempts"], capped * 2.2)
        if features["failed_attempts"] >= 3:
            reasons.append(f"{features['failed_attempts']} failed attempts occurred before this login")

    if ml_result["is_outlier"]:
        reasons.append("This login pattern doesn't match the account's normal behaviour")

    raw_total = ml_points + rule_points
    risk_score = int(round(max(0, min(100, raw_total))))

    if risk_score <= Config.RISK_LOW_MAX:
        risk_level = "LOW"
        action = "ALLOW"
    elif risk_score <= Config.RISK_MEDIUM_MAX:
        risk_level = "MEDIUM"
        action = "FLAG"
    else:
        risk_level = "HIGH"
        action = "BLOCK"

    if not reasons:
        reasons.append("Login matched the account's usual pattern")

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "action": action,
        "reasons": reasons,
        "anomaly_score": ml_result["raw_score"],
        "is_ml_outlier": ml_result["is_outlier"],
    }
