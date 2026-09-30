from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.database.mongodb import get_db
from app.services import session_service
from app.utils.helpers import serialize_many, success, error

bp = Blueprint("sessions", __name__, url_prefix="/api/sessions")


@bp.get("")
@jwt_required()
def list_sessions():
    db = get_db()
    user_id = get_jwt_identity()
    sessions = list(db.sessions.find({"user_id": user_id}).sort("last_active", -1))
    body, status = success(serialize_many(sessions))
    return jsonify(body), status


@bp.post("/<session_id>/revoke")
@jwt_required()
def revoke(session_id):
    db = get_db()
    user_id = get_jwt_identity()
    ok = session_service.revoke_session(db, user_id, session_id)
    if not ok:
        body, status = error("Session not found or already revoked", 404)
        return jsonify(body), status
    body, status = success(message="Session revoked")
    return jsonify(body), status


@bp.post("/revoke-others")
@jwt_required()
def revoke_others():
    db = get_db()
    user_id = get_jwt_identity()
    count = session_service.revoke_all_other_sessions(db, user_id)
    body, status = success({"revoked_count": count}, "Other sessions signed out")
    return jsonify(body), status
