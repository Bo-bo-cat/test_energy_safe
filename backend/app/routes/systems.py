from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timezone
from typing import List
from bson import ObjectId
from bson.errors import InvalidId

from app.database import get_database, col
from app.models.system import (
    SystemCreate, SystemByName, SystemUpdate,
    SystemResponse, RecommendedSystemResponse,
)
from app.services.ai_service import lookup_ups_specs
from app.auth import get_current_user_id

router = APIRouter(prefix="/systems", tags=["Systems (UPS)"])

_RECOMMENDED_UPS = [
    {
        "model": "EcoFlow RIVER 2",
        "type": "Портативна електростанція",
        "power": 300,
        "battery": "256 Wh",
        "autonomy": "~2 год",
        "is_recommended": True,
    },
    {
        "model": "EcoFlow DELTA 2",
        "type": "Портативна електростанція",
        "power": 1800,
        "battery": "1024 Wh",
        "autonomy": "~5 год",
        "is_recommended": True,
    },
    {
        "model": "Bluetti EB70S",
        "type": "Акумуляторна станція",
        "power": 800,
        "battery": "716 Wh",
        "autonomy": "~3 год",
        "is_recommended": True,
    },
    {
        "model": "Jackery Explorer 1000",
        "type": "Портативна електростанція",
        "power": 1000,
        "battery": "1002 Wh",
        "autonomy": "~4 год",
        "is_recommended": True,
    },
]


async def seed_recommended_systems(db) -> None:
    existing = await db[col("systems")].count_documents({"is_recommended": True})
    if existing == 0:
        await db[col("systems")].insert_many(_RECOMMENDED_UPS)


def _serialize_system(doc: dict) -> SystemResponse:
    return SystemResponse(
        id=str(doc["_id"]),
        model=doc["model"],
        type=doc["type"],
        power=doc["power"],
        battery=doc["battery"],
        autonomy=doc["autonomy"],
        user_id=doc.get("user_id", ""),
        selected_for_calculation=doc.get("selected_for_calculation", False),
        created_at=doc.get("created_at", datetime.now(timezone.utc)),
    )


def _serialize_recommended(doc: dict) -> RecommendedSystemResponse:
    return RecommendedSystemResponse(
        id=str(doc["_id"]),
        model=doc["model"],
        type=doc["type"],
        power=doc["power"],
        battery=doc["battery"],
        autonomy=doc["autonomy"],
    )


@router.get(
    "/recommended",
    response_model=List[RecommendedSystemResponse],
    summary="Каталог рекомендованих UPS-систем",
)
async def get_recommended_systems():
    """Повертає список рекомендованих UPS-моделей. Авторизація не потрібна."""
    db = get_database()
    await seed_recommended_systems(db)
    cursor = db[col("systems")].find({"is_recommended": True})
    return [_serialize_recommended(doc) async for doc in cursor]


@router.get(
    "/my",
    response_model=List[SystemResponse],
    summary="Мої UPS-системи",
)
async def get_my_systems(user_id: str = Depends(get_current_user_id)):
    """Повертає всі UPS-системи, які створив поточний користувач."""
    db = get_database()
    cursor = db[col("systems")].find({"user_id": user_id, "is_recommended": False})
    return [_serialize_system(doc) async for doc in cursor]


@router.get(
    "/selected",
    response_model=List[SystemResponse],
    summary="ДБЖ, позначені для розрахунку",
)
async def get_selected_systems(user_id: str = Depends(get_current_user_id)):
    """Повертає тільки ті системи користувача, де selected_for_calculation=True."""
    db = get_database()
    cursor = db[col("systems")].find({
        "user_id": user_id,
        "is_recommended": False,
        "selected_for_calculation": True,
    })
    return [_serialize_system(doc) async for doc in cursor]


@router.post(
    "/by-name",
    response_model=SystemResponse,
    status_code=201,
    summary="Додати систему за назвою (Groq lookup)",
)
async def add_system_by_name(
    payload: SystemByName,
    user_id: str = Depends(get_current_user_id),
):
    """Шукає характеристики ДБЖ/генератора через Groq і зберігає систему користувача."""
    db = get_database()

    count = await db[col("systems")].count_documents({"user_id": user_id, "is_recommended": False})
    if count >= 6:
        raise HTTPException(status_code=400, detail="Максимум 6 систем на користувача")

    specs = await lookup_ups_specs(payload.model)

    doc = {
        "model": payload.model.strip(),
        "type": specs["type"],
        "power": specs["power"],
        "battery": specs["battery"],
        "autonomy": specs["autonomy"],
        "user_id": user_id,
        "selected_for_calculation": False,
        "is_recommended": False,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db[col("systems")].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize_system(doc)


@router.post(
    "",
    response_model=SystemResponse,
    status_code=201,
    summary="Створити власну UPS-систему",
)
async def create_system(
    payload: SystemCreate,
    user_id: str = Depends(get_current_user_id),
):
    """Створює нову UPS-систему з усіма полями і прив'язує її до поточного користувача."""
    db = get_database()

    count = await db[col("systems")].count_documents({"user_id": user_id, "is_recommended": False})
    if count >= 6:
        raise HTTPException(status_code=400, detail="Максимум 6 систем на користувача")

    doc = {
        "model": payload.model.strip(),
        "type": payload.type,
        "power": payload.power,
        "battery": payload.battery,
        "autonomy": payload.autonomy,
        "user_id": user_id,
        "selected_for_calculation": payload.selected_for_calculation,
        "is_recommended": False,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db[col("systems")].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize_system(doc)


@router.patch(
    "/{system_id}",
    response_model=SystemResponse,
    summary="Оновити систему (чекбокс)",
)
async def update_system(
    system_id: str,
    payload: SystemUpdate,
    user_id: str = Depends(get_current_user_id),
):
    """Оновлює поле selected_for_calculation."""
    db = get_database()

    try:
        oid = ObjectId(system_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний system_id")

    doc = await db[col("systems")].find_one({"_id": oid, "user_id": user_id, "is_recommended": False})
    if not doc:
        raise HTTPException(status_code=404, detail="Систему не знайдено")

    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Немає даних для оновлення")

    result = await db[col("systems")].find_one_and_update(
        {"_id": oid},
        {"$set": update_data},
        return_document=True,
    )
    return _serialize_system(result)


@router.delete(
    "/{system_id}",
    status_code=204,
    summary="Видалити систему",
)
async def delete_system(
    system_id: str,
    user_id: str = Depends(get_current_user_id),
):
    """Видаляє систему поточного користувача."""
    db = get_database()

    try:
        oid = ObjectId(system_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний system_id")

    doc = await db[col("systems")].find_one({"_id": oid, "user_id": user_id, "is_recommended": False})
    if not doc:
        raise HTTPException(status_code=404, detail="Систему не знайдено")

    await db[col("systems")].delete_one({"_id": oid})
