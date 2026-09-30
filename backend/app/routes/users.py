from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.database.mongodb import get_db
from app.services.security_analyzer import compute_security_score
from app.utils.helpers import serialize_doc, serialize_many, success, error

bp = Blueprint("users", __name__, url_prefix="/api/users")


@bp.get("/profile")
@jwt_required()
def profile():
    db = get_db()
    user = db.users.find_one({"_id": get_jwt_identity()})
    if not user:
        body, status = error("User not found", 404)
        return jsonify(body), status
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    body, status = success(serialize_doc(safe_user))
    return jsonify(body), status


@bp.get("/security-score")
@jwt_required()
def security_score():
    db = get_db()
    user_id = get_jwt_identity()
    result = compute_security_score(db, user_id)
    db.users.update_one({"_id": user_id}, {"$set": {"security_score": result["security_score"]}})
    body, status = success(result)
    return jsonify(body), status


@bp.get("/login-history")
@jwt_required()
def login_history():
    db = get_db()
    user_id = get_jwt_identity()
    limit = min(int(request.args.get("limit", 50)), 200)
    events = list(
        db.login_events.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
    )
    body, status = success(serialize_many(events))
    return jsonify(body), status
