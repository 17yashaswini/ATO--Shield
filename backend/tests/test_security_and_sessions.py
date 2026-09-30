def register_and_login(client, email="secuser@example.com"):
    client.post("/api/auth/register", json={"name": "Sec User", "email": email, "password": "Password123!"})
    resp = client.post("/api/auth/login", json={
        "email": email, "password": "Password123!",
        "device_id": "d1", "device_name": "Trusted Laptop", "location": "Bengaluru, IN",
    })
    return resp.get_json()["data"]["token"]


def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def test_sessions_list_after_login(client):
    token = register_and_login(client)
    resp = client.get("/api/sessions", headers=auth_headers(token))
    assert resp.status_code == 200
    assert len(resp.get_json()["data"]) >= 1


def test_session_revocation(client):
    token = register_and_login(client)
    sessions = client.get("/api/sessions", headers=auth_headers(token)).get_json()["data"]
    session_id = sessions[0]["id"]
    resp = client.post(f"/api/sessions/{session_id}/revoke", headers=auth_headers(token))
    assert resp.status_code == 200

    sessions_after = client.get("/api/sessions", headers=auth_headers(token)).get_json()["data"]
    revoked = [s for s in sessions_after if s["id"] == session_id][0]
    assert revoked["status"] == "REVOKED"


def test_revoking_unknown_session_returns_404(client):
    token = register_and_login(client)
    resp = client.post("/api/sessions/does-not-exist/revoke", headers=auth_headers(token))
    assert resp.status_code == 404


def test_non_admin_cannot_access_admin_dashboard(client):
    token = register_and_login(client)
    resp = client.get("/api/admin/dashboard", headers=auth_headers(token))
    assert resp.status_code == 403


def test_admin_can_access_admin_dashboard(client):
    client.post("/api/auth/register", json={
        "name": "Admin", "email": "admin@example.com", "password": "Password123!",
    })
    # promote to admin directly via the mocked db (simulating a seeded admin)
    from app.database.mongodb import get_db
    db = get_db()
    db.users.update_one({"email": "admin@example.com"}, {"$set": {"role": "admin"}})

    resp = client.post("/api/auth/login", json={
        "email": "admin@example.com", "password": "Password123!",
        "device_id": "ad1", "device_name": "Admin Laptop", "location": "Bengaluru, IN",
    })
    token = resp.get_json()["data"]["token"]
    dash = client.get("/api/admin/dashboard", headers=auth_headers(token))
    assert dash.status_code == 200
    assert "totals" in dash.get_json()["data"]


def test_security_events_endpoint_returns_list(client):
    token = register_and_login(client)
    resp = client.get("/api/security/events", headers=auth_headers(token))
    assert resp.status_code == 200
    assert isinstance(resp.get_json()["data"], list)
