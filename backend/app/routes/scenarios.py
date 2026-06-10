from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from bson import ObjectId
from bson.errors import InvalidId
from typing import List, Optional

from app.database import get_database, col
from app.models.scenario import (
    ScenarioCreate, ScenarioResponse,
    DeviceSnapshot, DeviceUsageItem, SystemSnapshot,
)
from app.auth import get_current_user_id

router = APIRouter(prefix="/scenarios", tags=["Scenarios"])


def _build_device_snapshot(doc: dict) -> DeviceSnapshot:
    return DeviceSnapshot(
        id=str(doc["_id"]),
        model_name=doc["model_name"],
        category=doc.get("category", ""),
        power_watts=doc.get("power_watts", 0.0),
        startup_current_watts=doc.get("startup_current_watts"),
        brand=doc.get("brand", ""),
        is_critical=doc.get("is_critical", False),
        daily_usage_hours=doc.get("daily_usage_hours", 0.0),
        tag=doc.get("tag"),
    )


def _build_system_snapshot(doc: dict) -> SystemSnapshot:
    return SystemSnapshot(
        id=str(doc["_id"]),
        model=doc["model"],
        type=doc.get("type", "ДБЖ"),
        power=doc["power"],
        battery=doc.get("battery", ""),
        autonomy=doc.get("autonomy", ""),
    )


def _serialize_scenario(doc: dict) -> ScenarioResponse:
    # Backward compat: old docs have selectedDeviceIds, new have selectedDevices
    if "selectedDevices" in doc and doc["selectedDevices"]:
        selected_devices = [DeviceUsageItem(**item) for item in doc["selectedDevices"]]
    else:
        selected_devices = [
            DeviceUsageItem(deviceId=did, usageHours=24.0)
            for did in doc.get("selectedDeviceIds", [])
        ]

    selected_device_ids = [item.deviceId for item in selected_devices]

    devices_snapshot: Optional[List[DeviceSnapshot]] = None
    raw_devices = doc.get("devicesSnapshot")
    if raw_devices is not None:
        devices_snapshot = [DeviceSnapshot(**d) for d in raw_devices]

    system_snapshot: Optional[SystemSnapshot] = None
    raw_system = doc.get("systemSnapshot")
    if raw_system is not None:
        system_snapshot = SystemSnapshot(**raw_system)

    return ScenarioResponse(
        id=str(doc["_id"]),
        userId=doc["userId"],
        name=doc["name"],
        selectedDeviceIds=selected_device_ids,
        selectedDevices=selected_devices,
        selectedSystemId=doc.get("selectedSystemId"),
        totalPowerWatts=doc["totalPowerWatts"],
        loadPercent=doc["loadPercent"],
        autonomyHours=doc["autonomyHours"],
        devicesSnapshot=devices_snapshot,
        systemSnapshot=system_snapshot,
        createdAt=doc["createdAt"],
    )


@router.post("", response_model=ScenarioResponse, status_code=201)
async def create_scenario(
    payload: ScenarioCreate,
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()

    device_ids = [item.deviceId for item in payload.selectedDevices]

    device_oids = []
    for did in device_ids:
        try:
            device_oids.append(ObjectId(did))
        except InvalidId:
            raise HTTPException(status_code=400, detail=f"Невалідний device_id: {did}")

    cursor = db[col("devices")].find({"_id": {"$in": device_oids}, "user_id": user_id})
    devices = []
    async for doc in cursor:
        devices.append(doc)

    # Missing devices are OK (may have been deleted) — only validate found ones belong to user
    found_ids = {str(d["_id"]) for d in devices}
    device_map = {str(d["_id"]): d for d in devices}

    # Build snapshots in original request order; skip deleted devices gracefully
    devices_snapshot = [
        _build_device_snapshot(device_map[did]).model_dump()
        for did in device_ids
        if did in found_ids
    ]

    selected_system_id: Optional[str] = None
    system_snapshot: Optional[dict] = None

    if payload.selectedSystemId is not None:
        try:
            system_oid = ObjectId(payload.selectedSystemId)
        except InvalidId:
            raise HTTPException(status_code=400, detail="Невалідний selectedSystemId")

        system = await db[col("systems")].find_one({"_id": system_oid, "user_id": user_id})
        if not system:
            raise HTTPException(status_code=404, detail="Систему не знайдено або вона належить іншому користувачу")

        selected_system_id = payload.selectedSystemId
        system_snapshot = _build_system_snapshot(system).model_dump()

    doc = {
        "userId": user_id,
        "name": payload.name,
        # Store both formats for compatibility
        "selectedDeviceIds": device_ids,
        "selectedDevices": [item.model_dump() for item in payload.selectedDevices],
        "selectedSystemId": selected_system_id,
        "totalPowerWatts": payload.totalPowerWatts,
        "loadPercent": payload.loadPercent,
        "autonomyHours": payload.autonomyHours,
        "devicesSnapshot": devices_snapshot,
        "systemSnapshot": system_snapshot,
        "createdAt": datetime.now(timezone.utc),
    }
    result = await db[col("scenarios")].insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize_scenario(doc)


@router.get("", response_model=List[ScenarioResponse])
async def list_scenarios(user_id: str = Depends(get_current_user_id)):
    db = get_database()
    cursor = db[col("scenarios")].find({"userId": user_id})
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

    doc = await db[col("scenarios")].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Сценарій не знайдено")
    if doc["userId"] != user_id:
        raise HTTPException(status_code=403, detail="Доступ заборонено")

    return _serialize_scenario(doc)


@router.patch("/{scenario_id}", response_model=ScenarioResponse)
async def rename_scenario(
    scenario_id: str,
    payload: dict,
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()

    try:
        oid = ObjectId(scenario_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний scenario_id")

    doc = await db[col("scenarios")].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Сценарій не знайдено")
    if doc["userId"] != user_id:
        raise HTTPException(status_code=403, detail="Доступ заборонено")

    new_name = payload.get("name", "").strip()
    if not new_name:
        raise HTTPException(status_code=400, detail="Назва не може бути порожньою")

    await db[col("scenarios")].update_one({"_id": oid}, {"$set": {"name": new_name}})
    doc["name"] = new_name
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

    doc = await db[col("scenarios")].find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Сценарій не знайдено")
    if doc["userId"] != user_id:
        raise HTTPException(status_code=403, detail="Доступ заборонено")

    await db[col("scenarios")].delete_one({"_id": oid})
