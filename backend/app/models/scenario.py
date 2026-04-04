from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class ScenarioCreate(BaseModel):
    user_id: str
    name: str = Field(..., min_length=1, max_length=200)
    duration_hours: float = Field(..., gt=0, le=720)
    devices_included: List[str] = Field(..., min_length=1)

    model_config = {"json_schema_extra": {
        "example": {
            "user_id": "64f1a2b3c4d5e6f7a8b9c0d1",
            "name": "Відключення 4 години",
            "duration_hours": 4,
            "devices_included": ["64f1a2b3c4d5e6f7a8b9c0d2", "64f1a2b3c4d5e6f7a8b9c0d3"]
        }
    }}


class ScenarioResponse(BaseModel):
    id: str
    user_id: str
    name: str
    duration_hours: float
    devices_included: List[str]
    total_consumption_wh: float
    battery_sufficient: Optional[bool]
    created_at: datetime
