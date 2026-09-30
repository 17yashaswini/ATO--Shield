from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from app.config import Config
from app.middleware.error_handler import register_error_handlers

jwt = JWTManager()
limiter = Limiter(key_func=get_remote_address, default_limits=[Config.RATE_LIMIT_DEFAULT])


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/api/*": {"origins": Config.FRONTEND_ORIGIN}}, supports_credentials=True)
    jwt.init_app(app)
    limiter.init_app(app)

    register_error_handlers(app)

    from app.routes import auth, users, sessions, security, recovery, admin, notifications

    app.register_blueprint(auth.bp)
    app.register_blueprint(users.bp)
    app.register_blueprint(sessions.bp)
    app.register_blueprint(security.bp)
    app.register_blueprint(recovery.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(notifications.bp)

    limiter.limit(Config.RATE_LIMIT_LOGIN)(auth.bp)

    @app.get("/api/health")
    def health():
        return {"success": True, "message": "ATO Shield API is running"}

    return app
