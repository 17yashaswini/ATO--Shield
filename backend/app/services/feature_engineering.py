from app.utils.helpers import now_utc


def compute_login_features(db, user_id, ip_address, device_id, location, failed_attempts, timestamp=None):
    """
    Looks at a user's historical login_events to build the numerical
    feature vector expected by the Isolation Forest model.
    """
    timestamp = timestamp or now_utc()

    history = list(db.login_events.find({"user_id": user_id, "login_success": True}))

    known_devices = {h["device_id"] for h in history if h.get("device_id")}
    known_locations = {h["location"] for h in history if h.get("location")}

    is_new_device = 0 if device_id in known_devices else 1
    is_new_location = 0 if location in known_locations else 1

    # login frequency: successful logins in the last 30 days
    thirty_days_ago = timestamp.timestamp() - 30 * 24 * 3600
    recent = [h for h in history if h.get("timestamp") and h["timestamp"].timestamp() >= thirty_days_ago]
    login_frequency = max(1, len(recent))

    # time since previous login, in hours
    prev_logins = sorted(
        [h["timestamp"] for h in history if h.get("timestamp") and h["timestamp"] < timestamp],
        reverse=True,
    )
    if prev_logins:
        time_since_previous_login = max(0.01, (timestamp - prev_logins[0]).total_seconds() / 3600)
    else:
        time_since_previous_login = 720.0  # first login ever -> treat as long gap

    device_count = len(known_devices | {device_id})
    location_count = len(known_locations | {location})

    features = {
        "failed_attempts": failed_attempts,
        "login_hour": timestamp.hour,
        "is_new_device": is_new_device,
        "is_new_location": is_new_location,
        "login_frequency": login_frequency,
        "time_since_previous_login": time_since_previous_login,
        "device_count": device_count,
        "location_count": location_count,
    }
    return features
