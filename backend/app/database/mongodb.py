from pymongo import MongoClient, ASCENDING
from app.config import Config

_client = None
_db = None


def get_db():
    global _client, _db
    if _db is None:
        _client = MongoClient(Config.MONGO_URI)
        _db = _client[Config.MONGO_DB_NAME]
        _ensure_indexes(_db)
    return _db


def _ensure_indexes(db):
    db.users.create_index([("email", ASCENDING)], unique=True)
    db.login_events.create_index([("user_id", ASCENDING), ("timestamp", ASCENDING)])
    db.sessions.create_index([("user_id", ASCENDING)])
    db.security_events.create_index([("user_id", ASCENDING), ("timestamp", ASCENDING)])
    db.security_recommendations.create_index([("user_id", ASCENDING)])
    db.notifications.create_index([("user_id", ASCENDING), ("created_at", ASCENDING)])
    db.recovery_sessions.create_index([("user_id", ASCENDING), ("status", ASCENDING)])
