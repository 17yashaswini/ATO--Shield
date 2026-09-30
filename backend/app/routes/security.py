from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.database.mongodb import get_db
from app.services.recommendation_engine import generate_recommendations
from app.utils.helpers import serialize_doc, serialize_many, success, error, now_utc, new_id

bp = Blueprint("security", __name__, url_prefix="/api/security")


@bp.get("/events")
@jwt_required()
def list_events():
    db = get_db()
    user_id = get_jwt_identity()
    events = list(db.security_events.find({"user_id": user_id}).sort("timestamp", -1))
    body, status = success(serialize_many(events))
    return jsonify(body), status


@bp.get("/events/<event_id>")
@jwt_required()
def event_detail(event_id):
    db = get_db()
    user_id = get_jwt_identity()
    event = db.security_events.find_one({"_id": event_id, "user_id": user_id})
    if not event:
        body, status = error("Event not found", 404)
        return jsonify(body), status

    related_login = None
    if event.get("related_login_id"):
        related_login = db.login_events.find_one({"_id": event["related_login_id"]})

    detail = serialize_doc(event)
    detail["related_login"] = serialize_doc(related_login)
    detail["what_happened"] = (
        f"A {event.get('severity', 'LOW').lower()} risk login event was recorded on your account."
        if related_login else event.get("description")
    )
    detail["why_flagged"] = related_login.get("reasons", []) if related_login else []
    detail["what_we_did"] = (
        "This login was blocked automatically."
        if related_login and related_login.get("action") == "BLOCK"
        else "This login was flagged for your review."
    )
    detail["what_you_can_do"] = [
        "Confirm if this was you",
        "Revoke the session if it wasn't",
        "Change your password if you're unsure",
        "Review your recent activity",
    ]
    body, status = success(detail)
    return jsonify(body), status


@bp.post("/events/<event_id>/confirm")
@jwt_required()
def confirm_event(event_id):
    """'YES, THIS WAS ME' - marks event reviewed/resolved and trusts the device."""
    db = get_db()
    user_id = get_jwt_identity()
    event = db.security_events.find_one({"_id": event_id, "user_id": user_id})
    if not event:
        body, status = error("Event not found", 404)
        return jsonify(body), status

    db.security_events.update_one({"_id": event_id}, {"$set": {"resolved": True, "resolution": "CONFIRMED"}})

    if event.get("related_login_id"):
        db.login_events.update_one({"_id": event["related_login_id"]}, {"$set": {"reviewed": True}})
        login_event = db.login_events.find_one({"_id": event["related_login_id"]})
        if login_event:
            db.sessions.update_many(
                {"user_id": user_id, "device_id": login_event["device_id"], "status": "ACTIVE"},
                {"$set": {"is_suspicious": False}},
            )

    body, status = success(message="Thanks - marked as confirmed")
    return jsonify(body), status


@bp.post("/events/<event_id>/report")
@jwt_required()
def report_event(event_id):
    """'NO, SECURE MY ACCOUNT' - starts the account recovery workflow."""
    db = get_db()
    user_id = get_jwt_identity()
    event = db.security_events.find_one({"_id": event_id, "user_id": user_id})
    if not event:
        body, status = error("Event not found", 404)
        return jsonify(body), status

    db.security_events.update_one({"_id": event_id}, {"$set": {"resolved": False, "resolution": "REPORTED"}})

    existing = db.recovery_sessions.find_one({"user_id": user_id, "status": "IN_PROGRESS"})
    if existing:
        body, status = success(serialize_doc(existing), "Recovery already in progress")
        return jsonify(body), status

    recovery = {
        "_id": new_id(),
        "user_id": user_id,
        "triggered_by_event_id": event_id,
        "status": "IN_PROGRESS",
        "steps": {
            "revoke_suspicious_session": False,
            "sign_out_other_sessions": False,
            "change_password": False,
            "review_activity": False,
            "enable_stronger_auth": False,
        },
        "created_at": now_utc(),
        "updated_at": now_utc(),
    }
    db.recovery_sessions.insert_one(recovery)
    body, status = success(serialize_doc(recovery), "Account recovery started")
    return jsonify(body), status


@bp.get("/recommendations")
@jwt_required()
def recommendations():
    db = get_db()
    user_id = get_jwt_identity()
    recs = generate_recommendations(db, user_id)
    body, status = success(recs)
    return jsonify(body), status


@bp.get("/timeline")
@jwt_required()
def timeline():
    db = get_db()
    user_id = get_jwt_identity()

    logins = list(db.login_events.find({"user_id": user_id}).sort("timestamp", -1).limit(30))
    events = list(db.security_events.find({"user_id": user_id}).sort("timestamp", -1).limit(30))
    sessions = list(db.sessions.find({"user_id": user_id, "status": "REVOKED"}).sort("last_active", -1).limit(15))

    timeline_items = []
    for l in logins:
        timeline_items.append({
            "timestamp": l["timestamp"].isoformat(),
            "type": "LOGIN",
            "label": "Successful login" if l["login_success"] else "Failed login attempt",
            "detail": f"{l.get('device_name', 'Unknown device')} - {l.get('location', 'Unknown location')}",
            "risk_level": l.get("risk_level"),
        })
    for e in events:
        timeline_items.append({
            "timestamp": e["timestamp"].isoformat(),
            "type": e.get("event_type"),
            "label": e.get("event_type", "").replace("_", " ").title(),
            "detail": e.get("description"),
            "risk_level": e.get("severity"),
        })
    for s in sessions:
        timeline_items.append({
            "timestamp": s["last_active"].isoformat(),
            "type": "SESSION_REVOKED",
            "label": "Session revoked",
            "detail": f"{s.get('device_name')} - {s.get('location')}",
            "risk_level": None,
        })

    timeline_items.sort(key=lambda x: x["timestamp"], reverse=True)
    body, status = success(timeline_items[:50])
    return jsonify(body), status
