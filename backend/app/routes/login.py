"""
Not a Flask blueprint - this module holds the shared "analyze and record
a login attempt" pipeline used by the /api/auth/login route and by the
admin attack simulator, so both go through identical logic.
"""
from app.database.mongodb import get_db
from app.services.feature_engineering import compute_login_features
from app.services.risk_engine import evaluate_login
from app.services import session_service
from app.utils.helpers import new_id, now_utc


def analyze_and_record_login(user_id, ip_address, device_id, device_name, location,
                              failed_attempts, login_success, create_side_effects=True):
    db = get_db()
    timestamp = now_utc()

    features = compute_login_features(
        db, user_id, ip_address, device_id, location, failed_attempts, timestamp
    )
    risk = evaluate_login(features)

    login_event = {
        "_id": new_id(),
        "user_id": user_id,
        "timestamp": timestamp,
        "ip_address": ip_address,
        "user_agent": device_name,
        "device_id": device_id,
        "device_name": device_name,
        "location": location,
        "login_success": login_success,
        "failed_attempts": failed_attempts,
        "is_new_device": bool(features["is_new_device"]),
        "is_new_location": bool(features["is_new_location"]),
        "login_hour": features["login_hour"],
        "time_since_previous_login": features["time_since_previous_login"],
        "anomaly_score": risk["anomaly_score"],
        "risk_score": risk["risk_score"],
        "risk_level": risk["risk_level"],
        "action": risk["action"],
        "reasons": risk["reasons"],
        "reviewed": False,
    }

    if create_side_effects:
        db.login_events.insert_one(login_event)

        if login_success and risk["action"] != "BLOCK":
            session_service.create_session(
                db, user_id, device_id, device_name, ip_address, location,
                is_suspicious=(risk["risk_level"] != "LOW"),
            )

        if risk["risk_level"] in ("MEDIUM", "HIGH"):
            db.security_events.insert_one({
                "_id": new_id(),
                "user_id": user_id,
                "event_type": "SUSPICIOUS_LOGIN",
                "severity": risk["risk_level"],
                "description": "; ".join(risk["reasons"]),
                "timestamp": timestamp,
                "related_login_id": login_event["_id"],
                "resolved": False,
            })
            db.notifications.insert_one({
                "_id": new_id(),
                "user_id": user_id,
                "type": "SUSPICIOUS_LOGIN" if risk["action"] == "FLAG" else "LOGIN_BLOCKED",
                "message": f"{risk['risk_level']} risk login detected ({risk['risk_score']}/100).",
                "created_at": timestamp,
                "read": False,
            })

    return login_event
