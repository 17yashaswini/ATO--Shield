def generate_recommendations(db, user_id):
    """
    Builds recommendations from the user's actual current account state.
    Never returns generic/random tips unrelated to real conditions.
    """
    recs = []

    suspicious_sessions = list(db.sessions.find({
        "user_id": user_id, "status": "ACTIVE", "is_suspicious": True,
    }))
    if suspicious_sessions:
        recs.append({
            "id": "revoke-suspicious-session",
            "title": "Revoke the suspicious session",
            "description": f"{len(suspicious_sessions)} suspicious session(s) are still active on your account.",
            "priority": "HIGH",
            "action": "REVOKE_SESSION",
        })

    unresolved_high = db.security_events.count_documents({
        "user_id": user_id, "severity": "HIGH", "resolved": False,
    })
    if unresolved_high:
        recs.append({
            "id": "review-high-risk-events",
            "title": "Review unresolved high-risk events",
            "description": "You have security events that haven't been confirmed or resolved yet.",
            "priority": "HIGH",
            "action": "REVIEW_EVENTS",
        })

    recent_failed = db.login_events.count_documents({
        "user_id": user_id, "login_success": False,
    })
    if recent_failed >= 3:
        recs.append({
            "id": "change-password",
            "title": "Consider changing your password",
            "description": "Multiple failed login attempts were recorded on your account.",
            "priority": "MEDIUM",
            "action": "CHANGE_PASSWORD",
        })

    active_sessions = db.sessions.count_documents({"user_id": user_id, "status": "ACTIVE"})
    if active_sessions > 3:
        recs.append({
            "id": "review-devices",
            "title": "Review devices currently signed in",
            "description": f"You have {active_sessions} active sessions across devices.",
            "priority": "LOW",
            "action": "REVIEW_SESSIONS",
        })

    user = db.users.find_one({"_id": user_id})
    if user and not user.get("mfa_enabled"):
        recs.append({
            "id": "enable-mfa",
            "title": "Strengthen account authentication",
            "description": "Additional authentication is not currently enabled on your account.",
            "priority": "MEDIUM",
            "action": "ENABLE_MFA",
        })

    return recs
