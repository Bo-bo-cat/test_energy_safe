from pydantic import BaseModel, Field
from typing import List


class CalculateRequest(BaseModel):
    selectedDeviceIds: List[str] = Field(..., min_length=1)
    selectedSystemId: str = Field(..., min_length=1)

    model_config = {"json_schema_extra": {
        "example": {
            "selectedDeviceIds": ["device1", "device2"],
            "selectedSystemId": "system1"
        }
    }}


class CalculateResponse(BaseModel):
    totalPowerWatts: float
    peakPowerWatts: float
    loadPercent: float
    autonomyHours: float
