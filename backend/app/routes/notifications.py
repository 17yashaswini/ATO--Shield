from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.database.mongodb import get_db
from app.utils.helpers import serialize_many, success

bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")


@bp.get("")
@jwt_required()
def list_notifications():
    db = get_db()
    user_id = get_jwt_identity()
    items = list(db.notifications.find({"user_id": user_id}).sort("created_at", -1).limit(50))
    body, status = success(serialize_many(items))
    return jsonify(body), status


@bp.post("/<notification_id>/read")
@jwt_required()
def mark_read(notification_id):
    db = get_db()
    user_id = get_jwt_identity()
    db.notifications.update_one({"_id": notification_id, "user_id": user_id}, {"$set": {"read": True}})
    body, status = success(message="Marked as read")
    return jsonify(body), status
