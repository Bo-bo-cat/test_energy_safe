from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class DeviceSnapshot(BaseModel):
    id: str
    model_name: str
    category: str
    power_watts: float
    startup_current_watts: Optional[float] = None
    brand: str
    is_critical: bool
    daily_usage_hours: float
    tag: Optional[str] = None


class SystemSnapshot(BaseModel):
    id: str
    model: str
    type: str
    power: float
    battery: str
    autonomy: str


class ScenarioCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    selectedDeviceIds: List[str] = Field(..., min_length=1)
    selectedSystemId: Optional[str] = None
    totalPowerWatts: float = Field(..., ge=0)
    loadPercent: float = Field(..., ge=0)
    autonomyHours: float = Field(..., ge=0)

    model_config = {"json_schema_extra": {
        "example": {
            "name": "Вечір кіно",
            "selectedDeviceIds": ["64f1a2b3c4d5e6f7a8b9c0d2", "64f1a2b3c4d5e6f7a8b9c0d3"],
            "selectedSystemId": "64f1a2b3c4d5e6f7a8b9c0d4",
            "totalPowerWatts": 497,
            "loadPercent": 82,
            "autonomyHours": 2.5
        }
    }}


class ScenarioResponse(BaseModel):
    id: str
    userId: str
    name: str
    selectedDeviceIds: List[str]
    selectedSystemId: Optional[str]
    totalPowerWatts: float
    loadPercent: float
    autonomyHours: float
    devicesSnapshot: Optional[List[DeviceSnapshot]] = None
    systemSnapshot: Optional[SystemSnapshot] = None
    createdAt: datetime
