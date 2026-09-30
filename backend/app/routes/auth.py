from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt

from app.database.mongodb import get_db
from app.utils.helpers import new_id, now_utc, serialize_doc, success, error
from app.routes.login import analyze_and_record_login

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not name or not email or not password:
        body, status = error("Name, email and password are required", 400)
        return jsonify(body), status
    if len(password) < 8:
        body, status = error("Password must be at least 8 characters", 400)
        return jsonify(body), status

    db = get_db()
    if db.users.find_one({"email": email}):
        body, status = error("An account with this email already exists", 409)
        return jsonify(body), status

    user = {
        "_id": new_id(),
        "name": name,
        "email": email,
        "password_hash": generate_password_hash(password),
        "role": "user",
        "mfa_enabled": False,
        "security_score": 100,
        "created_at": now_utc(),
        "updated_at": now_utc(),
    }
    db.users.insert_one(user)

    token = create_access_token(identity=user["_id"], additional_claims={"role": "user"})
    body, status = success({"token": token, "user": serialize_doc({k: v for k, v in user.items() if k != "password_hash"})}, "Account created")
    return jsonify(body), status


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    device_id = data.get("device_id") or "unknown-device"
    device_name = data.get("device_name") or request.headers.get("User-Agent", "Unknown device")
    location = data.get("location") or "Unknown location"
    failed_attempts = int(data.get("failed_attempts", 0))

    db = get_db()
    user = db.users.find_one({"email": email})
    ip_address = request.remote_addr or "0.0.0.0"

    if not user or not check_password_hash(user["password_hash"], password):
        if user:
            analyze_and_record_login(
                user["_id"], ip_address, device_id, device_name, location,
                failed_attempts=failed_attempts + 1, login_success=False,
            )
        body, status = error("Invalid email or password", 401)
        return jsonify(body), status

    login_event = analyze_and_record_login(
        user["_id"], ip_address, device_id, device_name, location,
        failed_attempts=failed_attempts, login_success=True,
    )

    if login_event["action"] == "BLOCK":
        body, status = error(
            "This login was blocked due to unusual activity. Check your security events.", 403
        )
        return jsonify(body), status

    token = create_access_token(identity=user["_id"], additional_claims={"role": user.get("role", "user")})
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    body, status = success(
        {"token": token, "user": serialize_doc(safe_user), "login_event": serialize_doc(dict(login_event))},
        "Login successful",
    )
    return jsonify(body), status


@bp.get("/me")
@jwt_required()
def me():
    db = get_db()
    user_id = get_jwt_identity()
    user = db.users.find_one({"_id": user_id})
    if not user:
        body, status = error("User not found", 404)
        return jsonify(body), status
    safe_user = {k: v for k, v in user.items() if k != "password_hash"}
    body, status = success(serialize_doc(safe_user))
    return jsonify(body), status


@bp.post("/logout")
@jwt_required()
def logout():
    # Stateless JWT: client discards the token. Included for API completeness.
    body, status = success(message="Logged out")
    return jsonify(body), status
