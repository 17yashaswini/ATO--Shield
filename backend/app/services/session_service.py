from app.utils.helpers import new_id, now_utc


def create_session(db, user_id, device_id, device_name, ip_address, location, is_suspicious=False):
    session = {
        "_id": new_id(),
        "user_id": user_id,
        "device_id": device_id,
        "device_name": device_name,
        "ip_address": ip_address,
        "location": location,
        "created_at": now_utc(),
        "last_active": now_utc(),
        "status": "ACTIVE",
        "is_suspicious": is_suspicious,
    }
    db.sessions.insert_one(session)
    return session


def revoke_session(db, user_id, session_id):
    result = db.sessions.update_one(
        {"_id": session_id, "user_id": user_id, "status": "ACTIVE"},
        {"$set": {"status": "REVOKED"}},
    )
    if result.modified_count:
        db.security_events.insert_one({
            "_id": new_id(),
            "user_id": user_id,
            "event_type": "SESSION_REVOKED",
            "severity": "LOW",
            "description": "A session was revoked by the user.",
            "timestamp": now_utc(),
            "related_login_id": None,
            "resolved": True,
        })
        return True
    return False


def revoke_all_other_sessions(db, user_id, keep_session_id=None):
    query = {"user_id": user_id, "status": "ACTIVE"}
    if keep_session_id:
        query["_id"] = {"$ne": keep_session_id}
    result = db.sessions.update_many(query, {"$set": {"status": "REVOKED"}})
    if result.modified_count:
        db.security_events.insert_one({
            "_id": new_id(),
            "user_id": user_id,
            "event_type": "ALL_SESSIONS_REVOKED",
            "severity": "LOW",
            "description": f"{result.modified_count} other session(s) were signed out.",
            "timestamp": now_utc(),
            "related_login_id": None,
            "resolved": True,
        })
    return result.modified_count
