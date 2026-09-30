import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
import mongomock

os.environ.setdefault("MONGO_URI", "mongodb://localhost:27017")
os.environ.setdefault("SECRET_KEY", "test-secret")
os.environ.setdefault("JWT_SECRET_KEY", "test-jwt-secret")

import app.database.mongodb as mongodb_module

_client = mongomock.MongoClient()
_db = _client["ato_shield_test"]


MODULES_USING_GET_DB = [
    "app.routes.auth",
    "app.routes.users",
    "app.routes.login",
    "app.routes.sessions",
    "app.routes.security",
    "app.routes.recovery",
    "app.routes.admin",
    "app.routes.notifications",
]


@pytest.fixture(autouse=True)
def patch_db(monkeypatch):
    import importlib

    # Reset all collections between tests
    for name in _db.list_collection_names():
        _db[name].delete_many({})

    monkeypatch.setattr(mongodb_module, "get_db", lambda: _db)
    for mod_name in MODULES_USING_GET_DB:
        mod = importlib.import_module(mod_name)
        if hasattr(mod, "get_db"):
            monkeypatch.setattr(mod, "get_db", lambda: _db)
    yield _db


@pytest.fixture
def app():
    from app import create_app
    flask_app = create_app()
    flask_app.config.update(TESTING=True)
    return flask_app


@pytest.fixture
def client(app):
    return app.test_client()
