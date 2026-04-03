from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from typing import List, Optional

from app.database import get_database
from app.models.scenario import ScenarioCreate, ScenarioResponse

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])


def _serialize_scenario(doc: dict) -> ScenarioResponse:
    return ScenarioResponse(
        id=str(doc["_id"]),
        user_id=doc["user_id"],
        name=doc["name"],
        duration_hours=doc["duration_hours"],
        devices_included=doc["devices_included"],
        total_consumption_wh=doc["total_consumption_wh"],
        battery_sufficient=doc.get("battery_sufficient"),
        created_at=doc["created_at"],
    )


@router.post("", response_model=ScenarioResponse, status_code=201)
async def create_scenario(payload: ScenarioCreate):
    db = get_database()

    # Verify user exists
    try:
        user_oid = ObjectId(payload.user_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний user_id")

    user = await db.users.find_one({"_id": user_oid})
    if not user:
        raise HTTPException(status_code=404, detail="Користувача не знайдено")

    # Validate and fetch all devices
    device_oids = []
    for did in payload.devices_included:
        try:
            device_oids.append(ObjectId(did))
        except InvalidId:
            raise HTTPException(status_code=400, detail=f"Невалідний device_id: {did}")

    cursor = db.devices.find({"_id": {"$in": device_oids}})
    devices = []
    async for doc in cursor:
        devices.append(doc)

    if len(devices) != len(device_oids):
        found_ids = {str(d["_id"]) for d in devices}
        missing = [did for did in payload.devices_included if did not in found_ids]
        raise HTTPException(
            status_code=404,
            detail=f"Пристрої не знайдено: {', '.join(missing)}"
        )

    # Calculate total consumption: sum(power_watts * duration_hours) for each device
    total_consumption_wh = sum(
        d["power_watts"] * payload.duration_hours for d in devices
    )

    # Determine battery sufficiency
    battery_sufficient: Optional[bool] = None
    if user.get("has_inverter") and user.get("inverter_capacity_wh") is not None:
        battery_sufficient = total_consumption_wh <= user["inverter_capacity_wh"]

    doc = {
        "user_id": payload.user_id,
        "name": payload.name,
        "duration_hours": payload.duration_hours,
        "devices_included": payload.devices_included,
        "total_consumption_wh": total_consumption_wh,
        "battery_sufficient": battery_sufficient,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.scenarios.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize_scenario(doc)


@router.get("", response_model=List[ScenarioResponse])
async def list_scenarios(user_id: str = Query(..., description="ID користувача")):
    db = get_database()
    cursor = db.scenarios.find({"user_id": user_id})
    scenarios = []
    async for doc in cursor:
        scenarios.append(_serialize_scenario(doc))
    return scenarios


@router.get("/{scenario_id}", response_model=ScenarioResponse)
async def get_scenario(scenario_id: str):
    db = get_database()

    try:
        oid = ObjectId(scenario_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний scenario_id")

    doc = await db.scenarios.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Сценарій не знайдено")

    return _serialize_scenario(doc)


@router.delete("/{scenario_id}", status_code=204)
async def delete_scenario(scenario_id: str):
    db = get_database()

    try:
        oid = ObjectId(scenario_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний scenario_id")

    result = await db.scenarios.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Сценарій не знайдено")
