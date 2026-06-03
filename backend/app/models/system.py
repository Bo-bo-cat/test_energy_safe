from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class SystemCreate(BaseModel):
    model: str = Field(..., min_length=1, max_length=200)
    type: str = Field(default="ДБЖ")
    power: float = Field(..., gt=0, description="Потужність у Вт")
    battery: str = Field(..., description="Ємність батареї, напр. '256 Wh'")
    autonomy: str = Field(default="–", description="Час автономії, напр. '2 год'")
    selected_for_calculation: bool = False

    model_config = {"json_schema_extra": {
        "example": {
            "model": "EcoFlow RIVER 2",
            "type": "Портативна електростанція",
            "power": 300,
            "battery": "256 Wh",
            "autonomy": "2 год",
            "selected_for_calculation": False
        }
    }}


class SystemByName(BaseModel):
    model: str = Field(..., min_length=1, max_length=200)

    model_config = {"json_schema_extra": {
        "example": {"model": "EcoFlow RIVER 2"}
    }}


class SystemUpdate(BaseModel):
    model: Optional[str] = Field(None, min_length=1, max_length=200)
    type: Optional[str] = None
    power: Optional[float] = Field(None, gt=0)
    battery: Optional[str] = None
    autonomy: Optional[str] = None
    selected_for_calculation: Optional[bool] = None


class SystemResponse(BaseModel):
    id: str
    model: str
    type: str
    power: float
    battery: str
    autonomy: str
    user_id: str
    selected_for_calculation: bool
    created_at: datetime


class RecommendedSystemResponse(BaseModel):
    id: str
    model: str
    type: str
    power: float
    battery: str
    autonomy: str
