from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from typing import List

from app.database import get_database
from app.models.device import (
    DeviceCreate, DeviceUpdate, DeviceResponse,
    ClassifyRequest, ClassifyResponse
)
from app.services.ai_service import lookup_device_specs
from app.auth import get_current_user_id

router = APIRouter(prefix="/devices", tags=["Devices"])


def _serialize_device(doc: dict) -> DeviceResponse:
    return DeviceResponse(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        model_name=doc["model_name"],
        category=doc["category"],
        power_watts=doc["power_watts"],
        startup_current_watts=doc.get("startup_current_watts"),
        brand=doc["brand"],
        daily_usage_hours=doc["daily_usage_hours"],
        is_critical=doc["is_critical"],
        created_at=doc["created_at"],
    )


async def _get_specs_with_cache(db, model_name: str) -> dict:
    """Check device_catalog first; call AI only on cache miss."""
    model_key = model_name.strip().lower()
    cached = await db.device_catalog.find_one({"model_key": model_key})
    if cached:
        return {
            "category": cached["category"],
            "power_watts": cached["power_watts"],
            "startup_current_watts": cached.get("startup_current_watts"),
            "brand": cached["brand"],
        }

    specs = await lookup_device_specs(model_name)

    await db.device_catalog.update_one(
        {"model_key": model_key},
        {"$setOnInsert": {
            "model_key": model_key,
            "model_name": model_name.strip(),
            "category": specs["category"],
            "power_watts": specs["power_watts"],
            "startup_current_watts": specs.get("startup_current_watts"),
            "brand": specs["brand"],
            "created_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )

    return {
        "category": specs["category"],
        "power_watts": specs["power_watts"],
        "startup_current_watts": specs.get("startup_current_watts"),
        "brand": specs["brand"],
    }


@router.post("/classify", response_model=ClassifyResponse)
async def classify_only(payload: ClassifyRequest):
    """Classify a device by model name without adding it (uses catalog cache)."""
    db = get_database()
    specs = await _get_specs_with_cache(db, payload.model_name)
    return ClassifyResponse(is_valid=True, **specs)


@router.post("", response_model=DeviceResponse, status_code=201)
async def create_device(
    payload: DeviceCreate,
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()

    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    if payload.category and payload.power_watts is not None:
        specs = {"category": payload.category, "power_watts": payload.power_watts, "brand": ""}
    else:
        specs = await _get_specs_with_cache(db, payload.model_name)

    doc = {
        "user_id": user_id,
        "model_name": payload.model_name.strip(),
        "category": specs["category"],
        "power_watts": specs["power_watts"],
        "brand": specs["brand"],
        "startup_current_watts": payload.startup_current_watts,
        "daily_usage_hours": payload.daily_usage_hours,
        "is_critical": payload.is_critical,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.devices.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize_device(doc)


@router.get("", response_model=List[DeviceResponse])
async def list_devices(user_id: str = Depends(get_current_user_id)):
    db = get_database()
    cursor = db.devices.find({"user_id": user_id})
    devices = []
    async for doc in cursor:
        devices.append(_serialize_device(doc))
    return devices


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(
    device_id: str,
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()

    try:
        oid = ObjectId(device_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний device_id")

    doc = await db.devices.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Пристрій не знайдено")
    if doc["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Доступ заборонено")

    return _serialize_device(doc)


@router.put("/{device_id}", response_model=DeviceResponse)
async def update_device(
    device_id: str,
    payload: DeviceUpdate,
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()

    try:
        oid = ObjectId(device_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний device_id")

    doc = await db.devices.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Пристрій не знайдено")
    if doc["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Доступ заборонено")

    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Немає даних для оновлення")

    if "model_name" in update_data:
        specs = await _get_specs_with_cache(db, update_data["model_name"])
        update_data["category"] = specs["category"]
        update_data["power_watts"] = specs["power_watts"]
        update_data["brand"] = specs["brand"]

    result = await db.devices.find_one_and_update(
        {"_id": oid},
        {"$set": update_data},
        return_document=True,
    )
    return _serialize_device(result)


@router.delete("/{device_id}", status_code=204)
async def delete_device(
    device_id: str,
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()

    try:
        oid = ObjectId(device_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний device_id")

    doc = await db.devices.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Пристрій не знайдено")
    if doc["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Доступ заборонено")

    await db.devices.delete_one({"_id": oid})
