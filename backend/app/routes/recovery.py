from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.database.mongodb import get_db
from app.services import session_service
from app.utils.helpers import serialize_doc, success, error, now_utc

bp = Blueprint("recovery", __name__, url_prefix="/api/recovery")

VALID_STEPS = {
    "revoke_suspicious_session",
    "sign_out_other_sessions",
    "change_password",
    "review_activity",
    "enable_stronger_auth",
}


@bp.post("/start")
@jwt_required()
def start():
    db = get_db()
    user_id = get_jwt_identity()
    existing = db.recovery_sessions.find_one({"user_id": user_id, "status": "IN_PROGRESS"})
    if existing:
        body, status = success(serialize_doc(existing))
        return jsonify(body), status

    from app.utils.helpers import new_id
    recovery = {
        "_id": new_id(),
        "user_id": user_id,
        "triggered_by_event_id": None,
        "status": "IN_PROGRESS",
        "steps": {step: False for step in VALID_STEPS},
        "created_at": now_utc(),
        "updated_at": now_utc(),
    }
    db.recovery_sessions.insert_one(recovery)
    body, status = success(serialize_doc(recovery), "Recovery started")
    return jsonify(body), status


@bp.post("/action")
@jwt_required()
def action():
    db = get_db()
    user_id = get_jwt_identity()
    data = request.get_json(silent=True) or {}
    step = data.get("step")

    if step not in VALID_STEPS:
        body, status = error(f"Unknown step '{step}'", 400)
        return jsonify(body), status

    recovery = db.recovery_sessions.find_one({"user_id": user_id, "status": "IN_PROGRESS"})
    if not recovery:
        body, status = error("No active recovery session. Start one first.", 404)
        return jsonify(body), status

    if step == "revoke_suspicious_session":
        db.sessions.update_many(
            {"user_id": user_id, "status": "ACTIVE", "is_suspicious": True},
            {"$set": {"status": "REVOKED"}},
        )
    elif step == "sign_out_other_sessions":
        session_service.revoke_all_other_sessions(db, user_id)
    elif step == "change_password":
        new_password = data.get("new_password")
        if not new_password or len(new_password) < 8:
            body, status = error("A new password of at least 8 characters is required", 400)
            return jsonify(body), status
        db.users.update_one({"_id": user_id}, {"$set": {"password_hash": generate_password_hash(new_password)}})
    elif step == "enable_stronger_auth":
        db.users.update_one({"_id": user_id}, {"$set": {"mfa_enabled": True}})
    # "review_activity" has no server side-effect beyond marking the step complete

    steps = recovery["steps"]
    steps[step] = True
    completed = sum(1 for v in steps.values() if v)
    status_value = "COMPLETED" if completed == len(steps) else "IN_PROGRESS"

    db.recovery_sessions.update_one(
        {"_id": recovery["_id"]},
        {"$set": {"steps": steps, "status": status_value, "updated_at": now_utc()}},
    )
    updated = db.recovery_sessions.find_one({"_id": recovery["_id"]})
    progress_pct = int(round((completed / len(steps)) * 100))

    body, status = success(
        {**serialize_doc(updated), "progress_percent": progress_pct},
        "Step completed",
    )
    return jsonify(body), status
