from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

VALID_CATEGORIES = [
    "Холодильник", "Телевізор", "Пральна машина", "Мікрохвильовка",
    "Кондиціонер", "Ноутбук", "Роутер", "Освітлення", "Зарядний пристрій",
    "Посудомийна машина", "Електрочайник", "Кавоварка", "Інше"
]

class DeviceCreate(BaseModel):
    user_id: str
    model_name: str = Field(..., min_length=1, max_length=200)
    power_watts: float = Field(..., gt=0)
    brand: str = Field(..., min_length=1, max_length=100)
    daily_usage_hours: float = Field(..., ge=0, le=24)
    is_critical: bool = False

    model_config = {"json_schema_extra": {
        "example": {
            "user_id": "64f1a2b3c4d5e6f7a8b9c0d1",
            "model_name": "Samsung RB34",
            "power_watts": 150,
            "brand": "Samsung",
            "daily_usage_hours": 24,
            "is_critical": True
        }
    }}


class DeviceUpdate(BaseModel):
    model_name: Optional[str] = Field(default=None, min_length=1, max_length=200)
    power_watts: Optional[float] = Field(default=None, gt=0)
    brand: Optional[str] = Field(default=None, min_length=1, max_length=100)
    daily_usage_hours: Optional[float] = Field(default=None, ge=0, le=24)
    is_critical: Optional[bool] = None


class DeviceResponse(BaseModel):
    id: str
    user_id: str
    model_name: str
    category: str
    power_watts: float
    brand: str
    daily_usage_hours: float
    is_critical: bool
    created_at: datetime


class ClassifyRequest(BaseModel):
    model_name: str = Field(..., min_length=1, max_length=200)

    model_config = {"json_schema_extra": {
        "example": {"model_name": "Samsung RB34"}
    }}


class ClassifyResponse(BaseModel):
    category: str
    is_valid: bool
