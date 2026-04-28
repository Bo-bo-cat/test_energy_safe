from fastapi import APIRouter, Depends
from datetime import datetime, timezone
from typing import List

from app.database import get_database
from app.models.system import SystemCreate, SystemResponse, RecommendedSystemResponse
from app.auth import get_current_user_id

router = APIRouter(prefix="/systems", tags=["Systems (UPS)"])

_RECOMMENDED_UPS = [
    {
        "model": "EcoFlow RIVER 2",
        "type": "UPS",
        "power": 300,
        "battery": "256 Wh",
        "autonomy": "~2 год",
        "is_recommended": True,
    },
    {
        "model": "EcoFlow DELTA 2",
        "type": "UPS",
        "power": 1800,
        "battery": "1024 Wh",
        "autonomy": "~5 год",
        "is_recommended": True,
    },
    {
        "model": "Bluetti EB70S",
        "type": "UPS",
        "power": 800,
        "battery": "716 Wh",
        "autonomy": "~3 год",
        "is_recommended": True,
    },
    {
        "model": "Jackery Explorer 1000",
        "type": "UPS",
        "power": 1000,
        "battery": "1002 Wh",
        "autonomy": "~4 год",
        "is_recommended": True,
    },
    {
        "model": "Poweroak AC50S",
        "type": "UPS",
        "power": 500,
        "battery": "500 Wh",
        "autonomy": "~2.5 год",
        "is_recommended": True,
    },
]


async def seed_recommended_systems(db) -> None:
    existing = await db.systems.count_documents({"is_recommended": True})
    if existing == 0:
        await db.systems.insert_many(_RECOMMENDED_UPS)


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
    cursor = db.systems.find({"is_recommended": True})
    return [_serialize_recommended(doc) async for doc in cursor]


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
    """Створює нову UPS-систему і прив'язує її до поточного користувача."""
    db = get_database()
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
    result = await db.systems.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize_system(doc)


@router.get(
    "/my",
    response_model=List[SystemResponse],
    summary="Мої UPS-системи",
)
async def get_my_systems(user_id: str = Depends(get_current_user_id)):
    """Повертає всі UPS-системи, які створив поточний користувач."""
    db = get_database()
    cursor = db.systems.find({"user_id": user_id, "is_recommended": False})
    return [_serialize_system(doc) async for doc in cursor]
