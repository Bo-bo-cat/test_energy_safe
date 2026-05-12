from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
import bcrypt

from app.database import get_database, col
from app.models.user import UserCreate, UserLogin, UserResponse, TokenResponse, UserProfileResponse, ChangePasswordRequest
from app.auth import create_access_token, get_current_user_id

router = APIRouter(prefix="/users", tags=["Users"])


def _hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def _verify_password(password: str, hashed: str | None) -> bool:
    if not hashed:
        return False
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
    doc = await db[col("users")].find_one({"email": payload.email})
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

    existing = await db[col("users")].find_one({"email": payload.email})
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
    result = await db[col("users")].insert_one(doc)
    user_id = str(result.inserted_id)
    return TokenResponse(
        access_token=create_access_token(user_id),
        user_id=user_id,
        user_name=doc["name"],
    )


@router.get("/me", response_model=UserProfileResponse)
async def get_my_profile(user_id: str = Depends(get_current_user_id)):
    db = get_database()

    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний ідентифікатор")

    doc = await db[col("users")].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    parts = doc["name"].split()
    initials = "".join(p[0].upper() for p in parts[:2] if p)

    return UserProfileResponse(
        id=str(doc["_id"]),
        email=doc["email"],
        name=doc["name"],
        initials=initials,
        theme=doc.get("theme"),
    )


# --- НОВИЙ ЕНДПОІНТ ДЛЯ ЗМІНИ ІМЕНІ (ТА ІНШИХ ДАНИХ) ---
@router.patch("/me", response_model=UserResponse)
async def update_profile(payload: dict, user_id: str = Depends(get_current_user_id)):
    db = get_database()
    
    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний ідентифікатор")
        
    # Дозволяємо оновлювати тільки безпечні поля (name, theme тощо)
    update_data = {k: v for k, v in payload.items() if k in ["name", "theme"]}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="Немає даних для оновлення")
        
    await db[col("users")].update_one({"_id": oid}, {"$set": update_data})
    doc = await db[col("users")].find_one({"_id": oid})
    
    if not doc:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")
        
    return _serialize_user(doc)
# --------------------------------------------------------


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str, current_user_id: str = Depends(get_current_user_id)):
    if user_id != current_user_id:
        raise HTTPException(status_code=403, detail="Доступ заборонено")

    db = get_database()

    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний user_id")

    doc = await db[col("users")].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    return _serialize_user(doc)


@router.patch("/me/password", status_code=204)
async def change_password(payload: ChangePasswordRequest, user_id: str = Depends(get_current_user_id)):
    db = get_database()

    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний ідентифікатор")

    doc = await db[col("users")].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    if not doc.get("password_hash"):
        raise HTTPException(status_code=400, detail="Акаунт створено через Google — пароль не встановлено")

    if not _verify_password(payload.old_password, doc.get("password_hash")):
        raise HTTPException(status_code=400, detail="Невірний поточний пароль")

    await db[col("users")].update_one({"_id": oid}, {"$set": {"password_hash": _hash_password(payload.new_password)}})


@router.delete("/me", status_code=204)
async def delete_account(user_id: str = Depends(get_current_user_id)):
    db = get_database()

    try:
        oid = ObjectId(user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний ідентифікатор користувача")

    user = await db[col("users")].find_one({"_id": oid})
    if not user:
        raise HTTPException(status_code=404, detail="Акаунт не знайдено або вже видалено")

    try:
        await db[col("devices")].delete_many({"user_id": user_id})
        await db[col("systems")].delete_many({"user_id": user_id})
        result = await db[col("users")].delete_one({"_id": oid})
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Помилка при видаленні акаунту. Спробуйте ще раз пізніше",
        )

    if result.deleted_count == 0:
        raise HTTPException(status_code=500, detail="Акаунт не вдалося видалити")