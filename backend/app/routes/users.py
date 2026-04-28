from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
import bcrypt

from app.database import get_database
from app.models.user import UserCreate, UserLogin, UserResponse, TokenResponse
from app.auth import create_access_token, get_current_user_id

router = APIRouter(prefix="/users", tags=["Users"])


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def _verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))


def _serialize_user(doc: dict) -> UserResponse:
    return UserResponse(
        id=str(doc["_id"]),
        email=doc["email"],
        name=doc["name"],
        has_inverter=doc["has_inverter"],
        inverter_capacity_wh=doc.get("inverter_capacity_wh"),
        created_at=doc["created_at"],
    )


@router.post("/login", response_model=TokenResponse)
async def login_user(payload: UserLogin):
    db = get_database()
    doc = await db.users.find_one({"email": payload.email})
    if not doc:
        raise HTTPException(status_code=401, detail="Невірний email або пароль")
    if not _verify_password(payload.password, doc.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Невірний email або пароль")
    user_id = str(doc["_id"])
    return TokenResponse(
        access_token=create_access_token(user_id),
        user_id=user_id,
        user_name=doc["name"],
    )


@router.post("", response_model=TokenResponse, status_code=201)
async def create_user(payload: UserCreate):
    db = get_database()

    existing = await db.users.find_one({"email": payload.email})
    if existing:
        raise HTTPException(status_code=409, detail="Користувач з таким email вже існує")

    doc = {
        "email": payload.email,
        "name": payload.name,
        "password_hash": _hash_password(payload.password),
        "has_inverter": payload.has_inverter,
        "inverter_capacity_wh": payload.inverter_capacity_wh,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(doc)
    user_id = str(result.inserted_id)
    return TokenResponse(
        access_token=create_access_token(user_id),
        user_id=user_id,
        user_name=doc["name"],
    )


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


@router.delete("/me", status_code=204)
async def delete_account(user_id: str = Depends(get_current_user_id)):
    db = get_database()
    oid = ObjectId(user_id)
    await db.devices.delete_many({"user_id": user_id})
    await db.systems.delete_many({"user_id": user_id})
    await db.users.delete_one({"_id": oid})
