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
    if not payload.selectedDeviceIds:
        raise HTTPException(status_code=400, detail="Не вибрано жодного приладу")

    db = get_database()

    try:
        device_oids = [ObjectId(did) for did in payload.selectedDeviceIds]
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

    # НОВА ЛОГІКА РОЗРАХУНКУ
    total_power = 0
    max_startup_overhead = 0

    for dev in devices:
        p_watts = dev.get("power_watts", 0)
        total_power += p_watts
        
        # Вираховуємо найбільший стрибок пускового струму
        s_watts = dev.get("startup_current_watts")
        if s_watts is None:
            s_watts = p_watts
            
        overhead = max(0, s_watts - p_watts)
        if overhead > max_startup_overhead:
            max_startup_overhead = overhead

    if total_power == 0:
        raise HTTPException(status_code=400, detail="Сумарна потужність приладів дорівнює нулю")

    # Пікова потужність системи під час запуску найважчого приладу
    peak_power = total_power + max_startup_overhead

    # Перевантаження інвертора рахується по ПІКОВІЙ потужності
    load_percent = round((peak_power / system["power"]) * 100, 1)

    try:
        battery_wh = _parse_battery_wh(system["battery"])
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    # Час автономії рахується по РОБОЧІЙ потужності, бо пуск триває ~2 секунди
    autonomy_hours = round(battery_wh / total_power, 2)

    return CalculateResponse(
        totalPowerWatts=round(total_power, 1),
        peakPowerWatts=round(peak_power, 1),
        loadPercent=load_percent,
        autonomyHours=autonomy_hours,
    )