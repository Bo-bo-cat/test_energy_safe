from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId

from app.database import get_database
from app.models.user import UserCreate, UserResponse

router = APIRouter(prefix="/users", tags=["Users"])


def _serialize_user(doc: dict) -> UserResponse:
    return UserResponse(
        id=str(doc["_id"]),
        email=doc["email"],
        name=doc["name"],
        has_inverter=doc["has_inverter"],
        inverter_capacity_wh=doc.get("inverter_capacity_wh"),
        created_at=doc["created_at"],
    )


@router.post("", response_model=UserResponse, status_code=201)
async def create_user(payload: UserCreate):
    db = get_database()

    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=409, detail="Користувач з таким email вже існує")

    doc = {
        "email": payload.email,
        "name": payload.name,
        "has_inverter": payload.has_inverter,
        "inverter_capacity_wh": payload.inverter_capacity_wh,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize_user(doc)


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    db = get_database()

    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний user_id")

    doc = await db.users.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    return _serialize_user(doc)
