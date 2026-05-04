from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from typing import List, Optional

from app.database import get_database
from app.models.scenario import ScenarioCreate, ScenarioResponse
from app.auth import get_current_user_id

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])


def _serialize_scenario(doc: dict) -> ScenarioResponse:
    return ScenarioResponse(
        id=str(doc["_id"]),
        userId=doc["userId"],
        name=doc["name"],
        selectedDeviceIds=doc["selectedDeviceIds"],
        selectedSystemId=doc.get("selectedSystemId"),
        totalPowerWatts=doc["totalPowerWatts"],
        loadPercent=doc["loadPercent"],
        autonomyHours=doc["autonomyHours"],
        createdAt=doc["createdAt"],
    )


@router.post("", response_model=ScenarioResponse, status_code=201)
async def create_scenario(
    payload: ScenarioCreate,
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()

    device_oids = []
    for did in payload.selectedDeviceIds:
        try:
            device_oids.append(ObjectId(did))
        except InvalidId:
            raise HTTPException(status_code=400, detail=f"Невалідний device_id: {did}")

    cursor = db.devices.find({"_id": {"$in": device_oids}, "user_id": user_id})
    devices = []
    async for doc in cursor:
        devices.append(doc)

    if len(devices) != len(device_oids):
        found_ids = {str(d["_id"]) for d in devices}
        missing = [did for did in payload.selectedDeviceIds if did not in found_ids]
        raise HTTPException(
            status_code=404,
            detail=f"Пристрої не знайдено або не належать вам: {', '.join(missing)}"
        )

    selected_system_id: Optional[str] = None
    if payload.selectedSystemId is not None:
        try:
            system_oid = ObjectId(payload.selectedSystemId)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Невалідний selectedSystemId")

        system = await db.systems.find_one({"_id": system_oid, "user_id": user_id})
        if not system:
            raise HTTPException(status_code=404, detail="Систему не знайдено або вона належить іншому користувачу")
        selected_system_id = payload.selectedSystemId

    doc = {
        "userId": user_id,
        "name": payload.name,
        "selectedDeviceIds": payload.selectedDeviceIds,
        "selectedSystemId": selected_system_id,
        "totalPowerWatts": payload.totalPowerWatts,
        "loadPercent": payload.loadPercent,
        "autonomyHours": payload.autonomyHours,
        "createdAt": datetime.now(timezone.utc),
    }
    result = await db.scenarios.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize_scenario(doc)


@router.get("", response_model=List[ScenarioResponse])
async def list_scenarios(user_id: str = Depends(get_current_user_id)):
    db = get_database()
    cursor = db.scenarios.find({"userId": user_id})
    scenarios = []
    async for doc in cursor:
        scenarios.append(_serialize_scenario(doc))
    return scenarios


@router.get("/{scenario_id}", response_model=ScenarioResponse)
async def get_scenario(
    scenario_id: str,
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()

    try:
        oid = ObjectId(scenario_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний scenario_id")

    doc = await db.scenarios.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Сценарій не знайдено")
    if doc["userId"] != user_id:
        raise HTTPException(status_code=403, detail="Доступ заборонено")

    return _serialize_scenario(doc)


@router.delete("/{scenario_id}", status_code=204)
async def delete_scenario(
    scenario_id: str,
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()

    try:
        oid = ObjectId(scenario_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний scenario_id")

    doc = await db.scenarios.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Сценарій не знайдено")
    if doc["userId"] != user_id:
        raise HTTPException(status_code=403, detail="Доступ заборонено")

    await db.scenarios.delete_one({"_id": oid})
