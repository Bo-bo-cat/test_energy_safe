from pydantic import BaseModel, Field
from typing import List


class DeviceUsage(BaseModel):
    deviceId: str
    usageHours: float = Field(default=24.0, ge=0, le=24)


class CalculateRequest(BaseModel):
    selectedDevices: List[DeviceUsage] = Field(..., min_length=1)
    selectedSystemId: str = Field(..., min_length=1)

    model_config = {"json_schema_extra": {
        "example": {
            "selectedDevices": [
                {"deviceId": "device1", "usageHours": 6},
                {"deviceId": "device2", "usageHours": 24}
            ],
            "selectedSystemId": "system1"
        }
    }}


class CalculateResponse(BaseModel):
    totalPowerWatts: float
    peakPowerWatts: float
    loadPercent: float
    autonomyHours: float
