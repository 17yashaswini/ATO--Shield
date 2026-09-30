"""
Populates MongoDB with realistic demo data:
1 admin, 4 users, normal + suspicious + blocked login events,
active sessions (incl. one suspicious), and contextual security events.

Run with: python seed.py
"""
from datetime import timedelta
from werkzeug.security import generate_password_hash

from app import create_app
from app.database.mongodb import get_db
from app.utils.helpers import new_id, now_utc
from app.routes.login import analyze_and_record_login

DEMO_PASSWORD = "Password123!"

USERS = [
    {"name": "Admin Analyst", "email": "admin@atoshield.dev", "role": "admin"},
    {"name": "Yashaswini Rao", "email": "yashu@atoshield.dev", "role": "user"},
    {"name": "Rahul Mehta", "email": "rahul@atoshield.dev", "role": "user"},
    {"name": "Priya Sharma", "email": "priya@atoshield.dev", "role": "user"},
    {"name": "Aman Verma", "email": "aman@atoshield.dev", "role": "user"},
]


def seed():
    app = create_app()
    with app.app_context():
        db = get_db()

        print("Clearing existing demo collections...")
        for coll in ["users", "login_events", "sessions", "security_events",
                     "security_recommendations", "notifications", "recovery_sessions"]:
            db[coll].delete_many({})

        user_ids = {}
        for u in USERS:
            uid = new_id()
            db.users.insert_one({
                "_id": uid,
                "name": u["name"],
                "email": u["email"],
                "password_hash": generate_password_hash(DEMO_PASSWORD),
                "role": u["role"],
                "mfa_enabled": u["role"] == "admin",
                "security_score": 100,
                "created_at": now_utc() - timedelta(days=90),
                "updated_at": now_utc(),
            })
            user_ids[u["email"]] = uid
        print(f"Created {len(USERS)} users (password for all: {DEMO_PASSWORD})")

        normal_user = user_ids["yashu@atoshield.dev"]

        # Build up normal login history so the model has a baseline for this user
        print("Seeding normal login history...")
        for i in range(15):
            ts_offset = timedelta(days=15 - i, hours=(-8 + (i % 5)))
            fake_ts = now_utc() - ts_offset
            analyze_and_record_login(
                normal_user, ip_address="103.21.244.10", device_id="trusted-laptop",
                device_name="Windows Laptop - Chrome", location="Bengaluru, IN",
                failed_attempts=0, login_success=True,
            )

        print("Seeding a suspicious (flagged) login...")
        analyze_and_record_login(
            normal_user, ip_address="41.203.72.11", device_id="unknown-phone",
            device_name="Unknown Android Device", location="Lagos, NG",
            failed_attempts=2, login_success=True,
        )

        print("Seeding a high-risk (blocked) account takeover attempt...")
        analyze_and_record_login(
            normal_user, ip_address="185.220.101.5", device_id="attacker-device",
            device_name="Unknown Linux Device", location="Bucharest, RO",
            failed_attempts=7, login_success=False,
        )

        # Light activity for the other demo users so admin charts aren't empty
        for email in ["rahul@atoshield.dev", "priya@atoshield.dev", "aman@atoshield.dev"]:
            uid = user_ids[email]
            for _ in range(4):
                analyze_and_record_login(
                    uid, ip_address="103.21.244.20", device_id=f"device-{email[:3]}",
                    device_name="MacBook - Safari", location="Bengaluru, IN",
                    failed_attempts=0, login_success=True,
                )
            analyze_and_record_login(
                uid, ip_address="45.155.204.9", device_id=f"suspicious-{email[:3]}",
                device_name="Unknown Windows Device", location="Moscow, RU",
                failed_attempts=4, login_success=True,
            )

        print("Seed complete.")
        print("\nDemo credentials:")
        for u in USERS:
            print(f"  {u['role']:5} -> {u['email']} / {DEMO_PASSWORD}")


if __name__ == "__main__":
    seed()
