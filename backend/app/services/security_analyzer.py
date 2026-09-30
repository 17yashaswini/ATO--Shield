from datetime import timedelta
from app.utils.helpers import now_utc


def compute_security_score(db, user_id):
    """
    Derives a 0-100 security score from real account state.
    Never hardcoded - always recomputed from current data.
    """
    score = 100
    issues = []

    seven_days_ago = now_utc() - timedelta(days=7)

    recent_high_events = db.security_events.count_documents({
        "user_id": user_id,
        "severity": "HIGH",
        "timestamp": {"$gte": seven_days_ago},
        "resolved": False,
    })
    if recent_high_events:
        score -= min(35, recent_high_events * 20)
        issues.append("Unresolved high-risk security event(s) in the last 7 days")

    suspicious_sessions = db.sessions.count_documents({
        "user_id": user_id, "status": "ACTIVE", "is_suspicious": True,
    })
    if suspicious_sessions:
        score -= min(25, suspicious_sessions * 15)
        issues.append("Suspicious active session(s) detected")

    recent_failed = db.login_events.count_documents({
        "user_id": user_id,
        "login_success": False,
        "timestamp": {"$gte": seven_days_ago},
    })
    if recent_failed >= 3:
        score -= min(15, recent_failed * 2)
        issues.append("Multiple recent failed login attempts")

    user = db.users.find_one({"_id": user_id})
    mfa_enabled = bool(user and user.get("mfa_enabled"))
    if not mfa_enabled:
        score -= 10
        issues.append("Additional authentication (MFA) not enabled")

    active_sessions = db.sessions.count_documents({"user_id": user_id, "status": "ACTIVE"})
    if active_sessions > 4:
        score -= 5
        issues.append("Unusually high number of active sessions")

    score = max(0, min(100, score))

    if score >= 80:
        label = "Good"
    elif score >= 50:
        label = "Needs attention"
    else:
        label = "At risk"

    return {"security_score": score, "label": label, "issues": issues}
