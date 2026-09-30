def register(client, email="test@example.com", password="Password123!"):
    return client.post("/api/auth/register", json={
        "name": "Test User", "email": email, "password": password,
    })


def test_registration_success(client):
    resp = register(client)
    assert resp.status_code == 200
    data = resp.get_json()
    assert data["success"] is True
    assert "token" in data["data"]


def test_registration_duplicate_email_rejected(client):
    register(client)
    resp = register(client)
    assert resp.status_code == 409


def test_login_with_invalid_password(client):
    register(client)
    resp = client.post("/api/auth/login", json={
        "email": "test@example.com", "password": "wrong-password",
        "device_id": "d1", "device_name": "Test Device", "location": "Bengaluru, IN",
    })
    assert resp.status_code == 401
    assert resp.get_json()["success"] is False


def test_login_success_records_login_event(client, app):
    register(client)
    resp = client.post("/api/auth/login", json={
        "email": "test@example.com", "password": "Password123!",
        "device_id": "d1", "device_name": "Test Device", "location": "Bengaluru, IN",
    })
    assert resp.status_code == 200
    data = resp.get_json()["data"]
    assert "token" in data
    assert data["login_event"]["risk_level"] in ("LOW", "MEDIUM", "HIGH")


def test_protected_route_requires_token(client):
    resp = client.get("/api/auth/me")
    assert resp.status_code == 401


def test_protected_route_with_token(client):
    register(client)
    login_resp = client.post("/api/auth/login", json={
        "email": "test@example.com", "password": "Password123!",
        "device_id": "d1", "device_name": "Test Device", "location": "Bengaluru, IN",
    })
    token = login_resp.get_json()["data"]["token"]
    resp = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    assert resp.get_json()["data"]["email"] == "test@example.com"
