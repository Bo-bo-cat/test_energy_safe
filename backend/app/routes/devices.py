from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from typing import List

from app.database import get_database
from app.models.device import (
    DeviceCreate, DeviceUpdate, DeviceResponse,
    ClassifyRequest, ClassifyResponse
)
from app.services.gemini_service import classify_device

router = APIRouter(prefix="/devices", tags=["Devices"])


def _serialize_device(doc: dict) -> DeviceResponse:
    return DeviceResponse(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        model_name=doc["model_name"],
        category=doc["category"],
        power_watts=doc["power_watts"],
        brand=doc["brand"],
        daily_usage_hours=doc["daily_usage_hours"],
        is_critical=doc["is_critical"],
        created_at=doc["created_at"],
    )


@router.post("/classify", response_model=ClassifyResponse)
async def classify_only(payload: ClassifyRequest):
    result = await classify_device(payload.model_name)
    return ClassifyResponse(**result)


@router.post("", response_model=DeviceResponse, status_code=201)
async def create_device(payload: DeviceCreate):
    db = get_database()

    # Verify user exists
    try:
        user_oid = ObjectId(payload.user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний user_id")

    user = await db.users.find_one({"_id": user_oid})
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    # Classify via Gemini
    classification = await classify_device(payload.model_name)

    doc = {
        "user_id": payload.user_id,
        "model_name": payload.model_name,
        "category": classification["category"],
        "power_watts": payload.power_watts,
        "brand": payload.brand,
        "daily_usage_hours": payload.daily_usage_hours,
        "is_critical": payload.is_critical,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.devices.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize_device(doc)


@router.get("", response_model=List[DeviceResponse])
async def list_devices(user_id: str = Query(..., description="ID користувача")):
    db = get_database()
    cursor = db.devices.find({"user_id": user_id})
    devices = []
    async for doc in cursor:
        devices.append(_serialize_device(doc))
    return devices


@router.get("/{device_id}", response_model=DeviceResponse)
async def get_device(device_id: str):
    db = get_database()

    try:
        oid = ObjectId(device_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний device_id")

    doc = await db.devices.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Пристрій не знайдено")

    return _serialize_device(doc)


@router.put("/{device_id}", response_model=DeviceResponse)
async def update_device(device_id: str, payload: DeviceUpdate):
    db = get_database()

    try:
        oid = ObjectId(device_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний device_id")

    update_data = payload.model_dump(exclude_none=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="Немає даних для оновлення")

    # If model_name changes, re-classify
    if "model_name" in update_data:
        classification = await classify_device(update_data["model_name"])
        update_data["category"] = classification["category"]

    result = await db.devices.find_one_and_update(
        {"_id": oid},
        {"$set": update_data},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Пристрій не знайдено")

    return _serialize_device(result)


@router.delete("/{device_id}", status_code=204)
async def delete_device(device_id: str):
    db = get_database()

    try:
        oid = ObjectId(device_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний device_id")

    result = await db.devices.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Пристрій не знайдено")
