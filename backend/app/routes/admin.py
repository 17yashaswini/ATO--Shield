from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.database.mongodb import get_db
from app.middleware.authentication import admin_required
from app.routes.login import analyze_and_record_login
from app.utils.helpers import serialize_many, success, error

bp = Blueprint("admin", __name__, url_prefix="/api/admin")

SIMULATION_SCENARIOS = {
    "normal_login": dict(device_id="trusted-device-1", device_name="Windows Laptop - Chrome",
                          location="Bengaluru, IN", failed_attempts=0),
    "new_device": dict(device_id="sim-new-device", device_name="Unknown Linux Device",
                        location="Bengaluru, IN", failed_attempts=0),
    "unusual_time": dict(device_id="trusted-device-1", device_name="Windows Laptop - Chrome",
                          location="Bengaluru, IN", failed_attempts=0),
    "multiple_failed_attempts": dict(device_id="trusted-device-1", device_name="Windows Laptop - Chrome",
                                      location="Bengaluru, IN", failed_attempts=6),
    "new_location": dict(device_id="trusted-device-1", device_name="Windows Laptop - Chrome",
                          location="Lagos, NG", failed_attempts=0),
    "combined_ato_attempt": dict(device_id="sim-attacker-device", device_name="Unknown Android Device",
                                  location="Lagos, NG", failed_attempts=7),
}


@bp.get("/dashboard")
@jwt_required()
@admin_required()
def dashboard():
    db = get_db()
    total_users = db.users.count_documents({})
    total_logins = db.login_events.count_documents({})
    suspicious = db.login_events.count_documents({"risk_level": {"$in": ["MEDIUM", "HIGH"]}})
    blocked = db.login_events.count_documents({"action": "BLOCK"})
    high_risk_events = db.security_events.count_documents({"severity": "HIGH"})
    active_sessions = db.sessions.count_documents({"status": "ACTIVE"})

    risk_distribution = {
        "LOW": db.login_events.count_documents({"risk_level": "LOW"}),
        "MEDIUM": db.login_events.count_documents({"risk_level": "MEDIUM"}),
        "HIGH": db.login_events.count_documents({"risk_level": "HIGH"}),
    }
    action_distribution = {
        "ALLOW": db.login_events.count_documents({"action": "ALLOW"}),
        "FLAG": db.login_events.count_documents({"action": "FLAG"}),
        "BLOCK": db.login_events.count_documents({"action": "BLOCK"}),
    }
    event_type_counts = {}
    for doc in db.security_events.aggregate([{"$group": {"_id": "$event_type", "count": {"$sum": 1}}}]):
        event_type_counts[doc["_id"]] = doc["count"]

    recent_logins = list(db.login_events.find().sort("timestamp", -1).limit(20))

    body, status = success({
        "totals": {
            "total_users": total_users,
            "total_logins": total_logins,
            "suspicious_attempts": suspicious,
            "blocked_attempts": blocked,
            "high_risk_events": high_risk_events,
            "active_sessions": active_sessions,
        },
        "risk_distribution": risk_distribution,
        "action_distribution": action_distribution,
        "event_type_counts": event_type_counts,
        "recent_logins": serialize_many(recent_logins),
    })
    return jsonify(body), status


@bp.get("/users")
@jwt_required()
@admin_required()
def users():
    db = get_db()
    users_list = list(db.users.find({}, {"password_hash": 0}).sort("created_at", -1))
    body, status = success(serialize_many(users_list))
    return jsonify(body), status


@bp.get("/events")
@jwt_required()
@admin_required()
def events():
    db = get_db()
    resolved = request.args.get("resolved")
    query = {}
    if resolved is not None:
        query["resolved"] = resolved.lower() == "true"
    events_list = list(db.security_events.find(query).sort("timestamp", -1).limit(100))
    body, status = success(serialize_many(events_list))
    return jsonify(body), status


@bp.get("/login-events")
@jwt_required()
@admin_required()
def login_events():
    db = get_db()
    limit = min(int(request.args.get("limit", 100)), 500)
    events_list = list(db.login_events.find().sort("timestamp", -1).limit(limit))
    body, status = success(serialize_many(events_list))
    return jsonify(body), status


@bp.post("/simulate")
@jwt_required()
@admin_required()
def simulate():
    """
    Safe, controlled demonstration of the risk engine against a chosen
    scenario. Does NOT perform any real credential attack / brute force.
    No side effects are written for the acting admin's own account state.
    """
    data = request.get_json(silent=True) or {}
    scenario_key = data.get("scenario")
    target_user_id = data.get("target_user_id") or get_jwt_identity()

    if scenario_key not in SIMULATION_SCENARIOS:
        body, status = error(
            f"Unknown scenario. Choose from: {', '.join(SIMULATION_SCENARIOS.keys())}", 400
        )
        return jsonify(body), status

    scenario = SIMULATION_SCENARIOS[scenario_key]
    result = analyze_and_record_login(
        target_user_id,
        ip_address="203.0.113.10",
        device_id=scenario["device_id"],
        device_name=scenario["device_name"],
        location=scenario["location"],
        failed_attempts=scenario["failed_attempts"],
        login_success=(scenario_key != "multiple_failed_attempts"),
        create_side_effects=True,
    )

    body, status = success({
        "scenario": scenario_key,
        "input_features": {
            "device_name": scenario["device_name"],
            "location": scenario["location"],
            "failed_attempts": scenario["failed_attempts"],
            "login_hour": result["login_hour"],
        },
        "anomaly_score": result["anomaly_score"],
        "risk_score": result["risk_score"],
        "risk_level": result["risk_level"],
        "action": result["action"],
        "reasons": result["reasons"],
    }, "Simulation complete")
    return jsonify(body), status
