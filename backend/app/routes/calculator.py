import re
from fastapi import APIRouter, HTTPException, Depends
from bson import ObjectId
from bson.errors import InvalidId

from app.database import get_database, col
from app.models.calculator import CalculateRequest, CalculateResponse
from app.auth import get_current_user_id

router = APIRouter(prefix="/calculator", tags=["Calculator"])


def _parse_battery_wh(battery_str: str) -> float:
    """Extract numeric Wh value from strings like '256 Wh' or '1024Wh'."""
    match = re.search(r"[\d.]+", battery_str)
    if not match:
        raise ValueError(f"Не вдалося розпарсити ємність батареї: '{battery_str}'")
    return float(match.group())


@router.post("/calculate", response_model=CalculateResponse)
async def calculate(
    payload: CalculateRequest,
    user_id: str = Depends(get_current_user_id),
):
    db = get_database()

    # Будуємо словник deviceId → usageHours
    usage_map: dict[str, float] = {item.deviceId: item.usageHours for item in payload.selectedDevices}
    device_ids = list(usage_map.keys())

    try:
        device_oids = [ObjectId(did) for did in device_ids]
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний device_id")

    try:
        system_oid = ObjectId(payload.selectedSystemId)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Невалідний system_id")

    cursor = db[col("devices")].find({"_id": {"$in": device_oids}})
    devices = [doc async for doc in cursor]

    if len(devices) != len(device_oids):
        raise HTTPException(status_code=404, detail="Один або більше приладів не знайдено")

    for dev in devices:
        if dev["user_id"] != user_id:
            raise HTTPException(status_code=403, detail="Доступ до приладу заборонено")

    system = await db[col("systems")].find_one({"_id": system_oid, "user_id": user_id})
    if not system:
        raise HTTPException(status_code=404, detail="ДБЖ не знайдено або не належить вам")

    total_power = 0.0
    max_startup_overhead = 0.0
    weighted_energy = 0.0  # Sum(power_watts * usageHours)

    for dev in devices:
        p_watts = dev.get("power_watts", 0)
        hours = usage_map.get(str(dev["_id"]), 24.0)

        total_power += p_watts
        weighted_energy += p_watts * hours

        s_watts = dev.get("startup_current_watts") or p_watts
        overhead = max(0.0, s_watts - p_watts)
        if overhead > max_startup_overhead:
            max_startup_overhead = overhead

    if total_power == 0:
        raise HTTPException(status_code=400, detail="Сумарна потужність приладів дорівнює нулю")

    if weighted_energy == 0:
        raise HTTPException(status_code=400, detail="Сумарна енергія приладів дорівнює нулю (перевірте години використання)")

    # Пікова потужність — для оцінки навантаження на інвертор
    peak_power = total_power + max_startup_overhead
    load_percent = round((peak_power / system["power"]) * 100, 1)

    try:
        battery_wh = _parse_battery_wh(system["battery"])
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Автономія враховує реальний час використання кожного приладу:
    # autonomy = battery_wh * 24 / sum(power_watts * usageHours)
    # При usageHours=24 для всіх → формула збігається зі старою: battery_wh / total_power
    autonomy_hours = round((battery_wh * 24) / weighted_energy, 2)

    return CalculateResponse(
        totalPowerWatts=round(total_power, 1),
        peakPowerWatts=round(peak_power, 1),
        loadPercent=load_percent,
        autonomyHours=autonomy_hours,
    )
