import uuid
from datetime import datetime
from bson import ObjectId


def now_utc():
    """
    Naive UTC datetime - intentional. MongoDB (via BSON) always stores
    datetimes as timezone-naive UTC, so every datetime we create or read
    back must stay naive to remain comparable across the codebase.
    """
    return datetime.utcnow()


def new_id():
    return str(uuid.uuid4())


def oid(id_str):
    """Safely convert a string to ObjectId, returns None on failure."""
    try:
        return ObjectId(id_str)
    except Exception:
        return None


def serialize_doc(doc):
    """Convert a Mongo document (dict) into a JSON-safe dict."""
    if doc is None:
        return None
    out = dict(doc)
    if "_id" in out:
        out["id"] = str(out.pop("_id"))
    for key, value in list(out.items()):
        if isinstance(value, datetime):
            out[key] = value.isoformat()
        if isinstance(value, ObjectId):
            out[key] = str(value)
    return out


def serialize_many(docs):
    return [serialize_doc(d) for d in docs]


def success(data=None, message=None, status=200):
    body = {"success": True}
    if message:
        body["message"] = message
    if data is not None:
        body["data"] = data
    return body, status


def error(message="Something went wrong", status=400):
    return {"success": False, "message": message}, status
